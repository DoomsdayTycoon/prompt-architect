-- =============================================
-- Prompt Architect — Paywall & Usage Tracking
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. ADD USAGE COLUMNS TO PROFILES
alter table public.profiles
  add column if not exists prompt_count_simple int default 0 not null,
  add column if not exists prompt_count_expert int default 0 not null,
  add column if not exists is_paid boolean default false not null,
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text default 'free' not null,
  add column if not exists subscription_end timestamptz;

-- 2. FUNCTION TO INCREMENT PROMPT COUNT
-- Called from frontend after generating a prompt
create or replace function public.increment_prompt_count(mode text)
returns json as $$
declare
  current_simple int;
  current_expert int;
  paid boolean;
  sub_status text;
begin
  select prompt_count_simple, prompt_count_expert, is_paid, subscription_status
  into current_simple, current_expert, paid, sub_status
  from public.profiles
  where id = auth.uid();

  if mode = 'expert' then
    update public.profiles set prompt_count_expert = prompt_count_expert + 1 where id = auth.uid();
    return json_build_object(
      'simple_used', current_simple,
      'expert_used', current_expert + 1,
      'is_paid', paid,
      'subscription_status', sub_status
    );
  else
    update public.profiles set prompt_count_simple = prompt_count_simple + 1 where id = auth.uid();
    return json_build_object(
      'simple_used', current_simple + 1,
      'expert_used', current_expert,
      'is_paid', paid,
      'subscription_status', sub_status
    );
  end if;
end;
$$ language plpgsql security definer;

-- 3. FUNCTION TO GET USAGE STATUS
create or replace function public.get_usage_status()
returns json as $$
declare
  profile_row public.profiles%rowtype;
begin
  select * into profile_row from public.profiles where id = auth.uid();
  if not found then
    return json_build_object('error', 'not_found');
  end if;
  return json_build_object(
    'simple_used', profile_row.prompt_count_simple,
    'expert_used', profile_row.prompt_count_expert,
    'is_paid', profile_row.is_paid,
    'subscription_status', profile_row.subscription_status,
    'subscription_end', profile_row.subscription_end
  );
end;
$$ language plpgsql security definer;
