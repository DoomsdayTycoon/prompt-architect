#!/usr/bin/env node
/* watch-refine.js — background runner for the deterministic prompt linter.

   Watches src/app.jsx. On change:
     1. rebuilds the engine (tools/prompt-engine.cjs)
     2. runs the linter
     3. logs result to logs/watch.log + console
     4. waits for next change

   No API calls. No tokens. Free, instant, local. Run in a terminal and leave
   it running while iterating on src/app.jsx — every save triggers a fresh
   lint pass and you see new failures within ~100ms.

   Usage:
     node tools/watch-refine.js          # watch mode
     node tools/watch-refine.js --once   # single pass and exit
*/

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(ROOT, 'src/app.jsx');
const LOG_DIR = path.resolve(ROOT, 'logs');
const LOG_FILE = path.resolve(LOG_DIR, 'watch.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(line) {
  const stamped = '[' + ts() + '] ' + line;
  console.log(stamped);
  fs.appendFileSync(LOG_FILE, stamped + '\n');
}

function runStep(label, cmd, args) {
  log(label + ' ...');
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (r.status !== 0) {
    log(label + ' FAILED (exit ' + r.status + ')');
    if (r.stdout) log('stdout: ' + r.stdout.trim().split('\n').slice(-20).join(' | '));
    if (r.stderr) log('stderr: ' + r.stderr.trim().split('\n').slice(-20).join(' | '));
    return false;
  }
  // Pull the totals line from the linter output for a one-line summary.
  const out = r.stdout || '';
  const totals = out.match(/combos\s*:\s*\d+[\s\S]*?with warnings:\s*\d+/);
  if (totals) {
    log(label + ' OK');
    for (const line of totals[0].split('\n')) {
      if (line.trim()) log('  ' + line.trim());
    }
  } else {
    log(label + ' OK');
  }
  // If there were errors/warnings, dump the rule-hit summary.
  const ruleHits = out.match(/RULE HITS[\s\S]*?(?:\n\n|$)/);
  if (ruleHits && !ruleHits[0].includes('(none')) {
    for (const line of ruleHits[0].split('\n').slice(0, 12)) {
      if (line.trim() && !line.startsWith('RULE HITS')) log('  ' + line);
    }
  }
  return true;
}

function pass() {
  const t0 = Date.now();
  log('---- pass start ----');
  const built = runStep('build engine', 'node', ['tools/build-engine.mjs']);
  if (!built) {
    log('---- pass aborted (build failed) ----');
    return;
  }
  runStep('lint prompts', 'node', ['tools/lint-prompts.js']);
  log('---- pass done in ' + (Date.now() - t0) + 'ms ----');
  log('');
}

function watch() {
  log('watch-refine starting. Watching: ' + path.relative(ROOT, SRC));
  log('Log file: ' + path.relative(ROOT, LOG_FILE));
  log('');
  pass();

  let debounce = null;
  let lastMtime = 0;
  fs.watch(SRC, () => {
    try {
      const mtime = fs.statSync(SRC).mtimeMs;
      if (mtime === lastMtime) return; // ignore duplicate fs events
      lastMtime = mtime;
    } catch {}
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      log('change detected');
      pass();
    }, 250);
  });

  // Idle keep-alive ping every 30 minutes so user knows it's still alive.
  setInterval(() => log('idle (waiting for changes)'), 30 * 60 * 1000);
}

if (process.argv.includes('--once')) {
  pass();
} else {
  watch();
}
