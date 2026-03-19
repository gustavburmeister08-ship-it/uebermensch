-- ─── Enable UUID extension ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  phase text not null default 'dissonance'
    check (phase in ('dissonance', 'uncertainty', 'discovery')),
  level text not null default '1.0'
    check (level in ('1.0', '2.0', '3.0')),
  active_pillars text[] not null default '{}',
  onboarding_complete boolean not null default false,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro')),
  pillar_scores jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Check-ins ────────────────────────────────────────────────────────────────
create table public.check_ins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood integer not null check (mood between 0 and 10),
  energy_level integer not null check (energy_level between 0 and 10),
  note text,
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.check_ins enable row level security;

create policy "Users can manage own check-ins"
  on public.check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index check_ins_user_id_idx on public.check_ins(user_id);
create index check_ins_completed_at_idx on public.check_ins(completed_at desc);

-- ─── Metric Entries ───────────────────────────────────────────────────────────
create table public.metric_entries (
  id uuid primary key default uuid_generate_v4(),
  check_in_id uuid references public.check_ins(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  metric_id text not null,
  value numeric not null,
  note text,
  logged_at timestamptz not null
);

alter table public.metric_entries enable row level security;

create policy "Users can manage own metric entries"
  on public.metric_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index metric_entries_user_id_idx on public.metric_entries(user_id);
create index metric_entries_metric_id_idx on public.metric_entries(metric_id);
create index metric_entries_logged_at_idx on public.metric_entries(logged_at desc);

-- ─── Directives ───────────────────────────────────────────────────────────────
create table public.directives (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  pillar text not null,
  title text not null,
  body text not null,
  why text not null,
  action text not null,
  model text not null,
  generated_at timestamptz not null default now(),
  completed_at timestamptz,
  skipped_at timestamptz
);

alter table public.directives enable row level security;

create policy "Users can manage own directives"
  on public.directives for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index directives_user_id_idx on public.directives(user_id);
create index directives_generated_at_idx on public.directives(generated_at desc);

-- ─── Weekly Audits ────────────────────────────────────────────────────────────
create table public.weekly_audits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  pillar_scores jsonb not null default '{}',
  highlights text[] not null default '{}',
  gaps text[] not null default '{}',
  directive_completion numeric not null default 0,
  ai_summary text,
  completed_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_audits enable row level security;

create policy "Users can manage own audits"
  on public.weekly_audits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Onboarding Answers ───────────────────────────────────────────────────────
create table public.onboarding_answers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

alter table public.onboarding_answers enable row level security;

create policy "Users can manage own onboarding answers"
  on public.onboarding_answers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
