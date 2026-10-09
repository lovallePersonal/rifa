-- =============================================================================
-- Rifa (raffle app) — public reservation RPC
-- RUN ORDER: 01_schema -> 02_views -> 03_rls -> 04_functions -> 05_seed
-- HOW TO RUN: paste into the Supabase SQL editor and run (after 03_rls).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- reserve_ticket: the ONLY write path exposed to anonymous visitors. It is
-- SECURITY DEFINER so it can update public.tickets despite RLS, but it is
-- tightly scoped: it flips exactly one 'available' ticket to 'reserved' and
-- captures the buyer contact info. The WHERE status = 'available' guard makes
-- the operation race-safe (a concurrent second caller updates 0 rows and gets
-- false), preventing double-booking of the same number.
--
-- Returns:
--   true  -> the ticket was available and is now reserved
--   false -> number out of range, missing, or already reserved/paid
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_ticket(
  p_number int,
  p_name   text,
  p_phone  text,
  p_email  text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reject out-of-range numbers up front (matches the table CHECK 1..999).
  IF p_number IS NULL OR p_number < 1 OR p_number > 999 THEN
    RETURN false;
  END IF;

  UPDATE public.tickets
  SET status      = 'reserved',
      buyer_name  = p_name,
      buyer_phone = p_phone,
      buyer_email = p_email,
      reserved_at = now(),
      updated_at  = now()
  WHERE number = p_number
    AND status = 'available';

  -- No row matched -> the ticket was not available. Reject.
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Lock down execution: no one by default, then grant to the app roles only.
REVOKE EXECUTE ON FUNCTION public.reserve_ticket(int, text, text, text) FROM public;
GRANT  EXECUTE ON FUNCTION public.reserve_ticket(int, text, text, text) TO anon, authenticated;
