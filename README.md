# سبيكة AI · Sabika AI (working name)

Arabic-first AI trading companion for gold (XAUUSD).

Core loop: upload a gold chart → choose scalp or swing → get a structured trade analysis
(direction, entry, stop, targets, invalidation, confidence) → every analysis is tracked
against the live gold price and graded, so users see an honest track record.

## Status
- [x] Recon of the reference app (public sources only) — `replica/recon.md`, `replica/features.csv`
- [x] Architecture (stack, schema, API, build order) — `replica/architecture.md`, `replica/schema.sql`
- [x] Design system — `replica/design/` (tokens, contrast report: 0 failures, component specs) + primitives at `web/src/app/design`
- [~] Build v1 (web / PWA) — M1 vertical slice done: login → upload chart → AI analysis → saved card → list (see `replica/build-log.md`)
- [ ] Brand & name check
- [ ] Tests, deploy, launch

## Notes
Clean-room build: no code, name, logo, text, images or content from the reference app.
Educational tool — not financial advice. Trading involves risk.

## Run the web app
```bash
cd web
npm install
npm run dev        # http://localhost:3000/design  (design-system check page)
```
Regenerate tokens after editing `replica/design/tokens.json`:
```bash
python3 replica/design/build_tokens.py   # writes tokens.css, tailwind-theme.css, contrast-report.md, copies into web/src/styles
```

## Environment (`web/.env.local`, never committed)
```
AI_PROVIDER=gemini          # gemini | claude | mock
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
ANTHROPIC_API_KEY=...       # optional, if AI_PROVIDER=claude
AI_FALLBACK_MOCK=1          # dev only: use the labelled demo provider if the AI API is unreachable
SESSION_SECRET=...          # random string
```
