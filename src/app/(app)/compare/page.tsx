import { getCompareData } from '@/server/compare'
import { formatRupiah } from '@/lib/format'
import Link from 'next/link'

export default async function ComparePage() {
  const { comparisonModels, activeShops, settings } = await getCompareData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perbandingan Harga</h1>
        <p className="text-muted-foreground">Bandingkan tawaran konter dengan harga pasaran untuk model di Watchlist.</p>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-3 text-left font-medium whitespace-nowrap">Model</th>
              <th className="p-3 text-right font-medium whitespace-nowrap">Pasaran Acuan</th>
              {activeShops.map((shop: { id: string; name: string }) => (
                <th key={shop.id} className="p-3 text-right font-medium whitespace-nowrap">
                  Tawaran {shop.name}
                </th>
              ))}
              <th className="p-3 text-right font-medium whitespace-nowrap">Selisih Tertinggi</th>
              <th className="p-3 text-center font-medium whitespace-nowrap">Saran Keputusan</th>
            </tr>
          </thead>
          <tbody>
            {comparisonModels.map((row: any) => (
              <tr key={row.model.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <div className="font-semibold text-primary hover:underline">
                    <Link href={`/models/${row.model.id}`}>
                      {row.model.brand} {row.model.name}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>RAM {row.model.ram_gb || '?'}GB / {row.model.storage_gb || '?'}GB</span>
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
                  {row.bestBid > 0 && row.refPriceInfo.price ? (
                    <div>
                      <div className="font-semibold">
                        {(row.discount * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRupiah(row.refPriceInfo.price - row.bestBid)} margin
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">-</span>
                  )}
                </td>

                <td className="p-3 text-center align-middle">
                  {row.suggestion === 'jual_ke_konter' && (
                    <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded">
                      Lempar Konter
                    </span>
                  )}
                  {row.suggestion === 'pasang_di_fb' && (
                    <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded">
                      Jual Sendiri (FB)
                    </span>
                  )}
                  {!row.suggestion && (
                    <span className="text-muted-foreground text-xs italic">Data kurang</span>
                  )}
                </td>
              </tr>
            ))}
            {comparisonModels.length === 0 && (
              <tr>
                <td colSpan={activeShops.length + 4} className="p-6 text-center text-muted-foreground">
                  Belum ada model yang masuk daftar Watchlist. Tambahkan dari Katalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
