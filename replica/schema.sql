-- Sabika AI — first migration (Supabase / Postgres 15+)
-- Access model: Supabase Row Level Security on every table.
--   * user-owned rows: owner = auth.uid()
--   * public content (lessons, signals, news, strategies, prices): readable by signed-in users,
--     writable only by the service role (server routes, ingestion, admin)
-- All times timestamptz (UTC). Prices numeric(12,3). Money integer minor units + currency.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'ar' check (locale in ('ar','en')),
  tier text not null default 'free' check (tier in ('free','pro','elite')),
  tier_expires_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_upd before update on profiles for each row execute function set_updated_at();

-- create a profile automatically on sign-up
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1))); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ---------------------------------------------------------------- billing (manual local payments first)
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tier text not null check (tier in ('pro','elite')),
  months int not null check (months between 1 and 12),
  amount_minor int not null check (amount_minor > 0),
  currency text not null default 'IQD' check (currency in ('IQD','USD')),
  method text not null check (method in ('zaincash','fastpay','qicard','usdt','card','other')),
  reference text,                         -- transfer id the user types in
  proof_path text,                        -- storage path of receipt screenshot
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payments (user_id, created_at desc);
create index on payments (status, created_at);
create trigger payments_upd before update on payments for each row execute function set_updated_at();

create table usage_daily (
  user_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  analyses int not null default 0,
  chat_messages int not null default 0,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------- market data (from MT5 bridge EA or data API)
create table price_bars_m1 (
  symbol text not null default 'XAUUSD',
  t timestamptz not null,                 -- bar open time, UTC
  o numeric(12,3) not null, h numeric(12,3) not null, l numeric(12,3) not null, c numeric(12,3) not null,
  spread numeric(8,3),
  source text not null default 'mt5',
  primary key (symbol, t),
  check (h >= greatest(o,c) and l <= least(o,c))
);
create index on price_bars_m1 (symbol, t desc);

create table market_context (            -- refreshed every minute by ingestion; one row per symbol
  symbol text primary key,
  last_price numeric(12,3) not null,
  atr_d1 numeric(10,3), atr_h1 numeric(10,3), atr_m15 numeric(10,3),
  day_high numeric(12,3), day_low numeric(12,3), prev_day_high numeric(12,3), prev_day_low numeric(12,3),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- strategies (LAB) and signals
create table strategies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null, name_en text not null,
  description_ar text, description_en text,
  rules jsonb not null default '{}',
  tier_required text not null default 'free' check (tier_required in ('free','pro','elite')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger strategies_upd before update on strategies for each row execute function set_updated_at();

-- one table for AI setups and published signals: same grading logic, same stats
create table trade_setups (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('ai','signal')),
  user_id uuid references profiles(id) on delete cascade,      -- owner for source='ai'; null for signals
  strategy_id uuid references strategies(id) on delete set null,
  symbol text not null default 'XAUUSD',
  style text not null check (style in ('scalp','swing')),
  direction text not null check (direction in ('buy','sell','none')),  -- 'none' = AI says no trade
  entry_low numeric(12,3), entry_high numeric(12,3),
  sl numeric(12,3), tp1 numeric(12,3), tp2 numeric(12,3), tp3 numeric(12,3),
  invalidation text,
  confidence text check (confidence in ('low','medium','high')),
  rationale_ar text, rationale_en text,
  strategies jsonb not null default '[]',         -- [{id, note}] strategies the AI found on the chart
  primary_strategy text,                          -- id from the playbook the setup is built on
  confluence smallint check (confluence between 0 and 100),
  requested_strategy text,                        -- user forced a single strategy (null = auto)
  price_at_creation numeric(12,3),
  valid_until timestamptz not null,       -- pending setups expire (scalp ~4h, swing ~5d)
  status text not null default 'pending'
    check (status in ('pending','active','tp1','tp2','tp3','sl','be','expired','cancelled','no_trade')),
  filled_at timestamptz, filled_price numeric(12,3),
  closed_at timestamptz, closed_price numeric(12,3),
  result_r numeric(8,3),                  -- result in R (risk units); null until closed
  max_favorable numeric(12,3), max_adverse numeric(12,3),
  published_at timestamptz,               -- signals only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source <> 'ai' or user_id is not null),
  check (direction = 'none' or (entry_low is not null and sl is not null and tp1 is not null)),
  check (direction <> 'buy'  or (sl < entry_low and tp1 > entry_high)),
  check (direction <> 'sell' or (sl > entry_high and tp1 < entry_low)),
  check (entry_low is null or entry_high is null or entry_low <= entry_high)
);
create index on trade_setups (user_id, created_at desc);
create index on trade_setups (source, status) where status in ('pending','active','tp1','tp2');
create index on trade_setups (source, published_at desc) where source = 'signal';
create index on trade_setups (strategy_id);
create index on trade_setups (primary_strategy, status);
create trigger trade_setups_upd before update on trade_setups for each row execute function set_updated_at();

-- ---------------------------------------------------------------- AI coach
create table chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null default 'scalp' check (mode in ('scalp','swing','trend','general')),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on chat_threads (user_id, updated_at desc);
create trigger chat_threads_upd before update on chat_threads for each row execute function set_updated_at();

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,   -- denormalised for RLS
  role text not null check (role in ('user','assistant','system')),
  body text,
  image_path text,                         -- private storage path
  setup_id uuid references trade_setups(id) on delete set null,
  model text, prompt_version text, input_tokens int, output_tokens int,  -- for evaluation & cost
  created_at timestamptz not null default now()
);
create index on messages (thread_id, created_at);
create index on messages (user_id, created_at desc);

-- ---------------------------------------------------------------- learning
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null, title_en text,
  level int not null default 1 check (level between 1 and 5),
  position int not null default 0,
  tier_required text not null default 'free' check (tier_required in ('free','pro','elite')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger courses_upd before update on courses for each row execute function set_updated_at();

create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  position int not null,
  title_ar text not null, title_en text,
  body_ar text, body_en text,              -- markdown
  video_url text,
  pass_score int not null default 70 check (pass_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);
create index on lessons (course_id);
create trigger lessons_upd before update on lessons for each row execute function set_updated_at();

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  position int not null,
  prompt_ar text not null, prompt_en text,
  options jsonb not null,                  -- [{id, text_ar, text_en}]
  correct_option text not null,            -- never sent to the client before submit
  explanation_ar text, explanation_en text,
  unique (lesson_id, position)
);
create index on quiz_questions (lesson_id);

create table lesson_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  best_score int not null default 0,
  attempts int not null default 0,
  passed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index on lesson_progress (lesson_id);

create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_en text,
  host_name text not null,
  starts_at timestamptz not null,
  duration_min int not null default 60,
  join_url text,
  tier_required text not null default 'free' check (tier_required in ('free','pro','elite')),
  created_at timestamptz not null default now()
);
create index on live_sessions (starts_at);

-- ---------------------------------------------------------------- news
create table news_items (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null unique,         -- dedupe key (idempotent ingestion)
  title text not null,
  summary_ar text, summary_en text,
  impact text check (impact in ('high','medium','low')),
  published_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on news_items (published_at desc);

-- ---------------------------------------------------------------- notifications
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  wants_signals boolean not null default true,
  wants_sessions boolean not null default true,
  created_at timestamptz not null default now()
);
create index on push_subscriptions (user_id);

-- ---------------------------------------------------------------- stats view (honest track record)
create or replace view setup_stats as
select source, style, date_trunc('week', closed_at) as week,
       count(*) filter (where result_r is not null) as closed,
       count(*) filter (where result_r > 0) as wins,
       round(avg(result_r), 3) as avg_r,
       round(sum(result_r), 2) as sum_r
from trade_setups
where status not in ('pending','active','cancelled','no_trade')
group by 1, 2, 3;

-- per-strategy honesty: which playbook strategies actually win on gold
create or replace view strategy_stats as
select primary_strategy, style,
       count(*) filter (where result_r is not null) as closed,
       count(*) filter (where result_r > 0) as wins,
       round(avg(result_r), 3) as avg_r,
       round(sum(result_r), 2) as sum_r
from trade_setups
where source = 'ai' and primary_strategy is not null and status not in ('pending','active','cancelled','no_trade')
group by 1, 2;

-- ---------------------------------------------------------------- RLS
alter table profiles enable row level security;
alter table payments enable row level security;
alter table usage_daily enable row level security;
alter table price_bars_m1 enable row level security;
alter table market_context enable row level security;
alter table strategies enable row level security;
alter table trade_setups enable row level security;
alter table chat_threads enable row level security;
alter table messages enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table quiz_questions enable row level security;
alter table lesson_progress enable row level security;
alter table live_sessions enable row level security;
alter table news_items enable row level security;
alter table push_subscriptions enable row level security;

-- own rows
create policy "own profile read"   on profiles for select using (id = auth.uid());
create policy "own profile update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid());   -- tier / is_admin changes are blocked by a column grant below
revoke update (tier, tier_expires_at, is_admin) on profiles from authenticated;

create policy "own payments read"   on payments for select using (user_id = auth.uid());
create policy "own payments insert" on payments for insert with check (user_id = auth.uid() and status = 'pending');
create policy "own usage read"      on usage_daily for select using (user_id = auth.uid());
create policy "own threads"  on chat_threads for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own messages read" on messages for select using (user_id = auth.uid());
-- messages are inserted by the server (service role) after the AI call; no client insert policy
create policy "own progress read" on lesson_progress for select using (user_id = auth.uid());
create policy "own push"     on push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- setups: users see their own AI setups and all published signals
create policy "setups read" on trade_setups for select
  using ((source = 'ai' and user_id = auth.uid()) or (source = 'signal' and published_at is not null));

-- public content for signed-in users
create policy "prices read"   on price_bars_m1  for select to authenticated using (true);
create policy "context read"  on market_context for select to authenticated using (true);
create policy "strategies read" on strategies for select to authenticated using (is_published);
create policy "courses read"  on courses for select to authenticated using (is_published);
create policy "lessons read"  on lessons for select to authenticated
  using (exists (select 1 from courses c where c.id = course_id and c.is_published));
create policy "sessions read" on live_sessions for select to authenticated using (true);
create policy "news read"     on news_items for select to authenticated using (true);
-- quiz_questions: no client policy at all (correct answers stay server-side); served via server route

-- ---------------------------------------------------------------- storage buckets (run in Supabase dashboard or via API)
-- charts   : private, 5 MB max, image/png|jpeg|webp ; path = {user_id}/{uuid}.ext ; owner-only read
-- receipts : private, 5 MB max ; path = {user_id}/{uuid}.ext ; owner + admin read
