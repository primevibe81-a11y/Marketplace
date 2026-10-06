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
}
