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
  shops: { name: string } | any
}

type FormState = {
  error?: string
  success: boolean
}

const initialState: FormState = { success: false }

export function OfferList({ 
  modelId, 
  offers,
  activeShops 
}: { 
  modelId: string, 
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
        <h2 className="text-lg font-semibold">Tawaran Konter (Terbaru)</h2>
        <Button size="sm" onClick={() => setIsFormOpen(!isFormOpen)} variant={isFormOpen ? "outline" : "default"}>
          {isFormOpen ? 'Batal' : 'Tambah Tawaran'}
        </Button>
      </div>

      {isFormOpen && (
        <form action={formAction} className="p-4 bg-muted/50 rounded-lg space-y-4 border">
          <input type="hidden" name="model_id" value={modelId} />
          <input type="hidden" name="grade" value="normal" />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Konter</label>
              <select name="shop_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Pilih Konter...</option>
                {activeShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Tawaran</label>
              <input 
                name="price" 
                required 
                value={priceStr}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^\d]/g, '')
                  if (val) {
                    val = parseInt(val, 10).toLocaleString('id-ID')
                  }
                  setPriceStr(val)
                }}
                placeholder="Contoh: 1.500.000" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan (Opsional)</label>
            <input name="note" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>

          {state.error && <p className="text-sm text-destructive font-medium">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            Simpan Tawaran
          </Button>
        </form>
      )}

      {offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada tawaran dicatat.</p>
      ) : (
        <div className="space-y-2">
          {offers.map(offer => (
            <div key={offer.id} className="flex justify-between items-center p-3 rounded-lg border bg-card">
              <div>
                <div className="font-medium">{(offer.shops as any)?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(offer.offered_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {offer.note ? ' - ' + offer.note : ''}
                </div>
              </div>
              <div className="font-bold text-green-600 dark:text-green-400">
                {formatRupiah(offer.price)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
