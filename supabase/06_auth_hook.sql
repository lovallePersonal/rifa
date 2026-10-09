-- =============================================================================
-- Rifa (raffle app) — AUTH-layer admin allow-list (defense-in-depth)
-- RUN ORDER: 01_schema -> 02_views -> 03_rls -> 04_functions -> 05_seed -> 06_auth_hook
-- HOW TO RUN: paste into the Supabase SQL editor and run (after 05_seed), THEN
--             enable it in the dashboard (see README: "Hook de autenticacion").
--
-- WHY THIS FILE EXISTS
--   RLS (03_rls.sql) already blocks non-admin accounts from reading/writing the
--   `tickets` table. This hook adds a SECOND, EARLIER barrier: it runs at the
--   AUTH layer, before an access token is even issued, and refuses to mint a
--   token for any Google account whose email is not in `public.admin_emails`.
--   A rejected user never obtains a session at all — RLS never has to matter.
--
--   This file is STRICTLY ADDITIVE. It does NOT touch 02_views.sql or 03_rls.sql.
--
-- HOOK TYPE CHOSEN: "Custom Access Token" hook.
--   Rationale: it runs on EVERY token issuance (initial login AND every token
--   refresh), so it blocks both brand-new sign-ups and any pre-existing
--   non-admin account. A "Before User Created" hook only fires once at sign-up
--   and would let an already-created non-admin keep logging in, so it is weaker
--   for this requirement. When this hook returns an object with an `error` key,
--   Supabase Auth aborts token issuance and surfaces the error to the client.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- restrict_token_to_admins: Custom Access Token hook.
--   Input  (event jsonb): { user_id, claims, authentication_method }
--   Output (jsonb):
--     - on success -> { "claims": <claims unchanged> }  (token is issued)
--     - on reject  -> { "error": { "http_code": 403, "message": "..." } }
--                     (Supabase Auth does NOT issue the token)
--
-- The email is read from event->'claims'->>'email' and compared
-- case-insensitively against public.admin_emails (Gmail local parts are
-- case-insensitive). SECURITY DEFINER so it can read admin_emails under RLS.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restrict_token_to_admins(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_is_admin boolean;
BEGIN
  v_email := event -> 'claims' ->> 'email';

  -- No email on the token -> cannot be an admin. Reject.
  IF v_email IS NULL OR length(trim(v_email)) = 0 THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Acceso restringido a administradores.'
      )
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE lower(email) = lower(v_email)
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    -- Abort token issuance for non-admin accounts.
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Esta cuenta no esta autorizada como administrador.'
      )
    );
  END IF;

  -- Admin: issue the token unchanged (claims are not modified).
  RETURN jsonb_build_object('claims', event -> 'claims');
END;
$$;

-- -----------------------------------------------------------------------------
-- Permissions required by Supabase Auth to run the hook.
--   The auth server executes hooks as role `supabase_auth_admin`. That role
--   must be able to execute the function; no one else should be able to.
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.restrict_token_to_admins(jsonb) TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.restrict_token_to_admins(jsonb) FROM anon, authenticated, public;

-- The hook function reads public.admin_emails; let the auth admin role read it.
GRANT SELECT ON public.admin_emails TO supabase_auth_admin;

-- =============================================================================
-- AFTER running this file you MUST enable the hook in the dashboard:
--   Authentication -> Hooks -> "Custom Access Token" -> select
--   public.restrict_token_to_admins -> Enable. See README for details.
-- =============================================================================
