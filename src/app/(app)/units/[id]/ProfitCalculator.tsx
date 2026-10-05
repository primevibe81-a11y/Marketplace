'use client'

import { useState } from 'react'
import { formatRupiah } from '@/lib/format'
import { estimatedProfit } from '@/lib/pricing'

type ProfitCalculatorProps = {
  acquiredPrice: number | null
  extraCost: number
  bestBid: number | null
  referencePrice: number | null
}

export function ProfitCalculator({ acquiredPrice, extraCost, bestBid, referencePrice }: ProfitCalculatorProps) {
  const [customPrice, setCustomPrice] = useState<string>('')
  
  const baseCost = (acquiredPrice || 0) + (extraCost || 0)
  
  const getParsedPrice = () => {
    if (customPrice) return parseInt(customPrice.replace(/[^0-9]/g, ''), 10) || 0
    return bestBid || referencePrice || 0
  }

  const simulatedPrice = getParsedPrice()
  const profit = estimatedProfit({ sold: simulatedPrice, acquired: acquiredPrice || 0, extra: extraCost })
  const profitMargin = baseCost > 0 ? (profit / baseCost) * 100 : 0

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="font-semibold border-b pb-2">Kalkulator Laba / Rugi</h2>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Modal Beli:</span>
          <span>{acquiredPrice ? formatRupiah(acquiredPrice) : 'Tidak ada data'}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Biaya Ekstra (Servis):</span>
          <span>{formatRupiah(extraCost)}</span>
        </div>
        <div className="flex justify-between font-medium border-t pt-1">
          <span>Total Modal:</span>
          <span>{formatRupiah(baseCost)}</span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium">Simulasi Harga Jual</label>
        <div className="flex gap-2">
          {bestBid && (
            <button 
              onClick={() => setCustomPrice(bestBid.toString())}
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded"
            >
              Tawaran Tertinggi
            </button>
          )}
          {referencePrice && (
            <button 
              onClick={() => setCustomPrice(referencePrice.toString())}
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded"
            >
              Harga Pasaran
            </button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-2 text-sm text-muted-foreground">Rp</span>
          <input 
            value={customPrice ? formatRupiah(parseInt(customPrice.replace(/[^0-9]/g, ''), 10))?.replace('Rp ', '') || '' : ''}
            onChange={(e) => setCustomPrice(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={simulatedPrice ? formatRupiah(simulatedPrice)?.replace('Rp ', '') : 'Masukkan harga jual'}
            className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm"
          />
        </div>
      </div>

      <div className={`p-3 rounded-md mt-2 flex justify-between items-center ${profit >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
        <span className="font-semibold">{profit >= 0 ? 'Laba Bersih' : 'Rugi'}</span>
        <div className="text-right">
          <div className="font-bold">{formatRupiah(Math.abs(profit))}</div>
          <div className="text-xs opacity-80">{profitMargin.toFixed(1)}% dari modal</div>
        </div>
      </div>
    </div>
  )
}
