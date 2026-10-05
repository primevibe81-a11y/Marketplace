'use client'

import { useActionState, useState } from 'react'
import { createUnit } from '@/server/units'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/format'

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
  const [acquiredPriceStr, setAcquiredPriceStr] = useState('')
  const [extraCostStr, setExtraCostStr] = useState('')
  
  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const res = await createUnit(formData)
    if (res.success) {
      router.push('/units') // or /units/${res.unit.id}
      return { success: true, unit: res.unit }
    }
    return res as FormState
  }, initialState)

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <form action={formAction} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Informasi Produk</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Model HP</label>
            <select name="model_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">-- Pilih Model --</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.brand} {m.name} {m.ram_gb ? `(${m.ram_gb}/${m.storage_gb})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Kondisi (Grade)</label>
            <select name="grade" defaultValue="normal" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="mulus">Mulus</option>
              <option value="normal">Normal</option>
              <option value="minus">Minus</option>
              <option value="rusak">Rusak</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Identitas Unik</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">IMEI 1 (Wajib, 15 digit)</label>
              <input 
                name="imei1" 
                required 
                placeholder="Misal: 490154203237518"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IMEI 2 (Opsional)</label>
              <input 
                name="imei2" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Perolehan & Harga</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asal Barang</label>
              <select name="source_type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="lelang_gadai">Lelang/Gadai</option>
                <option value="beli_lain">Beli Putus</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">No. Ref Lot/Dokumen (Opsional)</label>
              <input 
                name="source_ref" 
                placeholder="Tanpa data pribadi nasabah"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Perolehan</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
                <input 
                  name="acquired_price" 
                  required 
                  value={acquiredPriceStr}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    if (raw) {
                      setAcquiredPriceStr(formatRupiah(parseInt(raw, 10))?.replace('Rp ', '') || '')
                    } else {
                      setAcquiredPriceStr('')
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Biaya Ekstra/Servis (Opsional)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
                <input 
                  name="extra_cost" 
                  value={extraCostStr}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    if (raw) {
                      setExtraCostStr(formatRupiah(parseInt(raw, 10))?.replace('Rp ', '') || '')
                    } else {
                      setExtraCostStr('')
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        {state.error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
            {state.error}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Registrasi Unit'}
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.push('/units')} disabled={isPending}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}
