# Pemantau Harga & Stok HP Second

Aplikasi web pribadi (PWA) untuk mengelola stok HP second, mencatat tawaran beli dari konter, dan membandingkannya dengan harga pasaran.

## Teknologi

- Next.js (App Router) dengan TypeScript strict
- Tailwind CSS & shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Gemini API (dengan grounding Google Search)
- Vitest untuk pengujian unit

## Cara Menjalankan

1. Salin `.env.example` ke `.env.local` dan isi dengan nilai yang sesuai.
2. Jalankan `pnpm install` untuk menginstal dependensi.
3. Jalankan `pnpm dev` untuk memulai development server.

## Pengujian

- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`
