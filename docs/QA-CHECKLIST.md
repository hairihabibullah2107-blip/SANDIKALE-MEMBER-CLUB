# Digital Showroom QA Checklist

Run these checks on the published GitHub Pages URL after the first successful deployment.

## Public storefront
- [ ] Landing page loads at the repository Pages URL; images and CSS load under the repository path.
- [ ] Catalog shows only published products and search/category filters work.
- [ ] Product details show the correct price and product image.
- [ ] Size quantities cannot be submitted as zero and must sum to the product quantity.
- [ ] DTF/print method and placement selections are preserved in the order.
- [ ] JPG, PNG, and PDF artwork uploads work; invalid extensions/signatures and files over 8 MB are rejected.
- [ ] Image artwork preview changes according to the selected print placement.
- [ ] Checkout validates customer name and WhatsApp number.
- [ ] Order creation uses server-side product prices, not browser-submitted prices.
- [ ] Order confirmation displays order number, SPK number, and tracking token.
- [ ] SPK PDF downloads, shows the size breakdown, and is saved to private Supabase Storage.
- [ ] WhatsApp handoff opens the SANDIKALE admin number.
- [ ] Public tracking shows only the order status and status timeline for the valid tracking token.

## Admin
- [ ] Owner/admin can sign in; unauthenticated users cannot access admin data.
- [ ] Admin can create/edit/publish/unpublish products and assign categories.
- [ ] Product image upload accepts JPG/PNG/WEBP up to 10 MB.
- [ ] Admin can see order details, open uploaded artwork using a short-lived signed URL, and open archived SPK PDFs.
- [ ] Admin can change order status and the status history is recorded.
- [ ] Partial payments accumulate correctly; overpayments and duplicate full-payment verification are blocked.
- [ ] Admin can sign out.

## Supabase/security
- [ ] No service-role key is present in browser assets or GitHub source.
- [ ] Customer artwork and SPK buckets remain private.
- [ ] Product images are public only for published catalog products.
- [ ] Invalid tracking tokens return no order details.
- [ ] Rate limiting returns HTTP 429 when thresholds are exceeded.
- [ ] Run Supabase Security and Performance Advisors after changes.

## Release gate
Do not accept live customer orders until all applicable checks above pass. Place one controlled test order with a test customer, verify its PDF/archive and tracking, then remove only the test order through an audited admin process.
