'use client'

import { useActionState, useState } from 'react'
import { saveOffer } from '@/server/offers'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/format'

type Shop = { id: string, name: string }
type Offer = {
  id: string
  price: number
  grade: string
  status: string
  offered_at: string
  note: string | null
  shops: { name: string }
}

type FormState = {
  error?: string
  success: boolean
}

const initialState: FormState = { success: false }

export function OfferList({ 
  unitId, 
  modelId, 
  unitGrade,
  offers,
  activeShops 
}: { 
  unitId: string, 
  modelId: string, 
  unitGrade: string,
  offers: Offer[],
  activeShops: Shop[]
}) {
  const [priceStr, setPriceStr] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const res = await saveOffer(formData)
    if (res.success) {
      setIsFormOpen(false)
      setPriceStr('')
      return { success: true }
    }
    return res as FormState
  }, initialState)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Riwayat Tawaran</h2>
        {!isFormOpen && (
          <Button size="sm" onClick={() => setIsFormOpen(true)}>+ Tawaran Baru</Button>
        )}
      </div>

      {isFormOpen && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="unit_id" value={unitId} />
            <input type="hidden" name="model_id" value={modelId} />
            <input type="hidden" name="grade" value={unitGrade} />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Konter</label>
                <select name="shop_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">-- Pilih Konter --</option>
                  {activeShops.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Tawaran</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
                  <input 
                    name="price" 
                    required 
                    value={priceStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      if (raw) {
                        setPriceStr(formatRupiah(parseInt(raw, 10))?.replace('Rp ', '') || '')
                      } else {
                        setPriceStr('')
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm" 
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Tambahan (Opsional)</label>
              <input 
                name="note" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>

            {state.error && <p className="text-sm text-destructive font-medium">{state.error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>Simpan Tawaran</Button>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-md border">
        {offers.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Belum ada tawaran.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 text-left font-medium">Tanggal</th>
                <th className="p-3 text-left font-medium">Konter</th>
                <th className="p-3 text-right font-medium">Harga</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    {new Date(o.offered_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <div className="text-[10px] text-muted-foreground">{new Date(o.offered_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{o.shops?.name}</span>
                    {o.note && <div className="text-xs text-muted-foreground">{o.note}</div>}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatRupiah(o.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
