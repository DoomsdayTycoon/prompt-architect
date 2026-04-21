-- Referral credits migration
-- Run this once in the Supabase SQL editor.
-- Adds:
--   1. profiles.referred_by        — UUID prefix (first 8 hex chars) of the referrer
--   2. profiles.referral_credits   — integer cents of unused credit
--   3. referral_events             — audit log of every credit event
--   4. increment_referral_credit() — RPC used by the Stripe webhook
-- Safe to re-run (CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- 1. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS referral_credits_cents INTEGER NOT NULL DEFAULT 0;

-- Backfill referred_by from auth metadata written at signup.
UPDATE public.profiles p
SET referred_by = (u.raw_user_meta_data->>'referred_by')
FROM auth.users u
WHERE u.id = p.id
  AND p.referred_by IS NULL
  AND u.raw_user_meta_data->>'referred_by' IS NOT NULL;

-- Sync future signups into profiles.referred_by. handle_new_user() is the
-- standard Supabase trigger that creates a profile row after signup — we
-- drop/recreate it to include the referral field.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'referred_by'
  )
  ON CONFLICT (id) DO UPDATE
    SET referred_by = COALESCE(public.profiles.referred_by, EXCLUDED.referred_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Audit log
CREATE TABLE IF NOT EXISTS public.referral_events (
  id BIGSERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  kind TEXT NOT NULL, -- 'earned_as_referrer' | 'earned_as_referee' | 'reversed_refund'
  stripe_event_id TEXT UNIQUE, -- idempotency key — one Stripe event never credits twice
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own events (as either side). Writes are webhook-only
-- via service_role, which bypasses RLS, so no insert policy needed.
DROP POLICY IF EXISTS referral_events_select_own ON public.referral_events;
CREATE POLICY referral_events_select_own
  ON public.referral_events FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- 3. Atomic credit grant used by the Stripe webhook.
-- Returns TRUE if credit was granted, FALSE if this stripe_event_id was already processed.
CREATE OR REPLACE FUNCTION public.grant_referral_credit(
  p_referrer_id UUID,
  p_referee_id UUID,
  p_amount_cents INTEGER,
  p_stripe_event_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing INTEGER;
BEGIN
  -- Idempotency check
  SELECT 1 INTO v_existing FROM public.referral_events
    WHERE stripe_event_id = p_stripe_event_id LIMIT 1;
  IF FOUND THEN RETURN FALSE; END IF;

  -- Referrer credit
  IF p_referrer_id IS NOT NULL THEN
    UPDATE public.profiles
      SET referral_credits_cents = referral_credits_cents + p_amount_cents
      WHERE id = p_referrer_id;
    INSERT INTO public.referral_events (referrer_id, referee_id, amount_cents, kind, stripe_event_id)
      VALUES (p_referrer_id, p_referee_id, p_amount_cents, 'earned_as_referrer', p_stripe_event_id || ':referrer');
  END IF;

  -- Referee credit (same $5)
  IF p_referee_id IS NOT NULL THEN
    UPDATE public.profiles
      SET referral_credits_cents = referral_credits_cents + p_amount_cents
      WHERE id = p_referee_id;
    INSERT INTO public.referral_events (referrer_id, referee_id, amount_cents, kind, stripe_event_id)
      VALUES (p_referrer_id, p_referee_id, p_amount_cents, 'earned_as_referee', p_stripe_event_id);
  END IF;

  RETURN TRUE;
END;
$$;

-- 4. Find referrer by 8-char UUID prefix. The referral link exposes only the
-- prefix, so the webhook needs to resolve it back to a full UUID.
CREATE OR REPLACE FUNCTION public.find_referrer_by_prefix(p_prefix TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles
    WHERE id::text LIKE (lower(p_prefix) || '%')
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.grant_referral_credit(UUID, UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_referrer_by_prefix(TEXT) TO service_role;
