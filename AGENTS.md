# SANDIKALE MEMBER CLUB — Engineering Rules

## Product baseline
- Follow Master Technical Specification & UI/UX Blueprint V1.0.
- Customer portal is the first delivery priority.
- Preserve the approved premium minimalist black/white visual direction.
- Do not modify or couple this repository to the legacy SANDIKALE POS.

## Non-negotiable business rules
- Stamps are earned from valid transactions only, never from visits.
- Stamp target and earning rules are configurable by Owner/Admin.
- A verified phone number maps to one active membership.
- A transaction can award stamps only once (idempotent server-side processing).
- Customers cannot directly edit stamps, transactions, or reward eligibility.
- Reward redemption must use a unique, single-use server-validated code.
- Every administrative correction requires a reason and staff identity.
- Transactional WhatsApp consent and marketing consent are separate.

## Security
- Never expose Supabase service-role credentials in browser code.
- Enforce authorization on the server and with database Row Level Security.
- Treat all browser-submitted transaction, stamp, and reward values as untrusted.
- Validate QR payloads and redemption tokens on the server.
- Keep audit records for privileged changes.

## UI and accessibility
- Mobile-first responsive layouts.
- Use semantic controls and accessible labels.
- Clearly label sample/demo data; never imply it is live customer data.
- Keep customer-facing copy in Indonesian unless a language feature is approved.

## Delivery discipline
- Inspect existing files before replacing them.
- Make focused, reviewable changes.
- Run production build and relevant tests before calling a phase complete.
- Do not claim integrations, deployment, or tests succeeded unless verified.
