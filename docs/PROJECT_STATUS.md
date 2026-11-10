# Project Status — 10 November 2026

## Current phase
Phase 1: Customer UI foundation (prototype). Repository scaffold and first customer portal UI are committed to `main`.

## Seven-layer delivery tracker

| Layer | Current state | Next action |
|---|---|---|
| 1. Monitoring | Not configured | Add deploy/build status visibility and error monitoring after hosting is selected |
| 2. Deploy | Not configured | Connect this repository to a free static hosting project |
| 3. Environment Variables | Template created | Add only the dedicated Member Club Supabase URL and publishable key after backend selection |
| 4. Database | Discovery in progress; no Member Club schema deployed | Confirm an isolated Supabase project, then implement V1.0 schema, constraints, indexes, RLS and migrations |
| 5. Test | Not run in CI | Install dependencies, run production build, then add unit/integration tests |
| 6. Rules File | Initial rules added | Maintain this file and AGENTS.md as implementation grows |
| 7. Application / Index | Initial React/Vite customer UI committed | Connect auth, member profile, ledger, rewards and transaction APIs after backend isolation is confirmed |

## Verified repository facts
- Canonical repository: `hairihabibullah2107-blip/SANDIKALE-MEMBER-CLUB`
- Repository visibility: Private
- Default branch: main
- Frontend: React + Vite
- Existing POS repository is separate and must remain untouched.
- Customer UI currently uses sample values and local component state only.

## Backend discovery and safety
- A Supabase project named `sandikale` is active and contains POS-shaped tables including `profiles`, `products`, `shifts`, `orders`, and `store_settings`. It is not safe to assume this is the Member Club backend.
- A separate Supabase project named `SANDIKALE-KASIR` is also listed, but metadata inspection of its database failed with a read-only database authentication error. Its schema has not been verified.
- No Member Club tables, authentication flow, or migration have been deployed.
- Do not connect this application to either existing project until the owner confirms which project is dedicated to Member Club, or creates a new isolated project.
- Never place a Supabase service-role or secret key in frontend environment variables. Only a publishable/anon client key may be used in the browser.

## Known limitations
- No live OTP, secure QR validation, cashier workflow, reward redemption, or WhatsApp integration exists yet.
- Build/test status is pending; do not treat source commits as a verified deployment.
- Demo member identity, stamp count, rewards, and transaction history are sample data only.
