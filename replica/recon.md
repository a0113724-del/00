# Recon map — "GO AI - OS" (GO OS) → clean-room clone "Sabika AI | سبيكة" (working name)

Recon date: 2026-11-08. Public sources only; the user has no account on the original.
Nothing owned by the original (code, name, logo, text, images, educators, users, data) is taken.

## 1. Scope

| question | decision |
|---|---|
| App / platform | GO AI - OS by Rakan Khalifa — iOS (App Store id6756324129) + Android (Google Play, publisher "GO AI"). |
| Clone platform | Mobile-first **web app (PWA)** first, wrapped for iOS/Android later. Arabic-first (RTL) + English. |
| Slice (core loop) | **Upload a gold chart → choose Scalp / Swing → AI returns a structured trade analysis (direction, entry, SL, TPs, invalidation, confidence) → the analysis is auto-tracked against the live gold price → win-rate stats.** Plus: a signals feed, learning (lessons + quizzes), news. |
| Who it is for | The user's own product to sell: Arabic-speaking gold (XAUUSD) traders, beginners → intermediate. |
| Differentiators vs original | Gold-only focus; every AI call is logged and graded honestly (public track record); signals come from the user's tested ORB_Pro_v2 rules, not opinions; Arabic-first. |

## 2. Sources

| # | source | URL | what it gave |
|---|---|---|---|
| 1 | App-store listing mirror (MWM) | https://mwm.ai/apps/go-ai-os/6756324129 | full feature description, 9 screenshot captions, version 1.1.0, release 2026-07-06, 10k+ downloads, 48 reviews, "Connect" tier, risk disclaimer, terms link |
| 2 | Google Play developer page | https://play.google.com/store/apps/developer?id=GO+AI | confirms Android version under publisher "GO AI" |
| 3 | FileHippo Android listing | https://filehippo.com/android/download_go-ai-os/ | Android positioning ("real-time insights") |
| 4 | Terms of use | https://goai.global/terms | **not reachable from this environment** — terms not reviewed (no account is used, so no account-terms issue) |
| 5 | Official site | goai.global | not reachable — gap |
| — | help center, pricing page, changelog, walkthrough videos | not found | gap: tier contents and prices unknown |

Gaps: pricing per tier, exact screen states, onboarding questions, signal format details. Marked as guesses below.

## 3. Screen inventory

States: E=empty, L=loading, F=filled, X=error, P=paywall/permission, M=mobile (all screens are mobile).

| ID | screen | how you get there | purpose | key components | states seen / inferred |
|---|---|---|---|---|---|
| S01 | Splash / landing | app open | trust message ("30+ countries") | logo, headline, CTA | F (seen) |
| S02 | Welcome / sign-in | S01 CTA | single sign-on ("GO ID") | SSO button, terms link | F (seen); X inferred |
| S03 | Language picker | onboarding / settings | choose UI language | list of languages, radio | F (seen) |
| S04 | Dashboard chooser | after login | pick Trading / Investment / Learning | 3 large cards | F (seen) |
| S05 | Trading dashboard | S04 → Trading | hub: coach, signals, active trades, news | cards, tab bar | inferred |
| S06 | AI Coach chat | tab / S05 | ask questions, upload chart, get setup | chat bubbles, image attach, mic, mode chips (Scalp/Swing/Trend), setup card | F (seen: BTC/USD setup with Swing/Scalp choice); L, X, P inferred |
| S07 | Chat history | S06 menu | thread list | list rows, search | inferred ("thread-based history") |
| S08 | Signals feed | tab | live signals grouped by asset, scalp/swing filter | segmented filter, signal cards, live badge | inferred from description; E inferred |
| S09 | Active trade detail | S08 / S05 | one trade: entry/exit, live P/L, action | price, levels, P/L, **one-click Sell/Buy** | F (seen: XAU/USD active trade) |
| S10 | Performance | tab / profile | win/loss, win rate, 7-day summary, history | stat tiles, chart, history table | inferred from description |
| S11 | News feed + detail | tab | curated news, impact analysis, source | news cards, impact tag, source link | inferred |
| S12 | GO Tracker | S05 | expert portfolios with followers / holdings | portfolio cards, follow button | F (seen) |
| S13 | Expert portfolio detail | S12 | holdings, performance | holdings list, chart | inferred |
| S14 | GO LAB | S05 | strategies & indicators (4 shown) | strategy cards | F (seen) |
| S15 | Strategy detail | S14 | rules, how to use | text, chart, CTA | inferred |
| S16 | Learning dashboard | S04 → Learning | lessons, quizzes, on-demand video | course list, progress | F (seen, highlighted in S04) |
| S17 | Lesson + quiz | S16 | learn, then test | video/text, quiz MCQ, result | inferred |
| S18 | Live sessions | S16 / S05 | upcoming live sessions ("Live Crypto Trading") | session cards, time, join | F (seen) |
| S19 | Plans / upgrade | locked feature / profile | tiers starting at "Connect" | plan cards, purchase | inferred (P) |
| S20 | Profile & settings | tab | account, language, notifications | rows, toggles | inferred |
| S21 | Notifications | bell / push | signal and session alerts | list | inferred ("real-time notifications") |
| S22 | Investment dashboard | S04 → Investment | portfolio / long-term | — | seen as option only |

## 4. User flows

```
F01 New user onboards
    S01 -> S02 sign in -> S03 language -> S04 pick dashboard -> S05
    clicks: ~4 · edge: SSO fails, language change mid-session
F02 CORE: analyse a gold chart
    S05 -> S06 attach chart image -> choose Scalp | Swing -> receive setup card -> (save / track)
    clicks: ~4 · edge: blurry image, no prices on axis, wrong symbol, market closed,
            daily limit reached (P -> S19), AI timeout (X)
F03 Follow a live signal
    push (S21) -> S08 -> S09 active trade -> watch P/L -> closed (TP/SL) -> stats in S10
    edge: signal already triggered, stale price, connection lost (realtime)
F04 Act on a trade (original: one-click execute)
    S09 -> one-click Sell -> confirmation
    edge: no broker linked, insufficient margin  (clone: SKIP execution, see §8)
F05 Learn
    S04 Learning -> S16 -> S17 lesson -> quiz -> pass -> next lesson unlocks
    edge: fail quiz, resume mid-lesson
F06 Join a live session
    S18 -> session card -> join / reminder
    edge: session over, time zone
F07 Upgrade
    any locked feature -> S19 -> purchase -> unlocked
    edge: purchase cancelled, restore purchases
F08 Check performance
    S10 -> filter 7d / all -> open a trade from history (S09)
F09 Read news
    S11 -> article -> impact analysis -> source
F10 Ask the coach by voice
    S06 -> hold mic -> transcript -> answer (text + optional voice)
```
Number to beat on the core loop (F02): **4 taps from home to a trade setup.**

## 5. Components

| component | variants | states | used on |
|---|---|---|---|
| Tab bar | 4–5 tabs | active / inactive / badge | S05–S11, S16, S20 |
| Primary button | primary, secondary, danger (Sell), success (Buy) | default, pressed, disabled, loading | all |
| SSO button | provider | default, loading, error | S02 |
| Dashboard card | Trading / Investment / Learning | default, selected | S04 |
| Chat bubble | user, AI, system | sending, streaming, error | S06 |
| Attachment chip | image | uploading, ready, failed | S06 |
| Mode chips | Scalp / Swing / Trend | selected | S06, S08 |
| Mic button | hold-to-talk | idle, recording, processing | S06 |
| **Trade setup card** | buy / sell | new, tracking, TP hit, SL hit, expired | S06, S08, S09, S10 |
| Price ticker | live | up / down flash, stale | S05, S09 |
| Stat tile | win rate, trades, P/L | — | S10 |
| Mini chart / sparkline | — | loading | S09, S10, S13 |
| News card | impact high/med/low | — | S11 |
| Portfolio card | — | following / not | S12 |
| Strategy card | — | locked / unlocked | S14 |
| Course card + progress bar | — | not started / in progress / done | S16 |
| Quiz question (MCQ) | — | unanswered, correct, wrong | S17 |
| Session card | upcoming / live / ended | reminder set | S18 |
| Plan card | Connect / higher tiers | current, recommended | S19 |
| Language row | — | selected | S03, S20 |
| Toast / banner | success, error, risk disclaimer | — | all |
| Empty state | per list | — | S07, S08, S10, S11 |

## 6. Inferred data model

```
User          id, email, name, locale (ar|en), tier, created_at, push_token
              evidence: S02 SSO, S03 language, S19 tiers · confidence: high
ChatThread    id, user_id, mode (scalp|swing|trend), title, created_at
              evidence: "thread-based chat history", mode chips · confidence: high
Message       id, thread_id, role (user|ai), text, image_url?, audio_url?, created_at
              evidence: S06 multi-modal chat, voice · confidence: high
TradeSetup    id, source (ai_chat|signal), user_id?, symbol, direction (buy|sell), style (scalp|swing),
              entry_low, entry_high, sl, tp1, tp2, tp3?, invalidation, confidence, rationale,
              status (pending|active|tp1|tp2|sl|expired|cancelled), opened_at, closed_at, result_pips, result_R
              evidence: S06 setup card, S09 active trade, S10 win-rate · confidence: medium (fields guessed)
Signal        = TradeSetup with source=signal, published_at, strategy_id
              evidence: "live signals via WebSocket", "organized by asset type" · confidence: medium
PerformanceSnapshot  scope (user|signals|ai), period (7d|30d|all), trades, wins, losses, win_rate, sum_R
              evidence: "7-day performance summaries" · confidence: medium (could be computed on the fly)
NewsItem      id, title, summary, source_name, source_url, published_at, impact (high|med|low), symbols[]
              evidence: S11 "source verification", "impact analysis" · confidence: medium
Expert / Portfolio / Holding / Follow
              evidence: S12 followers + holdings · confidence: low  (clone: skip v1)
Strategy      id, name, description, rules, indicators[], tier_required
              evidence: S14 GO LAB "4 strategies" · confidence: medium
Course, Lesson (order, video_url, body), Quiz, QuizQuestion, LessonProgress (user_id, lesson_id, passed, score)
              evidence: S16 lessons/quizzes/videos · confidence: medium
LiveSession   id, title, host, starts_at, url, status
              evidence: S18 · confidence: medium
Subscription  user_id, tier, store (apple|google|web), status, renews_at
              evidence: "flexible tier plans … Connect" · confidence: medium
UsageCounter  user_id, day, ai_analyses_used     (guess: needed to gate AI cost)
```

## 7. Feature matrix
See `features.csv` (must / should / could / skip).

## 8. What cannot or should not be cloned

| item | why |
|---|---|
| Name "GO OS / GO AI", logo, "GO ID", "GO LAB", "GO Tracker" names, copy, screenshots | owned by the original — new brand (replica-brand) |
| Their educators, live sessions content, community and 10k users | the network and people are theirs — the clone runs its own lessons and sessions |
| One-click trade execution | needs broker integration / regulated arrangements — v1 shows levels only; later: optional link to the user's own MT5 via his EA |
| Expert portfolio copy (GO Tracker) | copy-trading of third parties is regulated in many countries and needs a network of experts — skip v1 |
| Their signals and performance history | their data — the clone publishes its own, fully logged track record |
| Investment dashboard (stocks / long-term) | out of scope: gold focus |
| Real-time market data licence | must buy/licence a price feed; not copyable |

## 9. Size

- Screens: 22 in the original → **14 for the clone v1** (drop S12, S13, S22; merge S07 into S06).
- Flows: 10 → 8 in v1 (no F04 execution, no expert follow).
- Entities: ~14 → ~11 in v1.
- Hard parts:
  1. **AI chart analysis that is grounded**: vision model + live gold price + ATR to sanity-check levels read from the image; strict JSON output; per-user daily limits for cost.
  2. **Realtime tracking**: live XAUUSD feed, auto-grading every setup/signal (TP/SL/expiry) and computing honest stats.
  3. **Payments & subscriptions** across web + App Store/Play rules, plus Arabic RTL everywhere and voice input.
- Size: **v1 core (F01, F02, F03, F05, F07, F08) = M (a few weeks)**; full parity = L.
