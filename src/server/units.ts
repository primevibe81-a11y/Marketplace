'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { parseRupiah } from '@/lib/format'

const unitSchema = z.object({
  model_id: z.string().uuid('Model harus dipilih'),
  grade: z.enum(['mulus', 'normal', 'minus', 'rusak']),
  source_type: z.enum(['lelang_gadai', 'beli_lain', 'lainnya']),
  source_ref: z.string().optional(),
  acquired_price: z.string().transform(val => parseRupiah(val)).refine(val => val !== null && val >= 0, { message: 'Harga perolehan tidak valid' }),
  extra_cost: z.string().transform(val => parseRupiah(val) || 0).refine(val => val !== null && val >= 0, { message: 'Biaya ekstra tidak valid' }),
})

export async function createUnit(formData: FormData) {
  const supabase = await createClient()
  
  const parsed = unitSchema.safeParse({
    model_id: formData.get('model_id'),
    grade: formData.get('grade') || 'normal',
    source_type: formData.get('source_type'),
    source_ref: formData.get('source_ref') || undefined,
    acquired_price: formData.get('acquired_price'),
    extra_cost: formData.get('extra_cost') || '0',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data

  const { data, error } = await supabase.from('units').insert({
    model_id: payload.model_id,
    grade: payload.grade,
    source_type: payload.source_type,
    source_ref: payload.source_ref || null,
    acquired_price: payload.acquired_price,
    extra_cost: payload.extra_cost,
  }).select('id, code').single()

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/units')
  revalidatePath('/dashboard')
  return { success: true, unit: data as { id: string, code: string } }
}

const sellSchema = z.object({
  unit_id: z.string().uuid('ID Unit tidak valid'),
  sold_price: z.string().transform(val => parseRupiah(val)).refine(val => val !== null && val > 0, { message: 'Harga jual tidak valid' }),
  sold_channel: z.enum(['fb_marketplace', 'konter', 'lainnya']),
  sold_to_shop_id: z.string().uuid().optional().or(z.literal('')),
})

export async function sellUnit(formData: FormData) {
  const supabase = await createClient()
  
  const parsed = sellSchema.safeParse({
    unit_id: formData.get('unit_id'),
    sold_price: formData.get('sold_price'),
    sold_channel: formData.get('sold_channel'),
    sold_to_shop_id: formData.get('sold_to_shop_id') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data

  // Pastikan ID konter benar-benar null jika bukan ke konter
  const shopId = payload.sold_channel === 'konter' && payload.sold_to_shop_id ? payload.sold_to_shop_id : null

  const { error } = await supabase
    .from('units')
    .update({
      status: 'sold',
      sold_price: payload.sold_price,
      sold_channel: payload.sold_channel,
      sold_to_shop_id: shopId,
      sold_at: new Date().toISOString()
    })
    .eq('id', payload.unit_id)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/units')
  revalidatePath('/dashboard')
  revalidatePath(`/units/${payload.unit_id}`)
  return { success: true }
}

export async function getUnits(search?: string, status?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('units')
    .select(`
      *,
      phone_models (*)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    const term = `%${search}%`
    query = query.ilike('code', term)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return data
}

export async function getUnitDetail(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('units')
    .select(`
      *,
      phone_models (*)
    `)
    .eq('id', id)
    .single()

  if (error || !data) throw new Error(error?.message || 'Unit tidak ditemukan')

  return data
}
