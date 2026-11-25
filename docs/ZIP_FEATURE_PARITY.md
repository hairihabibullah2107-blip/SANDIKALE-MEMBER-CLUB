# ZIP Feature Parity — SANDIKALE Digital Showroom

Source of truth: uploaded `sandikale-—-streetwear-&-custom-dtf-studio.zip` (reviewed 2026-11-25).

## Source package audit
The archive contains React 19 + Vite + Tailwind + Motion UI, Express server routes, local JSON storage, and components for:
- Storefront navigation, catalog, category filters, sorting, product quick view, recently viewed, wishlist.
- Customer registration/login and account order history.
- Cart/checkout with configurable shipping and payment methods.
- Custom DTF Studio: garment silhouette, fabric/color options, multiple print zones, artwork upload, scale/quantity controls, draft save.
- Order tracking with production stages and notifications.
- Admin dashboard: order queue, production stages, product/fabric/color management, inventory, payment/shipping settings, monthly sales, PDF reports, webhook logs/retry, promo push, live chat, bug reports.
- Support modals and customer service.

## Important source limitations
- `src/types.ts` is empty.
- `server/store.ts` and `.data/sandikale-db.json` are empty.
- The source frontend calls many Express endpoints under `/api/*`; these cannot run on GitHub Pages.
- The package's local JSON store and Express server cannot be copied as-is into a static GitHub Pages deployment.
- ZIP includes a hardcoded sample tracking request and claims such as shipping/promo/production guarantees. Those must not be surfaced as real SANDIKALE policies unless admin configures and verifies them.

## Adaptation architecture
- Keep GitHub Pages as static frontend.
- Keep Supabase as database, authentication, and Storage.
- Use the existing `showroom-public-api` Edge Function for public order creation and tracking; add narrowly scoped Edge Function actions for chat, bug reports, and public customer account flows where required.
- Keep admin mutations behind Supabase Auth + staff-role checks / server-side Edge Functions.
- Keep existing showroom order, custom designer, SPK versioning, payment, and production tables as the canonical data. Do not duplicate them with ZIP-shaped tables.
- Do not touch the SANDIKALE POS repository or its database.

## Feature mapping
| ZIP feature | SANDIKALE adaptation |
|---|---|
| Catalog/category/search/sort/quick view | Existing showroom product/category tables and frontend |
| Wishlist/recently viewed | Browser-local initially; account sync only after customer auth design |
| Custom DTF Studio | Existing showroom designer, DTF-only pricing, per-zone uploads, garment mockups |
| Cart/checkout | Existing showroom cart and secure order Edge Function |
| Customer account | Supabase Auth; preserve guest checkout/tracking |
| Tracking/production stages | Existing order status history + production jobs |
| Admin product/material/color management | Existing showroom admin tables and Storage |
| Inventory + stock movement | New additive inventory tables in this migration |
| Product reviews | New moderated review table; only published reviews public |
| Live chat | New private message table; access only through Edge Function |
| Bug reports | New private bug report table; access only through Edge Function |
| Payment/shipping settings | New admin-managed configuration tables; manual payment remains default |
| Reports | Aggregate existing orders/payments/production data; no fabricated values |
| Webhooks/retry | Only implement for an actual external integration; do not simulate delivery |
| Promo push/email | Only activate after a real notification provider and consent flow exist |

## Migration note
`20261125090000_zip_feature_parity_foundation.sql` is additive and has not been applied automatically. Review it against the live schema and apply through Supabase migrations only after confirming the staff-profile columns and policies. No existing table is dropped or reset.

## Delivery gates
1. Apply and verify the migration.
2. Add secure Edge Function endpoints for chat/bug reports and customer account operations.
3. Wire inventory movements to order lifecycle using transactions/RPC to avoid overselling.
4. Implement admin CRUD for payment/shipping settings and inventory.
5. Add moderated reviews and real customer service messaging.
6. Validate the existing Custom DTF Studio + SPK flow end-to-end.
7. Run build, RLS checks, and browser tests on desktop/mobile before merging.
