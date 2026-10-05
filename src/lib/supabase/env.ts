/**
 * Kredensial publik Supabase. Referensi `process.env.NEXT_PUBLIC_*` harus
 * ditulis literal agar Next.js bisa meng-inline-nya ke bundle klien.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi',
    )
  }
  return { url, key }
}
