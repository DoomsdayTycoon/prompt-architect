# Prompt Architect — Project Guide

## What this is
A professional AI prompt generator web app. Users describe a goal, configure options (task type, industry, model, tone, etc.), and the tool generates an expert-level structured prompt they can paste into Claude, ChatGPT, Gemini, or any AI.

**Live:** Deployed on Vercel via GitHub (DoomsdayTycoon/prompt-architect)
**Stack:** Single-file React 18 app (Babel standalone, no build step), Flask dev server

## Architecture

### Single file: `static/index.html`
Everything lives here — React components, CSS, data constants, prompt engine, auth.
- ~1100 lines, loads React/ReactDOM/Babel from CDN
- No build tools, no bundler, no Node.js
- Deployed as static site to Vercel

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
- `vercel.json` — Vercel deployment config
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

## Auth & Database (IN PROGRESS — migrating to Supabase)

### Current state: localStorage (broken, needs replacement)
- Accounts stored in browser only, not persistent across devices
- No real security

### Target state: Supabase
- **Project:** Prompt-architect (eu-west-1, Ireland)
- **URL:** https://whfdtdcplkneviumgrkz.supabase.co
- **Credentials:** Stored in `.env`, NEVER in source code
- **Tables needed:**
  - `profiles` — user display name, linked to auth.users
  - `prompt_history` — saved prompts per user, RLS-protected
- **RLS policies:** Users can only read/write their own rows
- **Auth:** Supabase Auth (email/password), handles hashing, tokens, sessions

### Environment variables for Vercel
After Supabase integration, set these in Vercel dashboard (Settings > Environment Variables):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Note: For a static frontend site, the anon key is embedded in the client JS (this is safe — RLS policies enforce access control, not the key).

## Development
```bash
# Local dev
cd /Users/olaslettebak/Documents/prompt-architect
python app.py  # serves on http://localhost:5001

# Deploy
git push origin main  # Vercel auto-deploys
```

## Rules
- No emojis anywhere in the project
- No build tools — everything stays in one HTML file
- Keep it professional, portfolio-quality
- Firm/Role selector is Expert mode only
- Payment system coming soon — auth must work flawlessly
