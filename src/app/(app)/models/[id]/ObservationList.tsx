'use client'

import { useActionState, useState } from 'react'
import { saveObservation } from '@/server/observations'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Observation = {
  id: string
  price: number
  grade: string
  channel: string
  listing_state: string
  url: string | null
  note: string | null
  observed_at: string
}

type FormState = {
  error?: string
  success: boolean
}

const initialState: FormState = { success: false }

export function ObservationList({ 
  modelId, 
  observations,
  currentGrade = 'normal'
}: { 
  modelId: string, 
  observations: Observation[],
  currentGrade?: string
}) {
  const [priceStr, setPriceStr] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    // Inject grade implicitly since it's hidden from UI
    formData.set('grade', 'normal')
    const res = await saveObservation(formData)
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
        <h2 className="font-semibold text-lg">Pengamatan Manual (Pasaran)</h2>
        {!isFormOpen && (
          <Button size="sm" onClick={() => setIsFormOpen(true)}>+ Tambah Pengamatan</Button>
        )}
      </div>

      {isFormOpen && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="model_id" value={modelId} />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform / Kanal</Label>
                <select name="channel" defaultValue="fb_marketplace" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="fb_marketplace">FB Marketplace</option>
                  <option value="olx">OLX</option>
                  <option value="tokopedia">Tokopedia</option>
                  <option value="shopee">Shopee</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Harga Listing</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
                  <Input 
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
                    className="pl-8" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status Listing</Label>
                <select name="listing_state" defaultValue="active" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">Aktif (Masih Ada)</option>
                  <option value="sold">Terjual</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tautan URL (Opsional)</Label>
              <Input 
                name="url" 
                type="url"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan (Opsional)</Label>
              <Input 
                name="note" 
              />
            </div>

            {state.error && <p className="text-sm text-destructive font-medium">{state.error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>Simpan Pengamatan</Button>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-md border">
        {observations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Belum ada pengamatan pasaran.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 text-left font-medium">Tanggal</th>
                <th className="p-3 text-left font-medium">Kanal & Detail</th>
                <th className="p-3 text-right font-medium">Harga</th>
              </tr>
            </thead>
            <tbody>
              {observations.map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    {new Date(o.observed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <div className="text-[10px] uppercase font-semibold mt-1">
                      {o.listing_state === 'active' ? (
                        <span className="text-green-600 bg-green-100 px-1 py-0.5 rounded">Aktif</span>
                      ) : (
                        <span className="text-gray-600 bg-gray-100 px-1 py-0.5 rounded">Terjual</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium flex gap-2 items-center">
                      <span className="uppercase text-xs tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        {o.channel.replace('_', ' ')}
                      </span>
                      {o.url && (
                        <a href={o.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          Tautan ↗
                        </a>
                      )}
                    </div>
                    {o.note && <div className="text-xs text-muted-foreground mt-1">{o.note}</div>}
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
