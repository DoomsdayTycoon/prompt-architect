/* Bundle src/app.jsx into a Node-loadable CJS module exposing buildPrompt
   and its data constants. The trick: the source file has no `export` and
   uses browser globals (React, window, supabase). We:
     1. Read src/app.jsx
     2. Wrap it in an IIFE that captures the symbols we need
     3. Inject browser-global stubs as locals
     4. Append `module.exports = {...}`
     5. Run esbuild with --loader=jsx, --platform=node
   The linter calls buildPrompt(), a pure string-builder — so the React /
   Supabase stubs are never actually invoked at runtime. They just need to
   exist at init time so the file evaluates without throwing. */

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src/app.jsx');
const TMP = resolve(__dirname, '.engine-entry.jsx');
const OUT = resolve(__dirname, 'prompt-engine.cjs');

const SYMBOLS = [
  'MODELS', 'SUB_MODELS', 'TASKS', 'INDUSTRIES', 'OUTPUTS', 'STYLES', 'TONES',
  'LENGTHS', 'LEN_SUB', 'LEN_BY_FILE', 'FMTS', 'FILE_OUTPUTS', 'INCLUDES',
  'TECHS', 'LANGS', 'SECTOR_FIRMS', 'IND_CONTEXT', 'IND_STYLE', 'ROLE_DEEP',
  'METHODOLOGY', 'QUALITY', 'TONE_INST', 'STYLE_INST', 'OUTPUT_INST',
  'EXAMPLES', 'VAGUE_REPLACEMENTS', 'analyzeInput', 'getSmartEnhancements',
  'sharpenTopic', 'buildPrompt',
];

function makeEntry() {
  const src = readFileSync(SRC, 'utf8');

  // Stub browser globals so module init doesn't crash. These get prepended
  // before the original file body so all `const X = window.supabase...`
  // and React-using statements have something to bind to.
  const prelude = `
const React = {
  createElement: (...args) => ({ __el: true, args }),
  Fragment: 'Fragment',
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useRef: (initial) => ({ current: initial }),
  useCallback: (fn) => fn,
  useEffect: () => {},
  useMemo: (fn) => fn(),
};
const ReactDOM = {
  render: () => {},
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
};
const gtag = () => {};
const window = {
  supabase: {
    createClient: () => ({
      auth: {
        getUser: async () => ({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: null }),
        signUp: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ data: null, error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: null }),
        updateUser: async () => ({ data: null, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({ limit: async () => ({ data: [], error: null }) }),
            single: async () => ({ data: null, error: null }),
          }),
          single: async () => ({ data: null, error: null }),
        }),
        insert: async () => ({ error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
        upsert: async () => ({ error: null }),
      }),
      rpc: async () => ({ data: null, error: null }),
    }),
  },
  dataLayer: [],
  location: { href: '', origin: '', pathname: '/', search: '' },
  history: { pushState: () => {}, replaceState: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
  navigator: { language: 'en', clipboard: { writeText: async () => {} }, mediaDevices: {} },
  document: { createElement: () => ({}), body: {}, head: {}, addEventListener: () => {}, querySelector: () => null, getElementById: () => null },
  fetch: async () => ({ ok: true, json: async () => ({}), text: async () => '' }),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
};
const document = window.document;
const localStorage = window.localStorage;
const sessionStorage = window.sessionStorage;
const navigator = window.navigator;
const location = window.location;
const fetch = window.fetch;
`;

  // Append exports. We use a try/catch so if some symbol doesn't exist
  // (because it was renamed in src/app.jsx) the error is loud and clear.
  const epilogue = `
try {
  module.exports = {
${SYMBOLS.map(s => `    ${s}: typeof ${s} !== 'undefined' ? ${s} : undefined,`).join('\n')}
  };
} catch (err) {
  console.error('engine export failed:', err);
  module.exports = { __error: err.message };
}
`;

  return prelude + '\n' + src + '\n' + epilogue;
}

async function main() {
  console.log('[build-engine] writing temp entry...');
  writeFileSync(TMP, makeEntry());

  console.log('[build-engine] running esbuild...');
  await build({
    entryPoints: [TMP],
    outfile: OUT,
    bundle: false,           // single file, no imports to resolve
    platform: 'node',
    format: 'cjs',
    loader: { '.jsx': 'jsx' },
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'node18',
    logLevel: 'warning',
  });

  // Sanity check: dynamically import the CJS output and verify buildPrompt exists.
  const mod = await import('file://' + OUT + '?t=' + Date.now());
  const engine = mod.default || mod;
  if (typeof engine.buildPrompt !== 'function') {
    console.error('[build-engine] FAILED — buildPrompt not exported. Got keys:', Object.keys(engine));
    process.exit(1);
  }
  console.log('[build-engine] OK — buildPrompt exported, ' + Object.keys(engine).filter(k => engine[k] !== undefined).length + ' symbols available.');
}

main().catch(err => {
  console.error('[build-engine] ERROR:', err);
  process.exit(1);
});
