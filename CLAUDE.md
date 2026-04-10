# Prompt Architect — Project Guide

## What this is
A professional AI prompt generator web app. Users describe a goal, configure options (task type, industry, model, tone, etc.), and the tool generates an expert-level structured prompt they can paste into Claude, ChatGPT, Gemini, or any AI.

**Live:** https://www.proarch.tech (Vercel, GitHub: DoomsdayTycoon/prompt-architect)
**Stack:** Single-file React 18 app (Babel standalone, no build step), Flask dev server

## Architecture

### Source: `src/app.jsx`
All React components, CSS, data constants, prompt engine, and auth live in this JSX file.
- Compiled to `static/app.js` via esbuild (`npm run build`)
- Loads React/ReactDOM/Supabase from CDN (no Babel in production)
- Deployed as static site to Vercel (build step: `npm run build`)

### Shell: `static/index.html`
Lightweight HTML shell (~11KB) containing:
- Meta tags, structured data, Open Graph, Twitter cards
- SEO fallback content (880+ words, hidden when React mounts)
- Script tags for CDN deps + compiled `app.js`

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
- `vercel.json` — Vercel deployment config (build step: `npm run build`)
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
# Build (required after editing src/app.jsx)
npm run build  # compiles src/app.jsx -> static/app.js via esbuild

# Local dev
python app.py  # serves on http://localhost:5001

# Deploy
git push origin main  # Vercel runs npm run build, then deploys static/
```

## Rules
- No emojis anywhere in the project
- Source lives in `src/app.jsx`, compiled to `static/app.js` — always run `npm run build` after editing
- Keep it professional, portfolio-quality
- Firm/Role selector is Expert mode only
- Payment system is live (Stripe test mode) — never expose secret keys
