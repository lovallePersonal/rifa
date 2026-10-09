-- =============================================================================
-- Rifa (raffle app) — public read view
-- RUN ORDER: 01_schema -> 02_views -> 03_rls -> 04_functions -> 05_seed
-- HOW TO RUN: paste into the Supabase SQL editor and run (after 01_schema).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public_tickets: the ONLY surface anonymous visitors read from. It projects
-- just number / status / is_winner so buyer_* PII never leaves the base table.
--
-- This view is intentionally OWNER-RUN (security_invoker is OFF / default). It
-- runs with the view owner's privileges, so anon can read it even though RLS on
-- public.tickets (03_rls.sql) blocks any direct anon access to the base table.
-- Safety comes from the projection: only number, status and is_winner are ever
-- selected here — no buyer_name / buyer_phone / buyer_email / sold_by columns.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_tickets AS
  SELECT number, status, is_winner
  FROM public.tickets;

-- Anon must never read the base table directly; all public reads go via the view.
REVOKE ALL ON public.tickets FROM anon;

-- Expose only the safe projection to anon and authenticated roles.
GRANT SELECT ON public.public_tickets TO anon, authenticated;
