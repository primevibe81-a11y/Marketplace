'use client'

import { useActionState, useState } from 'react'
import { saveModel, toggleModelWatchlist } from '@/server/models'
import { Button } from '@/components/ui/button'
import { Star, AlertTriangle } from 'lucide-react'
import { formatRupiah } from '@/lib/format'
import Link from 'next/link'

type PhoneModel = {
  id: string
  brand: string
  name: string
  ram_gb: number | null
  storage_gb: number | null
  watchlist: boolean
  current_price?: number | null
  taufik_price?: number | null
}

type FormState = {
  error?: string
  success: boolean
}

const initialState: FormState = { success: false }

export function ModelList({ initialModels }: { initialModels: PhoneModel[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [brandFilter, setBrandFilter] = useState('all')
  const [priceStatusFilter, setPriceStatusFilter] = useState('all')

  const [state, formAction, isPending] = useActionState(async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const res = await saveModel(formData)
    if (res.success) {
      setEditingId(null)
      return { success: true }
    }
    return res as FormState
  }, initialState)

  const uniqueBrands = Array.from(new Set(initialModels.map(m => m.brand))).sort()

  const filteredModels = initialModels.filter(m => {
    const matchesSearch = m.brand.toLowerCase().includes(searchTerm.toLowerCase()) || m.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesWatchlist = showWatchlistOnly ? m.watchlist : true
    const matchesBrand = brandFilter === 'all' ? true : m.brand === brandFilter
    const matchesPriceStatus = 
      priceStatusFilter === 'all' ? true : 
      priceStatusFilter === 'has_price' ? m.current_price !== null : 
      m.current_price === null

    return matchesSearch && matchesWatchlist && matchesBrand && matchesPriceStatus
  })

  filteredModels.sort((a, b) => (a.watchlist === b.watchlist ? 0 : a.watchlist ? -1 : 1))

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
              <label className="text-sm font-medium">RAM (GB) - Opsional</label>
              <input 
                name="ram_gb" 
                type="number" 
                min="1"
                defaultValue={editingId ? initialModels.find(m => m.id === editingId)?.ram_gb || '' : ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Storage (GB) - Opsional</label>
              <input 
                name="storage_gb" 
                type="number" 
                min="1"
                defaultValue={editingId ? initialModels.find(m => m.id === editingId)?.storage_gb || '' : ''}
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
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
            />
            <label htmlFor="watchlist" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Pantau harga model ini (Watchlist)
            </label>
          </div>

          {state.error && <p className="text-sm text-destructive font-medium">{state.error}</p>}
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {editingId ? 'Simpan Perubahan' : 'Tambah'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => {
                setEditingId(null)
                state.error = undefined
              }}>
                Batal
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-2">
          <input 
            type="search" 
            placeholder="Cari merek atau model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm" 
          />
          <select 
            value={brandFilter} 
            onChange={(e) => setBrandFilter(e.target.value)}
            className="flex h-10 w-full sm:max-w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Semua Merek</option>
            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select 
            value={priceStatusFilter} 
            onChange={(e) => setPriceStatusFilter(e.target.value)}
            className="flex h-10 w-full sm:max-w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Semua Status</option>
            <option value="has_price">Sudah Ada Harga</option>
            <option value="no_price">Belum Ada Harga</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default"
            disabled={isSyncing}
            onClick={async () => {
              const modelsToSync = filteredModels.filter(m => m.watchlist);
              if (modelsToSync.length === 0) return alert('Tidak ada model watchlist untuk disinkronkan.');
              
              setIsSyncing(true);
              for (const m of modelsToSync) {
                const hostStr = encodeURIComponent(window.location.origin);
                const url = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(m.brand + ' ' + m.name)}&exact=false#auto_scrape=${m.id}&host=${hostStr}`;
                const win = window.open(url, '_blank');
                if (!win) {
                  alert('Pop-up diblokir browser. Izinkan pop-up untuk melanjutkan.');
                  break;
                }
                await new Promise(r => {
                  const timer = setInterval(() => {
                    if (win.closed) {
                      clearInterval(timer);
                      r(true);
                    }
                  }, 500);
                });
                await new Promise(r => setTimeout(r, 2000));
              }
              setIsSyncing(false);
              alert('Sinkronisasi massal selesai! Refresh halaman untuk melihat hasil.');
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSyncing ? 'Menyinkronkan...' : 'Tarik Semua Watchlist'}
          </Button>

          <Button 
            variant={showWatchlistOnly ? "default" : "outline"} 
            onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
            className="flex items-center gap-2"
          >
            <Star className={`h-4 w-4 ${showWatchlistOnly ? "fill-current" : ""}`} /> 
            Watchlist
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map(model => {
          // Asumsi ambang batas peringatan jika harga di bawah Rp 1jt
          const isWarning = model.current_price && model.current_price < 1000000 && model.watchlist;

          return (
            <div key={model.id} className={`rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between ${model.watchlist ? 'border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                    {model.watchlist && <Star className="h-4 w-4 text-blue-500 fill-current" />}
                    {model.brand} {model.name}
                  </h3>
                  {isWarning && <span title="Harga Anjlok"><AlertTriangle className="h-5 w-5 text-amber-500" /></span>}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  RAM: {model.ram_gb || '?'}GB | Storage: {model.storage_gb || '?'}GB
                </p>
                <div className="mb-4 space-y-1">
                  <div>
                    <span className="text-xs text-muted-foreground inline-block w-20">Pasaran FB: </span>
                    <span className={`font-semibold ${isWarning ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                      {model.current_price ? formatRupiah(model.current_price) : 'Belum ada data'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground inline-block w-20">Taufik: </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {model.taufik_price ? formatRupiah(model.taufik_price) : 'Belum ada tawaran'}
                    </span>
                    {model.taufik_price && model.current_price && (
                      <span className="text-xs ml-2 text-muted-foreground">
                        ({(((model.taufik_price - model.current_price) / model.current_price) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <a 
                  href={`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(model.brand + ' ' + model.name)}&exact=false#auto_scrape=${model.id}&host=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="default" size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Tarik FB</Button>
                </a>
                <Link href={`/models/${model.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">Detail</Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingId(model.id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    await toggleModelWatchlist(model.id, !model.watchlist)
                  }}
                >
                  {model.watchlist ? 'Batal' : 'Pantau'}
                </Button>
              </div>
            </div>
          )
        })}
        {filteredModels.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">Tidak ada data model.</p>
        )}
      </div>
    </div>
  )
}
