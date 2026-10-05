<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENT BRIEF — Pemantau Harga & Stok HP Second

Dokumen ini adalah sumber kebenaran untuk AI Agent yang membangun aplikasi. Baca seluruhnya sebelum menulis kode. Simpan di root repo sebagai `AGENTS.md` (atau `CLAUDE.md`).

---

## 0. Untuk Yoga: cara memakai dokumen ini

1. Siapkan hal manual di **Bagian 13** (proyek Supabase, Vercel, kunci Gemini).
2. Tempel **prompt pembuka di Bagian 12** ke agent.
3. Minta agent mengerjakan **satu fase per sesi**, satu task per commit. Tinjau hasil tiap task sebelum lanjut.
4. Fase 0 dan Fase 1 sudah dirinci penuh. Fase 2–4 hanya kerangka; minta agent merinci dulu dan minta persetujuanmu sebelum mengerjakan.

## 1. Konteks produk

Aplikasi web pribadi (PWA) satu pengguna untuk mengelola stok HP second (kebanyakan barang lelang), mencatat **tawaran beli dari beberapa konter**, membandingkannya dengan **harga pasaran**, dan memberi acuan harga serta saran: jual cepat ke konter atau pasang sendiri di Facebook Marketplace. Data harus sama di semua perangkat. Ke depan struktur data dipakai sebagai fondasi marketplace sendiri.

**Keputusan produk yang sudah final (jangan diubah tanpa bertanya):**

| Topik | Keputusan |
|---|---|
| Arah tawaran | Tawaran konter = harga **beli** konter dari pemilik. Tawaran terbaik = **tertinggi**. |
| Kanal jual | Facebook Marketplace. Marketplace sendiri = Fase 4. |
| Pengguna | Hanya **satu akun superadmin**. Login wajib. **Tidak ada pendaftaran publik.** Multi-user = backlog. |
| Identitas unit | **IMEI wajib dan unik** per unit (IMEI 2 dan serial opsional). |
| Sumber pasaran | Dua sumber berdampingan: pengamatan manual harga FB Marketplace dan estimasi AI (web). |
| Bahasa UI | Bahasa Indonesia. Mata uang Rupiah, format `Rp 1.250.000`. |
| Biaya | Target Rp0 di free tier (Vercel Hobby, Supabase free, kuota gratis Gemini). |

## 2. Aturan kerja untuk agent

**Proses**
- Kerjakan berdasarkan ID task. Satu task = satu commit dengan pesan `T1.6: registrasi unit + IMEI`. Jangan loncat fase.
- Sebelum mengerjakan task, tulis asumsi singkat. Bila ada ambiguitas yang memengaruhi data atau keamanan, **berhenti dan tanya**.
- Setelah tiap task jalankan: `pnpm lint`, `pnpm typecheck`, `pnpm test`. Semua harus hijau sebelum commit.
- Jangan menambah dependensi berat tanpa alasan tertulis. Jangan menulis fitur di luar task.

**Kode**
- TypeScript `strict`. Semua input dari luar (form, API, respons AI) divalidasi dengan **Zod**.
- Logika bisnis ditulis sebagai **fungsi murni** di `src/lib/` dengan unit test (Vitest). UI tidak boleh berisi rumus.
- Akses data lewat lapisan `src/server/` (server actions / route handlers). Klien tidak menulis query rumit.
- Perubahan skema **hanya lewat file migrasi** di `supabase/migrations/`. Jangan ubah skema lewat dashboard.

**Keamanan (wajib)**
- RLS aktif di semua tabel; policy `owner_id = auth.uid()`. Tidak ada tabel tanpa RLS.
- `SUPABASE_SERVICE_ROLE_KEY` dan `GEMINI_API_KEY` **hanya di server**. Jangan pernah diberi awalan `NEXT_PUBLIC_`, jangan di-log.
- **IMEI tidak boleh** masuk log, prompt AI, URL/query string, analitik, atau pesan error. Tampilkan termasking (`***********1234`) di daftar; penuh hanya di halaman detail setelah aksi "tampilkan".
- Jangan menyimpan data nasabah atau data internal perusahaan. Kolom `source_ref` hanya nomor referensi lot/dokumen.
- Halaman `/signup` tidak ada. Semua rute kecuali `/login` diproteksi middleware.
- Endpoint cron dilindungi header `Authorization: Bearer $CRON_SECRET`.

**UX**
- Mobile-first (target layar 360 px), target sentuh ≥ 44 px, mode gelap, status data (segar/usang) selalu terlihat.
- Input harga: hanya angka, terformat ribuan otomatis, disimpan sebagai integer Rupiah.

## 3. Stack

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js (App Router) versi stabil terbaru, TypeScript strict, pnpm |
| UI | Tailwind CSS, shadcn/ui, lucide-react |
| Data klien | TanStack Query (bila perlu), react-hook-form + zod |
| Backend | Server Actions / Route Handlers di Vercel |
| DB dan Auth | Supabase (Postgres, Auth, RLS), paket `@supabase/ssr` |
| AI | Gemini API dengan tool Google Search grounding, lewat SDK resmi Google |
| Tes | Vitest (unit), Playwright (opsional, Fase 2) |
| Grafik | Recharts (Fase 2) |

> **Penting:** versi paket, nama SDK, ID model Gemini, dan nama variabel kunci Supabase (anon vs publishable) berubah dari waktu ke waktu. **Periksa dokumentasi resmi terbaru saat implementasi** dan catat versi yang dipakai di README. Jangan mengandalkan ingatan.

**Variabel lingkungan** (`.env.example`, jangan commit nilai asli):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # sesuaikan nama dengan dokumen Supabase terbaru
SUPABASE_SERVICE_ROLE_KEY=            # server only; hindari dipakai bila tidak perlu
GEMINI_API_KEY=                       # server only
GEMINI_MODEL=                         # isi ID model terbaru dari dokumentasi Google
CRON_SECRET=
```

**Struktur folder yang disarankan**
```
src/
  app/                 # rute: /login, /(app)/units, /(app)/compare, /(app)/models, /(app)/shops, /(app)/settings
    api/estimate/route.ts
    api/cron/refresh/route.ts   # Fase 2
  components/
  lib/                 # fungsi murni + tes: format.ts imei.ts pricing.ts
  server/              # akses data, provider AI, rate limit
    ai/price-provider.ts        # interface PriceProvider
    ai/gemini-provider.ts
  types/
supabase/migrations/
```

## 4. Migrasi database — `supabase/migrations/0001_init.sql`

Isi lengkap ada di file `supabase/migrations/0001_init.sql` (sumber kebenaran skema). Ringkasan: fungsi `is_valid_imei` (15 digit + Luhn); tabel `settings`, `shops`, `phone_models`, `units`, `unit_identifiers`, `offers`, `market_observations`, `market_estimates`, `estimate_runs`; view `latest_offers`, `latest_estimates`, `unit_identifiers_masked` (semua `security_invoker`); RLS `owner only` di semua tabel; `revoke all ... from anon`.

Catatan untuk agent: migrasi `0002` harus membuat fungsi Postgres `create_unit_with_identifiers(...)` agar unit dan identifiernya tersimpan **atomik** (satu transaksi). Kesalahan unik IMEI harus diterjemahkan menjadi pesan "IMEI sudah dipakai unit HP-XXXX-NNNN".

## 5. Spesifikasi logika bisnis (`src/lib/`) beserta vektor uji

### `imei.ts`
- `normalizeImei(input)`: hapus spasi/tanda hubung.
- `isValidImei(s)`: 15 digit angka + Luhn.
- `maskImei(s)`: `***********` + 4 digit terakhir.
- Uji: `490154203237518` valid; `490154203237519` tidak valid; `49015420323751` (14 digit) tidak valid; huruf ditolak.

### `format.ts`
- `formatRupiah(n)` → `Rp 1.250.000`; `parseRupiah("1.250.000")` → `1250000`; input kosong → `null`; negatif/desimal ditolak.

### `pricing.ts`
- `quantile(sorted, q)` memakai interpolasi linear (tipe 7).
- `filterOutliers(prices)`: hitung median awal; buang harga di luar 1,5 × IQR **atau** < 50% / > 150% median awal.
- `summarize(prices, sourceCount)` → `{min, p25, median, p75, max, sample_count, confidence}`.
  - Keyakinan: `high` bila sampel ≥ 8 dan sumber ≥ 2; `medium` bila sampel 4–7; `low` bila sampel < 4 atau hanya satu sumber.
- `discountFastSale(bestBid, median)` = `1 - bestBid / median`.
- `suggest({discount, stockDays}, settings)` → `"jual_ke_konter"` bila `discount <= fast_sale_threshold` **atau** `stockDays > stock_age_days`; selain itu `"pasang_di_fb"`. Hanya saran, bukan keharusan.
- `estimatedProfit({sold, acquired, extra})` = `sold - acquired - extra`.
- `maxAcquisition({median, margin, repair, other})` = `median × (1 - margin) - repair - other`.
- `referencePrice({fbObservations, aiEstimate})` → median pengamatan FB bila ≥ 3 sampel aktif; jika tidak, median estimasi AI; kembalikan juga kedua angka dan asal yang dipakai.

**Contoh angka untuk tes:**
- Harga `[2.000.000, 2.100.000, 2.150.000, 2.200.000, 2.250.000, 5.000.000]`: median awal 2.175.000, batas atas 150% = 3.262.500, jadi 5.000.000 dibuang. Sisa 5 sampel: p25 = 2.100.000, median = 2.150.000, p75 = 2.200.000. Dengan 2 sumber, keyakinan `medium`.
- `discountFastSale(1.900.000, 2.150.000)` ≈ 0,1163 → saran `jual_ke_konter` (ambang 15%).
- `maxAcquisition({median: 2.150.000, margin: 0,12, repair: 100.000, other: 0})` = 1.792.000.
- `estimatedProfit({sold: 2.150.000, acquired: 1.700.000, extra: 100.000})` = 350.000.

## 6. Spesifikasi estimasi AI

**Kontrak:** `POST /api/estimate` body `{ modelId: uuid, grade: string, force?: boolean }`.

Alur:
1. Cek sesi Supabase; tanpa sesi → 401.
2. Ambil model dari DB. Jika ada `market_estimates` method `ai` untuk model+grade yang lebih baru dari `estimate_ttl_days` dan `force` tidak true → kembalikan cache (catat `estimate_runs.status = 'cached'`).
3. Rate limit: maksimal 20 permintaan/jam (hitung dari `estimate_runs`); lebih dari itu → 429 dan catat `rate_limited`.
4. Panggil provider AI lewat interface `PriceProvider` (`gemini-provider.ts`) dengan tool Google Search grounding.
5. Parse respons ke JSON, validasi Zod. Bila gagal parse, **coba ulang satu kali** dengan instruksi memperbaiki format; bila tetap gagal → error terkontrol.
6. Jalankan `filterOutliers` dan `summarize` di kode (**statistik tidak dihitung oleh model**).
7. Ambil sumber dari metadata grounding (URL dan judul) dan gabungkan dengan `source_domain` tiap listing.
8. Simpan ke `market_estimates` (`method = 'ai'`) dan `estimate_runs`. Kembalikan ringkasan + sumber.

**Aturan prompt:** hanya berisi brand, nama, RAM/storage, dan grade. **Tanpa IMEI, harga perolehan, nama konter, atau data pribadi.** Template:

```
Kamu asisten riset harga HP bekas di Indonesia.
Cari listing HP bekas untuk: {brand} {name} {ram}/{storage} kondisi {grade}.
Gunakan hanya listing di Indonesia dengan harga Rupiah. Abaikan aksesori, sparepart,
paket tukar tambah, dan varian RAM/storage yang berbeda. Maksimal 15 listing.
Balas HANYA JSON valid tanpa markdown:
{"listings":[{"title":string,"price_idr":number,"source_domain":string,
"url":string|null,"condition_note":string|null}],"notes":string}
```

Catatan:
- Mode keluaran terstruktur mungkin tidak bisa digabung dengan tool pencarian di semua model; karena itu JSON diminta lewat prompt dan divalidasi ketat. Verifikasi perilaku ini di dokumentasi saat implementasi.
- Listing FB Marketplace kemungkinan besar tidak terjangkau pencarian. Jangan menjanjikan data FB dari AI; UI harus menampilkan pengamatan FB manual sebagai sumber terpisah.
- Timeout 30 detik, tampilkan indikator progres. Kegagalan tidak boleh memblokir input manual.
- Batas kuota gratis grounding dan tarif berubah-ubah; jangan hardcode, tampilkan jumlah pemakaian bulan berjalan dari `estimate_runs`.

## 7. Halaman (MVP)

| Rute | Isi |
|---|---|
| `/login` | Email + password. Tanpa tautan daftar. |
| `/units` | Daftar unit (IMEI termasking), cari kode/IMEI, filter status, tombol tambah. |
| `/units/[id]` | Detail unit, IMEI penuh dengan tombol tampilkan, tawaran, saran keputusan, laba. |
| `/units/new` | Form registrasi unit + validasi IMEI real-time. |
| `/compare` | Tabel perbandingan konter vs pasaran. |
| `/models` dan `/models/[id]` | Katalog; detail berisi pengamatan FB, estimasi AI + sumber, angka acuan. |
| `/shops` | Kelola konter. |
| `/settings` | Ambang dan margin. |

**Tabel perbandingan `/compare`:** kolom: Unit/Model, tiap konter aktif (tawaran terbaru + % vs pasaran), **Tawaran terbaik** (tertinggi, disorot hijau), **Pasaran acuan** (dengan asal: FB manual/AI), **Diskon jual cepat** (%), **Saran**, **Diperbarui** (usang bila > `stale_offer_days`). Bisa diurutkan dan dicari.

## 8. Rencana task — FASE 0: Fondasi

| ID | Task | Kriteria selesai |
|---|---|---|
| T0.1 | Inisialisasi repo: Next.js TS strict, Tailwind, shadcn/ui, ESLint, Prettier, Vitest, `.env.example`, README singkat | `pnpm dev`, `build`, `lint`, `typecheck`, `test` semua jalan |
| T0.2 | Klien Supabase (`@supabase/ssr`: browser, server, middleware), migrasi `0001_init.sql`, skrip generate tipe | Migrasi terpasang; tipe TypeScript dihasilkan; tabel semua ber-RLS |
| T0.3 | Auth: halaman login, logout, middleware proteksi semua rute selain `/login`, tanpa rute daftar | Tanpa sesi → redirect ke `/login`; login/logout berfungsi; tidak ada rute signup |
| T0.4 | Deploy Vercel + env vars; rute `/api/health` (terproteksi) | URL produksi bisa login; env tidak bocor ke klien (cek bundle) |

## 9. Rencana task — FASE 1: MVP

| ID | Task | Kriteria selesai |
|---|---|---|
| T1.1 | `lib/format.ts` + tes | Vektor uji Bagian 5 lulus |
| T1.2 | `lib/imei.ts` + tes | Vektor uji IMEI lulus |
| T1.3 | `lib/pricing.ts` + tes | Semua contoh angka Bagian 5 lulus; kasus tepi (sampel kosong, 1 sampel) tertangani |
| T1.4 | CRUD Konter | Tambah/ubah/nonaktifkan; konter nonaktif tidak muncul di form baru |
| T1.5 | CRUD Katalog model + autocomplete + cegah duplikat | Model kembar ditolak dengan pesan jelas |
| T1.6 | Registrasi unit + IMEI (migrasi 0002 fungsi atomik, form zod, aksi server) | IMEI tidak valid/duplikat ditolak; unit + identifier tersimpan atomik; `source_type` wajib; kode `HP-TAHUN-NNNN` terbentuk |
| T1.7 | Daftar + detail unit | IMEI termasking di daftar; penuh hanya setelah tombol "tampilkan"; cari berdasarkan kode atau 4+ digit IMEI |
| T1.8 | Input tawaran konter (per unit atau per model) + riwayat | Tawaran baru = baris baru; harga ≤ 0 ditolak; riwayat terlihat |
| T1.9 | Halaman `/compare` | Sesuai spesifikasi Bagian 7; sorotan = tawaran tertinggi; penanda usang bekerja |
| T1.10 | Pasaran manual + pengamatan FB | Catat listing (harga, tautan, tanggal, aktif/terjual); median dihitung; `referencePrice` dipakai di `/compare` |
| T1.11 | Estimasi AI (Bagian 6) | Cache, rate limit, retry parse, sumber tampil, keyakinan tampil; kegagalan tidak memblokir input manual; IMEI tidak pernah ada di prompt/log (dibuktikan lewat tes) |
| T1.12 | Responsif + PWA + mode gelap | Bisa di-install di HP; nyaman di 360 px; Lighthouse PWA lulus dasar |
| T1.13 | Pengerasan dan QA | Skrip uji RLS: klien anon tanpa sesi tidak bisa membaca/menulis tabel apa pun; ceklis keamanan Bagian 2 terpenuhi; README berisi cara deploy dan pemulihan |

**Definisi selesai MVP**
- Login superadmin berfungsi, tanpa pendaftaran publik, uji RLS lulus.
- Registrasi unit dengan IMEI unik dan tervalidasi; duplikat ditolak.
- Input tawaran dari dua konter dan tabel perbandingan bekerja dengan data nyata.
- Harga pasaran bisa dari pengamatan FB manual maupun estimasi AI, dengan sumber dan keyakinan.
- Deploy produksi di Vercel, PWA terpasang di HP.

## 10. Backlog (jangan dikerjakan sebelum diminta)

**Fase 2 — Optimal:** grafik tren (F2.1) · penyesuaian per grade (F2.2) · kalkulator dan saran keputusan lengkap (F2.3) · refresh terjadwal via Vercel Cron `/api/cron/refresh` (F2.4) · watchlist dan peringatan (F2.5) · impor/ekspor CSV/JSON termasuk impor data prototipe HTML (F2.6) · dashboard (F2.7) · scan IMEI lewat kamera dengan pustaka barcode dan fallback ketik (F2.8).

**Fase 3 — Otomasi:** generator listing FB Marketplace, judul + deskripsi yang **selalu memuat kisaran harga pasaran**, tanpa IMEI (F3.1) · foto dan lampiran di Supabase Storage (F3.2) · laporan laba per unit/asal barang (F3.3) · bot Telegram (F3.4) · audit log dan backup, termasuk koreksi IMEI tercatat (F3.5).

**Fase 4 — Marketplace sendiri:** katalog publik dari inventaris, kolom/tabel publik **terpisah** (tanpa IMEI, harga perolehan, asal barang), tombol WhatsApp, publish/unpublish.

**Backlog lain:** multi-pengguna/role, pembayaran online, posting otomatis ke marketplace.

## 11. Ceklis pengujian dan keamanan (dipakai di T1.13)

- [ ] Tanpa login: semua rute dan API selain `/login` menolak akses.
- [ ] Klien anon tidak bisa `select`/`insert` ke tabel mana pun (uji otomatis).
- [ ] Tidak ada variabel rahasia di bundle klien.
- [ ] IMEI tidak muncul di log server, URL, prompt AI, maupun pesan error.
- [ ] IMEI duplikat, IMEI 14 digit, IMEI gagal Luhn ditolak di UI **dan** di database.
- [ ] Respons AI yang rusak/kosong tidak menyebabkan crash atau data salah tersimpan.
- [ ] Rate limit estimasi bekerja; hasil cache dipakai bila masih segar.
- [ ] Harga negatif/nol/non-angka ditolak di semua form.
- [ ] Semua halaman terpakai nyaman di 360 px dan mode gelap.

## 12. Prompt pembuka siap tempel untuk agent

```
Kamu akan membangun aplikasi "Pemantau Harga & Stok HP Second". Baca AGENTS.md
(brief ini) seluruhnya sebelum menulis kode. Ikuti aturan kerja di Bagian 2.

Tugas sesi ini: kerjakan FASE 0 saja (T0.1 sampai T0.4), satu task per commit
dengan pesan "T0.x: ...". Sebelum tiap task, tulis asumsi singkat. Setelah tiap
task jalankan lint, typecheck, dan test. Periksa dokumentasi resmi terbaru untuk
versi paket dan API Supabase/Next.js. Jangan mulai Fase 1 sebelum saya bilang.
Bila ada yang ambigu terkait data atau keamanan, berhenti dan tanya.
Di akhir sesi, berikan ringkasan: apa yang selesai, apa yang perlu saya siapkan
manual, dan asumsi yang kamu ambil.
```

Untuk sesi Fase 1, ganti bagian tugas menjadi: "kerjakan FASE 1 (T1.1 sampai T1.13) secara berurutan; berhenti dan minta tinjauan setelah T1.6, T1.9, dan T1.11."

## 13. Persiapan manual oleh Yoga (agent tidak bisa melakukan ini)

1. Buat repo GitHub (privat) dan hubungkan ke Vercel.
2. Buat proyek Supabase (pilih region terdekat, mis. Singapura). Catat URL dan kunci API.
3. Di Supabase Authentication: **matikan pendaftaran pengguna baru**, lalu buat **satu user superadmin** secara manual dan aktifkan MFA (TOTP).
4. Buat API key Gemini di Google AI Studio. Cek batas kuota grounding di halaman pricing resmi.
5. Isi environment variables di Vercel (dan `.env.local` untuk lokal). Buat `CRON_SECRET` acak yang panjang.
6. Siapkan data awal untuk diuji: tawaran dua konter dan beberapa listing FB pembanding per model.
