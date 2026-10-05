import { getCompareData } from '@/server/compare'
import { formatRupiah } from '@/lib/format'
import Link from 'next/link'

export default async function ComparePage() {
  const { comparisonUnits, activeShops, settings } = await getCompareData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perbandingan Harga</h1>
        <p className="text-muted-foreground">Bandingkan tawaran konter dengan harga pasaran untuk stok aktif.</p>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-3 text-left font-medium whitespace-nowrap">Unit / Model</th>
              <th className="p-3 text-right font-medium whitespace-nowrap">Pasaran Acuan</th>
              {activeShops.map((shop: { id: string; name: string }) => (
                <th key={shop.id} className="p-3 text-right font-medium whitespace-nowrap">
                  Tawaran {shop.name}
                </th>
              ))}
              <th className="p-3 text-right font-medium whitespace-nowrap">Diskon Jual Cepat</th>
              <th className="p-3 text-center font-medium whitespace-nowrap">Saran Keputusan</th>
            </tr>
          </thead>
          <tbody>
            {comparisonUnits.map((row: { unit: { id: string, code: string, status: string, phone_models: { brand: string, name: string } }, stockDays: number, refPriceInfo: { price: number | null, source: string | null }, latestOffersPerShop: Record<string, { price: number; offered_at: string } | null>, bestBid: number, discount: number, suggestion: string | null }) => (
              <tr key={row.unit.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <div className="font-semibold text-primary hover:underline">
                    <Link href={`/units/${row.unit.id}`}>
                      {row.unit.phone_models.brand} {row.unit.phone_models.name}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{row.unit.code}</span>
                    <span className="uppercase">{row.unit.status}</span>
                    <span>• {row.stockDays} hari</span>
                  </div>
                </td>
                
                <td className="p-3 text-right">
                  {row.refPriceInfo.price ? (
                    <div>
                      <div className="font-semibold">{formatRupiah(row.refPriceInfo.price)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-0.5">
                        Sumber: {row.refPriceInfo.source === 'fb_marketplace' ? 'FB Manual' : 'Estimasi AI'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Belum ada data</span>
                  )}
                </td>

                {activeShops.map((shop: { id: string; name: string }) => {
                  const offer = row.latestOffersPerShop[shop.id]
                  if (!offer) {
                    return <td key={shop.id} className="p-3 text-right text-muted-foreground text-xs italic">-</td>
                  }
                  
                  const isBest = offer.price === row.bestBid && row.bestBid > 0
                  const isStale = (new Date().getTime() - new Date(offer.offered_at).getTime()) > (settings.stale_offer_days * 24 * 3600 * 1000)

                  return (
                    <td key={shop.id} className={`p-3 text-right ${isBest ? 'bg-green-500/10' : ''}`}>
                      <div className={`font-semibold ${isBest ? 'text-green-600 dark:text-green-400' : ''}`}>
                        {formatRupiah(offer.price)}
                      </div>
                      <div className="flex flex-col items-end gap-1 mt-1">
                        {(row.refPriceInfo.price ?? 0) > 0 && (
                          <span className="text-[10px] bg-muted px-1 rounded">
                            {((offer.price / (row.refPriceInfo.price ?? 1)) * 100).toFixed(1)}% pasaran
                          </span>
                        )}
                        {isStale && (
                          <span className="text-[10px] text-destructive bg-destructive/10 px-1 rounded">Usang</span>
                        )}
                      </div>
                    </td>
                  )
                })}

                <td className="p-3 text-right">
                  {row.bestBid > 0 && (row.refPriceInfo.price ?? 0) > 0 ? (
                    <div className="font-medium">
                      {(row.discount * 100).toFixed(1)}%
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>

                <td className="p-3 text-center">
                  {row.suggestion === 'jual_ke_konter' && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full whitespace-nowrap">
                      Jual ke Konter
                    </span>
                  )}
                  {row.suggestion === 'pasang_di_fb' && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full whitespace-nowrap">
                      Pasang di FB
                    </span>
                  )}
                  {!row.suggestion && (
                    <span className="text-muted-foreground text-xs italic">-</span>
                  )}
                </td>
              </tr>
            ))}
            
            {comparisonUnits.length === 0 && (
              <tr>
                <td colSpan={activeShops.length + 4} className="p-8 text-center text-muted-foreground">
                  Belum ada unit aktif untuk dibandingkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
