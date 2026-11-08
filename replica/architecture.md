# Architecture — Sabika AI | سبيكة

Inputs: `replica/recon.md`, `replica/features.csv`. Schema: `replica/schema.sql` (validated on Postgres 16, 16 tables).
Constraints: solo founder in Iraq, low budget, Arabic-first, gold only, ship a web app first.

## 1. Stack

| layer | choice | why |
|---|---|---|
| web app | **Next.js 15 (App Router) + TypeScript** | one codebase for pages + server routes; huge docs; deploys free on Vercel |
| styling | **Tailwind CSS** with logical properties (`ms-`, `me-`, `ps-`) and `dir="rtl"` | RTL Arabic comes almost free; tokens from replica-design |
| i18n | **next-intl**, Arabic default, English second | locale-prefixed routes, server-side messages |
| PWA | next-pwa / manual service worker + Web App Manifest | installable on phones now; Expo wrapper later |
| mobile (later) | **Expo** (React Native) reusing the API | after the web v1 proves demand |
| database | **Postgres on Supabase** | managed, free tier, RLS, Realtime, Storage and Auth in one place |
| DB access | **supabase-js** + SQL migrations (Supabase CLI) | RLS does the authorisation; no ORM layer to learn |
| auth | **Supabase Auth**: email magic link + Google (+ Apple when on iOS) | free, works in Iraq, no passwords to manage |
| AI | **Anthropic Claude API (vision)**, model set in env (`AI_MODEL`) | reads chart images well, structured output via tool use; model swappable by config |
| realtime | **Supabase Realtime** (Postgres changes on `trade_setups`) | live signals without running a WebSocket server |
| price feed | **MT5 Bridge EA** → `POST /api/ingest/bars` every minute (JustMarkets feed), fallback **Twelve Data** API | free, the user already runs MT5 24/7; same feed his bot trades on |
| signals | ORB_Pro_v2 rules: the Bridge EA posts each new trade (A/B module) to `POST /api/ingest/signal` | signals come from a tested strategy, not opinions |
| payments v1 | **manual local payments** (ZainCash, FastPay, Qi Card, USDT) + receipt upload + admin approval | Stripe does not serve Iraq; this works on day one |
| payments v2 | Paddle or Lemon Squeezy (merchant of record) for international cards; App Store / Play billing inside mobile apps | added when there are paying users outside Iraq |
| push | **Web Push (VAPID)** via `web-push` | free; Expo push later |
| voice | browser **Web Speech API** (ar-IQ / ar-SA) for speech-to-text | free; server STT only if quality is poor |
| email | **Resend** | magic links via Supabase SMTP + receipts |
| jobs | **Supabase pg_cron** calling edge functions + grading on every bar ingest | Vercel Hobby cron is daily only |
| files | **Supabase Storage** (private buckets `charts`, `receipts`) | signed URLs, owner-only |
| hosting | **Vercel** (web) + Supabase (data) | $0 at launch |
| monitoring | Vercel logs + Sentry (free tier) | |

One database, one web app, no microservices.

## 2. Schema summary (`replica/schema.sql`)

| table | owner | purpose |
|---|---|---|
| profiles | user | locale, tier, expiry, admin flag (tier/admin not client-writable) |
| payments | user | manual payment requests + receipt, admin approves |
| usage_daily | user | analyses / chat messages per day → tier limits |
| price_bars_m1 | public read | XAUUSD M1 bars, UTC, PK (symbol,t) = idempotent upserts |
| market_context | public read | last price, ATR D1/H1/M15, day/prev-day high/low |
| strategies | public read | LAB strategies (ORB modules A/B etc.) |
| trade_setups | user (ai) / public (signal) | **one table for AI setups and signals**, graded by the same job; DB checks force SL/TP on the right side |
| chat_threads, messages | user | coach history; messages store model, prompt version, tokens (evaluation + cost) |
| courses, lessons, quiz_questions, lesson_progress | public / user | learning path; quiz answers never readable by clients |
| live_sessions | public read | session list |
| news_items | public read | deduped by `source_url` |
| push_subscriptions | user | web push endpoints + preferences |
| view setup_stats | — | weekly closed / wins / avg R / sum R per source & style |

Access rules: **RLS on every table**. Clients read through RLS; all writes that matter (AI results, grading, signals, approvals, quiz grading) happen in server routes with the service role after an explicit check.

## 3. API (Next.js route handlers / server actions)

Auth column: `anon` = anyone, `user` = signed in, `tier` = signed in + within tier limits, `admin` = profiles.is_admin, `bridge` = shared secret header from the MT5 Bridge EA (HMAC of body), `cron` = Supabase cron secret.

| method path | what it does | who | input | output | flow |
|---|---|---|---|---|---|
| GET `/[locale]` | landing | anon | — | page | F01 |
| GET `/[locale]/login` + Supabase Auth | magic link / Google | anon | email | session | F01 |
| POST `/api/profile` | update name, locale | user | {display_name, locale} | profile | F01 |
| POST `/api/charts/upload-url` | signed upload URL for a chart image | tier | {mime, size ≤ 5 MB} | {path, url} | F02 |
| POST `/api/analyze` | **core**: image + style → AI setup | tier | {image_path, style: scalp\|swing, thread_id?, note?} | {setup, message} | F02 |
| POST `/api/chat` | coach message (text / voice transcript), streaming | tier | {thread_id, text, image_path?} | SSE stream | F02, F10 |
| GET `/api/threads` / `/api/threads/[id]` | history | user | — | list / messages | F02 |
| POST `/api/setups/[id]/cancel` | user drops a pending AI setup | user (owner) | — | setup | F02 |
| GET `/api/setups?source=ai\|signal&status=` | lists (RLS) | user | filters | setups | F03, F08 |
| GET `/api/stats?source=&period=7d\|30d\|all` | win rate, avg R, sum R | user | — | stats | F08 |
| GET `/api/track-record` | public signal stats (no login) | anon | — | stats + last 50 closed | F08 |
| GET `/api/lessons/[id]` | lesson + quiz questions **without answers**; 403 if previous lesson not passed | user | — | lesson | F05 |
| POST `/api/lessons/[id]/submit` | grade quiz server-side, unlock next | user | {answers} | {score, passed, explanations} | F05 |
| GET `/api/sessions` | upcoming live sessions | user | — | list | F06 |
| GET `/api/news` | latest news | user | cursor | list | F09 |
| POST `/api/payments` | create manual payment + receipt path | user | {tier, months, method, reference, proof_path} | payment | F07 |
| POST `/api/admin/payments/[id]` | approve / reject → sets tier + expiry | admin | {action} | payment | F07 |
| CRUD `/api/admin/*` | courses, lessons, quizzes, sessions, strategies, signals (manual) | admin | — | — | — |
| POST `/api/push/subscribe` | save web push endpoint | user | subscription | ok | F03 |
| POST `/api/ingest/bars` | upsert M1 bars, refresh market_context, **grade open setups** | bridge | [{t,o,h,l,c,spread}] | {upserted, graded} | F03, F08 |
| POST `/api/ingest/signal` | new ORB_Pro_v2 signal → trade_setups(source=signal) + push | bridge | {module, dir, entry, sl, tp, ts, idempotency_key} | setup | F03 |
| POST `/api/cron/expire` | expire pending setups past valid_until; downgrade expired tiers | cron (every 5 min) | — | counts | — |
| POST `/api/cron/news` | pull news API, dedupe, AI summary ar/en + impact | cron (every 30 min) | — | counts | F09 |
| POST `/api/cron/stale-feed` | alert admin if no bar for 10 min during market hours | cron (every 5 min) | — | — | — |

Outbound: Anthropic API, Twelve Data (fallback prices), news API, Web Push, Resend.
Only official public APIs with our own keys. Nothing from the reference app's endpoints.

### The core analysis pipeline (`/api/analyze`)
1. Check tier + `usage_daily` limit (free 3/day, pro 30/day, elite 100/day — tunable).
2. Load `market_context` (last price, ATRs, day levels) and last 300 M15 bars summary.
3. Call Claude with the image, the style, and the context; force a **tool call** returning
   `{symbol_seen, timeframe_seen, price_seen, direction, entry_low, entry_high, sl, tp1, tp2, invalidation, confidence, rationale_ar, rationale_en}`.
4. **Validate server-side**: symbol is gold; `|price_seen − last_price| ≤ 0.6 % ` (else warn: old or wrong chart);
   SL on the right side; stop distance within style limits (scalp 0.15–0.8 × ATR_H1·4, swing 0.3–1.5 × ATR_D1);
   RR(tp1) ≥ 1. Re-ask once with the errors; if still invalid → `direction = 'none'` with an explanation.
5. Insert `trade_setups` (status pending, valid_until scalp +4 h / swing +5 d) and the assistant `message` (model, prompt version, tokens).
6. Return the setup card. Risk disclaimer always attached.

### Grading (on every `/api/ingest/bars`)
For each `pending`/`active` setup: walk new M1 bars in order. pending → active when price enters
`[entry_low, entry_high]`; active → tp1/tp2/sl on touch (if SL and TP in the same bar, assume **SL first**);
after tp1 move SL to break-even (status `be` if hit). Write `result_r`, `max_favorable`, `max_adverse`.
Conservative by design so the public track record is never flattering.

## 4. The parts that bite

- **Time zones / DST**: store UTC; show Iraq time (Asia/Baghdad, no DST) by default, user-selectable. MT5 server time (GMT+2/+3) is converted to UTC inside the Bridge EA before posting.
- **Idempotency**: bars upsert on (symbol,t); signals carry an `idempotency_key`; news dedupe on `source_url`; payment approval is a single conditional update (`where status='pending'`).
- **Race conditions**: grading runs in one transaction with `select … for update skip locked` so two ingests never grade the same setup twice.
- **Rate limits / cost**: per-user daily caps in `usage_daily` (atomic upsert-increment before the AI call); global spend alarm; image downscaled to ≤1568 px before sending.
- **File limits**: 5 MB, png/jpeg/webp only, checked on signed-URL creation and again server-side.
- **Realtime**: Supabase Realtime on `trade_setups` filtered by `source=signal`; clients fall back to polling every 30 s.
- **Stale feed**: if MT5 PC sleeps, grading stops → stale-feed alert + Twelve Data fallback.
- **Offline**: PWA caches shell + last lessons; analysis needs network.
- **Search**: not needed in v1 (lessons are a list).
- **Multi-tenancy**: single tenant; owner via RLS.
- **Data deletion**: account deletion cascades from `auth.users` → profiles → everything owned; storage files deleted by a cleanup job.
- **Legal**: every setup shows "تحليل تعليمي وليس نصيحة مالية"; no execution; no promises of profit.
- **Prompt injection via images**: the model only fills the tool schema; text in images never triggers actions.

## 5. Build order

| milestone | content | screens | tables | routes |
|---|---|---|---|---|
| **M0 setup** | repo, Next.js, Tailwind RTL, next-intl, Supabase project, migration | — | all | — |
| **M1 vertical slice** (ugly) | sign in → upload chart → choose scalp/swing → AI setup card saved → shows in "my analyses" | S02, S06, S10 (list only) | profiles, usage_daily, trade_setups, chat_threads, messages | `/login`, `/api/charts/upload-url`, `/api/analyze`, `/api/setups` |
| **M2 grading + data** | Bridge EA (MQL5) posts M1 bars; market_context; grading; stats; public track record | S09, S10 | price_bars_m1, market_context, setup_stats | `/api/ingest/bars`, `/api/stats`, `/api/track-record`, `/api/cron/expire`, `/api/cron/stale-feed` |
| **M3 signals** | Bridge EA posts ORB_Pro_v2 trades; signals feed; realtime; web push | S05, S08, S09, S21 | strategies, push_subscriptions | `/api/ingest/signal`, `/api/push/subscribe` |
| **M4 learning** | courses, lessons, quiz unlock, admin editor; first 10 lessons of content | S16, S17, S14, S15 | courses, lessons, quiz_questions, lesson_progress | `/api/lessons/*`, `/api/admin/*` |
| **M5 money** | tiers, paywall, manual payments, admin approval, expiry | S19, S20 | payments | `/api/payments`, `/api/admin/payments/*` |
| **M6 should-haves** | coach chat + history + voice, news, live sessions, onboarding, language picker, 7-day summary | S01, S03, S04, S07, S11, S18 | news_items, live_sessions | `/api/chat`, `/api/threads`, `/api/news`, `/api/sessions`, `/api/cron/news` |
| **M7 polish & launch** | PWA install, empty/error states, Sentry, landing page, brand | all | — | — |
| **M8 fixes** | items from replica-entrepreneur (reviews of the reference + competitors) | — | — | — |
| later | Expo apps + store billing; Paddle; optional MT5 execution link | — | subscriptions | — |

v1 = M0–M5 (core loop, honest tracking, signals, learning, getting paid). M6–M7 complete parity on what matters.
