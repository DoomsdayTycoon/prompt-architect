-- =============================================
-- Prompt Architect — Supabase Database Setup
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. PROFILES TABLE
-- Stores user display names, linked to Supabase Auth
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Users can only read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. PROMPT HISTORY TABLE
-- Stores generated prompts per user
create table if not exists public.prompt_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic text not null,
  task text not null,
  industry text not null default 'general',
  output text not null default 'document',
  model text not null default 'claude',
  file_output text default 'pdf',
  prompt_text text,
  created_at timestamptz default now() not null
);

-- Enable RLS on prompt_history
alter table public.prompt_history enable row level security;

-- Users can only read their own history
create policy "Users can read own history"
  on public.prompt_history for select
  using (auth.uid() = user_id);

-- Users can insert their own history
create policy "Users can insert own history"
  on public.prompt_history for insert
  with check (auth.uid() = user_id);

-- Users can delete their own history
create policy "Users can delete own history"
  on public.prompt_history for delete
  using (auth.uid() = user_id);

-- 3. INDEX for fast history queries
create index if not exists idx_prompt_history_user_id
  on public.prompt_history (user_id, created_at desc);

-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- Trigger function that creates a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
