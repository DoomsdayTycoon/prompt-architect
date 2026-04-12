#!/usr/bin/env node
/* test-static-html.js — structural safety checks for static/index.html.

   This is the test harness the previous outage revealed was missing. The
   prompt-engine linter (tools/lint-prompts.js) validates the OUTPUT of
   buildPrompt(), but it operates on src/app.jsx via an esbuild bundle. It
   never touches the inline <script type="text/babel"> block inside
   static/index.html — which is what production actually serves.

   If someone puts a literal </script> inside a JS template literal inside
   that block, the HTML tokenizer closes the script tag mid-string. Babel
   Standalone then fails to compile, React never mounts, and proarch.tech
   serves raw JSX source as plain text. This exact bug shipped once and
   broke production until caught by the user.

   This file runs the checks that would have caught it. Run as:
     node tools/test-static-html.js              # exit 1 on any failure
     node tools/test-static-html.js --quiet      # only print on failure
*/

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.resolve(ROOT, 'static/index.html');
const SRC = path.resolve(ROOT, 'src/app.jsx');

const QUIET = process.argv.includes('--quiet');

function log(msg) {
  if (!QUIET) console.log(msg);
}

function fail(msg) {
  console.error('[test-static-html] FAIL: ' + msg);
  process.exit(1);
}

function ok(msg) {
  log('[test-static-html] ok  — ' + msg);
}

/* ─────────────────────────────────────────────────────────────
   Load index.html and extract the inline Babel block
   ───────────────────────────────────────────────────────────── */

if (!fs.existsSync(INDEX)) fail('static/index.html not found');
const html = fs.readFileSync(INDEX, 'utf8');

const BABEL_OPEN = '<script type="text/babel">';
const openIdx = html.indexOf(BABEL_OPEN);
if (openIdx === -1) fail('no <script type="text/babel"> block found in static/index.html');

const babelStart = openIdx + BABEL_OPEN.length;
const closeIdx = html.indexOf('</script>', babelStart);
if (closeIdx === -1) fail('inline Babel block has no closing </script> tag');

const babelCode = html.slice(babelStart, closeIdx);
ok('babel block extracted (' + babelCode.length + ' bytes)');

/* ─────────────────────────────────────────────────────────────
   TEST 1 — exactly one </script> after the Babel opening tag
   Any extra closer means a stray literal is hiding in a string.
   ───────────────────────────────────────────────────────────── */

{
  const tail = html.slice(babelStart);
  const matches = tail.match(/<\/script>/g) || [];
  if (matches.length !== 1) {
    fail(
      'expected exactly 1 </script> after babel opening tag, found ' +
        matches.length +
        '. A literal </script> inside a template literal breaks the HTML parser. ' +
        'Rewrite the string as prose or split the tag into <\\/script>.'
    );
  }
  ok('exactly one </script> closer after babel opening tag');
}

/* ─────────────────────────────────────────────────────────────
   TEST 2 — parse the Babel block as JSX via esbuild
   Catches unterminated strings, mismatched braces, bad JSX, etc.
   This is the check that would have caught the outage in <100ms.
   ───────────────────────────────────────────────────────────── */

async function testBabelParse() {
  let esbuild;
  try {
    esbuild = require('esbuild');
  } catch {
    fail('esbuild not installed — cannot parse babel block');
  }
  try {
    const result = await esbuild.transform(babelCode, {
      loader: 'jsx',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    });
    ok('babel block parses cleanly as JSX (' + result.code.length + ' bytes transformed)');
  } catch (err) {
    const detail = err.errors
      ? err.errors
          .slice(0, 5)
          .map((e) =>
            e.location
              ? '  @ babel-line ' + e.location.line + ':' + e.location.column + ' — ' + e.text
              : '  ' + e.text
          )
          .join('\n')
      : err.message;
    fail('babel block failed to parse:\n' + detail);
  }
}

/* ─────────────────────────────────────────────────────────────
   TEST 3 — no literal </script> in the raw src/app.jsx either
   src/app.jsx is not served in production, but if we miss this,
   a future mirror commit into index.html will reintroduce the bug.
   ───────────────────────────────────────────────────────────── */

{
  if (!fs.existsSync(SRC)) {
    log('[test-static-html] skip — src/app.jsx not found');
  } else {
    const src = fs.readFileSync(SRC, 'utf8');
    // Count </script> occurrences. src/app.jsx should have ZERO because it's
    // a JSX source file — script close tags in JS strings are only a problem
    // inside inline HTML script blocks, but we still want symmetry with index.html
    // so future mirroring doesn't reintroduce the bug.
    const closers = src.match(/<\/script>/g) || [];
    if (closers.length > 0) {
      fail(
        'src/app.jsx contains ' +
          closers.length +
          ' literal </script> — will break when mirrored into static/index.html. ' +
          'Rewrite as prose.'
      );
    }
    ok('src/app.jsx has zero literal </script> tokens');
  }
}

/* ─────────────────────────────────────────────────────────────
   TEST 4 — FORMULA_RULES block sanity checks inside index.html
   The specific anti-patterns that caused the PDF equation overlap bug.
   If the rule text gets accidentally deleted or weakened, fail loudly.
   ───────────────────────────────────────────────────────────── */

function checkFormulaRulesIn(label, code) {
  const required = [
    {
      rx: /FORMULA & EQUATION RULES/,
      hint: 'FORMULA & EQUATION RULES header is missing — the whole formula guidance block was deleted',
    },
    {
      rx: /ONE equation per/i,
      hint: 'missing "ONE equation per $$...$$ block" rule — required to prevent multi-formula overlap',
    },
    {
      rx: /tag\{\}.*SHORT|SHORT.*tag/i,
      hint: 'missing "\\tag{} contents must be SHORT" rule — required to prevent tag/body collision',
    },
    {
      rx: /NEVER combine.*parameter|parameter values.*separate line/i,
      hint: 'missing "never combine equation with parameter values" rule',
    },
    {
      rx: /wide.*aligned|broken.*aligned/i,
      hint: 'missing "break wide expressions with aligned" rule',
    },
    {
      rx: /BAD \(/,
      hint: 'missing BAD worked example in FORMULA_RULES',
    },
    {
      rx: /GOOD \(/,
      hint: 'missing GOOD worked example in FORMULA_RULES',
    },
    {
      rx: /value function|lambda.*2\.25|\\\\lambda \\\\approx 2\.25/,
      hint: 'missing the canonical value-function / lambda 2.25 overlap example',
    },
  ];
  for (const r of required) {
    if (!r.rx.test(code)) {
      fail('[' + label + '] FORMULA_RULES check: ' + r.hint);
    }
  }
  ok('[' + label + '] FORMULA_RULES block has all required anti-overlap rules');
}

checkFormulaRulesIn('index.html', babelCode);
if (fs.existsSync(SRC)) {
  checkFormulaRulesIn('src/app.jsx', fs.readFileSync(SRC, 'utf8'));
}

/* ─────────────────────────────────────────────────────────────
   TEST 5 — sanity: index.html has the Supabase client
   If someone accidentally deletes the createClient call, auth breaks silently.
   ───────────────────────────────────────────────────────────── */

{
  if (!/createClient\s*\(\s*SUPABASE_URL/.test(babelCode)) {
    fail('babel block missing createClient(SUPABASE_URL, ...) — auth will break');
  }
  ok('Supabase client initialization present');
}

/* ─────────────────────────────────────────────────────────────
   TEST 6 — sanity: buildPrompt, App, and React root render are all present
   ───────────────────────────────────────────────────────────── */

{
  const required = [
    { rx: /function buildPrompt\b|const buildPrompt\b|buildPrompt\s*=/, hint: 'buildPrompt not defined' },
    { rx: /function App\b|const App\b/, hint: 'App component not defined' },
    { rx: /createRoot|ReactDOM\.render/, hint: 'no React root render call' },
  ];
  for (const r of required) {
    if (!r.rx.test(babelCode)) fail('babel block missing: ' + r.hint);
  }
  ok('core entry points present (buildPrompt, App, createRoot)');
}

/* ─────────────────────────────────────────────────────────────
   Run async tests and exit
   ───────────────────────────────────────────────────────────── */

(async () => {
  await testBabelParse();
  log('');
  log('[test-static-html] ALL CHECKS PASSED');
})().catch((err) => {
  console.error('[test-static-html] unexpected error:', err);
  process.exit(1);
});
