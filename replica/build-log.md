# Build log

| ID | date | state | missing | harder than expected |
|---|---|---|---|---|
| shell | 2026-11-08 | done | i18n (English) not wired yet; Arabic only | Tailwind v4 theme vars must not share names with source vars (circular) — prefixed tokens `--sb-*` |
| S02 login | 2026-11-08 | partial | real auth (Supabase magic link + Google) | — |
| S05 home | 2026-11-08 | done (v1) | live price ticker, signals preview | — |
| S06 analyzer | 2026-11-08 | done (v1) | voice, chat follow-ups, chat history (S07) | Gemini/Claude cannot be reached from the build sandbox → provider fallback to a clearly-labelled mock in dev (`AI_FALLBACK_MOCK=1`); real call untested until deployed or the domain is allowed |
| S09 analysis detail | 2026-11-08 | done (v1) | live P/L, grading timeline (M2) | — |
| S10 my analyses | 2026-11-08 | partial | win-rate stats (needs grading, M2) | — |
| S08 signals / S16 learn | 2026-11-08 | stub | M3 / M4 | — |
| S20 account | 2026-11-08 | partial | language, notifications, plan | — |

E2E (Playwright, Chrome, 390px + 1440px): login validation, keyboard login, wrong-file-type error, upload, scalp/swing, analysis result, detail page with owner-only image, free limit (3/day) disables the button, list shows 3 cards, foreign chart URL → 404, logout. 0 console errors.
| S06 strategies | 2026-11-08 | done | real-model check (sandbox can't reach Gemini) | playbook of 25 strategies / 6 families in `web/src/lib/ai/strategies.ts`; AI returns strategies_matched + primary_strategy + confluence_score; server drops unknown ids, requires a primary strategy for any trade; user can force one strategy (filtered by scalp/swing) |
| S14 strategy library | 2026-11-08 | done (v1) | lessons/quizzes per strategy (M4) | — |

Unit tests: `npm test` → 10/10 (validation geometry, R:R, stop width per style, strategy sanitising, forced-strategy prompt). Prompt ≈ 5k chars in auto mode.
