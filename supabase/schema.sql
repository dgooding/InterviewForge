-- ============================================================
-- InterviewForge — Supabase schema (run in SQL Editor)
-- ============================================================
-- 1. Create a project at https://supabase.com
-- 2. Authentication → Providers → Google → enable + add Client ID/Secret
-- 3. Authentication → URL Configuration:
--      Site URL: https://interviewforge-zeta.vercel.app  (and http://localhost:3000 for dev)
--      Redirect URLs: 
--        http://localhost:3000/auth/callback
--        https://interviewforge-zeta.vercel.app/auth/callback
-- 4. Run this entire script
-- 5. Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
-- ============================================================

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  streak int not null default 0,
  last_practice_date date,
  preferred_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Interview sessions + answers (jsonb)
create table if not exists public.interview_sessions (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  mode text not null,
  company_style text,
  started_at timestamptz not null,
  completed_at timestamptz,
  overall_score numeric,
  status text not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interview_sessions_user_id_idx
  on public.interview_sessions (user_id);

create index if not exists interview_sessions_started_at_idx
  on public.interview_sessions (started_at desc);

-- Resume analyses
create table if not exists public.resume_analyses (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text,
  summary text,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  experience_highlights jsonb default '[]'::jsonb,
  talking_points jsonb default '[]'::jsonb,
  sample_answers jsonb default '[]'::jsonb,
  suggested_roles jsonb default '[]'::jsonb,
  raw_text_excerpt text,
  source text,
  uploaded_at timestamptz not null default now()
);

create index if not exists resume_analyses_user_id_idx
  on public.resume_analyses (user_id);

-- Auto-create profile when a user signs up via Google
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.resume_analyses enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Sessions policies
drop policy if exists "sessions_select_own" on public.interview_sessions;
create policy "sessions_select_own" on public.interview_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.interview_sessions;
create policy "sessions_insert_own" on public.interview_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.interview_sessions;
create policy "sessions_update_own" on public.interview_sessions
  for update using (auth.uid() = user_id);

drop policy if exists "sessions_delete_own" on public.interview_sessions;
create policy "sessions_delete_own" on public.interview_sessions
  for delete using (auth.uid() = user_id);

-- Resume policies
drop policy if exists "resume_select_own" on public.resume_analyses;
create policy "resume_select_own" on public.resume_analyses
  for select using (auth.uid() = user_id);

drop policy if exists "resume_insert_own" on public.resume_analyses;
create policy "resume_insert_own" on public.resume_analyses
  for insert with check (auth.uid() = user_id);

drop policy if exists "resume_update_own" on public.resume_analyses;
create policy "resume_update_own" on public.resume_analyses
  for update using (auth.uid() = user_id);

drop policy if exists "resume_delete_own" on public.resume_analyses;
create policy "resume_delete_own" on public.resume_analyses
  for delete using (auth.uid() = user_id);
