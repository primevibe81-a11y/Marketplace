'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isValidImei, normalizeImei, maskImei } from '@/lib/imei'
import { parseRupiah } from '@/lib/format'

const unitSchema = z.object({
  model_id: z.string().uuid('Model harus dipilih'),
  grade: z.enum(['mulus', 'normal', 'minus', 'rusak']),
  source_type: z.enum(['lelang_gadai', 'beli_lain', 'lainnya']),
  source_ref: z.string().optional(),
  acquired_price: z.string().transform(val => parseRupiah(val)).refine(val => val !== null && val >= 0, { message: 'Harga perolehan tidak valid' }),
  extra_cost: z.string().transform(val => parseRupiah(val) || 0).refine(val => val !== null && val >= 0, { message: 'Biaya ekstra tidak valid' }),
  imei1: z.string().min(1, 'IMEI 1 wajib diisi').transform(normalizeImei),
  imei2: z.string().transform(normalizeImei).optional().refine(val => !val || val !== '', { message: 'IMEI 2 kosong' }),
  serial: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!isValidImei(data.imei1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imei1'],
      message: 'IMEI 1 tidak valid',
    })
  }
  if (data.imei2 && !isValidImei(data.imei2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imei2'],
      message: 'IMEI 2 tidak valid',
    })
  }
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
    imei1: formData.get('imei1'),
    imei2: formData.get('imei2') || undefined,
    serial: formData.get('serial') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data

  const { data, error } = await supabase.rpc('create_unit_with_identifiers', {
    p_model_id: payload.model_id,
    p_grade: payload.grade,
    p_source_type: payload.source_type,
    p_source_ref: payload.source_ref || null,
    p_acquired_price: payload.acquired_price,
    p_extra_cost: payload.extra_cost,
    p_imei1: payload.imei1,
    p_imei2: payload.imei2 || null,
    p_serial: payload.serial || null,
  })

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/units')
  return { success: true, unit: data as { id: string, code: string } }
}

export async function getUnits(search?: string, status?: string) {
  const supabase = await createClient()
  
  let unitIdsToInclude: string[] | null = null

  if (search) {
    const term = `%${search}%`
    
    // Find units matching code
    const { data: codeMatches } = await supabase
      .from('units')
      .select('id')
      .ilike('code', term)

    // Find units matching identifiers (IMEI 4+ digits)
    const { data: identMatches } = await supabase
      .from('unit_identifiers')
      .select('unit_id')
      .ilike('value', term)

    const ids = new Set<string>()
    codeMatches?.forEach(u => ids.add(u.id))
    identMatches?.forEach(i => ids.add(i.unit_id))
    
    unitIdsToInclude = Array.from(ids)
    
    // If search yielded no IDs, we can return empty early
    if (unitIdsToInclude.length === 0) {
      return []
    }
  }

  let query = supabase
    .from('units')
    .select(`
      *,
      phone_models (*),
      unit_identifiers (kind, value)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (unitIdsToInclude) {
    query = query.in('id', unitIdsToInclude)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Mask the identifiers before sending to client
  const maskedData = data.map(unit => ({
    ...unit,
    unit_identifiers: unit.unit_identifiers.map((ident: { kind: string; value: string }) => ({
      kind: ident.kind,
      value: maskImei(ident.value)
    }))
  }))

  return maskedData
}

export async function getUnitDetail(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('units')
    .select(`
      *,
      phone_models (*),
      unit_identifiers (kind, value)
    `)
    .eq('id', id)
    .single()

  if (error || !data) throw new Error(error?.message || 'Unit tidak ditemukan')

  // Mask the identifiers
  const maskedData = {
    ...data,
    unit_identifiers: data.unit_identifiers.map((ident: { kind: string; value: string }) => ({
      kind: ident.kind,
      value: maskImei(ident.value)
    }))
  }

  return maskedData
}

export async function getFullIdentifiers(unitId: string) {
  // Dipanggil lewat server action dari Client Component saat "Tampilkan" diklik.
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('unit_identifiers')
    .select('kind, value')
    .eq('unit_id', unitId)

  if (error) return { error: error.message }
  return { data }
}
