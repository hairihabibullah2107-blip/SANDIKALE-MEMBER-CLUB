# Project Status — 10 November 2026

## Current phase
Phase 2: Member Club database foundation. Customer UI prototype remains the first user-facing surface.

## Seven-layer delivery tracker

| Layer | Current state | Next action |
|---|---|---|
| 1. Monitoring | Not configured | Add deploy/build status visibility after hosting is selected |
| 2. Deploy | Not configured | Connect this repository to Netlify Free; remain within free usage limits |
| 3. Environment Variables | Template exists | Configure only the dedicated SANDIKALE-KASIR project URL and publishable key in hosting settings |
| 4. Database | V1.0 foundation migration applied to SANDIKALE-KASIR | Add secure server workflows, auth, staff role provisioning and RLS tests |
| 5. Test | Not run | Run Vite production build and database/RLS tests |
| 6. Rules File | AGENTS.md maintained | Keep V1.0 and POS-isolation guardrails current |
| 7. Application / Index | Customer UI prototype exists; not connected | Integrate Supabase auth and read-only member views, then transaction/reward server functions |

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
- Additive Member Club tables use the `mc_` prefix. The V1.0 foundation migration is stored at `supabase/migrations/202611100001_member_club_v1_foundation.sql`.
- New `mc_` tables have RLS enabled. Browser roles have read-only grants; member-scoped SELECT policies are in place. Loyalty writes are reserved for trusted server workflows.
- Supabase project URL: `https://zwtjqtwidfezvfhxmkyf.supabase.co`. Use the publishable key only in browser configuration. Never expose service-role/secret keys.
- Free tier only: no paid upgrade, add-on, SMS, or WhatsApp provider activation without explicit approval.

## Security findings requiring attention
- Existing legacy table `public.profiles` in SANDIKALE-KASIR has RLS disabled while several policies exist. Supabase security advisors report this as a critical exposure. It was deliberately not auto-remediated because enabling RLS without reviewing existing POS policies could disrupt legacy behavior. Review its policies and decide remediation before exposing this project to browser clients.
- `mc_stamp_rules` and `mc_audit_logs` intentionally have no browser policies; writes and privileged reads must be implemented through trusted server-side workflows.
- No live phone OTP, secure QR validation, cashier transaction integration, reward redemption endpoint, or WhatsApp integration exists yet.
- Phone OTP/SMS and WhatsApp may incur provider charges; defer until a confirmed no-cost option is available and approved.

## Known limitations
- The customer portal still uses sample identity, stamp count, reward catalog and transaction history.
- No deployment or production build has been verified.
- Do not claim production readiness until build, RLS, auth, idempotency and redemption tests pass.
