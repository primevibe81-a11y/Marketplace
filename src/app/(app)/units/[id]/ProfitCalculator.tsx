'use client'

import { formatRupiah } from '@/lib/format'

type ProfitCalculatorProps = {
  bestBid: number | null
  referencePrice: number | null
  soldPrice: number | null
}

export function ProfitCalculator({ bestBid, referencePrice, soldPrice }: ProfitCalculatorProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="font-semibold border-b pb-2">Status Penjualan</h2>
      
      {!soldPrice && (
        <div className="space-y-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tawaran Tertinggi Saat Ini:</span>
            <span className="font-medium text-foreground">{bestBid ? formatRupiah(bestBid) : 'Belum ada'}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Harga Pasaran (FB):</span>
            <span className="font-medium text-foreground">{referencePrice ? formatRupiah(referencePrice) : 'Belum ada'}</span>
          </div>
        </div>
      )}

      {soldPrice && (
        <div className="flex justify-between font-medium border-t pt-2 text-green-700 dark:text-green-500">
          <span>Telah Terjual (Omset):</span>
          <span className="text-xl font-bold">{formatRupiah(soldPrice)}</span>
        </div>
      )}
    </div>
  )
}
