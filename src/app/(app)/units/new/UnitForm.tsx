'use client'

import { useActionState, useState } from 'react'
import { createUnit } from '@/server/units'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PhoneModel = {
  id: string
  brand: string
  name: string
  ram_gb: number | null
  storage_gb: number | null
}

type FormState = {
  error?: string
  success: boolean
  unit?: { id: string; code: string }
}

const initialState: FormState = { success: false }

export function UnitForm({ models }: { models: PhoneModel[] }) {
  const router = useRouter()
  
  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const res = await createUnit(formData)
    if (res.success) {
      router.push('/units')
      return { success: true, unit: res.unit }
    }
    return res as FormState
  }, initialState)

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>Form Registrasi Unit</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2 text-primary">Informasi Produk</h3>
            
            <div className="space-y-2">
              <Label htmlFor="model_id">Model HP</Label>
              <select name="model_id" id="model_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Pilih model...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.brand} {m.name} {m.ram_gb ? `(${m.ram_gb}/${m.storage_gb})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2 text-primary">Sumber Barang</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_type">Sumber</Label>
                <select name="source_type" id="source_type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="lelang_gadai">Lelang/Gadai</option>
                  <option value="beli_lain">Beli dari tempat lain</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_ref">Referensi (Opsional)</Label>
                <Input type="text" id="source_ref" name="source_ref" placeholder="No. Lot / Nota" />
              </div>
            </div>
          </div>

          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {state.error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Menyimpan...' : 'Simpan Unit'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
