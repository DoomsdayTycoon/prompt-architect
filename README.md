# Prompt Architect

Professional-grade AI prompt generator with smart enhancement. Your input gets automatically enriched with audience targeting, reasoning strategies, and domain expertise — so the AI gives better output than raw prompting.

## What Makes This Different

Most prompt generators just stitch your words into a template. Prompt Architect adds **intelligence**:

- **Smart Enhancement Engine** — detects vague input and auto-injects specificity, audience calibration, and reasoning strategies
- **Audience Inference** — automatically targets the right audience based on your task + industry combo
- **Auto-Techniques** — adds chain-of-thought, self-verification, and comparison frameworks when they'll help
- **Industry Expertise** — 15 industries with domain-specific terminology, frameworks, and compliance context
- **Model-Specific Formatting** — XML for Claude, Markdown for GPT, PTCF for Gemini

## Features

- **Simple & Expert modes** — accessible for beginners, powerful for professionals
- **15 industries** with domain-specific terminology, frameworks, and compliance
- **12 output types** — reports, emails, code, presentations, proposals, and more
- **16 response formats** — multi-select: prose, tables, scorecards, flowcharts, etc.
- **5 AI models** — prompt structure adapts per model
- **8 writing styles**, 7 tones, 4 length presets, 18 languages
- **Prompt history** — saved locally, reload any previous prompt
- **Export** — copy to clipboard or download as .txt
- **Example prompts** — one-click examples to get started
- **Privacy** — everything runs in your browser, no data sent anywhere

## Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd prompt-architect

# Option A: Local dev server (Python)
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
# Open http://localhost:5001

# Option B: Just open the file
open static/index.html
```

## Deploy to Vercel (Recommended)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Deploy — that's it. No build step, no config needed.

The `vercel.json` is already configured to serve from the `static/` directory.

```bash
# Or deploy via CLI
npm i -g vercel
vercel
```

## Other Hosting Options

### Docker
```bash
docker build -t prompt-architect .
docker run -p 5001:5001 prompt-architect
```

### Any Static Host (Netlify, Cloudflare Pages, GitHub Pages)
Just point the deploy to the `static/` folder. No build step required.

## Project Structure

```
prompt-architect/
├── static/
│   ├── index.html       # The entire app (React + smart engine, no build step)
│   └── favicon.ico
├── app.py               # Local dev server (Flask)
├── vercel.json          # Vercel deployment config
├── requirements.txt     # Python deps (local dev only)
├── Dockerfile
└── README.md
```

## How Smart Enhancement Works

When you type a prompt, the engine analyzes it in real-time:

1. **Vagueness detection** — short or generic input gets specificity guidance injected
2. **Audience inference** — maps task + industry to the most likely audience (e.g., Finance + Analysis → "senior financial analysts and portfolio managers")
3. **Auto-techniques** — analysis tasks get chain-of-thought reasoning; coding tasks get production-readiness checks
4. **Industry precision** — finance prompts get quantification requirements; legal gets jurisdictional awareness; healthcare gets safety disclaimers
5. **Output optimization** — presentations get assertion-evidence structure; proposals get persuasion frameworks

All enhancements are shown as badges so users learn what good prompting looks like.

## License

MIT
