'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/format'
import { useRouter } from 'next/navigation'

type Estimate = {
  id: string
  price_p25: number
  price_p50: number
  price_p75: number
  sample_count: number
  confidence: string
  sources_urls: string
  fetched_at: string
}

export function AiEstimates({ 
  modelId, 
  grade,
  estimates 
}: { 
  modelId: string,
  grade: string,
  estimates: Estimate[] 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEstimate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, grade, force: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Estimasi AI (Grade: {grade})</h2>
        <Button size="sm" onClick={handleEstimate} disabled={loading}>
          {loading ? 'Mencari...' : 'Perbarui Estimasi'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-md border">
        {estimates.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Belum ada hasil estimasi AI.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 text-left font-medium">Tanggal</th>
                <th className="p-3 text-left font-medium">Statistik & Keyakinan</th>
                <th className="p-3 text-right font-medium">Acuan Harga (P50)</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map(est => (
                <tr key={est.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 align-top">
                    {new Date(est.fetched_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <div className="text-[10px] text-muted-foreground">{new Date(est.fetched_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 mb-1">
                      <span className={`text-xs uppercase font-semibold px-1.5 py-0.5 rounded ${est.confidence === 'high' ? 'bg-green-100 text-green-800' : est.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {est.confidence}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {est.sample_count} Sampel
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2" title={est.sources_urls}>
                      Sumber: {est.sources_urls || '-'}
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold">
                    <div className="text-primary">{formatRupiah(est.price_p50)}</div>
                    <div className="text-[10px] text-muted-foreground font-normal mt-1">
                      Range: {formatRupiah(est.price_p25)} - {formatRupiah(est.price_p75)}
                    </div>
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
