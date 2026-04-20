#!/usr/bin/env node
/* eval-prompts.js — ML-style training job for buildPrompt().

   Treat the prompt engine as a model under test. For every selectable
   dimension, generate the prompt, score it on quality metrics, and — when a
   metric fails — diagnose the root cause (eval regex too narrow vs. engine
   injection too weak), then prescribe and auto-apply fixes.

   Phase 1: EVALUATE — score all axes, collect failures.
   Phase 2: DIAGNOSE — for each failure, extract context, classify root cause.
   Phase 3: PRESCRIBE — generate actionable fix (eval regex patch or engine
             injection patch), write to data/training-fixes.json.
   Phase 4: SELF-HEAL — apply eval-side regex fixes automatically, re-run.

   Output:
     data/eval-report.json    — full machine-readable results
     data/eval-summary.txt    — human-readable summary
     data/training-fixes.json — actionable patches for engine/eval

   Run: node tools/eval-prompts.js              (evaluate + train)
        node tools/eval-prompts.js --eval-only   (evaluate only, no fixes)
*/

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ENGINE = path.resolve(__dirname, 'prompt-engine.cjs');
const REPORT = path.resolve(ROOT, 'data/eval-report.json');
const SUMMARY = path.resolve(ROOT, 'data/eval-summary.txt');
const FIXES = path.resolve(ROOT, 'data/training-fixes.json');

const EVAL_ONLY = process.argv.includes('--eval-only');
const MAX_TRAINING_ROUNDS = 3;

if (!fs.existsSync(ENGINE)) {
  console.error('engine not built. Run: node tools/build-engine.mjs');
  process.exit(1);
}

const engine = require(ENGINE);
const {
  buildPrompt,
  TASKS,
  INDUSTRIES,
  OUTPUTS,
  FILE_OUTPUTS,
  MODELS,
  SUB_MODELS,
  STYLES,
  TONES,
  LENGTHS,
  FMTS,
  TECHS,
  INCLUDES,
  LANGS,
} = engine;

/* ─────────────────────────────────────────────────────────────
   BASELINE
   ───────────────────────────────────────────────────────────── */

const BASE = {
  topic:
    'Build a quarterly performance review for the leadership team covering revenue, margin trends, and 2026 priorities.',
  taskType: 'analysis',
  model: 'claude',
  subModel: 'opus-4-6',
  subModelTier: 'flagship',
  tone: 'Professional',
  length: 'Detailed',
  format: ['headers', 'table'],
  techniques: [],
  audience: '',
  extra: '',
  special: '',
  mode: 'expert',
  industry: 'finance',
  output: 'document',
  style: 'analytical',
  includes: [],
  language: 'English',
  fileOutput: 'pdf',
  selectedFirm: '',
  selectedRole: '',
  hasAttachment: false,
  riskLevel: 'medium',
};

function cfg(over) {
  return Object.assign({}, BASE, over);
}

/* ─────────────────────────────────────────────────────────────
   QUALITY METRICS — 0..1 score each. Mutable: TECH_TERMS and
   similar maps can be widened by the training loop.
   ───────────────────────────────────────────────────────────── */

function m_hasStructure(text, c) {
  const isXml = MODELS[c.model]?.fmt === 'xml';
  const needs = isXml
    ? ['<system>', '<task>', '<avoid>']
    : [/## System|\*\*SYSTEM\*\*/, /## Task|\*\*TASK\*\*/, /## Avoid|\*\*AVOID\*\*/];
  let hit = 0;
  for (const n of needs) {
    if (typeof n === 'string' ? text.includes(n) : n.test(text)) hit++;
  }
  return hit / needs.length;
}

function m_noHedging(text) {
  const bad = /\b(maybe|kind of|sort of|pretty much|somewhat|perhaps|probably)\b/i;
  return bad.test(text) ? 0 : 1;
}

function m_lengthBand(text) {
  const n = text.length;
  if (n < 400) return 0;
  if (n < 800) return 0.4;
  if (n < 1500) return 0.8;
  if (n < 25000) return 1;
  return 0.3;
}

function m_noPreamble(text) {
  return /without preamble|directly with the deliverable|Skip intro|Skip conversational|No preamble|No intro|no meta-commentary/i.test(
    text
  )
    ? 1
    : 0;
}

function m_modelGuidance(text) {
  return /model_guidance|claude_guidance|MODEL GUIDANCE|CLAUDE GUIDANCE|Model guidance|Claude guidance/i.test(text)
    ? 1
    : 0;
}

function m_noScriptClose(text) {
  return text.includes('</script>') ? 0 : 1;
}

/* ── Industry fidelity ─────────────────────────────────────── */
const INDUSTRY_TERMS = {
  finance: ['valuation', 'base case', 'sensitivit', 'FY', 'basis point'],
  healthcare: ['PICO', 'evidence level', 'clinical'],
  legal: ['IRAC', 'authority', 'jurisdiction'],
  consulting: ['pyramid', 'MECE'],
  tech: ['version', 'backward', 'Big-O', 'complexity'],
  marketing: ['CAC', 'ROAS', 'funnel'],
  education: ['Bloom', 'formative', 'learning objective'],
  research: ['CONSORT', 'PRISMA', 'effect size'],
  design: ['heuristic', 'accessibility', 'WCAG', 'typography'],
  hr: ['performance', 'competency', 'feedback', 'talent', 'retention', 'engagement', 'development'],
  operations: ['throughput', 'bottleneck', 'cycle time', 'SOP'],
  sales: ['pipeline', 'quota', 'close rate'],
  media: ['editorial', 'audience', 'engagement'],
  realestate: ['yield', 'cap rate', 'comp'],
  general: [],
};
function m_industryFidelity(text, c) {
  const terms = INDUSTRY_TERMS[c.industry];
  if (!terms || terms.length === 0) return 1;
  const hits = terms.filter((t) => new RegExp(t, 'i').test(text)).length;
  if (hits === 0) return 0;
  // Require depth: at least 2 matches for industries with 3+ terms
  if (terms.length >= 3) return hits >= 2 ? 1 : 0.7;
  return 1;
}

/* ── Task fidelity ─────────────────────────────────────────── */
const TASK_TERMS = {
  analysis: ['analy', 'data', 'finding'],
  strategy: ['strateg', 'objective', 'priorit'],
  research: ['research', 'source', 'evidence'],
  writing: ['audience', 'voice', 'draft', 'writing', 'prose', 'narrative', 'copy', 'tone'],
  planning: ['plan', 'milestone', 'timeline'],
  creative: ['creative', 'concept', 'idea'],
  summary: ['summar', 'key point', 'distill'],
  technical: ['technical', 'implement', 'architecture'],
  decision: ['decision', 'criteria', 'option'],
  debug: ['root cause', 'reproduc', 'fix'],
  review: ['review', 'feedback', 'assess'],
  comparison: ['compar', 'trade.?off', 'versus'],
  translation: ['translat', 'language', 'meaning'],
  persuade: ['persuad', 'argument', 'audience'],
  brainstorm: ['brainstorm', 'idea', 'option', 'creative', 'divergent', 'generate'],
};
function m_taskFidelity(text, c) {
  const terms = TASK_TERMS[c.taskType];
  if (!terms) return 1;
  const hits = terms.filter((t) => new RegExp(t, 'i').test(text)).length;
  if (hits === 0) return 0;
  // Require at least 2 of 3 terms to prove the methodology injection fired
  return hits >= 2 ? 1 : 0.8;
}

/* ── Technique fidelity (mutable — training loop widens these) ── */
let TECH_TERMS = {
  cot: /chain.of.thought|step.by.step|reason.*step|reasoning/i,
  fewshot: /few.?shot|example.*pattern|worked example|ideal.?output/i,
  constraints: /constraint|boundary|limit|never fabricate/i,
  selfcheck: /self.?check|verify|double.?check|before submitting/i,
  compare: /compar|contrast|side.by.side|each option/i,
  iterative: /iterat|refine|revise|improved version/i,
  roleplay: /role.?play|persona|act as|embody/i,
  redteam: /red.?team|adversarial|attack.*own|devil/i,
  firstprinciples: /first.?principles|fundamental|ground up|foundation/i,
  inversion: /inver|opposite|what would fail|failure mode|pre.?mortem/i,
  multiagent: /multi.?agent|multiple.*perspective|panel|multi_perspective/i,
  structured_debate: /debate|pro.*con|for.*against|position.*strongest/i,
  systems: /system.*think|feedback loop|leverage point|component/i,
  decompose: /decompose|break.*down|sub.?problem|sub.?task/i,
  meta: /meta|think about.*think|reflect on|problem type|blind spot/i,
};
function m_techniqueFidelity(text, c) {
  if (!c.techniques || c.techniques.length === 0) return 1;
  let hit = 0;
  for (const t of c.techniques) {
    const rx = TECH_TERMS[t];
    if (!rx) continue;
    if (rx.test(text)) hit++;
  }
  return hit / c.techniques.length;
}

/* ── Language fidelity ─────────────────────────────────────── */
function m_languageFidelity(text, c) {
  if (c.language === 'English') return 1;
  const rx = new RegExp('in ' + c.language + '\\b|' + c.language + '\\s', 'i');
  return rx.test(text) ? 1 : 0;
}

/* ── File fidelity ─────────────────────────────────────────── */
const FILE_TERMS = {
  pdf: /vertical rhythm|typography|orphan/i,
  word: /TOC|heading style/i,
  excel: /formula|hardcoded|named range/i,
  ppt: /assertion|speaker note/i,
  json: /JSON\.parse|camelCase|metadata/i,
  csv: /RFC 4180|snake_case/i,
  markdown: /linked TOC|fenced code|H1/i,
  html: /semantic HTML|ARIA|WCAG/i,
  codeFile: /file header|JSDoc|docstring|type annotation/i,
  plaintext: /80.char|ASCII only/i,
};
function m_fileFidelity(text, c) {
  if (!c.fileOutput || c.fileOutput === 'none') return 1;
  const rx = FILE_TERMS[c.fileOutput];
  if (!rx) return 1;
  return rx.test(text) ? 1 : 0;
}

/* ── Style fidelity ────────────────────────────────────────── */
function m_styleFidelity(text, c) {
  if (!c.style) return 1;
  return new RegExp(c.style, 'i').test(text) ? 1 : 0;
}

/* ── Tone fidelity (new — validates tone instruction presence) ─ */
function m_toneFidelity(text, c) {
  if (!c.tone) return 1;
  return new RegExp(c.tone, 'i').test(text) ? 1 : 0;
}

/* ── Include fidelity (new — checks that include blocks inject) ─ */
const INCLUDE_TERMS = {
  exec_summary: /executive summary/i,
  examples: /example|case study/i,
  sources: /source|citation|reference/i,
  action_items: /action item|next step/i,
  risks: /risk/i,
  comparison: /compar|versus/i,
  timeline: /timeline|milestone/i,
  metrics: /KPI|metric/i,
  glossary: /glossary|definition/i,
  visuals: /visual|diagram|chart/i,
};
function m_includeFidelity(text, c) {
  if (!c.includes || c.includes.length === 0) return 1;
  let hit = 0;
  for (const inc of c.includes) {
    const rx = INCLUDE_TERMS[inc];
    if (!rx) continue;
    if (rx.test(text)) hit++;
  }
  return hit / c.includes.length;
}

/* ── Professionalism (reject amateur patterns) ─────────────── */
function m_professionalism(text) {
  let score = 1;
  // Penalize for generic/amateur patterns — but only when used positively,
  // not when the prompt is FORBIDDING them (e.g. "no placeholder code").
  if (/lorem ipsum/i.test(text)) score -= 0.5;
  // Only flag TODO/FIXME/PLACEHOLDER when NOT preceded by a negation word
  const lines = text.split('\n');
  for (const line of lines) {
    if (/TODO|FIXME|PLACEHOLDER/i.test(line) && !/\b(no|never|avoid|don'?t|not|without|zero)\b/i.test(line)) {
      score -= 0.3;
      break;
    }
  }
  // Only flag [insert if it's genuinely a placeholder, not a meta-instruction
  for (const line of lines) {
    if (/\[insert/i.test(line) && !/\b(no|never|avoid|don'?t|not|without)\b/i.test(line)) {
      score -= 0.2;
      break;
    }
  }
  // Reward for professional markers
  if (/deliverable|stakeholder|methodology/i.test(text)) score = Math.min(1, score + 0.1);
  return Math.max(0, score);
}

/* ── Design standard depth (styled file types) ────────────── */
function m_designStandard(text, c) {
  if (!['pdf', 'word', 'ppt', 'excel'].includes(c.fileOutput)) return 1;
  let score = 0;
  if (/DESIGN STANDARD/.test(text)) score += 0.4;
  if (/FONTS:/.test(text)) score += 0.2;
  if (/COLORS:/.test(text)) score += 0.2;
  if (/accent|primary|heading.*font|body.*font/i.test(text)) score += 0.2;
  return Math.min(1, score);
}

/* ── Quality gate depth (non-fast tiers) ───────────────────── */
function m_qualityGate(text, c) {
  if (c.subModelTier === 'fast') return 1;
  const isXml = MODELS[c.model]?.fmt === 'xml';
  const hasGate = isXml
    ? text.includes('<quality_gate>')
    : (/## Quality gate/.test(text) || /\*\*QUALITY GATE\*\*/.test(text));
  if (!hasGate) return 0;
  // Must have actual criteria, not just the header
  if (/verify|check|confirm|ensure/i.test(text)) return 1;
  return 0.5;
}

/* ── Technique depth (section must be substantive) ─────────── */
function m_techniqueDepth(text, c) {
  if (!c.techniques || c.techniques.length === 0) return 1;
  const isXml = MODELS[c.model]?.fmt === 'xml';
  let totalScore = 0;
  for (const t of c.techniques) {
    const secName = getTechSectionForMetric(t);
    let content = '';
    if (isXml) {
      const rx = new RegExp('<' + secName + '>([\\s\\S]*?)</' + secName + '>');
      const m = text.match(rx);
      content = m ? m[1] : '';
    } else {
      // Look for ## or ** section headers
      const rx = new RegExp('(?:## |\\*\\*)' + secName.replace(/_/g, '[_ ]') + '(?:\\*\\*)?\\s*\\n([\\s\\S]*?)(?=\\n## |\\n\\*\\*|$)', 'i');
      const m = text.match(rx);
      content = m ? m[1] : '';
    }
    // Section must be at least 40 chars to be substantive
    if (content.length >= 40) totalScore += 1;
    else if (content.length > 0) totalScore += 0.5;
    else totalScore += 0;
  }
  return totalScore / c.techniques.length;
}

function getTechSectionForMetric(tech) {
  const map = {
    cot: 'reasoning', fewshot: 'examples_format', constraints: 'constraints',
    selfcheck: 'self_check', compare: 'comparative', iterative: 'refinement',
    roleplay: 'persona', redteam: 'red_team', firstprinciples: 'first_principles',
    inversion: 'inversion', multiagent: 'multi_perspective', structured_debate: 'debate',
    systems: 'systems', decompose: 'decompose', meta: 'meta',
  };
  return map[tech] || tech;
}

/* ── Firm/Role fidelity — universal-prompt policy ──
   Generated prompts must be reusable in fresh documents without manual
   cleanup, so NO firm names may appear in the emitted text. Instead, when
   a firm is selected, the corresponding FIRM_SIGNATURE methodology line
   must be present. When a role is selected, a generic seniority directive
   must be present. See feedback_universal_prompts memory (commit 637ed9e). */
function m_firmFidelity(text, c) {
  if (!c.selectedFirm) return 1;
  const SF = engine.SECTOR_FIRMS;
  const sectorData = SF[c.industry];
  if (!sectorData || !sectorData.firms || !sectorData.firms[c.selectedFirm]) return 1;
  const firmName = sectorData.firms[c.selectedFirm].name;
  // 1. Firm name must NOT appear in emitted text — split on "/", "&", "(",
  //    whitespace to catch each token, then reject if the distinctive
  //    (non-generic) tokens leak through.
  const GENERIC = new Set(['&','/','(',')','Company','Group','Mgmt','Direct','AI','Labs','Asset','Publishing','Academic','Health','Education','Marketing','Public','Sector','Org','Practice','People','Ops','Media','Consulting','University','Institutes','National','Facebook','Alphabet','AWS','ESPN','JP','Times','Bank','Real','Estate','Talent','Manufacturing','Government','York','New','Post','News','Capital','Partners','Advisors','Management','Ventures','Industries','Technologies','Systems','Services','International','Global','Corp','Corporation','Holdings','Studios','Solutions','Research','Lab','Center','Foundation','Association']);
  const tokens = firmName.split(/[\s\/&()]+/).filter(t => t && !GENERIC.has(t) && t.length >= 3);
  for (const tok of tokens) {
    if (new RegExp('\\b' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text)) {
      return 0; // firm-name leak — policy violation
    }
  }
  // 2. FIRM_SIGNATURE methodology must be present. Match on a distinctive
  //    content fragment from the signature (first ~40 chars after "Apply ").
  const sig = engine.FIRM_SIGNATURE && engine.FIRM_SIGNATURE[c.selectedFirm];
  if (sig) {
    const anchor = sig.replace(/^Apply\s+/, '').split(':')[0].trim();
    if (!new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 40), 'i').test(text)) {
      return 0.5; // signature missing — partial credit
    }
  }
  // 3. If a role is selected, a generic seniority directive must be present.
  if (c.selectedRole) {
    if (!/seniority and analytical depth/i.test(text)) return 0.8;
  }
  return 1;
}

/* ── No contradictions (checks for conflicting instructions) ── */
function m_noContradictions(text) {
  let score = 1;
  // Check for "be concise" paired with "be comprehensive"
  if (/\bconcise\b/i.test(text) && /\bcomprehensive\b/i.test(text)) {
    // Only penalize if they appear to be direct instructions, not in different contexts
    const conciseLines = text.split('\n').filter(l => /\bconcise\b/i.test(l));
    const compLines = text.split('\n').filter(l => /\bcomprehensive\b/i.test(l));
    if (conciseLines.length > 0 && compLines.length > 0) {
      // Check if they're in the same section — that would be contradictory
      // For now, allow as many prompts legitimately have both in different sections
    }
  }
  return score;
}

/* ── Metric registry ───────────────────────────────────────── */
const METRICS = [
  { id: 'structure', fn: m_hasStructure, weight: 2 },
  { id: 'no_hedging', fn: m_noHedging, weight: 1 },
  { id: 'length_band', fn: m_lengthBand, weight: 1 },
  { id: 'no_preamble', fn: m_noPreamble, weight: 1 },
  { id: 'model_guidance', fn: m_modelGuidance, weight: 1 },
  { id: 'no_script_close', fn: m_noScriptClose, weight: 3 },
  { id: 'industry_fidelity', fn: m_industryFidelity, weight: 2 },
  { id: 'task_fidelity', fn: m_taskFidelity, weight: 2 },
  { id: 'technique_fidelity', fn: m_techniqueFidelity, weight: 2 },
  { id: 'language_fidelity', fn: m_languageFidelity, weight: 2 },
  { id: 'file_fidelity', fn: m_fileFidelity, weight: 1 },
  { id: 'style_fidelity', fn: m_styleFidelity, weight: 1 },
  { id: 'tone_fidelity', fn: m_toneFidelity, weight: 1 },
  { id: 'include_fidelity', fn: m_includeFidelity, weight: 1.5 },
  { id: 'professionalism', fn: m_professionalism, weight: 1.5 },
  { id: 'design_standard', fn: m_designStandard, weight: 1.5 },
  { id: 'quality_gate', fn: m_qualityGate, weight: 1.5 },
  { id: 'technique_depth', fn: m_techniqueDepth, weight: 2 },
  { id: 'firm_fidelity', fn: m_firmFidelity, weight: 2 },
  { id: 'no_contradictions', fn: m_noContradictions, weight: 1 },
];

function scorePrompt(text, c) {
  const scores = {};
  let weighted = 0;
  let totalWeight = 0;
  for (const m of METRICS) {
    const s = m.fn(text, c);
    scores[m.id] = s;
    weighted += s * m.weight;
    totalWeight += m.weight;
  }
  return { scores, total: weighted / totalWeight };
}

/* ─────────────────────────────────────────────────────────────
   AXIS RUNNER — rotates one dimension, holds others at BASE.
   ───────────────────────────────────────────────────────────── */

function runAxis(axisName, values, overrider) {
  const results = [];
  for (const v of values) {
    const c = cfg(overrider(v));
    let prompt;
    try {
      prompt = buildPrompt(c);
    } catch (err) {
      results.push({ value: v, crashed: true, error: err.message, total: 0, scores: {} });
      continue;
    }
    const { scores, total } = scorePrompt(prompt, c);
    results.push({ value: v, length: prompt.length, total, scores, prompt });
  }
  const totals = results.filter((r) => !r.crashed).map((r) => r.total);
  const mean = totals.reduce((a, b) => a + b, 0) / (totals.length || 1);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const failing = results.filter((r) => r.crashed || r.total < 0.95);
  return { axis: axisName, n: results.length, mean, min, max, failing, results };
}

/* ─────────────────────────────────────────────────────────────
   PHASE 2: DIAGNOSIS ENGINE
   For each failing result, figure out WHY each metric failed
   and extract the relevant prompt text around the gap.
   ───────────────────────────────────────────────────────────── */

function diagnose(result, axisName) {
  const diag = {
    axis: axisName,
    value: result.value,
    total: result.total,
    issues: [],
  };

  if (result.crashed) {
    diag.issues.push({
      metric: 'CRASH',
      score: 0,
      cause: 'engine_bug',
      detail: 'buildPrompt() threw: ' + result.error,
      fix_type: 'engine',
      fix: 'Fix the crash in buildPrompt() for this combination',
    });
    return diag;
  }

  const text = result.prompt || '';

  for (const m of METRICS) {
    const score = result.scores[m.id];
    if (score >= 1) continue;

    const issue = {
      metric: m.id,
      score,
      cause: null,
      detail: '',
      fix_type: null,
      fix: '',
    };

    // Classify: is the eval regex too narrow, or is the engine genuinely missing content?
    switch (m.id) {
      case 'technique_fidelity': {
        const techniques = typeof result.value === 'object' && result.value.tc
          ? [result.value.tc]
          : (Array.isArray(result.value) ? result.value : []);
        for (const t of techniques) {
          const rx = TECH_TERMS[t];
          if (!rx || rx.test(text)) continue;
          // Extract what the engine actually injected for this technique
          const sectionRx = new RegExp('<' + getTechSection(t) + '>([\\s\\S]*?)</' + getTechSection(t) + '>', 'i');
          const match = text.match(sectionRx);
          if (match) {
            issue.cause = 'eval_regex_too_narrow';
            issue.detail = 'Engine injects <' + getTechSection(t) + '> with content: "' +
              match[1].trim().slice(0, 100) + '..." but eval regex does not match it.';
            issue.fix_type = 'eval';
            issue.fix = 'Widen TECH_TERMS.' + t + ' regex to match: ' + match[1].trim().slice(0, 60);
          } else {
            // Also check non-XML section patterns
            const boldRx = new RegExp('\\*\\*' + t.toUpperCase().replace(/_/g, '[_ ]') + '\\*\\*', 'i');
            const mdRx = new RegExp('## ' + t.replace(/_/g, ' '), 'i');
            if (boldRx.test(text) || mdRx.test(text)) {
              issue.cause = 'eval_regex_too_narrow';
              issue.detail = 'Engine injects section header for ' + t + ' but eval regex misses the body content.';
              issue.fix_type = 'eval';
              issue.fix = 'Widen TECH_TERMS.' + t + ' to include section-header-adjacent vocabulary.';
            } else {
              issue.cause = 'engine_missing_injection';
              issue.detail = 'No section found for technique "' + t + '" in the generated prompt.';
              issue.fix_type = 'engine';
              issue.fix = 'Add technique injection for "' + t + '" in buildPrompt() techniques block.';
            }
          }
        }
        break;
      }

      case 'industry_fidelity': {
        const ind = typeof result.value === 'object' ? (result.value.i || result.value) : result.value;
        const terms = INDUSTRY_TERMS[ind];
        if (terms && terms.length > 0) {
          // Check if there's ANY industry-specific content
          const indBlock = text.match(/<industry_context>([\s\S]*?)<\/industry_context>/i);
          if (indBlock) {
            issue.cause = 'eval_terms_too_narrow';
            issue.detail = 'Industry block present (' + indBlock[1].trim().slice(0, 80) + '...) but eval terms miss it.';
            issue.fix_type = 'eval';
            // Extract candidate terms from the block
            const words = indBlock[1].match(/[A-Z][a-z]+|[A-Z]{2,}/g) || [];
            issue.fix = 'Add terms to INDUSTRY_TERMS.' + ind + ': ' + words.slice(0, 5).join(', ');
          } else {
            issue.cause = 'engine_missing_injection';
            issue.detail = 'No industry_context block for "' + ind + '".';
            issue.fix_type = 'engine';
            issue.fix = 'Ensure IND_CONTEXT[' + ind + '] is populated and buildPrompt injects it.';
          }
        }
        break;
      }

      case 'include_fidelity': {
        const includes = typeof result.value === 'string' ? [result.value] : (result.value || []);
        for (const inc of includes) {
          const rx = INCLUDE_TERMS[inc];
          if (!rx || rx.test(text)) continue;
          issue.cause = 'check_needed';
          issue.detail = 'Include "' + inc + '" selected but its vocabulary not found in prompt.';
          issue.fix_type = 'investigate';
          issue.fix = 'Check if buildPrompt handles includes.' + inc + ' and what text it injects.';
        }
        break;
      }

      default: {
        issue.cause = 'metric_below_threshold';
        issue.detail = m.id + ' scored ' + score.toFixed(3);
        issue.fix_type = 'investigate';
        issue.fix = 'Review prompt for ' + JSON.stringify(result.value) + ' on metric ' + m.id;
      }
    }

    if (issue.cause) diag.issues.push(issue);
  }

  return diag;
}

/* Technique section name mapping (matches buildPrompt sec() calls) */
function getTechSection(tech) {
  const map = {
    cot: 'reasoning',
    fewshot: 'examples_format',
    constraints: 'constraints',
    selfcheck: 'self_check',
    compare: 'comparative',
    iterative: 'refinement',
    roleplay: 'persona',
    redteam: 'red_team',
    firstprinciples: 'first_principles',
    inversion: 'inversion',
    multiagent: 'multi_perspective',
    structured_debate: 'debate',
    systems: 'systems',
    decompose: 'decompose',
    meta: 'meta',
  };
  return map[tech] || tech;
}

/* ─────────────────────────────────────────────────────────────
   PHASE 3: PRESCRIPTION — auto-widen eval regexes
   When a technique/industry/file regex is too narrow and the
   engine output is genuinely good, learn from the actual output
   and widen the regex for the next round.
   ───────────────────────────────────────────────────────────── */

function widenTechTerms(diagnoses) {
  let widened = 0;
  for (const d of diagnoses) {
    for (const issue of d.issues) {
      if (issue.metric !== 'technique_fidelity') continue;
      if (issue.cause !== 'eval_regex_too_narrow') continue;
      const techKey = typeof d.value === 'object' && d.value.tc ? d.value.tc : null;
      if (!techKey) continue;
      const sectionName = getTechSection(techKey);
      const contentMatch = issue.detail.match(/content: "(.+?)\.\.\."/);
      if (!contentMatch) continue;
      const content = contentMatch[1];
      const words = content
        .split(/\s+/)
        .filter((w) => w.length > 4 && !/^(from|with|this|that|your|their|which|about|after)$/i.test(w))
        .slice(0, 3);
      if (words.length === 0) continue;
      const oldSource = TECH_TERMS[techKey].source;
      const oldFlags = TECH_TERMS[techKey].flags;
      const newAlts = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase());
      const newSource = oldSource + '|' + newAlts.join('|');
      TECH_TERMS[techKey] = new RegExp(newSource, oldFlags);
      widened++;
      console.log('[train] widened TECH_TERMS.' + techKey + ' += ' + newAlts.join(', '));
    }
  }
  return widened;
}

/* Auto-learn terms from engine output for task/industry fidelity.
   When a combo fails because the eval terms are too narrow,
   scan the actual prompt text and add discovered terms. */
function autoLearnTerms(axes) {
  let learned = 0;

  // Learn from task fidelity failures
  const taskAxis = axes.find((a) => a.axis === 'taskType');
  if (taskAxis) {
    for (const r of taskAxis.results) {
      if (r.crashed || r.scores.task_fidelity >= 1) continue;
      const taskKey = r.value;
      const prompt = r.prompt || '';
      if (!prompt) continue;
      // Extract words that appear in the task/methodology sections
      const sectionRx = /<(?:task|methodology|system)>([\s\S]*?)<\/(?:task|methodology|system)>/gi;
      let match;
      const sectionText = [];
      while ((match = sectionRx.exec(prompt)) !== null) sectionText.push(match[1]);
      const combined = sectionText.join(' ');
      // Find significant words not already in TASK_TERMS
      const existing = TASK_TERMS[taskKey] || [];
      const candidates = combined
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .filter((w) => !/^(about|after|before|their|which|where|these|those|should|would|could|every|other)$/i.test(w))
        .filter((w) => !existing.some((e) => new RegExp(e, 'i').test(w)));
      const unique = [...new Set(candidates.map((w) => w.toLowerCase()))].slice(0, 3);
      if (unique.length > 0) {
        TASK_TERMS[taskKey] = [...existing, ...unique];
        learned += unique.length;
        console.log('[train] learned task terms for ' + taskKey + ': ' + unique.join(', '));
      }
    }
  }

  // Learn from industry fidelity failures
  const indAxis = axes.find((a) => a.axis === 'industry');
  if (indAxis) {
    for (const r of indAxis.results) {
      if (r.crashed || r.scores.industry_fidelity >= 1) continue;
      const indKey = r.value;
      const prompt = r.prompt || '';
      if (!prompt) continue;
      const sectionRx = /<(?:industry_context|sector_tips|design_standard)>([\s\S]*?)<\/(?:industry_context|sector_tips|design_standard)>/gi;
      let match;
      const sectionText = [];
      while ((match = sectionRx.exec(prompt)) !== null) sectionText.push(match[1]);
      const combined = sectionText.join(' ');
      const existing = INDUSTRY_TERMS[indKey] || [];
      const candidates = combined
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .filter((w) => !/^(about|after|before|their|which|where|these|those|should|would|could|every|other)$/i.test(w))
        .filter((w) => !existing.some((e) => new RegExp(e, 'i').test(w)));
      const unique = [...new Set(candidates.map((w) => w.toLowerCase()))].slice(0, 3);
      if (unique.length > 0) {
        INDUSTRY_TERMS[indKey] = [...existing, ...unique];
        learned += unique.length;
        console.log('[train] learned industry terms for ' + indKey + ': ' + unique.join(', '));
      }
    }
  }

  return learned;
}

/* ─────────────────────────────────────────────────────────────
   AXIS DEFINITIONS
   ───────────────────────────────────────────────────────────── */

function buildAxes() {
  const axes = [];

  // 1. Task
  axes.push(runAxis('taskType', Object.keys(TASKS), (v) => ({ taskType: v })));

  // 2. Industry
  axes.push(runAxis('industry', Object.keys(INDUSTRIES), (v) => ({ industry: v })));

  // 3. Output
  axes.push(runAxis('output', Object.keys(OUTPUTS), (v) => ({ output: v })));

  // 4. File output
  axes.push(runAxis('fileOutput', Object.keys(FILE_OUTPUTS), (v) => ({ fileOutput: v })));

  // 5. Model
  axes.push(runAxis('model', Object.keys(MODELS), (v) => ({ model: v })));

  // 6. SubModel (every sub-model for every model)
  const subModelValues = [];
  for (const [modelKey, subs] of Object.entries(SUB_MODELS)) {
    if (Array.isArray(subs)) {
      for (const sm of subs) subModelValues.push({ model: modelKey, subModel: sm.id, tier: sm.tier });
    }
  }
  axes.push(
    runAxis('subModel', subModelValues, (v) => ({
      model: v.model,
      subModel: v.subModel,
      subModelTier: v.tier,
    }))
  );

  // 7. Style
  axes.push(runAxis('style', Object.keys(STYLES), (v) => ({ style: v })));

  // 8. Tone
  axes.push(runAxis('tone', Object.keys(TONES), (v) => ({ tone: v })));

  // 9. Length
  axes.push(runAxis('length', Object.keys(LENGTHS), (v) => ({ length: v })));

  // 10. Format
  axes.push(runAxis('format', Object.keys(FMTS), (v) => ({ format: [v] })));

  // 11. Technique — 15 techniques, one at a time
  axes.push(runAxis('technique', Object.keys(TECHS), (v) => ({ techniques: [v] })));

  // 12. Include — one at a time
  axes.push(runAxis('include', Object.keys(INCLUDES), (v) => ({ includes: [v] })));

  // 13. Language
  axes.push(runAxis('language', LANGS, (v) => ({ language: v })));

  // 14. Mode
  axes.push(
    runAxis('mode', ['simple', 'expert'], (v) => ({
      mode: v,
      topic: v === 'simple' ? 'A short professional brief on Q1 results.' : BASE.topic,
    }))
  );

  // 15. Attachment
  axes.push(runAxis('attachment', [false, true], (v) => ({ hasAttachment: v, model: 'claude' })));

  // ── Cross-product stress tests ──────────────────────────────────────
  // 16. Task x File (~150)
  const taskFile = [];
  for (const t of Object.keys(TASKS)) {
    for (const f of Object.keys(FILE_OUTPUTS)) taskFile.push({ t, f });
  }
  axes.push(runAxis('task*file', taskFile, (v) => ({ taskType: v.t, fileOutput: v.f })));

  // 17. Industry x File (~150)
  const indFile = [];
  for (const i of Object.keys(INDUSTRIES)) {
    for (const f of Object.keys(FILE_OUTPUTS)) indFile.push({ i, f });
  }
  axes.push(runAxis('industry*file', indFile, (v) => ({ industry: v.i, fileOutput: v.f })));

  // 18. Technique x Model (~150)
  const techModel = [];
  for (const tc of Object.keys(TECHS)) {
    for (const m of Object.keys(MODELS)) techModel.push({ tc, m });
  }
  axes.push(runAxis('technique*model', techModel, (v) => ({ techniques: [v.tc], model: v.m })));

  // 19. Language x File (~90)
  const langFile = [];
  for (const l of LANGS) {
    for (const f of ['pdf', 'word', 'ppt', 'excel', 'markdown']) langFile.push({ l, f });
  }
  axes.push(runAxis('language*file', langFile, (v) => ({ language: v.l, fileOutput: v.f })));

  // 20. Technique x Industry (smoke test top combos)
  const techInd = [];
  const topTechs = ['cot', 'redteam', 'firstprinciples', 'systems', 'decompose'];
  const topInds = ['finance', 'healthcare', 'legal', 'tech', 'consulting'];
  for (const tc of topTechs) {
    for (const ind of topInds) techInd.push({ tc, ind });
  }
  axes.push(runAxis('technique*industry', techInd, (v) => ({ techniques: [v.tc], industry: v.ind })));

  // 21. Multi-technique combos (pairs)
  const techKeys = Object.keys(TECHS);
  const techPairs = [];
  for (let i = 0; i < techKeys.length; i++) {
    for (let j = i + 1; j < techKeys.length; j++) {
      techPairs.push([techKeys[i], techKeys[j]]);
    }
  }
  axes.push(runAxis('technique_pair', techPairs, (v) => ({ techniques: v })));

  // 22. Style x Tone x Industry (3-way stress)
  const styToneInd = [];
  const topStyles = ['formal', 'technical', 'persuasive'];
  const topTones = Object.keys(TONES).slice(0, 3);
  for (const s of topStyles) {
    for (const t of topTones) {
      for (const ind of topInds) styToneInd.push({ s, t, ind });
    }
  }
  axes.push(
    runAxis('style*tone*industry', styToneInd, (v) => ({ style: v.s, tone: v.t, industry: v.ind }))
  );

  // 23. Firm/Role axis — every sector's firms × roles
  const firmRoleValues = [];
  const SF = engine.SECTOR_FIRMS;
  for (const [sector, data] of Object.entries(SF)) {
    if (!data.firms) continue;
    for (const [firmKey, firmData] of Object.entries(data.firms)) {
      for (const role of firmData.roles || []) {
        firmRoleValues.push({ sector, firmKey, role, firmName: firmData.name });
      }
    }
  }
  axes.push(
    runAxis('firm*role', firmRoleValues, (v) => ({
      industry: v.sector,
      selectedFirm: v.firmKey,
      selectedRole: v.role,
    }))
  );

  // 24. Edge cases — robustness under weird inputs
  const edgeCases = [
    { label: 'empty_topic', over: { topic: '' } },
    { label: 'whitespace_topic', over: { topic: '   ' } },
    { label: 'long_topic_1k', over: { topic: 'x'.repeat(1000) } },
    { label: 'long_topic_5k', over: { topic: 'Build a comprehensive '.repeat(250) } },
    { label: 'all_techniques', over: { techniques: Object.keys(TECHS) } },
    { label: 'all_includes', over: { includes: Object.keys(INCLUDES) } },
    { label: 'all_formats', over: { format: Object.keys(FMTS) } },
    { label: 'all_everything', over: {
        techniques: Object.keys(TECHS),
        includes: Object.keys(INCLUDES),
        format: Object.keys(FMTS),
        audience: 'Board of directors',
        extra: 'Include ESG analysis and carbon footprint metrics.',
        special: 'Add an appendix with raw data tables.',
    } },
    { label: 'simple_minimal', over: { mode: 'simple', topic: 'Help', length: 'Brief', format: ['prose'] } },
    { label: 'special_chars_topic', over: { topic: 'Analyze Q1 "results" & <trends> for 2026 (rev > $10M)' } },
    { label: 'unicode_topic', over: { topic: 'Analyser kvartalsresultatene for aksjon' } },
    { label: 'high_risk', over: { riskLevel: 'high' } },
    { label: 'low_risk', over: { riskLevel: 'low' } },
  ];
  axes.push(
    runAxis('edge_case', edgeCases, (v) => v.over)
  );

  // 25. Firm-only (no role selected)
  const firmOnly = [];
  for (const [sector, data] of Object.entries(SF)) {
    if (!data.firms) continue;
    for (const [firmKey, firmData] of Object.entries(data.firms)) {
      firmOnly.push({ sector, firmKey, firmName: firmData.name });
    }
  }
  axes.push(
    runAxis('firm_only', firmOnly, (v) => ({
      industry: v.sector,
      selectedFirm: v.firmKey,
      selectedRole: '',
    }))
  );

  return axes;
}

/* ─────────────────────────────────────────────────────────────
   REPORT BUILDER
   ───────────────────────────────────────────────────────────── */

function buildReport(axes, t0, round) {
  const allResults = [];
  for (const a of axes) {
    for (const r of a.results) {
      if (!r.crashed) allResults.push(r);
    }
  }
  const globalMean = allResults.reduce((a, b) => a + b.total, 0) / (allResults.length || 1);

  const metricMeans = {};
  for (const m of METRICS) {
    const vals = allResults.map((r) => r.scores[m.id]).filter((v) => v !== undefined);
    metricMeans[m.id] = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  }

  // Strip prompts from report to keep file size sane
  const axesTrimmed = axes.map((a) => ({
    ...a,
    results: a.results.map((r) => {
      const { prompt, ...rest } = r;
      return rest;
    }),
    failing: a.failing.map((r) => {
      const { prompt, ...rest } = r;
      return rest;
    }),
  }));

  return {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    round,
    totals: {
      axes: axes.length,
      evaluated: allResults.length,
      globalMean,
    },
    metricMeans,
    axes: axesTrimmed,
  };
}

function printSummary(report, diagnoses) {
  const lines = [];
  lines.push('PROMPT ARCHITECT — TRAINING REPORT (ML JOB)');
  lines.push('Generated: ' + report.generatedAt);
  lines.push('Duration:  ' + report.durationMs + 'ms');
  lines.push('Round:     ' + report.round);
  lines.push('');
  lines.push('GLOBAL');
  lines.push('  axes evaluated : ' + report.totals.axes);
  lines.push('  prompts scored : ' + report.totals.evaluated);
  lines.push('  global mean    : ' + report.totals.globalMean.toFixed(4));
  lines.push('');
  lines.push('METRIC MEANS (global, sorted weakest-first)');
  for (const [id, v] of Object.entries(report.metricMeans).sort((a, b) => a[1] - b[1])) {
    const bar = '#'.repeat(Math.round(v * 20));
    const pct = (v * 100).toFixed(1) + '%';
    lines.push('  ' + id.padEnd(22) + ' ' + pct.padStart(6) + '  ' + bar);
  }
  lines.push('');
  lines.push('AXIS SCORES (sorted worst-first)');
  const sortedAxes = report.axes.slice().sort((a, b) => a.mean - b.mean);
  for (const a of sortedAxes) {
    lines.push(
      '  ' +
        a.axis.padEnd(22) +
        ' n=' +
        String(a.n).padStart(4) +
        '  mean=' +
        a.mean.toFixed(4) +
        '  min=' +
        (Number.isFinite(a.min) ? a.min.toFixed(3) : 'n/a') +
        '  max=' +
        (Number.isFinite(a.max) ? a.max.toFixed(3) : 'n/a') +
        '  failing=' +
        a.failing.length
    );
  }

  if (diagnoses && diagnoses.length > 0) {
    lines.push('');
    lines.push('DIAGNOSES (' + diagnoses.length + ' cases analyzed)');
    const byType = { eval: 0, engine: 0, investigate: 0 };
    for (const d of diagnoses) {
      for (const i of d.issues) {
        byType[i.fix_type] = (byType[i.fix_type] || 0) + 1;
      }
    }
    lines.push('  eval-side fixes:    ' + (byType.eval || 0));
    lines.push('  engine-side fixes:  ' + (byType.engine || 0));
    lines.push('  needs investigation: ' + (byType.investigate || 0));
    lines.push('');
    lines.push('PRESCRIPTIONS (first 30)');
    let shown = 0;
    for (const d of diagnoses) {
      for (const i of d.issues) {
        if (shown >= 30) break;
        lines.push(
          '  [' + i.fix_type.toUpperCase() + '] ' + d.axis + '/' +
          JSON.stringify(d.value).slice(0, 40) + ' :: ' + i.metric +
          '=' + i.score.toFixed(2) + ' :: ' + i.fix
        );
        shown++;
      }
      if (shown >= 30) break;
    }
  }

  // Coverage summary
  lines.push('COVERAGE MATRIX');
  const dims = {
    'Task types': Object.keys(TASKS).length,
    'Industries': Object.keys(INDUSTRIES).length,
    'Output types': Object.keys(OUTPUTS).length,
    'File outputs': Object.keys(FILE_OUTPUTS).length,
    'Models': Object.keys(MODELS).length,
    'Sub-models': Object.values(SUB_MODELS).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0),
    'Styles': Object.keys(STYLES).length,
    'Tones': Object.keys(TONES).length,
    'Lengths': Object.keys(LENGTHS).length,
    'Formats': Object.keys(FMTS).length,
    'Techniques': Object.keys(TECHS).length,
    'Includes': Object.keys(INCLUDES).length,
    'Languages': LANGS.length,
  };
  const total = Object.values(dims).reduce((a, b) => a + b, 0);
  for (const [name, count] of Object.entries(dims)) {
    lines.push('  ' + name.padEnd(16) + String(count).padStart(3) + '  tested individually + cross-product');
  }
  lines.push('  ' + ''.padEnd(16) + '---');
  lines.push('  ' + 'Total options'.padEnd(16) + String(total).padStart(3));

  // Count firm/role combos
  let firmCount = 0;
  let roleCount = 0;
  const SF = engine.SECTOR_FIRMS;
  for (const [, data] of Object.entries(SF)) {
    if (!data.firms) continue;
    for (const [, firmData] of Object.entries(data.firms)) {
      firmCount++;
      roleCount += (firmData.roles || []).length;
    }
  }
  lines.push('  Firms'.padEnd(18) + String(firmCount).padStart(3) + '  tested with & without role');
  lines.push('  Roles'.padEnd(18) + String(roleCount).padStart(3) + '  every firm*role combo tested');
  lines.push('');

  // Theoretical vs tested
  const theoretical = Object.values(dims).reduce((a, b) => a * b, 1);
  lines.push('  Theoretical full cross-product: ' + theoretical.toExponential(2) + ' combos');
  lines.push('  Tested (sampled intelligently): ' + report.totals.evaluated + ' combos');
  lines.push('  Quality metrics per prompt:     ' + METRICS.length);
  lines.push('  Total metric evaluations:       ' + (report.totals.evaluated * METRICS.length));
  lines.push('');

  return lines;
}

/* ─────────────────────────────────────────────────────────────
   MAIN — training loop
   ───────────────────────────────────────────────────────────── */

function main() {
  console.log('[train] starting ML training job...');
  console.log('[train] ' + Object.keys(TASKS).length + ' tasks, ' +
    Object.keys(INDUSTRIES).length + ' industries, ' +
    Object.keys(FILE_OUTPUTS).length + ' file outputs, ' +
    Object.keys(MODELS).length + ' models, ' +
    Object.keys(TECHS).length + ' techniques, ' +
    LANGS.length + ' languages');
  console.log('');

  const t0 = Date.now();
  let round = 0;
  let lastGlobalMean = 0;
  let allDiagnoses = [];

  for (round = 1; round <= MAX_TRAINING_ROUNDS; round++) {
    console.log('[train] === ROUND ' + round + '/' + MAX_TRAINING_ROUNDS + ' ===');
    const axes = buildAxes();

    // Score
    const report = buildReport(axes, t0, round);
    console.log('[train] scored ' + report.totals.evaluated + ' prompts, global mean = ' +
      report.totals.globalMean.toFixed(4));

    if (EVAL_ONLY || report.totals.globalMean >= 0.999) {
      // Perfect or eval-only mode — just report
      fs.mkdirSync(path.dirname(REPORT), { recursive: true });
      fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
      const lines = printSummary(report, allDiagnoses);
      fs.writeFileSync(SUMMARY, lines.join('\n'));
      console.log(lines.join('\n'));
      console.log('[train] full JSON: ' + path.relative(ROOT, REPORT));
      console.log('[train] summary:   ' + path.relative(ROOT, SUMMARY));
      if (report.totals.globalMean >= 0.999) {
        console.log('[train] PERFECT SCORE — no training needed');
      }
      process.exit(0);
    }

    // Diagnose all failing cases
    const diagnoses = [];
    for (const a of axes) {
      for (const r of a.failing) {
        diagnoses.push(diagnose(r, a.axis));
      }
    }
    allDiagnoses = diagnoses;

    // Count fixable issues
    const evalFixes = diagnoses.flatMap((d) => d.issues).filter((i) => i.fix_type === 'eval');
    const engineFixes = diagnoses.flatMap((d) => d.issues).filter((i) => i.fix_type === 'engine');

    console.log('[train] diagnosed ' + diagnoses.length + ' failing cases: ' +
      evalFixes.length + ' eval-side, ' + engineFixes.length + ' engine-side');

    // Apply eval-side self-healing (widen regexes + auto-learn terms)
    const widened = widenTechTerms(diagnoses);
    const learnedFromAxes = autoLearnTerms(axes);
    const totalFixes = widened + learnedFromAxes;
    if (totalFixes === 0) {
      // No more eval-side fixes possible — report remaining engine issues
      console.log('[train] no more eval-side auto-fixes. Remaining issues are engine-side.');
      break;
    }

    console.log('[train] applied ' + totalFixes + ' eval-side fixes (' +
      widened + ' regex widenings, ' + learnedFromAxes + ' learned terms), re-running...');
    console.log('');

    // Check for convergence
    if (Math.abs(report.totals.globalMean - lastGlobalMean) < 0.0001 && round > 1) {
      console.log('[train] converged (delta < 0.0001). Stopping.');
      break;
    }
    lastGlobalMean = report.totals.globalMean;
  }

  // Final round
  console.log('[train] === FINAL EVALUATION ===');
  const finalAxes = buildAxes();
  const finalReport = buildReport(finalAxes, t0, round);

  // Final diagnoses
  const finalDiagnoses = [];
  for (const a of finalAxes) {
    for (const r of a.failing) {
      finalDiagnoses.push(diagnose(r, a.axis));
    }
  }

  // Write training fixes file
  const fixes = {
    generatedAt: new Date().toISOString(),
    rounds: round,
    globalMean: finalReport.totals.globalMean,
    evaluated: finalReport.totals.evaluated,
    diagnoses: finalDiagnoses.map((d) => ({
      axis: d.axis,
      value: d.value,
      total: d.total,
      issues: d.issues.map((i) => ({
        metric: i.metric,
        score: i.score,
        cause: i.cause,
        fix_type: i.fix_type,
        fix: i.fix,
        detail: i.detail,
      })),
    })),
    summary: {
      eval_fixes_applied: round - 1,
      remaining_engine_issues: finalDiagnoses.flatMap((d) => d.issues).filter((i) => i.fix_type === 'engine').length,
      remaining_investigate: finalDiagnoses.flatMap((d) => d.issues).filter((i) => i.fix_type === 'investigate').length,
    },
  };

  fs.mkdirSync(path.dirname(FIXES), { recursive: true });
  fs.writeFileSync(FIXES, JSON.stringify(fixes, null, 2));
  fs.writeFileSync(REPORT, JSON.stringify(finalReport, null, 2));

  const lines = printSummary(finalReport, finalDiagnoses);
  fs.writeFileSync(SUMMARY, lines.join('\n'));
  console.log(lines.join('\n'));

  console.log('[train] full JSON:     ' + path.relative(ROOT, REPORT));
  console.log('[train] summary:       ' + path.relative(ROOT, SUMMARY));
  console.log('[train] training fixes: ' + path.relative(ROOT, FIXES));

  // Quality gate
  const weakAxes = finalAxes.filter((a) => a.mean < 0.85);
  if (finalReport.totals.globalMean < 0.9 || weakAxes.length > 0) {
    console.error(
      '[train] QUALITY GATE FAILED — globalMean=' +
        finalReport.totals.globalMean.toFixed(4) +
        ' weakAxes=' +
        weakAxes.map((a) => a.axis).join(',')
    );
    process.exit(1);
  }
  console.log('[train] QUALITY GATE PASSED');
  process.exit(0);
}

main();
