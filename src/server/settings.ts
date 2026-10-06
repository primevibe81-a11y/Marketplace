'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const settingsSchema = z.object({
  margin_target: z.number().min(0).max(100),
  fast_sale_threshold: z.number().min(0).max(100),
  stale_offer_days: z.number().min(1),
  stock_age_days: z.number().min(1),
  estimate_ttl_days: z.number().min(1),
})

export async function getSettings() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    // Bawaan jika belum pernah diatur
    return {
      margin_target: 12,
      fast_sale_threshold: 15,
      stale_offer_days: 14,
      stock_age_days: 5,
      estimate_ttl_days: 7,
    }
  }

  return {
    margin_target: data.margin_target * 100,
    fast_sale_threshold: data.fast_sale_threshold * 100,
    stale_offer_days: data.stale_offer_days,
    stock_age_days: data.stock_age_days,
    estimate_ttl_days: data.estimate_ttl_days,
  }
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()

  const parsed = settingsSchema.safeParse({
    margin_target: parseFloat(formData.get('margin_target') as string),
    fast_sale_threshold: parseFloat(formData.get('fast_sale_threshold') as string),
    stale_offer_days: parseInt(formData.get('stale_offer_days') as string, 10),
    stock_age_days: parseInt(formData.get('stock_age_days') as string, 10),
    estimate_ttl_days: parseInt(formData.get('estimate_ttl_days') as string, 10),
  })

  if (!parsed.success) {
    return { error: 'Format data tidak valid', details: parsed.error.issues }
  }

  const payload = {
    margin_target: parsed.data.margin_target / 100,
    fast_sale_threshold: parsed.data.fast_sale_threshold / 100,
    stale_offer_days: parsed.data.stale_offer_days,
    stock_age_days: parsed.data.stock_age_days,
    estimate_ttl_days: parsed.data.estimate_ttl_days,
  }

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) return { error: 'Sesi tidak valid' }

  // upsert
  const { error } = await supabase
    .from('settings')
    .upsert({ owner_id: userData.user.id, ...payload })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout') // Refresh seluruh layout karena berdampak global
  return { success: true }
}
