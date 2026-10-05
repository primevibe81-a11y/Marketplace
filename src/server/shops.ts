'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const shopSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nama konter tidak boleh kosong'),
  note: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function getShops() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getActiveShops() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function saveShop(formData: FormData) {
  const supabase = await createClient()
  
  const id = formData.get('id') as string | null
  const parsed = shopSchema.safeParse({
    id: id || undefined,
    name: formData.get('name'),
    note: formData.get('note') || '',
    is_active: formData.get('is_active') === 'true',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data

  let error
  if (payload.id) {
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        name: payload.name,
        note: payload.note,
        is_active: payload.is_active,
      })
      .eq('id', payload.id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('shops')
      .insert({
        name: payload.name,
        note: payload.note,
        is_active: payload.is_active,
      })
    error = insertError
  }

  if (error) return { error: error.message }
  
  revalidatePath('/shops')
  return { success: true }
}

export async function toggleShopActive(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shops')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/shops')
  return { success: true }
}
