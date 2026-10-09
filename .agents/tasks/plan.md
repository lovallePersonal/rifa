# Implementation Plan — App de Rifa (React + Vite + TS + Tailwind + Supabase)

Greenfield build in an empty workspace. Node 20.19.2 and pnpm 10.17.0 are present; git is NOT
initialized. Target: a compilable React SPA plus plain `.sql` files for Supabase cloud. There is no
live Supabase project, so end-to-end runtime testing is OUT OF SCOPE. The verification bar is:
`pnpm install` + `pnpm run build` succeed with zero TypeScript errors, and the SQL object names
(`public_tickets`, `reserve_ticket`, `admin_emails`, `tickets`) match exactly what the frontend calls.

## Key design decisions (made here, do not re-decide)

1. **Tailwind v3, not v4.** The spec mandates a `tailwind.config` file with `darkMode: 'class'`, a
   `brand` color, and Inter font family. Tailwind v3's JS-config model expresses this directly and is
   the stable, best-documented path. Use `tailwind.config.js` + `postcss.config.js` +
   `@tailwind base/components/utilities` directives. (Tailwind v4 moves config into CSS and would
   complicate the required `darkMode:'class'` + `brand` extension.)
2. **Supabase Auth Google flow:** `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`,
   session via `onAuthStateChange` + `getSession()`; admin email read from `session.user.email`.
   Admin gating is UX-only on the client; RLS enforces server-side.
3. **Public reads go through the `public_tickets` VIEW only.** The base `tickets` table is never
   readable by `anon`. Public writes happen only through the `reserve_ticket` SECURITY DEFINER RPC.
4. **WhatsApp destination:** config-driven. During the testing phase it must resolve to the
   test number `573143933641` ONLY (not Jaco's). Keep `jaco` (573125556018) and the pending
   Pipe number in `WHATSAPP_NUMBERS` with clear comments; expose a single
   `WHATSAPP_ACTIVE_DESTINATION` that points at the test number now and is a one-line change to
   switch to Jaco later. Documented in `src/config.ts` comments and the README.
5. **Standalone app:** the LogiSuite steering patterns (UserPreferencesContext, UserMenu, LogiAuth
   SAML, deploy.yml/SSM) do NOT apply — this is an independent app with its own explicit spec and
   its own Supabase auth. Follow this spec.

## SQL object-name contract (frontend depends on these EXACT names)

- Table: `public.tickets` — columns: `number`, `status`, `buyer_name`, `buyer_phone`,
  `buyer_email`, `sold_by`, `reserved_at`, `paid_at`, `is_winner`, `created_at`, `updated_at`.
- View: `public.public_tickets` — columns: `number`, `status`, `is_winner`.
- RPC: `public.reserve_ticket(p_number int, p_name text, p_phone text, p_email text)` returns a
  boolean/json success flag.
- Table: `public.admin_emails` — column `email`, seeded with all THREE real admin emails
  (`leandroovalle02@gmail.com`, `jacoboovallegiraldo@gmail.com`,
  `juan.feliperodriguezgarcia1508@gmail.com`). Store lowercased; compare case-insensitively.
- Status enum values (text/check): `available` | `reserved` | `paid`.
- `sold_by` values: `Felipe` | `Pipe`.

---

## Ordered items

- [ ] 1. Scaffold the Vite React-TS project and enforce pnpm.
      Create `package.json` (name `rifa`, `"packageManager": "pnpm@10.17.0"`, scripts dev/build/preview/lint,
      `"version": "0.1.0"`), `.npmrc` (`engine-strict=true`), `tsconfig.json`, `tsconfig.node.json`,
      `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`.
      Deps: react, react-dom, @supabase/supabase-js, react-router-dom, react-i18next, i18next,
      i18next-browser-languagedetector. Dev: typescript, vite, @vitejs/plugin-react, tailwindcss@^3,
      postcss, autoprefixer, @types/react, @types/react-dom.
      Files: package.json, .npmrc, tsconfig.json, tsconfig.node.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/vite-env.d.ts
      Verify: `pnpm install` succeeds; `pnpm run build` compiles the stub app.

- [ ] 2. Configure Tailwind v3 (darkMode class, brand amber, Inter) and global styles.
      Files: tailwind.config.js (darkMode:'class', content globs, theme.extend.colors.brand amber scale,
      fontFamily.sans Inter+system-ui), postcss.config.js, src/index.css (@tailwind directives + Inter import).
      Verify: `pnpm run build` succeeds; brand/dark classes resolve (no unknown-utility errors).

- [ ] 3. Create centralized config `src/config.ts`.
      ADMIN_EMAILS (three real emails, all lowercased: leandroovalle02@gmail.com,
      jacoboovallegiraldo@gmail.com, juan.feliperodriguezgarcia1508@gmail.com — no placeholders;
      compare case-insensitively), WHATSAPP_NUMBERS (jaco '573125556018', test '573143933641', Pipe placeholder
      comment) + WHATSAPP_ACTIVE_DESTINATION = test number (one-line change to switch to jaco later), RAFFLE (ticketPrice 10000, drawDate '2026-10-29', prize 'Nintendo Switch + AirPods 4',
      numberMin 1, numberMax 999, format3 helper, lottery 'Loteria de Bogota'). All values commented.
      Files: src/config.ts
      Verify: `pnpm run build` succeeds; imported by other modules without type errors.

- [ ] 4. Set up i18n (es primary, en fallback) with all keys.
      Files: src/i18n/index.ts (init with LanguageDetector, fallbackLng 'en', es+en resources),
      src/i18n/locales/es.json, src/i18n/locales/en.json. Keys cover: banner/raffle copy, public grid,
      search, counters, reservation form + validation, whatsapp message template, admin login/denied,
      admin table headers, filters, mark-paid, release, winner, csv, footer. No hardcoded UI strings anywhere.
      Verify: `pnpm run build` succeeds; `src/i18n` imported in main.tsx.

- [ ] 5. Create the Supabase client and shared types.
      Files: src/lib/supabase.ts (createClient from VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY,
      detectSessionInUrl true), src/types.ts (Ticket, PublicTicket, Status, SoldBy types matching SQL columns).
      Verify: `pnpm run build` succeeds; env vars typed in vite-env.d.ts.

- [ ] 6. Author Supabase SQL files (schema, RLS, seed) — the exact contract above.
      Files: supabase/01_schema.sql (tickets table + check constraints + admin_emails table + updated_at trigger),
      supabase/02_views.sql (public_tickets view, grant SELECT to anon, revoke base table from anon),
      supabase/03_rls.sql (enable RLS; admin SELECT/UPDATE policies checking auth.jwt()->>'email' in admin_emails,
      wrapped in subselect per Supabase best practice; index on admin_emails.email),
      supabase/04_functions.sql (reserve_ticket SECURITY DEFINER: rejects if not available, sets reserved + buyer
      data + reserved_at, returns success), supabase/05_seed.sql (generate_series 1..999 insert all available;
      seed admin_emails with all three real emails, lowercased, no placeholder). Idempotent where reasonable (IF NOT EXISTS / CREATE OR REPLACE).
      Verify: SQL object names grep-match frontend calls (`public_tickets`, `reserve_ticket`, `admin_emails`);
      status/sold_by literals consistent with src/types.ts and src/config.ts.

- [ ] 7. Build shared UI primitives and auth hook.
      Files: src/components/StatusBadge.tsx (accessible color-coded status), src/components/Footer.tsx
      (VITE_APP_VERSION fallback 'dev'), src/components/Banner.tsx (prize + price + draw copy via i18n),
      src/hooks/useAuth.ts (session via onAuthStateChange, isAdmin = email in ADMIN_EMAILS, signInWithGoogle, signOut).
      Verify: `pnpm run build` succeeds.

- [ ] 8. Build the PUBLIC view (open route `/`).
      Files: src/pages/PublicView.tsx, src/components/TicketGrid.tsx (999 cells 001..999 color-coded from
      public_tickets), src/components/SearchBox.tsx, src/components/Counters.tsx (sold/paid/raised/projected
      from status counts), src/components/ReserveModal.tsx (name/phone/email form -> reserve_ticket RPC ->
      on success open wa.me link with Spanish prefilled message incl. 3-digit number + buyer). Reads only
      public_tickets. 
      Verify: `pnpm run build` succeeds; no direct reads of base `tickets` table in public code.

- [ ] 9. Build the ADMIN view (route `/admin`, Google login, gated to ADMIN_EMAILS).
      Files: src/pages/AdminView.tsx (login screen 'Iniciar sesion con Google'; access-denied + signout if not
      admin), src/components/AdminTable.tsx (all numbers + buyer data, filters by status/seller, per-seller totals,
      counters), src/components/AdminActions.tsx (mark paid -> status+paid_at; set sold_by Felipe|Pipe; release ->
      available), src/components/WinnerInput.tsx (enter 3 digits -> is_winner=true, show buyer), src/lib/csv.ts
      (export all tickets w/ buyer data). Reads base `tickets` (admin RLS). Wire routes in src/App.tsx (react-router).
      Verify: `pnpm run build` succeeds; RPC/table/column names match SQL contract.

- [ ] 10. Project meta: env example, README, git init.
      Files: .env.example (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_VERSION), .gitignore
      (node_modules, dist, .env/.env.local, package-lock.json, yarn.lock; keep .env.example + pnpm-lock.yaml),
      README.md in Spanish (local run with pnpm, Supabase cloud setup + paste SQL in order, Google auth setup,
      adding Felipe/Jaco admin emails, data-privacy explanation of the view/RPC/RLS model, Vercel deploy + env vars).
      Then: `git init`, `git checkout -b DEV`, stage, commit `v0.1.0 Init: estructura inicial de la app de rifa`.
      Do NOT push; do NOT configure remotes/deploy creds.
      Verify: `pnpm install && pnpm run build` succeed end to end; `git log` shows the DEV-branch commit;
      `.env` and node_modules are gitignored.

## Final verification checklist

- `pnpm install` clean, `pnpm-lock.yaml` present.
- `pnpm run build` — zero TS errors.
- grep confirms `public_tickets`, `reserve_ticket`, `admin_emails` used in frontend all exist in `supabase/*.sql`.
- status (`available|reserved|paid`) and sold_by (`Felipe|Pipe`) literals consistent across types/config/SQL.
- No hardcoded user-facing strings outside i18n locales.
- Public code never queries the base `tickets` table.
