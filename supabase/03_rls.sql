-- =============================================================================
-- Rifa (raffle app) — Row Level Security
-- RUN ORDER: 01_schema -> 02_views -> 03_rls -> 04_functions -> 05_seed
-- HOW TO RUN: paste into the Supabase SQL editor and run (after 02_views).
-- =============================================================================

-- Enable RLS. With RLS on and no anon policy, anon has NO direct access to the
-- base table; anon reads happen only through public.public_tickets (owner-run).
ALTER TABLE public.tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Speed up the admin membership lookup used by the predicate below.
CREATE INDEX IF NOT EXISTS idx_admin_emails_email ON public.admin_emails (email);

-- -----------------------------------------------------------------------------
-- Admin check as a SECURITY DEFINER function.
--
-- WHY A FUNCTION (and not an inline subquery): if a policy on `tickets` reads
-- `admin_emails`, and `admin_emails` itself has an RLS policy that also reads
-- `admin_emails`, Postgres raises "infinite recursion detected in policy".
-- A SECURITY DEFINER function reads `admin_emails` with the function owner's
-- privileges, bypassing RLS on that table and breaking the recursion cycle.
--
-- The email is read from the JWT, trying the top-level `email` claim first and
-- falling back to `user_metadata.email` (Supabase has shipped tokens with the
-- email in either place depending on version), compared case-insensitively
-- (Gmail local parts are case-insensitive).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE lower(email) = lower(
      COALESCE(
        NULLIF(auth.jwt() ->> 'email', ''),
        auth.jwt() -> 'user_metadata' ->> 'email'
      )
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, anon;

-- tickets: admins (authenticated + email in allow-list) can read every row.
DROP POLICY IF EXISTS admin_select ON public.tickets;
CREATE POLICY admin_select ON public.tickets
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- tickets: admins can update rows (mark paid, set sold_by, set winner, etc.).
DROP POLICY IF EXISTS admin_update ON public.tickets;
CREATE POLICY admin_update ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- admin_emails: authenticated admins may read the allow-list. Uses the same
-- SECURITY DEFINER function, so there is no self-referential recursion.
DROP POLICY IF EXISTS admin_emails_select ON public.admin_emails;
CREATE POLICY admin_emails_select ON public.admin_emails
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());
