# Project Status — 10 November 2026

## Current phase
Phase 2: Member Club database foundation and trusted cashier transaction workflows. Customer UI prototype remains the first user-facing surface.

## Seven-layer delivery tracker

| Layer | Current state | Next action |
|---|---|---|
| 1. Monitoring | Not configured | Add deploy/build status visibility after hosting is selected |
| 2. Deploy | Not configured | Connect this repository to Netlify Free; remain within free usage limits |
| 3. Environment Variables | Template exists | Configure only the dedicated SANDIKALE-KASIR project URL and publishable key in hosting settings |
| 4. Database | Foundation and cashier transaction workflows applied | Add customer onboarding, staff provisioning, rewards issuance/redemption workflows |
| 5. Test | SQL structure/permissions inspected; unauthenticated RPC guard tested; GitHub Actions build workflow added but no run result is visible yet | Verify first CI run; then run authenticated staff integration tests, idempotency tests and RLS tests |
| 6. Rules File | AGENTS.md maintained | Keep V1.0 and POS-isolation guardrails current |
| 7. Application / Index | Customer UI prototype exists; not connected | Integrate Supabase client and customer auth after a no-cost verification approach is selected |

## Verified repository facts
- Canonical repository: `hairihabibullah2107-blip/SANDIKALE-MEMBER-CLUB`
- Repository visibility: Private; default branch: main
- Frontend: React 18 + Vite 6
- Existing POS repository remains separate and untouched.
- Customer UI values and local interactions are still demo-only.

## Backend selection and isolation
- Approved backend project: `SANDIKALE-KASIR`, ref `zwtjqtwidfezvfhxmkyf`, region `ap-southeast-2`.
- The other project named `sandikale` (lowercase) is the live store POS database and is strictly off-limits: do not inspect for writes, modify, migrate, pause, or delete it.
- The five pre-existing POS-shaped tables in SANDIKALE-KASIR were observed with zero rows at inspection time. They were not deleted or modified.
- Additive Member Club tables use the `mc_` prefix. The V1.0 foundation migration and cashier workflow migration are stored under `supabase/migrations/`.
- New `mc_` tables have RLS enabled. Browser roles have read-only grants; member-scoped SELECT policies are in place. Loyalty writes are reserved for trusted server workflows.
- Supabase project URL: `https://zwtjqtwidfezvfhxmkyf.supabase.co`. Use the publishable key only in browser configuration. Never expose service-role/secret keys.
- Free tier only: no paid upgrade, add-on, SMS, or WhatsApp provider activation without explicit approval.

## Implemented trusted workflows
- `public.mc_create_transaction(member_number, source_transaction_id, total_amount)`: requires an active owner/admin/cashier staff profile; validates member and positive amount; uses a stable source transaction ID for duplicate protection; records an audit event.
- `public.mc_validate_transaction(transaction_id)`: locks the transaction row; rejects voided transactions; returns the prior result for already validated transactions; awards stamps from the currently active rule; records validation and audit events.
- Both functions use SECURITY DEFINER with an empty search_path, fully qualified relations, and EXECUTE revoked from PUBLIC/anon; EXECUTE is granted only to authenticated. Each function independently checks the caller's active staff role.
- Verification: inspected function security settings and grants; confirmed anon cannot execute and authenticated can execute; an unauthenticated call was rejected with SQLSTATE 42501 before any transaction was created.
- Supabase security advisor reports the two SECURITY DEFINER functions as warnings because authenticated staff can execute them. This is intentional and guarded by the in-function staff-role checks; it must remain under review.
- The Supabase advisor still reports the legacy `public.profiles` table with RLS disabled. Do not auto-enable or alter it without a separate review because it may affect old POS behavior.
- `mc_stamp_rules` and `mc_audit_logs` intentionally have no browser policies; privileged access remains server-side.

## Security and cost constraints
- No service-role/secret key is exposed to frontend code.
- Do not add customer phone OTP/SMS or WhatsApp delivery until a genuinely no-cost provider or alternative is confirmed. Never claim phone verification is active yet.
- No staff provisioning or customer onboarding workflow exists yet; an owner/admin must be securely provisioned before cashier RPCs can be used.
- No direct integration with the legacy POS order database exists. Cashier transaction creation is currently a separate MEMBER CLUB workflow.

## Known limitations
- The customer portal still uses sample identity, stamp count, reward catalog and transaction history.
- No deployment or production build has been verified. A GitHub Actions workflow now runs `npm install` and `npm run build` on pushes/PRs to `main`; its first run is still pending/unobserved.
- No authenticated staff end-to-end transaction test has been run because no MEMBER CLUB staff profile/account is provisioned. A negative test confirmed that an unauthenticated RPC call is rejected with SQLSTATE 42501.
- Do not claim production readiness until build, RLS, auth, idempotency, reward issuance/redemption and deployment tests pass.

## Preview UI delivery — 10 November 2026
- Added `src/Admin.jsx` as a separate responsive admin dashboard preview.
- Customer portal remains at `/`; admin preview is routed at `/admin` (also `/?view=admin`).
- Added `netlify.toml` for Vite static build and SPA fallback.
- Added responsive admin styles and mobile horizontal navigation.
- All admin/member figures and transaction rows shown in these previews are mock/sample data. Admin actions are not connected to production data.
- Netlify Free team confirmed; a Netlify site named `sandikale-member-club` was created (site ID `3979d338-7df7-4375-99b8-470c911e8abe`). The site has not yet received a deploy and no live preview URL is verified.
- Repository-to-Netlify continuous deployment still needs to be connected in Netlify UI. Once connected, set build command `npm run build`, publish directory `dist`; `netlify.toml` already contains these values.
- Build workflow was corrected to remove npm cache configuration because this repository has no committed lockfile. The latest CI run is queued/in progress; do not mark the build successful until the run concludes successfully.
- Netlify environment-variable write attempt was rejected by the connected Netlify API. No Supabase environment variables were confirmed on the Netlify site. Do not expose any secret key; only a publishable/anon key may be configured for a future browser integration.
