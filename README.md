# سبيكة AI · Sabika AI (working name)

Arabic-first AI trading companion for gold (XAUUSD).

Core loop: upload a gold chart → choose scalp or swing → get a structured trade analysis
(direction, entry, stop, targets, invalidation, confidence) → every analysis is tracked
against the live gold price and graded, so users see an honest track record.

## Status
- [x] Recon of the reference app (public sources only) — `replica/recon.md`, `replica/features.csv`
- [x] Architecture (stack, schema, API, build order) — `replica/architecture.md`, `replica/schema.sql`
- [x] Design system — `replica/design/` (tokens, contrast report: 0 failures, component specs) + primitives at `web/src/app/design`
- [ ] Build v1 (web / PWA)
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
