'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const modelSchema = z.object({
  id: z.string().uuid().optional(),
  brand: z.string().min(1, 'Merek tidak boleh kosong'),
  name: z.string().min(1, 'Nama model tidak boleh kosong'),
  ram_gb: z.number().int().positive().nullable(),
  storage_gb: z.number().int().positive().nullable(),
  watchlist: z.boolean().default(false),
})

export async function getModels() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('phone_models')
    .select('*')
    .order('brand', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function saveModel(formData: FormData) {
  const supabase = await createClient()
  
  const id = formData.get('id') as string | null
  const ramStr = formData.get('ram_gb') as string
  const storageStr = formData.get('storage_gb') as string

  const parsed = modelSchema.safeParse({
    id: id || undefined,
    brand: formData.get('brand'),
    name: formData.get('name'),
    ram_gb: ramStr ? parseInt(ramStr, 10) : null,
    storage_gb: storageStr ? parseInt(storageStr, 10) : null,
    watchlist: formData.get('watchlist') === 'true',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data

  let error
  if (payload.id) {
    const { error: updateError } = await supabase
      .from('phone_models')
      .update({
        brand: payload.brand,
        name: payload.name,
        ram_gb: payload.ram_gb,
        storage_gb: payload.storage_gb,
        watchlist: payload.watchlist,
      })
      .eq('id', payload.id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('phone_models')
      .insert({
        brand: payload.brand,
        name: payload.name,
        ram_gb: payload.ram_gb,
        storage_gb: payload.storage_gb,
        watchlist: payload.watchlist,
      })
    error = insertError
  }

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: 'Model kembar (merek, nama, RAM, dan storage yang sama) sudah ada.' }
    }
    return { error: error.message }
  }
  
  revalidatePath('/models')
  return { success: true }
}

export async function toggleModelWatchlist(id: string, watchlist: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('phone_models')
    .update({ watchlist })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/models')
  return { success: true }
}
