-- JudgeBench platform schema (Phase 26 scaffold)
-- Apply with: supabase db push  (or via the Supabase MCP apply_migration)
-- Activation steps in docs/PLATFORM_SETUP.md

-- ============ Profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (char_length(username) between 3 and 24),
  created_at timestamptz not null default now(),
  stats jsonb not null default '{}'::jsonb  -- mirrors judgebench.stats.v1
);

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);
create policy "users manage own profile"
  on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- ============ Trials (saved replays) ============
create table if not exists public.trials (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  case_type text,
  is_public boolean not null default false,
  share_slug text unique,          -- judgebench.app/trial/<slug>
  replay jsonb not null,           -- judgebench-replay format (versioned)
  verdict_decision text,
  created_at timestamptz not null default now()
);

alter table public.trials enable row level security;

create policy "public trials readable by everyone"
  on public.trials for select using (is_public or auth.uid() = owner);
create policy "owners manage own trials"
  on public.trials for insert with check (auth.uid() = owner);
create policy "owners update own trials"
  on public.trials for update using (auth.uid() = owner);
create policy "owners delete own trials"
  on public.trials for delete using (auth.uid() = owner);

create index if not exists trials_share_slug_idx on public.trials (share_slug);
create index if not exists trials_owner_idx on public.trials (owner);

-- ============ Community cases ============
create table if not exists public.community_cases (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles (id) on delete cascade,
  case_data jsonb not null,        -- CaseData schema v2
  is_published boolean not null default false,
  plays integer not null default 0,
  rating_sum integer not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.community_cases enable row level security;

create policy "published cases readable by everyone"
  on public.community_cases for select using (is_published or auth.uid() = author);
create policy "authors manage own cases"
  on public.community_cases for insert with check (auth.uid() = author);
create policy "authors update own cases"
  on public.community_cases for update using (auth.uid() = author);
create policy "authors delete own cases"
  on public.community_cases for delete using (auth.uid() = author);

-- ============ Usage events (server-side AI metering, when keys move server-side) ============
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,        -- 'turn' | 'draft' | 'deliberation' | ...
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

create policy "users read own usage"
  on public.usage_events for select using (auth.uid() = user_id);
-- inserts happen via service role from Edge Functions only
