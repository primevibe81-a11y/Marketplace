'use client'

import { useActionState } from 'react'
import { updateSettings } from '@/server/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'

type FormState = {
  error?: string
  success?: boolean
}

const initialState: FormState = {}

export function SettingsForm({ initialData }: { initialData: any }) {
  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData) => {
    const res = await updateSettings(formData)
    return res as FormState
  }, initialState)

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="margin_target" value={initialData.margin_target || 12} />
      {state.success && (
        <div className="bg-green-100 text-green-800 p-3 rounded-md border border-green-200">
          Pengaturan berhasil disimpan!
        </div>
      )}
      {state.error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md border border-red-200">
          Error: {state.error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* A. Margin & Diskon */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Target & Diskon</h2>
          
          <div className="space-y-2">
            <Label htmlFor="fast_sale_threshold">Ambang Diskon Jual Cepat (%)</Label>
            <div className="relative">
              <Input type="number" id="fast_sale_threshold" name="fast_sale_threshold" defaultValue={initialData.fast_sale_threshold} min="0" max="100" required className="pl-3 pr-8" />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Jika tawaran konter selisihnya dari pasaran lebih kecil dari persentase ini, sistem menyarankan jual ke konter.</p>
          </div>
        </div>

        {/* B. Usia & Waktu */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Peringatan Umur Data</h2>
          
          <div className="space-y-2">
            <Label htmlFor="stock_age_days">Batas Usia Stok Mati (Hari)</Label>
            <div className="relative">
              <Input type="number" id="stock_age_days" name="stock_age_days" defaultValue={initialData.stock_age_days} min="1" required className="pl-3 pr-12" />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">Hari</span>
            </div>
            <p className="text-xs text-muted-foreground">Stok yang ditahan lebih dari angka ini akan ditandai peringatan merah di Dasbor.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stale_offer_days">Batas Usia Tawaran Usang (Hari)</Label>
            <div className="relative">
              <Input type="number" id="stale_offer_days" name="stale_offer_days" defaultValue={initialData.stale_offer_days} min="1" required className="pl-3 pr-12" />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">Hari</span>
            </div>
            <p className="text-xs text-muted-foreground">Tawaran konter yang lebih lama dari angka ini dianggap sudah basi.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimate_ttl_days">Kedaluwarsa Estimasi AI (Hari)</Label>
            <div className="relative">
              <Input type="number" id="estimate_ttl_days" name="estimate_ttl_days" defaultValue={initialData.estimate_ttl_days} min="1" required className="pl-3 pr-12" />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">Hari</span>
            </div>
            <p className="text-xs text-muted-foreground">Jeda waktu sebelum sistem AI mengecek harga pasaran online lagi.</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto gap-2">
          <Save className="w-4 h-4" /> {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </form>
  )
}
