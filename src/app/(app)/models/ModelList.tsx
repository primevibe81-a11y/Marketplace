'use client'

import { useActionState, useState } from 'react'
import { saveModel, toggleModelWatchlist } from '@/server/models'
import { Button } from '@/components/ui/button'

type PhoneModel = {
  id: string
  brand: string
  name: string
  ram_gb: number | null
  storage_gb: number | null
  watchlist: boolean
}

type FormState = {
  error?: string
  success: boolean
}

const initialState: FormState = { success: false }

export function ModelList({ initialModels }: { initialModels: PhoneModel[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const res = await saveModel(formData)
    if (res.success) {
      setEditingId(null)
      return { success: true }
    }
    return res as FormState
  }, initialState)

  // Unique brands for autocomplete
  const uniqueBrands = Array.from(new Set(initialModels.map(m => m.brand))).sort()

  const filteredModels = initialModels.filter(m => 
    m.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <datalist id="brands">
        {uniqueBrands.map(b => <option key={b} value={b} />)}
      </datalist>

      {/* Form Tambah / Edit */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <h2 className="font-semibold mb-4">{editingId ? 'Edit Model' : 'Tambah Model Baru'}</h2>
        <form action={formAction} className="space-y-4">
          {editingId && <input type="hidden" name="id" value={editingId} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Merek</label>
              <input 
                name="brand" 
                required 
                list="brands"
                autoComplete="off"
                defaultValue={editingId ? initialModels.find(m => m.id === editingId)?.brand : ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Model</label>
              <input 
                name="name" 
                required 
                defaultValue={editingId ? initialModels.find(m => m.id === editingId)?.name : ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">RAM (GB)</label>
              <input 
                type="number"
                name="ram_gb"
                min="1"
                defaultValue={editingId ? (initialModels.find(m => m.id === editingId)?.ram_gb || '') : ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Storage (GB)</label>
              <input 
                type="number"
                name="storage_gb" 
                min="1"
                defaultValue={editingId ? (initialModels.find(m => m.id === editingId)?.storage_gb || '') : ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="watchlist" 
              name="watchlist" 
              value="true"
              defaultChecked={editingId ? initialModels.find(m => m.id === editingId)?.watchlist : false}
            />
            <label htmlFor="watchlist" className="text-sm">Masuk Watchlist (Pantau Harga)</label>
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

      {/* Cari Model */}
      <div>
        <input 
          type="text" 
          placeholder="Cari merek atau nama model..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Daftar Model */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredModels.map(model => (
          <div key={model.id} className="rounded-lg border p-4 bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{model.brand} {model.name}</h3>
                {model.watchlist && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    Watchlist
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {model.ram_gb ? `${model.ram_gb}GB` : 'RAM ?'} / {model.storage_gb ? `${model.storage_gb}GB` : 'Storage ?'}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setEditingId(model.id)}>Edit</Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  await toggleModelWatchlist(model.id, !model.watchlist)
                }}
              >
                {model.watchlist ? 'Hapus Pantau' : 'Pantau'}
              </Button>
            </div>
          </div>
        ))}
        {filteredModels.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">Tidak ada data model.</p>
        )}
      </div>
    </div>
  )
}
