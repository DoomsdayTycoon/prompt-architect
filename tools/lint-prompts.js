/* lint-prompts.js — deterministic linter for buildPrompt() output.

   For every meaningful {task × industry × output × fileOutput × model} combo,
   generate the prompt and run a battery of checks against the prompt text.
   The checks enforce the formatting rules already documented in FILE_INST and
   TABLE_RULES inside src/app.jsx — they catch the case where someone edits the
   data constants or buildPrompt() in a way that drops a rule, contradicts
   itself, or emits an amateur instruction.

   This linter does NOT call any LLM. It is free, instant, and deterministic.
   Run it as often as you want. Report goes to data/lint-report.json. */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ENGINE = path.resolve(__dirname, 'prompt-engine.cjs');
const REPORT = path.resolve(ROOT, 'data/lint-report.json');
const SUMMARY = path.resolve(ROOT, 'data/lint-summary.txt');

if (!fs.existsSync(ENGINE)) {
  console.error('engine not built. Run: node tools/build-engine.mjs');
  process.exit(1);
}

const engine = require(ENGINE);
const { buildPrompt, TASKS, INDUSTRIES, OUTPUTS, FILE_OUTPUTS, MODELS, FMTS } = engine;

/* ─────────────────────────────────────────────────────────────
   RULES
   Each rule has: id, severity (error|warn), description, applies(combo) -> bool,
   check(promptText, combo) -> null | failure message.
   ───────────────────────────────────────────────────────────── */

const DOC_FILES = ['pdf', 'word', 'ppt'];
const TABLE_FILES = ['pdf', 'word', 'ppt', 'excel'];
const STYLED_FILES = ['pdf', 'word', 'ppt', 'excel'];

const rules = [
  // ── Forbidden tokens — these are amateur formatting markers ──────────
  {
    id: 'no-na-token',
    severity: 'error',
    description: 'Prompt must not contain raw "N/A" as an instruction (only as a forbidden example).',
    applies: () => true,
    check: (text) => {
      // We allow "NEVER N/A" / "never use N/A" because that's a forbidding instruction.
      // Look for N/A used positively or as an example value.
      const lines = text.split('\n');
      for (const line of lines) {
        if (/\bN\/A\b/i.test(line) && !/never|forbid|don'?t use|do not use|instead|not|no /i.test(line)) {
          return 'found raw "N/A" without a forbidding context: ' + line.trim();
        }
      }
      return null;
    },
  },

  {
    id: 'no-numbered-headers',
    severity: 'error',
    description: 'Document file types must instruct against numbered section headers (e.g. "1.0 Executive Summary").',
    applies: (c) => DOC_FILES.includes(c.fileOutput),
    check: (text) => {
      if (!/DO NOT number/i.test(text) && !/no numbered/i.test(text)) {
        return 'missing "DO NOT number section headers" instruction for document file type';
      }
      return null;
    },
  },

  {
    id: 'em-dash-empty-cells',
    severity: 'error',
    description: 'Table-bearing file types must require em-dash (--) for empty cells.',
    applies: (c) => TABLE_FILES.includes(c.fileOutput),
    check: (text) => {
      if (!/em dash|em-dash|--/i.test(text)) {
        return 'no em-dash empty-cell instruction found';
      }
      // Also assert that None / null / 0 are explicitly forbidden.
      if (!/NEVER.*N\/A|never use N\/A|never.*null|never.*None/i.test(text)) {
        return 'no explicit ban on N/A / None / null for empty cells';
      }
      return null;
    },
  },

  {
    id: 'units-as-subtitle',
    severity: 'warn',
    description: 'Tables should declare units in an italic subtitle, never inline with data.',
    applies: (c) => TABLE_FILES.includes(c.fileOutput),
    check: (text) => {
      if (!/italic.*subtitle|8pt italic/i.test(text)) {
        return 'no "units in italic subtitle" instruction';
      }
      return null;
    },
  },

  {
    id: 'source-line-required',
    severity: 'warn',
    description: 'Tables should require a source line below.',
    applies: (c) => TABLE_FILES.includes(c.fileOutput),
    check: (text) => {
      if (!/source line|Source:/i.test(text)) {
        return 'no source-line requirement for tables';
      }
      return null;
    },
  },

  {
    id: 'insight-chart-titles',
    severity: 'warn',
    description: 'Charts should use insight-statement titles, not generic labels.',
    applies: (c) => ['pdf', 'word', 'ppt', 'excel'].includes(c.fileOutput),
    check: (text) => {
      if (!/insight statement|insight title/i.test(text)) {
        return 'no insight-statement-title rule for charts';
      }
      return null;
    },
  },

  {
    id: 'design-standard-present',
    severity: 'error',
    description: 'Styled file types must include the industry DESIGN STANDARD block (fonts + colors).',
    applies: (c) => STYLED_FILES.includes(c.fileOutput),
    check: (text) => {
      if (!/DESIGN STANDARD/.test(text)) {
        return 'missing DESIGN STANDARD block';
      }
      if (!/FONTS:/.test(text) || !/COLORS:/.test(text)) {
        return 'DESIGN STANDARD block missing FONTS or COLORS';
      }
      return null;
    },
  },

  {
    id: 'quality-gate-present',
    severity: 'error',
    description: 'Non-fast-tier file outputs must emit a quality_gate block.',
    applies: (c) => c.fileOutput && c.subModelTier !== 'fast',
    check: (text, c) => {
      const isXml = MODELS[c.model]?.fmt === 'xml';
      // sec() helper turns "quality_gate" into "## Quality gate" (md) or
      // "**QUALITY GATE**" (bold/gemini) or "<quality_gate>" (xml).
      const found = isXml
        ? text.includes('<quality_gate>')
        : (/## Quality gate/.test(text) || /\*\*QUALITY GATE\*\*/.test(text));
      return found ? null : 'no quality_gate block found';
    },
  },

  {
    id: 'system-block-present',
    severity: 'error',
    description: 'Every prompt must contain a SYSTEM block.',
    applies: () => true,
    check: (text, c) => {
      const isXml = MODELS[c.model]?.fmt === 'xml';
      const tag = isXml ? '<system>' : /## System|\*\*SYSTEM\*\*/;
      const found = isXml ? text.includes('<system>') : (/## System/.test(text) || /\*\*SYSTEM\*\*/.test(text));
      return found ? null : 'no system block';
    },
  },

  {
    id: 'task-block-present',
    severity: 'error',
    description: 'Every prompt must contain a TASK block.',
    applies: () => true,
    check: (text, c) => {
      const isXml = MODELS[c.model]?.fmt === 'xml';
      const found = isXml ? text.includes('<task>') : (/## Task/.test(text) || /\*\*TASK\*\*/.test(text));
      return found ? null : 'no task block';
    },
  },

  {
    id: 'no-double-blank',
    severity: 'warn',
    description: 'Prompt should not contain triple-newline runs (drift in formatting).',
    applies: () => true,
    check: (text) => {
      if (/\n\n\n\n/.test(text)) {
        return 'found 4+ consecutive newlines';
      }
      return null;
    },
  },

  {
    id: 'no-amateur-words',
    severity: 'warn',
    description: 'Prompt should not contain amateur hedge words like "maybe", "kind of", "sort of".',
    applies: () => true,
    check: (text) => {
      const bad = ['maybe', 'kind of', 'sort of', 'pretty much', 'somewhat'];
      for (const w of bad) {
        if (new RegExp('\\b' + w + '\\b', 'i').test(text)) {
          return 'found hedge word: "' + w + '"';
        }
      }
      return null;
    },
  },

  {
    id: 'avoid-block-present',
    severity: 'warn',
    description: 'Every prompt should contain an AVOID block.',
    applies: () => true,
    check: (text, c) => {
      const isXml = MODELS[c.model]?.fmt === 'xml';
      const found = isXml ? text.includes('<avoid>') : (/## Avoid/.test(text) || /\*\*AVOID\*\*/.test(text));
      return found ? null : 'no avoid block';
    },
  },

  {
    id: 'min-prompt-length',
    severity: 'error',
    description: 'Generated prompt should be at least 400 chars (otherwise something is dropped).',
    applies: () => true,
    check: (text) => {
      if (text.length < 400) {
        return 'prompt too short: ' + text.length + ' chars';
      }
      return null;
    },
  },

  {
    id: 'max-prompt-length',
    severity: 'warn',
    description: 'Generated prompt should be under 25k chars (otherwise it bloats).',
    applies: () => true,
    check: (text) => {
      if (text.length > 25000) {
        return 'prompt too long: ' + text.length + ' chars';
      }
      return null;
    },
  },

  {
    id: 'currency-rule-present',
    severity: 'warn',
    description: 'Excel/financial file types should have a currency-symbol-only-on-first-or-total-row rule.',
    applies: (c) => ['excel', 'pdf', 'word'].includes(c.fileOutput) && c.industry === 'finance',
    check: (text) => {
      if (!/Currency|first.{0,20}total|total row/i.test(text)) {
        return 'no currency-formatting rule for financial document';
      }
      return null;
    },
  },

  {
    id: 'json-naming-rule',
    severity: 'error',
    description: 'JSON output must require camelCase keys.',
    applies: (c) => c.fileOutput === 'json',
    check: (text) => {
      if (!/camelCase/i.test(text)) {
        return 'JSON output missing camelCase requirement';
      }
      return null;
    },
  },

  {
    id: 'csv-rfc-rule',
    severity: 'error',
    description: 'CSV output must reference RFC 4180 or equivalent compliance.',
    applies: (c) => c.fileOutput === 'csv',
    check: (text) => {
      if (!/RFC 4180/i.test(text)) {
        return 'CSV output missing RFC 4180 reference';
      }
      return null;
    },
  },

  {
    id: 'plaintext-80col',
    severity: 'error',
    description: 'Plaintext output must enforce an 80-column max.',
    applies: (c) => c.fileOutput === 'plaintext',
    check: (text) => {
      if (!/80 char|80-char|80 column/i.test(text)) {
        return 'plaintext missing 80-column rule';
      }
      return null;
    },
  },

  {
    id: 'codefile-typing',
    severity: 'error',
    description: 'Code file output must require type annotations on public functions.',
    applies: (c) => c.fileOutput === 'codeFile',
    check: (text) => {
      if (!/type annotation/i.test(text)) {
        return 'code file missing type-annotation requirement';
      }
      return null;
    },
  },

  // ── Model-specific rules (all models) ──────────

  {
    id: 'model-guidance-block',
    severity: 'error',
    description: 'Every prompt must contain a model_guidance or claude_guidance block.',
    applies: () => true,
    check: (text) => {
      return /model_guidance|claude_guidance|MODEL GUIDANCE|CLAUDE GUIDANCE|Model guidance|Claude guidance/i.test(text)
        ? null : 'missing model guidance block';
    },
  },

  {
    id: 'no-preamble-instruction',
    severity: 'error',
    description: 'Every prompt must instruct the model to skip preamble.',
    applies: () => true,
    check: (text) => {
      return /without preamble|directly with the deliverable|Skip intro|Skip conversational|No preamble|No intro|no meta-commentary/i.test(text)
        ? null : 'missing no-preamble instruction';
    },
  },

  {
    id: 'self-verification',
    severity: 'error',
    description: 'Flagship/balanced prompts must include self-verification.',
    applies: (c) => c.subModelTier !== 'fast',
    check: (text) => {
      return /verify|Before final|self.*check/i.test(text)
        ? null : 'missing self-verification instruction';
    },
  },

  {
    id: 'claude-positive-avoid',
    severity: 'warn',
    description: 'Claude AVOID block should use positive framing.',
    applies: (c) => c.model === 'claude',
    check: (text) => {
      const avoidBlock = text.match(/<avoid>([\s\S]*?)<\/avoid>/);
      if (!avoidBlock) return null;
      const content = avoidBlock[1];
      if (/^(Open with|Start with|Every sentence|Begin with)/m.test(content)) return null;
      return 'Claude AVOID block should lead with positive instruction';
    },
  },

  {
    id: 'claude-xml-tags',
    severity: 'error',
    description: 'Claude prompts must use XML tags for all sections.',
    applies: (c) => c.model === 'claude',
    check: (text) => {
      if (!text.includes('<system>')) return 'Claude prompt missing <system> XML tag';
      if (!text.includes('<task>')) return 'Claude prompt missing <task> XML tag';
      if (!text.includes('<contract>') && !text.includes('<avoid>')) return 'Claude prompt missing structural XML tags';
      return null;
    },
  },

  {
    id: 'sector-tips',
    severity: 'warn',
    description: 'Prompts for key sectors should include sector-specific guidance keywords.',
    applies: (c) => ['finance', 'healthcare', 'legal', 'consulting', 'tech', 'marketing', 'education', 'research'].includes(c.industry),
    check: (text, c) => {
      const sectorKeywords = {
        finance: /FY\d{2}[AE]|valuation|sensitivit|base case/i,
        healthcare: /PICO|evidence level/i,
        legal: /IRAC|binding.*authority|persuasive.*authority/i,
        consulting: /pyramid|MECE/i,
        tech: /version number|backward compat|Big-O|complexity/i,
        marketing: /CAC|ROAS|funnel/i,
        education: /Bloom|formative/i,
        research: /CONSORT|PRISMA|effect size/i,
      };
      const kw = sectorKeywords[c.industry];
      if (kw && !kw.test(text)) {
        return c.model + ' prompt for ' + c.industry + ' missing sector keywords';
      }
      return null;
    },
  },

  {
    id: 'file-tips',
    severity: 'warn',
    description: 'Prompts for file outputs should include file-specific guidance keywords.',
    applies: (c) => c.fileOutput && c.fileOutput !== 'none',
    check: (text, c) => {
      const fileKeywords = {
        pdf: /vertical rhythm|typography|orphan header/i,
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
      const kw = fileKeywords[c.fileOutput];
      if (kw && !kw.test(text)) {
        return c.model + ' prompt for ' + c.fileOutput + ' missing file-specific keywords';
      }
      return null;
    },
  },

  {
    id: 'claude-document-grounding',
    severity: 'warn',
    description: 'Claude attachment prompts should instruct quote extraction.',
    applies: (c) => c.model === 'claude' && c.hasAttachment,
    check: (text) => {
      return /<quotes>|quote.*relevant/i.test(text) ? null : 'Claude attachment missing quote-extraction';
    },
  },

  {
    id: 'prose-guidance',
    severity: 'warn',
    description: 'Document outputs (pdf/word/plaintext) should include prose guidance.',
    applies: (c) => ['pdf', 'word', 'plaintext'].includes(c.fileOutput) && ['document', 'proposal', 'brief'].includes(c.output),
    check: (text) => {
      return /flowing prose|complete paragraph|prose paragraph/i.test(text) ? null : 'document output missing prose-guidance';
    },
  },

  // ── FORMULA / LaTeX rules ─────────────────────────────────────────────
  // These catch the class of bugs that produced overlapping equations in
  // exported PDFs: long \tag{} labels, multi-formula display blocks,
  // parameters stuffed into equation bodies, and unbroken wide expressions.
  // The fix lives in FORMULA_RULES (inside FILE_INST for pdf/word/ppt/
  // markdown/html), so every rule below verifies a specific anti-pattern
  // warning is actually present in the generated prompt text.

  {
    id: 'formula-rules-present',
    severity: 'error',
    description: 'Document-style file outputs must ship the FORMULA & EQUATION RULES block.',
    applies: (c) => ['pdf', 'word', 'ppt', 'markdown', 'html'].includes(c.fileOutput),
    check: (text) => {
      return /FORMULA & EQUATION RULES/.test(text) ? null : 'missing FORMULA & EQUATION RULES block';
    },
  },

  {
    id: 'formula-one-per-block',
    severity: 'error',
    description: 'Formula rules must forbid multiple equations inside a single $$...$$ display block.',
    applies: (c) => ['pdf', 'word', 'ppt', 'markdown', 'html'].includes(c.fileOutput),
    check: (text) => {
      // Must explicitly say ONE equation per display block.
      return /ONE equation per .*block|one equation per display/i.test(text)
        ? null : 'formula rules missing "one equation per block" requirement';
    },
  },

  {
    id: 'formula-short-tag',
    severity: 'error',
    description: 'Formula rules must require \\tag{} contents to be short (numbers or 1-3 char labels).',
    applies: (c) => ['pdf', 'word', 'ppt', 'markdown', 'html'].includes(c.fileOutput),
    check: (text) => {
      // Must explicitly forbid multi-word tags like \tag{value function}.
      if (!/tag\{\}.*SHORT|short.*tag|NEVER multi-word|NEVER.*\\tag\{value function\}/i.test(text)) {
        return 'formula rules missing "short \\tag{} contents" requirement';
      }
      return null;
    },
  },

  {
    id: 'formula-no-inline-params',
    severity: 'error',
    description: 'Formula rules must forbid combining equation body with parameter values on the same line.',
    applies: (c) => ['pdf', 'word', 'ppt', 'markdown', 'html'].includes(c.fileOutput),
    check: (text) => {
      return /NEVER combine.*equation.*parameter|parameter values.*separate line|where:.*block/i.test(text)
        ? null : 'formula rules missing "parameters on separate line" requirement';
    },
  },

  {
    id: 'formula-break-wide',
    severity: 'error',
    description: 'Formula rules must require wide expressions to be broken across lines with aligned.',
    applies: (c) => ['pdf', 'word', 'ppt', 'markdown', 'html'].includes(c.fileOutput),
    check: (text) => {
      return /wide.*aligned|break.*aligned|\\begin\{aligned\}.*\\\\/i.test(text)
        ? null : 'formula rules missing "break wide expressions with aligned" requirement';
    },
  },

  {
    id: 'formula-worked-example',
    severity: 'error',
    description: 'Formula rules must ship a BAD/GOOD worked example showing the overlap anti-pattern.',
    applies: (c) => ['pdf', 'word', 'ppt', 'markdown', 'html'].includes(c.fileOutput),
    check: (text) => {
      // The rule block ships both "BAD" and "GOOD" example labels.
      if (!/BAD \(/i.test(text) || !/GOOD \(/i.test(text)) {
        return 'formula rules missing BAD/GOOD worked examples';
      }
      // And the canonical overlap case: value function + lambda 2.25.
      if (!/value function|lambda.*2\.25|\\lambda \\approx 2\.25/i.test(text)) {
        return 'formula rules missing the value-function overlap example';
      }
      return null;
    },
  },

  {
    id: 'formula-no-literal-script-close',
    severity: 'error',
    description: 'No FILE_INST / FORMULA_RULES text may contain a literal </script> close tag (HTML parser footgun).',
    applies: (c) => ['pdf', 'word', 'ppt', 'markdown', 'html'].includes(c.fileOutput),
    check: (text) => {
      // If the generated prompt contains </script> anywhere, a template-literal
      // in FILE_INST has leaked a raw HTML script close tag. Inside the inline
      // Babel block in static/index.html that closes the entire app. Block it.
      return text.includes('</script>')
        ? 'generated prompt contains literal </script> — will break inline Babel in index.html'
        : null;
    },
  },
];

/* ─────────────────────────────────────────────────────────────
   COMBO GENERATOR
   Cartesian over the meaningful axes. We don't enumerate every
   combination — that's millions. Instead we sample the most
   impactful axes and let the watch loop catch drift over time.
   ───────────────────────────────────────────────────────────── */

const taskKeys = Object.keys(TASKS);
const indKeys = Object.keys(INDUSTRIES);
const outKeys = Object.keys(OUTPUTS);
const fileKeys = Object.keys(FILE_OUTPUTS);
const modelKeys = ['claude', 'chatgpt', 'gpt4o', 'gemini', 'grok', 'mistral', 'llama', 'perplexity', 'copilot', 'general'];
const tiers = ['flagship', 'balanced', 'fast'];

const BASE = {
  topic: 'Build a quarterly performance review for the leadership team covering revenue, margin trends, and 2026 priorities.',
  taskType: 'analysis',
  model: 'claude',
  subModel: 'flagship',
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

function combo(over) {
  return Object.assign({}, BASE, over);
}

function* generateCombos() {
  // Phase A: every fileOutput × every model — exhaustive on file/model crossing
  for (const fileOutput of fileKeys) {
    for (const model of modelKeys) {
      yield combo({ fileOutput, model });
    }
  }

  // Phase B: every industry × every fileOutput on claude — design-standard coverage
  for (const industry of indKeys) {
    for (const fileOutput of fileKeys) {
      yield combo({ industry, fileOutput });
    }
  }

  // Phase C: every task × every fileOutput on claude — task coverage across files
  for (const taskType of taskKeys) {
    for (const fileOutput of fileKeys) {
      yield combo({ taskType, fileOutput });
    }
  }

  // Phase D: every output type × every fileOutput
  for (const output of outKeys) {
    for (const fileOutput of fileKeys) {
      yield combo({ output, fileOutput });
    }
  }

  // Phase E: tier coverage — fast tier should still emit basic structure
  for (const tier of tiers) {
    for (const fileOutput of fileKeys) {
      for (const model of modelKeys) {
        yield combo({ subModelTier: tier, subModel: tier, fileOutput, model });
      }
    }
  }

  // Phase F: simple mode across file outputs and industries
  for (const fileOutput of fileKeys) {
    for (const industry of ['general', 'finance', 'consulting', 'tech', 'healthcare']) {
      yield combo({
        mode: 'simple',
        topic: 'A short professional brief on Q1 results.',
        length: 'Brief',
        format: ['prose'],
        fileOutput,
        industry,
      });
    }
  }

  // Phase G: every length × pdf — length-specific drift
  for (const length of ['Brief', 'Medium', 'Detailed', 'Comprehensive']) {
    for (const fileOutput of fileKeys) {
      yield combo({ length, fileOutput });
    }
  }

  // Phase H: every format combination on top-3 fileOutputs
  const fmtKeys = Object.keys(FMTS);
  for (const f of fmtKeys) {
    for (const fileOutput of ['pdf', 'word', 'excel', 'ppt']) {
      yield combo({ format: [f], fileOutput });
    }
  }

  // Phase I: combined task + industry + model stress on pdf and excel
  for (const taskType of taskKeys) {
    for (const industry of indKeys) {
      yield combo({ taskType, industry, fileOutput: 'pdf', model: 'claude' });
    }
  }

  // Phase J: Claude-specific — attachment mode for key file outputs
  for (const fileOutput of ['pdf', 'word', 'excel', 'ppt']) {
    yield combo({ model: 'claude', fileOutput, hasAttachment: true, output: 'document' });
    yield combo({ model: 'claude', fileOutput, hasAttachment: true, output: 'proposal' });
  }

  // Phase K: Claude-specific — all sectors on Claude with pdf
  for (const industry of indKeys) {
    yield combo({ model: 'claude', industry, fileOutput: 'pdf' });
    yield combo({ model: 'claude', industry, fileOutput: 'excel' });
  }

  // Phase L: Claude-specific — all file outputs with document and proposal output types
  for (const fileOutput of fileKeys) {
    yield combo({ model: 'claude', fileOutput, output: 'document' });
    yield combo({ model: 'claude', fileOutput, output: 'proposal' });
    yield combo({ model: 'claude', fileOutput, output: 'brief' });
  }
}

/* ─────────────────────────────────────────────────────────────
   RUN
   ───────────────────────────────────────────────────────────── */

function comboLabel(c) {
  return [c.taskType, c.industry, c.output, c.fileOutput, c.model, c.subModelTier, c.mode].join('|');
}

function lintOne(combo) {
  let prompt;
  try {
    prompt = buildPrompt(combo);
  } catch (err) {
    return {
      combo: comboLabel(combo),
      ok: false,
      crashed: true,
      error: err.message,
      failures: [],
    };
  }

  const failures = [];
  for (const rule of rules) {
    if (!rule.applies(combo)) continue;
    const msg = rule.check(prompt, combo);
    if (msg) {
      failures.push({ rule: rule.id, severity: rule.severity, message: msg });
    }
  }

  return {
    combo: comboLabel(combo),
    ok: failures.filter(f => f.severity === 'error').length === 0,
    crashed: false,
    promptLength: prompt.length,
    failures,
  };
}

function main() {
  console.log('[lint] starting...');
  const t0 = Date.now();
  const results = [];
  let total = 0;
  for (const combo of generateCombos()) {
    total++;
    results.push(lintOne(combo));
  }

  // Aggregate
  const errors = results.filter(r => !r.ok || r.crashed);
  const warnings = results.filter(r => r.ok && r.failures.some(f => f.severity === 'warn'));
  const clean = results.filter(r => r.ok && r.failures.length === 0);

  // Group failures by rule for the report
  const ruleHits = {};
  for (const r of results) {
    for (const f of r.failures) {
      ruleHits[f.rule] = ruleHits[f.rule] || { count: 0, severity: f.severity, examples: [] };
      ruleHits[f.rule].count++;
      if (ruleHits[f.rule].examples.length < 3) {
        ruleHits[f.rule].examples.push({ combo: r.combo, message: f.message });
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    totals: {
      combos: total,
      clean: clean.length,
      withErrors: errors.length,
      withWarnings: warnings.length,
    },
    ruleHits,
    results,
  };

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  // Human-readable summary
  const lines = [];
  lines.push('PROMPT ARCHITECT — LINT REPORT');
  lines.push('Generated: ' + report.generatedAt);
  lines.push('Duration:  ' + report.durationMs + 'ms');
  lines.push('');
  lines.push('TOTALS');
  lines.push('  combos       : ' + total);
  lines.push('  clean        : ' + clean.length);
  lines.push('  with errors  : ' + errors.length);
  lines.push('  with warnings: ' + warnings.length);
  lines.push('');
  lines.push('RULE HITS');
  const sortedRules = Object.entries(ruleHits).sort((a, b) => b[1].count - a[1].count);
  if (sortedRules.length === 0) {
    lines.push('  (none — all rules clean)');
  } else {
    for (const [id, data] of sortedRules) {
      lines.push('  [' + data.severity.toUpperCase() + '] ' + id + ' x' + data.count);
      for (const ex of data.examples) {
        lines.push('     - ' + ex.combo + ' :: ' + ex.message);
      }
    }
  }
  lines.push('');
  if (errors.length > 0) {
    lines.push('FAILURES (first 20)');
    for (const r of errors.slice(0, 20)) {
      lines.push('  ' + r.combo);
      if (r.crashed) {
        lines.push('    CRASH: ' + r.error);
      } else {
        for (const f of r.failures.filter(x => x.severity === 'error')) {
          lines.push('    [' + f.rule + '] ' + f.message);
        }
      }
    }
  }
  fs.writeFileSync(SUMMARY, lines.join('\n'));

  // Console output
  console.log(lines.join('\n'));
  console.log('');
  console.log('[lint] full JSON: ' + path.relative(ROOT, REPORT));
  console.log('[lint] summary:   ' + path.relative(ROOT, SUMMARY));

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
