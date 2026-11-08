# Component specs — Sabika AI

Global rules
- Direction: RTL by default (`dir="rtl"`), LTR for English. Use logical spacing (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`). Icons that point (arrows, chevrons) flip in RTL; trade-direction icons (up/down) never flip.
- **Numbers and prices are always LTR** (`dir="ltr"`, `font-mono`, tabular numbers) inside Arabic text, Western digits (0-9) for prices so they match MT5/TradingView.
- Focus: `focus-visible` = 2px ring `focus` + 2px offset `bg`. Never remove outlines.
- Hit targets ≥ 44px on touch. Motion respects `prefers-reduced-motion`.
- Icons: **Lucide** (ISC). No icons, illustrations or copy from the reference app.
- Fonts: **IBM Plex Sans Arabic** (OFL) for UI, **IBM Plex Mono** (OFL) for prices.
- Colour only via roles (`bg-surface`, `text-muted`, `bg-accent`…). Buy = `success`, Sell = `danger`, always paired with a word/icon (never colour alone).

```
Button
  variants  primary (accent), secondary (surface-2 + border), ghost, danger, buy (success), sell (danger)
  sizes     sm 36px, md 44px, lg 52px; full-width option
  states    default, hover, active (scale .98), focus-visible, disabled (50% opacity, no pointer), loading (spinner + label kept for SR, aria-busy)
  tokens    radius md, font sm/600 (lg: md/600)
  a11y      real <button type>, aria-disabled when loading, icon-only buttons need aria-label
  used on   all

IconButton
  sizes     40, 44 · variants ghost, secondary · a11y aria-label required
  used on   S06 (mic, attach), headers

Input / Textarea
  states    default (border-input), focus (focus ring), error (border danger + message, aria-invalid, aria-describedby), disabled
  tokens    bg surface, text text, placeholder text-muted, radius md, height 44
  used on   S02, S06, S19, S20

SSOButton
  variants  google, email (magic link) · states default, loading, error
  used on   S02

Card
  variants  default (surface + border), raised (surface + shadow md), interactive (hover border-input, focus ring), highlight (accent-soft)
  tokens    radius lg, padding 16
  used on   all lists

DashboardCard (S04)
  states    default, selected (border accent + shadow glow, aria-pressed) · large icon + title + one line

SegmentedControl / ModeChips
  options   Scalp سريع / Swing طويل / Trend ترند
  states    default, selected (bg accent, on-accent), focus-visible, disabled
  a11y      role="radiogroup" + role="radio" aria-checked; arrow keys move selection (RTL-aware)
  used on   S06, S08, S10

TabBar (mobile bottom nav)
  items     الرئيسية · المحلل · الإشارات · التعلم · حسابي (5)
  states    active (accent icon + label, aria-current="page"), inactive (text-muted), badge (danger dot + count for SR)
  layout    height 64 + safe-area inset, fixed bottom, max-width 480 centered
  used on   S05–S11, S16, S20

ChatBubble
  variants  user (accent-soft, aligned to start in RTL = right), assistant (surface-2), system (text-muted small)
  states    sending (opacity .7), streaming (caret), error (danger text + retry button)
  a11y      list of messages in role="log" aria-live="polite"
  used on   S06

AttachmentChip / ImageDrop
  states    empty (dashed border-input + hint), dragging (border accent), uploading (progress bar), ready (thumbnail + remove), failed (danger + retry), too-large / wrong-type (inline error)
  rules     png/jpeg/webp ≤ 5 MB
  used on   S06

MicButton
  states    idle, recording (danger pulse, aria-pressed=true, timer), processing (spinner), unsupported (hidden + tooltip)
  used on   S06

TradeSetupCard  (the product's signature component)
  header    direction badge (BUY شراء / SELL بيع / NO TRADE ماكو صفقة) · style chip · confidence (low/med/high as 1–3 bars + text)
  body      entry range, stop, TP1/TP2 (mono, LTR), R:R, invalidation line, rationale (2–4 lines, expandable)
  status    pending (warning dot "بانتظار الدخول"), active (info "مفعّلة" + live P/L), tp1/tp2 (success), sl (danger), be (text-muted), expired (text-muted, strikethrough levels), no_trade (neutral explainer)
  footer    created time (Iraq time), source (AI / ORB-A / ORB-B), disclaimer line always visible
  actions   track / cancel (pending only), share image (later)
  a11y      article with heading; status announced via aria-live when it changes
  used on   S06, S08, S09, S10

PriceTicker
  states    up (success flash 300ms), down (danger flash), stale (> 2 min: text-muted + "متأخر" label), loading (skeleton)
  rules     mono, LTR, 2 decimals for XAUUSD; reduced motion = no flash
  used on   S05, S09

StatTile
  content   label (muted, xs) · value (xl, mono) · delta (success/danger + arrow + text)
  states    loading skeleton, empty ("—" + "لا توجد صفقات مغلقة بعد")
  used on   S10, track record page

MiniChart / Sparkline
  states    loading, empty, filled; equity line in accent, zero line border
  a11y      figure + figcaption with summary numbers (no chart-only information)
  used on   S09, S10

NewsCard
  content   source + time, title, AI summary (ar), impact badge (high danger-soft / medium warning / low surface-2)
  used on   S11

CourseCard + ProgressBar
  states    locked (lock icon + tier label), not started, in progress (bar accent, aria-valuenow), done (success check)
  used on   S16

LessonView + QuizQuestion
  quiz      radio options (Card interactive), states unanswered, selected, correct (success-soft + check), wrong (danger-soft + x), explanation reveal
  rules     next lesson locked until pass_score
  used on   S17

SessionCard
  states    upcoming (time in Iraq + countdown), live (danger "مباشر" pulsing dot), ended (muted), reminder set (accent bell)
  used on   S18

PlanCard
  content   tier name, price (IQD + USD), limits (analyses/day), features list, CTA
  states    current (border accent "خطتك الحالية"), recommended (accent-soft ribbon), disabled
  used on   S19

PaymentForm (manual)
  fields    method (radio: ZainCash, FastPay, Qi Card, USDT), reference, receipt upload, months
  states    submitting, pending review (warning banner), approved, rejected (danger + reason)
  used on   S19

LanguageRow · SettingRow (toggle)
  toggle    role="switch" aria-checked, 44px row
  used on   S03, S20

Toast
  variants  success, error, info · auto-dismiss 4s (errors stay until closed) · role="status" / role="alert"
  used on   all

Banner
  variants  risk disclaimer (surface-2, info icon, always on analysis screens), warning, error
  used on   S06, S08, S09

EmptyState
  content   Lucide icon (muted), one-line title, one-line hint, optional CTA
  used on   S07, S08, S10, S11

Skeleton
  shimmer disabled under reduced motion · used for every async list
```
