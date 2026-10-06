import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { GeminiProvider } from '@/server/ai/gemini-provider'
import { summarize, filterOutliers } from '@/lib/pricing'

export async function GET(request: Request) {
  // 1. Validate CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // SEMENTARA: Fitur estimasi AI dikunci karena masalah kuota provider
  return NextResponse.json({ success: true, message: 'Cron bypassed (AI estimation locked)' })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for cron jobs
    {
      cookies: {
        getAll() { return [] },
        setAll(cookies: any) {}
      }
    }
  )

  // 2. Fetch all models in watchlist
  const { data: models, error } = await supabase
    .from('phone_models')
    .select('*')
    .eq('watchlist', true)
    
  if (error || !models) {
    return NextResponse.json({ error: 'Failed to fetch watchlist models' }, { status: 500 })
  }
  
  if (models.length === 0) {
    return NextResponse.json({ message: 'No models in watchlist' })
  }

  const results = []

  // 3. Process each model sequentially to avoid rate limits
  for (const model of models) {
    try {
      // Create run record
      const { data: run } = await supabase.from('estimate_runs').insert({
        owner_id: model.owner_id,
        model_id: model.id,
        grade: 'normal',
        status: 'running'
      }).select().single()

      if (!run) continue

      // Fetch AI Estimate (Google Search Grounding)
      const query = `${model.brand} ${model.name} ${model.ram_gb || ''}GB ${model.storage_gb || ''}GB`
      const provider = new GeminiProvider(process.env.GEMINI_API_KEY!, process.env.GEMINI_MODEL || "gemini-flash-latest")
      const rawRes = await provider.estimate(model.brand, model.name, model.ram_gb, model.storage_gb, 'normal')
      
      const prices = rawRes.listings.map((l: any) => l.price_idr)
      const validPrices = filterOutliers(prices)
      
      // Calculate distinct source domains
      const domains = new Set(rawRes.listings.map((l: any) => l.source_domain))
      const stats = summarize(validPrices, domains.size)

      // Save market_estimates
      await supabase.from('market_estimates').insert({
        owner_id: model.owner_id,
        model_id: model.id,
        grade: 'normal',
        method: 'ai',
        price_p25: stats.p25,
        price_p50: stats.median,
        price_p75: stats.p75,
        sample_count: stats.sample_count,
        confidence: stats.confidence,
        sources_urls: rawRes.listings.map((l: any) => l.url).filter(Boolean).join('\n'),
        raw_response: JSON.stringify(rawRes)
      })

      // Update run status
      await supabase.from('estimate_runs')
        .update({ status: 'success' })
        .eq('id', run.id)
        
      results.push({ model: model.name, status: 'success' })
      
    } catch (err: any) {
      console.error(`Cron error for model ${model.id}:`, err)
      results.push({ model: model.name, status: 'failed', error: err.message })
    }
    
    // Slight delay to respect API limits
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return NextResponse.json({ message: 'Cron finished', results })
}
