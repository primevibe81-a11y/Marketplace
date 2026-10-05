import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GeminiProvider } from '@/server/ai/gemini-provider'
import { filterOutliers, summarize } from '@/lib/pricing'
import { z } from 'zod'

const requestSchema = z.object({
  modelId: z.string().uuid(),
  grade: z.string(),
  force: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Cek sesi Supabase; tanpa sesi → 401.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { modelId, grade, force } = parsed.data

    // Ambil detail model
    const { data: model } = await supabase.from('phone_models').select('*').eq('id', modelId).single()
    if (!model) {
      return NextResponse.json({ error: 'Model tidak ditemukan' }, { status: 404 })
    }

    // 2. Cek Cache
    // Ambil TTL dari settings
    const { data: settings } = await supabase.from('settings').select('estimate_ttl_days').single()
    const ttlDays = settings?.estimate_ttl_days || 7

    if (!force) {
      const { data: latestEstimate } = await supabase
        .from('market_estimates')
        .select('*')
        .eq('model_id', modelId)
        .eq('grade', grade)
        .eq('method', 'ai')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()

      if (latestEstimate) {
        const fetchDate = new Date(latestEstimate.fetched_at).getTime()
        const now = new Date().getTime()
        if (now - fetchDate < ttlDays * 24 * 3600 * 1000) {
          // Masih segar, pakai cache
          await supabase.from('estimate_runs').insert({
            model_id: modelId,
            grade,
            status: 'cached'
          })
          return NextResponse.json({ data: latestEstimate, cached: true })
        }
      }
    }

    // 3. Rate Limit (maksimal 20 permintaan/jam)
    const satuJamLalu = new Date(Date.now() - 3600 * 1000).toISOString()
    const { count } = await supabase
      .from('estimate_runs')
      .select('id', { count: 'exact' })
      .gte('started_at', satuJamLalu)
      .not('status', 'eq', 'cached') // Yang dihitung hanya yang benar-benar memanggil AI

    if (count !== null && count >= 20) {
      await supabase.from('estimate_runs').insert({
        model_id: modelId,
        grade,
        status: 'rate_limited'
      })
      return NextResponse.json({ error: 'Rate limit tercapai. Maksimal 20 pencarian per jam.' }, { status: 429 })
    }

    // 4. Panggil provider AI
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tidak dikonfigurasi' }, { status: 500 })
    }

    // Insert run log to record the attempt
    const { data: runRecord } = await supabase.from('estimate_runs').insert({
      model_id: modelId,
      grade,
      status: 'running'
    }).select('id').single()
    const runId = runRecord?.id

    const provider = new GeminiProvider(apiKey, process.env.GEMINI_MODEL || 'gemini-2.5-pro')
    
    let result
    try {
      result = await provider.estimate(model.brand, model.name, model.ram_gb, model.storage_gb, grade)
    } catch (e: unknown) {
      if (runId) {
        await supabase.from('estimate_runs').update({
          status: 'failed',
          error_message: e instanceof Error ? e.message : String(e)
        }).eq('id', runId)
      }
      return NextResponse.json({ error: 'Gagal memanggil AI Provider: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 })
    }

    // 6. Jalankan filterOutliers dan summarize
    // Zod validation for the listings
    const listingSchema = z.object({
      title: z.string(),
      price_idr: z.number(),
      source_domain: z.string(),
      url: z.string().nullable(),
      condition_note: z.string().nullable()
    })
    
    const validListings = result.listings.filter(l => listingSchema.safeParse(l).success)
    const rawPrices = validListings.map(l => l.price_idr)
    const filteredPrices = filterOutliers(rawPrices)
    
    const uniqueSourcesCount = new Set(validListings.map(l => l.source_domain)).size
    const summary = summarize(filteredPrices, uniqueSourcesCount)

    // 7. Ambil sumber dari metadata grounding
    const rawSources = [...result.sources]
    validListings.forEach(l => {
      if (l.url && l.source_domain) {
        rawSources.push({ title: l.title, url: l.url })
      }
    })
    // Deduplicate URLs
    const uniqueSources = Array.from(new Map(rawSources.map(s => [s.url, s])).values())

    // 8. Simpan ke market_estimates
    const estimatePayload = {
      model_id: modelId,
      grade,
      method: 'ai',
      price_p25: summary.p25,
      price_p50: summary.median,
      price_p75: summary.p75,
      sample_count: summary.sample_count,
      confidence: summary.confidence,
      sources_urls: uniqueSources.map(s => s.url).join(', '),
      raw_response: result.rawResponse
    }

    const { data: savedEstimate, error: insertError } = await supabase
      .from('market_estimates')
      .insert(estimatePayload)
      .select('*')
      .single()

    if (runId) {
      await supabase.from('estimate_runs').update({
        status: 'success'
      }).eq('id', runId)
    }

    if (insertError) {
      return NextResponse.json({ error: 'Gagal menyimpan hasil estimasi' }, { status: 500 })
    }

    return NextResponse.json({ data: savedEstimate, cached: false })

  } catch (error: unknown) {
    return NextResponse.json({ 
      error: 'Terjadi kesalahan internal', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
