-- =============================================================================
-- Rifa (raffle app) — seed data
-- RUN ORDER: 01_schema -> 02_views -> 03_rls -> 04_functions -> 05_seed
-- HOW TO RUN: paste into the Supabase SQL editor and run (after 04_functions).
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING).
-- =============================================================================

-- All 999 raffle numbers, each defaulting to status 'available'.
INSERT INTO public.tickets (number)
SELECT generate_series(1, 999)
ON CONFLICT (number) DO NOTHING;

-- The three real administrators (lowercased). No placeholder entries.
INSERT INTO public.admin_emails (email) VALUES
  ('leandroovalle02@gmail.com'),
  ('jacoboovallegiraldo@gmail.com'),
  ('juan.feliperodriguezgarcia1508@gmail.com')
ON CONFLICT (email) DO NOTHING;
