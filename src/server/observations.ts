'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { parseRupiah } from '@/lib/format'

const observationSchema = z.object({
  model_id: z.string().uuid(),
  grade: z.enum(['mulus', 'normal', 'minus', 'rusak']),
  channel: z.enum(['fb_marketplace', 'olx', 'tokopedia', 'shopee', 'lainnya']),
  price: z.string().transform(val => parseRupiah(val)).refine(val => val !== null && val > 0, { message: 'Harga pasaran harus lebih dari 0' }),
  listing_state: z.enum(['active', 'sold']),
  url: z.string().url('URL tidak valid').or(z.literal('')),
  note: z.string().optional(),
})

export async function getModelDetail(modelId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('phone_models')
    .select('*')
    .eq('id', modelId)
    .single()

  if (error || !data) throw new Error(error?.message || 'Model tidak ditemukan')
  return data
}

export async function getObservations(modelId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('market_observations')
    .select('*')
    .eq('model_id', modelId)
    .order('observed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function saveObservation(formData: FormData) {
  const supabase = await createClient()

  const parsed = observationSchema.safeParse({
    model_id: formData.get('model_id'),
    grade: formData.get('grade'),
    channel: formData.get('channel'),
    price: formData.get('price'),
    listing_state: formData.get('listing_state'),
    url: formData.get('url') || '',
    note: formData.get('note') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data

  const { error } = await supabase
    .from('market_observations')
    .insert({
      model_id: payload.model_id,
      grade: payload.grade,
      channel: payload.channel,
      price: payload.price,
      listing_state: payload.listing_state,
      url: payload.url || null,
      note: payload.note,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/models/${payload.model_id}`)
  revalidatePath('/compare')
  return { success: true }
}
