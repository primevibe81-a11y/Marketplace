'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { parseRupiah } from '@/lib/format'

const offerSchema = z.object({
  model_id: z.string().uuid(),
  unit_id: z.string().uuid().optional(),
  shop_id: z.string().uuid('Pilih konter'),
  grade: z.enum(['mulus', 'normal', 'minus', 'rusak']),
  price: z.string().transform(val => parseRupiah(val)).refine(val => val !== null && val > 0, { message: 'Harga tawaran harus lebih dari 0' }),
  note: z.string().optional(),
})

export async function getOffersByUnit(unitId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offers')
    .select('*, shops(name)')
    .eq('unit_id', unitId)
    .order('offered_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function saveOffer(formData: FormData) {
  const supabase = await createClient()

  const parsed = offerSchema.safeParse({
    model_id: formData.get('model_id'),
    unit_id: formData.get('unit_id') || undefined,
    shop_id: formData.get('shop_id'),
    grade: formData.get('grade'),
    price: formData.get('price'),
    note: formData.get('note') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data

  const { error } = await supabase
    .from('offers')
    .insert({
      model_id: payload.model_id,
      unit_id: payload.unit_id,
      shop_id: payload.shop_id,
      grade: payload.grade,
      price: payload.price,
      note: payload.note,
      status: 'open',
    })

  if (error) {
    return { error: error.message }
  }

  if (payload.unit_id) {
    revalidatePath(`/units/${payload.unit_id}`)
  }
  revalidatePath('/compare')
  return { success: true }
}
