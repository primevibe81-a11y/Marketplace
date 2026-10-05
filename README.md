# Pemantau Harga & Stok HP Second

Aplikasi web PWA (Progressive Web App) pribadi untuk manajemen stok HP bekas, mencatat tawaran konter, membandingkan dengan estimasi pasar (Facebook Marketplace & AI), serta memberi referensi cepat untuk profit.

## Fitur MVP
1. **Manajemen Stok**: Register unit lengkap dengan masking IMEI untuk privasi data di log dan *client-side*.
2. **Katalog Model & Observasi FB**: Simpan daftar model HP dan amati harganya di Facebook Marketplace untuk jadi acuan harga minimum.
3. **Estimasi AI Terintegrasi**: Sinkronisasi dengan Gemini API beserta *Google Search Grounding* untuk mengambil ringkasan harga pasaran HP *real-time* dari berbagai situs dengan cepat.
4. **Perbandingan & Tawaran (*Compare*)**: Tabel matriks untuk melihat tawaran terbaik secara langsung dengan label "Jual ke Konter" atau "Pasang di FB" otomatis.
5. **Aman & Ringan**: Login *Superadmin* via Supabase. Anonim / tanpa sesi tidak bisa mengintip *database* (Dilindungi penuh oleh *Row Level Security* Supabase).
6. **Mobile-First & PWA**: Dukungan fitur `Dark Mode` (*Mode Gelap*), navigasi HP fleksibel, serta mendukung fungsi "Install/Add to Home Screen" di HP Android & iPhone Anda.

## Cara Pemasangan & *Deploy* (Deployment Guide)

1. **GitHub**: *Fork* atau salin proyek ini ke repositori privat Anda.
2. **Supabase**: 
   - Buat proyek baru di [Supabase](https://supabase.com/).
   - Di tab *SQL Editor*, jalankan kode pada fail konfigurasi *database* (`supabase_full_migration.sql` atau gunakan metode `supabase db push`).
   - Matikan fitur **Allow new users to sign up** di menu *Authentication > Providers*. Buat 1 (satu) akun secara manual, dan itulah satu-satunya akun yang bisa dipakai untuk masuk.
3. **Vercel**:
   - Impor repo ini ke Vercel.
   - Tambahkan Environment Variables (*Environment Variables*) berikut pada Vercel Settings:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Sangat krusial untuk klien)
     - `GEMINI_API_KEY` (Ambil dari Google AI Studio)
     - `GEMINI_MODEL` (Contoh: `gemini-1.5-pro`)
   - Simpan dan tekan tombol **Redeploy**.

## Cara Pemulihan Data (*Disaster Recovery*)
- Data aplikasi sepenuhnya tersimpan di dalam proyek Postgres Supabase. Fitur _backup_ harian diaktifkan dari pihak Supabase.
- Jika Supabase *error* dan Anda harus pindah ke *server* lain, *export* data CSV atau lakukan `pg_dump` ke *host* yang baru. Lalu ubah nilai Environment Variable di Vercel, _website_ Anda akan langsung menyesuaikan datanya tanpa perlu modifikasi kode lanjutan.

## Skrip Keamanan
Untuk menguji keamanan database terhadap peretas anonim yang tidak memiliki sesi (tervalidasi RLS):
```bash
node --env-file=.env.local scripts/test-rls.js
```
*Hasil normal harus menolak semua operasi SELECT & INSERT.*
