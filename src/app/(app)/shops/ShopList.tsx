'use client'

import { useActionState, useState } from 'react'
import { saveShop, toggleShopActive } from '@/server/shops'
import { Button } from '@/components/ui/button'

type Shop = {
  id: string
  name: string
  is_active: boolean
  note: string | null
}

type FormState = {
  error?: string
  success: boolean
}

const initialState: FormState = { success: false }

export function ShopList({ initialShops }: { initialShops: Shop[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const res = await saveShop(formData)
    if (res.success) {
      setEditingId(null)
      return { success: true }
    }
    return res as FormState
  }, initialState)

  return (
    <div className="space-y-6">
      {/* Form Tambah / Edit */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <h2 className="font-semibold mb-4">{editingId ? 'Edit Konter' : 'Tambah Konter Baru'}</h2>
        <form action={formAction} className="space-y-4">
          {editingId && <input type="hidden" name="id" value={editingId} />}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Konter</label>
            <input 
              name="name" 
              required 
              defaultValue={editingId ? initialShops.find(s => s.id === editingId)?.name : ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan (opsional)</label>
            <input 
              name="note" 
              defaultValue={editingId ? (initialShops.find(s => s.id === editingId)?.note || '') : ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="is_active" 
              name="is_active" 
              value="true"
              defaultChecked={editingId ? initialShops.find(s => s.id === editingId)?.is_active : true}
            />
            <label htmlFor="is_active" className="text-sm">Aktif</label>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>Simpan</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Batal</Button>
            )}
          </div>
        </form>
      </div>

      {/* Daftar Konter */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialShops.map(shop => (
          <div key={shop.id} className={`rounded-lg border p-4 flex flex-col justify-between ${!shop.is_active ? 'opacity-60 bg-muted/50' : 'bg-card'}`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{shop.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${shop.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {shop.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              {shop.note && <p className="text-sm text-muted-foreground mb-4">{shop.note}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setEditingId(shop.id)}>Edit</Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  await toggleShopActive(shop.id, !shop.is_active)
                }}
              >
                {shop.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </div>
          </div>
        ))}
        {initialShops.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">Belum ada data konter.</p>
        )}
      </div>
    </div>
  )
}
