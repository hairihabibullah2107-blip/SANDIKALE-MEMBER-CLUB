# SANDIKALE MEMBER CLUB

[![Netlify Status](https://api.netlify.com/api/v1/badges/3979d338-7df7-4375-99b8-470c911e8abe/deploy-status)](https://app.netlify.com/projects/sandikale-member-club/deploys)

**Repository:** [SANDIKALE-MEMBER-CLUB](https://github.com/hairihabibullah2107-blip/SANDIKALE-MEMBER-CLUB) · **Branch:** [main](https://github.com/hairihabibullah2107-blip/SANDIKALE-MEMBER-CLUB/tree/main) · **Deploy status:** [Netlify](https://app.netlify.com/projects/sandikale-member-club/deploys)

Customer-first loyalty and membership portal for SANDIKALE.

## Current phase

**Phase 1 — Customer UI foundation (prototype).**

Included:
- Responsive customer member portal
- Digital member card presentation
- Stamp collection and progress display
- Reward catalog and demo claim interaction
- Transaction history presentation
- Customer profile and WhatsApp preference UI
- Demo-state labels to distinguish sample data from verified backend data

Not connected yet:
- Supabase Auth / database / Row Level Security
- Phone OTP verification
- Real member QR token generation
- Cashier transaction validation and idempotent stamp ledger
- Secure reward redemption codes
- WhatsApp Business Platform

No real customer or transaction data is stored by this prototype.

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Environment

Copy `.env.example` to `.env.local` when the Supabase integration phase begins. Never commit service-role keys or private credentials.

## Architecture guardrails

- This repository is separate from the legacy SANDIKALE POS repository.
- Do not modify the existing POS as part of MEMBER CLUB work.
- Transaction-based stamps only; visits do not generate stamps.
- Stamp and reward mutations must be server-validated.
- Customer-facing UI must never be trusted as the source of transaction validity.
- Apply role-based authorization and Supabase RLS before connecting production data.
- Separate transactional WhatsApp consent from marketing consent.

## Baseline

Follow **Master Technical Specification & UI/UX Blueprint V1.0**. Any change to core business rules requires explicit approval.
