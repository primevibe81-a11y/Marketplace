'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function UnitFilters({ defaultSearch = '', defaultStatus = '' }) {
  const router = useRouter()
  const [search, setSearch] = useState(defaultSearch)
  const [status, setStatus] = useState(defaultStatus)

  const applyFilters = (newSearch: string, newStatus: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newStatus) params.set('status', newStatus)
    router.push(`/units?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <input
        type="text"
        placeholder="Cari kode / IMEI..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && applyFilters(search, status)}
        className="flex h-10 w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value)
          applyFilters(search, e.target.value)
        }}
        className="flex h-10 w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Semua Status</option>
        <option value="bought">Bought (Baru Beli)</option>
        <option value="repair">Repair (Servis)</option>
        <option value="ready">Ready (Siap Jual)</option>
        <option value="listed">Listed (Sedang Dijual)</option>
        <option value="sold">Sold (Terjual)</option>
      </select>
      <button 
        onClick={() => applyFilters(search, status)}
        className="h-10 px-4 rounded-md border bg-secondary text-secondary-foreground text-sm font-medium"
      >
        Filter
      </button>
    </div>
  )
}
