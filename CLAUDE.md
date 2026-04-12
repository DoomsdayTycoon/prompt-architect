# Prompt Architect — Project Guide

## What this is
A professional AI prompt generator web app. Users describe a goal, configure options (task type, industry, model, tone, etc.), and the tool generates an expert-level structured prompt they can paste into Claude, ChatGPT, Gemini, or any AI.

**Live:** https://www.proarch.tech (Vercel, GitHub: DoomsdayTycoon/prompt-architect)
**Stack:** Single-file React 18 app, Babel Standalone compiles in-browser, Flask dev server for local

## Architecture

### CRITICAL: Two files, one is authoritative in production

This project has a tricky split that has caused production outages. Read this carefully before editing.

**`static/index.html`** — THIS IS WHAT PRODUCTION SERVES.
- `vercel.json` has `"buildCommand": ""` — Vercel does NOT run `npm run build`. It serves static files as-is and rewrites every route to `/index.html`.
- The entire React app (~2800 lines) lives inside a single `<script type="text/babel">` block inside this file.
- Babel Standalone is loaded from CDN and compiles the JSX in the browser on page load.
- `static/app.js` exists but **production does not load it**. Do not assume that updating `src/app.jsx` + running `npm run build` is enough.
- Any edit that must ship to users MUST be made in `static/index.html`.

**`src/app.jsx`** — Source-of-truth *copy* used for local dev server, lint pipeline, and future migration.
- Compiled to `static/app.js` via esbuild (`npm run build`).
- The lint pipeline (`tools/build-engine.mjs`, `tools/lint-prompts.js`, `tools/watch-refine.js`) operates on this file — it bundles src/app.jsx and runs 1255 prompt combos through the engine to catch regressions.
- Edits must be **mirrored** here whenever `static/index.html` changes so the lint pipeline stays accurate and a future build-step migration is painless.

**Golden rule:** every change touches BOTH `static/index.html` AND `src/app.jsx`. If they drift, production and the linter disagree and bugs slip through.

### Key sections in index.html (in order):
1. **Auth functions** (lines ~24-31) — signup, login, logout (currently localStorage, migrating to Supabase)
2. **Icons** (lines ~37-76) — SVG icon library as React components
3. **Model logos** (line ~78) — Claude, ChatGPT, Gemini, Llama, Universal
4. **Data constants** (lines ~83-108) — MODELS, TASKS (15), INDUSTRIES (15), OUTPUTS, STYLES, TONES, LENGTHS, FMTS (13), FILE_OUTPUTS (10), INCLUDES, TECHS (15), LANGS, LEN_BY_FILE
5. **SECTOR_FIRMS** (lines ~110-237) — 14 sectors, 5 firms each, 5 roles per firm
6. **Deep knowledge** (lines ~240-318) — IND_CONTEXT, ROLE_DEEP, METHODOLOGY, QUALITY, TONE_INST, STYLE_INST, OUTPUT_INST per task type
7. **EXAMPLES** (lines ~323-395) — 35 examples, 5 per 7 sectors
8. **Smart Enhancement Engine** (lines ~400-447) — analyzeInput() + getSmartEnhancements()
9. **buildPrompt()** (lines ~452-587) — Main prompt generation engine
10. **App component** (lines ~618+) — All UI, state, and interactions

### Supporting files:
- `app.py` — Flask dev server (serves static/)
- `build.mjs` — esbuild script: compiles `src/app.jsx` to `static/app.js`
- `vercel.json` — Vercel deployment config (`buildCommand: ""` — no build step, serves `static/` as-is, rewrites all routes to `/index.html`)
- `.env` — Supabase credentials (NEVER committed, in .gitignore)

## Design system
- Light blue/teal palette: bg #f8fafc, cards #fff, accent dynamic per model
- Claude default: #0891B2 (Turkish cyan)
- Font: Instrument Sans + IBM Plex Mono
- Responsive: CSS class `.two-col-layout` with media query at 1024px

## Key features
- **Two modes:** Simple (amateur) and Expert
- **Smart Enhancement Engine:** Detects vague input, auto-injects audience, scope, techniques
- **15 task types** including strategy, debug, review, decision, persuade
- **15 industries** with deep context injection
- **Firm & Role selector** (Expert mode): Industry > Firm > Role cascading selection
- **Dynamic length metrics** per file output type (pages for PDF, slides for PPT, rows for Excel, etc.)
- **Voice input** via Web Speech API
- **File output section** with 10 file types and tailored formatting instructions
- **15 advanced techniques** (red team, first principles, systems thinking, etc.)
- **Model-specific prompt formatting** (XML tags for Claude, markdown for ChatGPT, bold for Gemini)
- **New Prompt button** with confirmation dialog

## Auth & Database (Supabase — LIVE)
- **Project:** Prompt-architect (eu-west-1, Ireland)
- **URL:** https://whfdtdcplkneviumgrkz.supabase.co
- **Auth:** Supabase Auth (email/password), JWT sessions
- **Tables:** `profiles` (with payment fields), `prompt_history` — both RLS-protected
- **RPC functions:** `increment_prompt_count(mode)`, `get_usage_status()`
- **Credentials:** `.env` file (NEVER committed), also set in Vercel dashboard

## Payments (Stripe — LIVE)
- **Stripe mode:** Test (sandbox)
- **Plans:** Monthly $9/mo, Annual $6/mo ($72/yr)
- **Flow:** Paywall modal > /api/checkout (serverless) > Stripe Checkout > /api/webhook > Supabase update
- **Free tier:** 2 simple prompts + 1 expert prompt before paywall
- **Serverless functions:** `api/checkout.js`, `api/webhook.js`
- **Webhook events:** checkout.session.completed, customer.subscription.updated, customer.subscription.deleted

## Domain
- **Primary:** https://www.proarch.tech (Namecheap DNS > Vercel)
- **Vercel subdomain:** prompt-architect-ashen-one.vercel.app
- **DNS:** A record @ > 216.198.79.1, CNAME www > vercel-dns

## Development
```bash
# Build the esbuild bundle (for lint pipeline; production does NOT use this)
npm run build

# Local dev
python app.py  # serves on http://localhost:5001

# Lint pipeline — bundles src/app.jsx and runs 1255 prompt combos
node tools/watch-refine.js --once

# Deploy
git push origin main  # Vercel serves static/index.html as-is (no build step)
```

## Pre-push validation protocol (MANDATORY — no exceptions)

The previous incident: a literal `<script src="..."></script>` inside a JS template literal broke production for 10+ minutes because the HTML tokenizer closed the outer `<script type="text/babel">` block mid-string. The build ran clean, the linter ran clean, and the bug still shipped because neither of those tools touch the inline Babel block in `static/index.html`.

**Before every `git push`, run ALL of the following. If any fail, DO NOT push.**

1. **Mirror check** — every functional edit exists in both `static/index.html` and `src/app.jsx`. Drift between them is a bug.
2. **esbuild on src/app.jsx**: `npm run build` — must complete with no errors.
3. **Lint pipeline**: `node tools/watch-refine.js --once` — must report `with errors: 0` and `with warnings: 0` across all 1255 combos.
4. **Inline Babel parse check** — THIS IS THE ONE THAT WOULD HAVE CAUGHT THE OUTAGE. Extract the inline Babel block from `static/index.html` and parse it. Any failure here means production is broken:
   ```bash
   node -e "
   const fs=require('fs');
   const html=fs.readFileSync('static/index.html','utf8');
   const m=html.match(/<script type=\"text\/babel\">([\s\S]*?)<\/script>/);
   if(!m){console.error('FAIL: no babel block found');process.exit(1);}
   require('esbuild').transform(m[1],{loader:'jsx',jsx:'transform',jsxFactory:'React.createElement',jsxFragment:'React.Fragment'})
     .then(r=>console.log('babel block OK, '+r.code.length+' bytes transformed'))
     .catch(e=>{console.error('BABEL BLOCK BROKEN:',e.message);if(e.errors)e.errors.slice(0,5).forEach(er=>console.error(er.location?er.location.line+':'+er.location.column+' '+er.text:er.text));process.exit(1);});
   "
   ```
5. **Exactly one `</script>` inside the Babel block** — more than one means a stray closer is hiding in a string literal:
   ```bash
   node -e "
   const fs=require('fs');
   const html=fs.readFileSync('static/index.html','utf8');
   const start=html.indexOf('<script type=\"text/babel\">')+'<script type=\"text/babel\">'.length;
   const tail=html.slice(start);
   const n=(tail.match(/<\/script>/g)||[]).length;
   if(n!==1){console.error('FAIL: expected exactly 1 </script> inside babel block, found '+n);process.exit(1);}
   console.log('script-close count OK');
   "
   ```
6. **Smoke test via Flask**: `python app.py &` then `curl -s http://localhost:5001/ | grep -c 'script type=\"text/babel\"'` must print `1`. Kill the server after.
7. **Git status sanity** — `git status` and `git diff --stat` — confirm you are pushing what you think you are pushing. Never `git add .` or `git add -A`; stage files by name.

**Optional but recommended when touching UI:** hit the live URL in a browser via the dev server and click through the changed flow. The pre-push checks above catch parse errors, not behavioral regressions.

## Known landmines

Edit `static/index.html` with these specific hazards in mind. Each of these has caused or nearly caused an outage.

- **Literal `</script>` inside any template literal or string.** The HTML parser closes the Babel block the moment it sees `</script>`, regardless of JS string boundaries. Never embed raw script tags in strings. If you must reference a script tag in prose, write it as "a script tag pointing to X" or split it (`<\/script>`). This applies to FORMULA_RULES, FILE_INST, EXAMPLES, and any other multi-line template literal.
- **`${...}` inside template literals** is interpolation. If you are writing LaTeX/math strings with `$...$`, make sure a `$` is never immediately followed by `{` unless you actually want interpolation. LaTeX `$v(x)$` is fine; LaTeX `${...}` is a JS bug.
- **Unescaped backticks in template literals** end the string early. Use `` \` `` inside template literals that contain backticks in their content.
- **JSX attribute values with embedded quotes of the same type.** `onMouseEnter={e=>e.currentTarget.style.background="var(--s1)"}}` broke parsing in a previous commit. Prefer block bodies with semicolons: `onMouseEnter={e=>{e.currentTarget.style.background="var(--s1)";}}`.
- **Supabase schema drift.** New columns in `prompt_history`, `profiles`, etc. require a SQL migration AND the user must run it in the Supabase SQL editor. Ship the `.sql` file in the repo root and tell the user to run it. Do not assume the schema matches the code until confirmed.
- **The lint pipeline only tests the prompt-engine output**, not React rendering, not the inline Babel block, not the Supabase calls. A clean lint pass is necessary but not sufficient.
- **`vercel.json` has `buildCommand: ""`.** Do not "fix" this without understanding the consequences. Changing it means Vercel will start running `npm run build` and serving `static/app.js`, which would flip production from the inline Babel path to the compiled path — a deploy model change, not a config tweak.

## Hard rules

- No emojis anywhere in the project.
- Every functional edit touches BOTH `static/index.html` AND `src/app.jsx`. Never one without the other.
- Run the full pre-push validation protocol above before every `git push`. No exceptions, even for "trivial" one-line changes.
- Never skip git hooks (`--no-verify`), never force-push to main, never amend already-pushed commits.
- Never `git add .` or `git add -A` — stage files by explicit name to avoid committing `.env`, `node_modules`, worktrees, or untracked experiments.
- Payment system is live (Stripe test mode) — never expose secret keys, never commit `.env`.
- Firm/Role selector is Expert mode only.
- Keep it professional, portfolio-quality. No placeholder content, no lorem ipsum, no TODOs in shipped code.
