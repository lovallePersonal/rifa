-- =============================================================================
-- Rifa (raffle app) — Supabase Cloud schema
-- RUN ORDER: 01_schema -> 02_views -> 03_rls -> 04_functions -> 05_seed
-- HOW TO RUN: paste each file, in order, into the Supabase SQL editor and run it.
-- There is no local Supabase/Docker; these files are applied manually in Cloud.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Base table: one row per raffle number (1..999).
-- status / sold_by CHECK literals MUST match src/types.ts (Status, SoldBy).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  number       int PRIMARY KEY CHECK (number BETWEEN 1 AND 999),
  status       text NOT NULL DEFAULT 'available'
               CHECK (status IN ('available', 'reserved', 'paid')),
  buyer_name   text,
  buyer_phone  text,
  buyer_email  text,
  sold_by      text CHECK (sold_by IN ('Jaco', 'Pipe')),
  reserved_at  timestamptz,
  paid_at      timestamptz,
  is_winner    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Admin allow-list: emails stored lowercased (see 05_seed). Membership is
-- checked case-insensitively by the RLS predicate in 03_rls.sql.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY
);

-- -----------------------------------------------------------------------------
-- Keep updated_at fresh on every UPDATE of a ticket row.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tickets_set_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_set_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
