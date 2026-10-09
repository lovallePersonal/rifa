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
-- Admin predicate (reused by every policy):
--   lower((select auth.jwt() ->> 'email')) IN (SELECT lower(email) FROM admin_emails)
-- The auth.jwt() call is wrapped in a scalar subselect (Supabase best practice:
-- it is evaluated once per statement, not once per row). Both sides are
-- lowercased because the Gmail local part is case-insensitive.
-- -----------------------------------------------------------------------------

-- tickets: admins (authenticated + email in allow-list) can read every row.
DROP POLICY IF EXISTS admin_select ON public.tickets;
CREATE POLICY admin_select ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    lower((select auth.jwt() ->> 'email'))
      IN (SELECT lower(email) FROM public.admin_emails)
  );

-- tickets: admins can update rows (mark paid, set sold_by, set winner, etc.).
DROP POLICY IF EXISTS admin_update ON public.tickets;
CREATE POLICY admin_update ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    lower((select auth.jwt() ->> 'email'))
      IN (SELECT lower(email) FROM public.admin_emails)
  )
  WITH CHECK (
    lower((select auth.jwt() ->> 'email'))
      IN (SELECT lower(email) FROM public.admin_emails)
  );

-- admin_emails: authenticated admins may read the allow-list.
DROP POLICY IF EXISTS admin_emails_select ON public.admin_emails;
CREATE POLICY admin_emails_select ON public.admin_emails
  FOR SELECT
  TO authenticated
  USING (
    lower((select auth.jwt() ->> 'email'))
      IN (SELECT lower(email) FROM public.admin_emails)
  );
