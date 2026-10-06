'use client'

import { useActionState, useState } from 'react'
import { sellUnit } from '@/server/units'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatRupiah } from '@/lib/format'
import { CheckCircle2 } from 'lucide-react'

type FormState = {
  error?: string
  success: boolean
}

const initialState: FormState = { success: false }

export function SellUnitDialog({ unitId, activeShops }: { unitId: string, activeShops: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [priceStr, setPriceStr] = useState('')
  const [channel, setChannel] = useState('konter')

  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const res = await sellUnit(formData)
    if (res.success) {
      setIsOpen(false)
      return { success: true }
    }
    return res as FormState
  }, initialState)

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2">
        <CheckCircle2 className="w-4 h-4" /> Tandai Terjual
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl border shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Checkout / Jual Unit</h2>
        </div>
        <form action={formAction} className="p-4 space-y-4">
          <input type="hidden" name="unit_id" value={unitId} />
          
          <div className="space-y-2">
            <Label>Jalur Penjualan</Label>
            <select 
              name="sold_channel" 
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="konter">Toko / Konter</option>
              <option value="fb_marketplace">FB Marketplace (Eceran)</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          {channel === 'konter' && (
            <div className="space-y-2">
              <Label>Pilih Konter</Label>
              <select 
                name="sold_to_shop_id" 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih Konter...</option>
                {activeShops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Harga Terjual (Rp)</Label>
            <Input 
              name="sold_price" 
              required 
              value={priceStr}
              placeholder="Contoh: 2.500.000"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                if (raw) {
                  setPriceStr(formatRupiah(parseInt(raw, 10))?.replace('Rp ', '') || '')
                } else {
                  setPriceStr('')
                }
              }}
            />
          </div>

          {state.error && <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">{state.error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              {isPending ? 'Menyimpan...' : 'Konfirmasi Terjual'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
