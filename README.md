# SANDIKALE Digital Showroom

Premium mobile-first custom apparel storefront and production order workspace.

## Stack
React 18 + Vite, Supabase Auth/Postgres/Storage/Edge Functions, jsPDF, Netlify.

## Infrastructure
Uses the existing Supabase project `bpfurmqbtredhipendpz` formerly used by Member Club. Digital Showroom data is isolated in `showroom_*` tables and `showroom-*` buckets. Legacy `mc_*` tables are retained. The legacy SANDIKALE POS is not connected or modified.

## Local setup
1. Node.js 20+
2. `npm install`
3. Copy `.env.example` to `.env`; set Supabase URL and publishable key.
4. `npm run dev`; production check: `npm run build`.

## Routes
- `/` catalog and checkout
- `/admin` staff workspace
- `/?track=TRACKING_CODE` public tracking

## Business rules
- Manual payment; admin verifies payment.
- Public order creation and tracking use `showroom-public-api` Edge Function.
- Customer receives tracking code and downloadable draft SPK.
- Product management is done in admin UI, without JSON editing.

## Netlify
Build command `npm run build`; publish directory `dist`. Connect this repository to the dedicated Netlify site `sandikale-digital-showroom`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
