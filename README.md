# SANDIKALE Digital Showroom

Website katalog dan pemesanan custom apparel SANDIKALE. Mobile-first, dengan workspace admin, unggah artwork, pratinjau penempatan desain, SPK PDF, dan tracking pesanan.

## Stack resmi

- **GitHub** — source code, version control, build, dan hosting GitHub Pages.
- **Supabase** — Auth, PostgreSQL, Storage, dan Edge Functions.
- **React 18 + Vite** — frontend.
- **jsPDF** — dokumen SPK.

Netlify tidak dipakai sebagai hosting maupun bagian dari alur deployment.

## Infrastruktur

- Repository: `hairihabibullah2107-blip/SANDIKALE-MEMBER-CLUB`
- Supabase project: `bpfurmqbtredhipendpz`
- Data Digital Showroom terisolasi pada tabel `showroom_*` dan bucket `showroom-*`.
- Tabel dan fungsi lama `mc_*` tetap dipertahankan sebagai arsip Member Club.
- Repository/database SANDIKALE POS (Kasir) tidak digunakan dan tidak diubah.

## Deployment GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` membangun aplikasi dan menerbitkan folder `dist` ke GitHub Pages setiap ada push ke `main`.

Alamat publik:
https://hairihabibullah2107-blip.github.io/SANDIKALE-MEMBER-CLUB/

Jika deployment pertama belum berjalan, aktifkan **Settings → Pages → Build and deployment → Source: GitHub Actions** pada repository.

## Akses website

- Showroom: `/`
- Admin: `/?view=admin`
- Tracking: `/?track=TRACKING_CODE`

## Local development

1. Node.js 20 atau lebih baru.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env` bila ingin mengganti konfigurasi Supabase.
4. Jalankan `npm run dev`.
5. Validasi produksi dengan `npm run build`.

Konfigurasi publik Supabase sudah memiliki fallback pada `src/supabase.js`. Jangan pernah memasukkan service-role key ke frontend atau repository.

## Fitur

- Katalog produk dikelola melalui dashboard admin, tanpa mengedit JSON. Produk hanya dapat diterbitkan setelah admin mengunggah foto produk utama.
- Akses admin tidak ditampilkan di navigasi publik; pintu masuk berupa ikon gembok kecil di footer dan tetap dilindungi Supabase Auth serta profil staf aktif.
- Form konfigurasi ukuran, posisi cetak, teknik sablon, dan unggah artwork.
- Pratinjau artwork pada kaos untuk posisi cetak yang dipilih.
- Checkout pesanan dengan pembayaran manual setelah konfirmasi admin.
- Tracking publik menggunakan token acak; database hanya menyimpan hash token.
- SPK PDF draft dapat diunduh dan diarsipkan pada private Storage.
- Dashboard admin untuk katalog, status order, dan verifikasi pembayaran.

## Catatan operasional

SPK customer adalah dokumen draft. Admin tetap harus mengonfirmasi harga, spesifikasi, artwork, dan pembayaran sebelum produksi. Lakukan pengujian end-to-end di GitHub Pages setelah workflow pertama berhasil, termasuk login admin, unggah foto produk, pemesanan, unduh/arsip SPK, tracking, dan verifikasi pembayaran.
