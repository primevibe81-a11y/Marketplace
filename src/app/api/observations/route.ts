import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Validasi format JSON yang dikirim ekstensi
const observationsSchema = z.object({
  model_id: z.string().uuid(),
  observations: z.array(z.object({
    price: z.number().min(10000),
    url: z.string().url().optional().nullable(),
    note: z.string().optional().nullable(),
  })).min(1).max(50)
})

export async function POST(request: Request) {
  try {
    // 1. Verifikasi keamanan (menggunakan rahasia yang sama dengan Cron)
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body request
    const body = await request.json()
    const parsed = observationsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Format data tidak valid', details: parsed.error.issues }, { status: 400 })
    }

    const { model_id, observations } = parsed.data

    // 3. Gunakan Service Role Key untuk operasi di balik layar (tanpa sesi login browser)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Cari ID pemilik tunggal (Superadmin) dari tabel settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('owner_id')
      .limit(1)
      .single()

    if (settingsError || !settingsData) {
      return NextResponse.json({ error: 'Gagal menemukan ID pemilik aplikasi' }, { status: 500 })
    }

    const owner_id = settingsData.owner_id

    // 5. Susun data untuk dimasukkan (Otomatis ditandai sebagai FB Marketplace dan normal)
    const payload = observations.map(obs => ({
      owner_id,
      model_id,
      grade: 'normal',
      channel: 'fb_marketplace',
      price: obs.price,
      listing_state: 'active',
      url: obs.url || null,
      note: obs.note || 'Dari Ekstensi Scraper',
      observed_at: new Date().toISOString()
    }))

    // 6. Simpan secara massal (bulk insert)
    const { error: insertError } = await supabase
      .from('market_observations')
      .insert(payload)

    if (insertError) {
      return NextResponse.json({ error: 'Gagal menyimpan ke database', details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${payload.length} pengamatan harga FB berhasil ditambahkan` 
    })

  } catch (err: any) {
    return NextResponse.json({ error: 'Kesalahan internal server', message: err?.message }, { status: 500 })
  }
}
