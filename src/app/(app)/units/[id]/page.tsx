import { getUnitDetail } from '@/server/units'
import { formatRupiah } from '@/lib/format'
import { OfferList } from './OfferList'
import { getOffersByUnit } from '@/server/offers'
import { getActiveShops } from '@/server/shops'
import { getObservations, getEstimates } from '@/server/observations'
import { referencePrice, summarize } from '@/lib/pricing'
import { ProfitCalculator } from './ProfitCalculator'
import { SellUnitDialog } from './SellUnitDialog'

export default async function UnitDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const resolvedParams = await params
  const unit = await getUnitDetail(resolvedParams.id)
  
  const [offers, activeShops, observations, estimates] = await Promise.all([
    getOffersByUnit(resolvedParams.id),
    getActiveShops(),
    getObservations(unit.model_id),
    getEstimates(unit.model_id)
  ])

  // Aggregate all observations across channels
  const fbActivePrices = observations.filter(o => o.listing_state === 'active').map(o => o.price)
  const fbStats = summarize(fbActivePrices, fbActivePrices.length) 
  
  const est = estimates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  const ref = referencePrice({
    fbObservations: fbActivePrices.length > 0 ? { median: fbStats.median, activeCount: fbActivePrices.length } : null,
    aiEstimate: est.length > 0 && est[0].price_p50 ? { median: est[0].price_p50 } : null
  })

  const bestBid = offers.length > 0 ? Math.max(...offers.map(o => o.price)) : null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm font-semibold bg-muted px-2 py-0.5 rounded">{unit.code}</span>
            <span className={`text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${unit.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {unit.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {unit.phone_models.brand} {unit.phone_models.name}
          </h1>
          <p className="text-muted-foreground">
            RAM/Storage: <span className="font-medium">{unit.phone_models.ram_gb || '?'}GB / {unit.phone_models.storage_gb || '?'}GB</span>
          </p>
        </div>
        {unit.status !== 'sold' && (
          <SellUnitDialog unitId={unit.id} activeShops={activeShops} />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold border-b pb-2 mb-3">Detail Perolehan</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Asal Barang</dt>
                <dd className="font-medium capitalize">{unit.source_type.replace('_', ' ')}</dd>
              </div>
              {unit.source_ref && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">No. Referensi</dt>
                  <dd className="font-medium">{unit.source_ref}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Harga Perolehan</dt>
                <dd className="font-medium">{formatRupiah(unit.acquired_price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Biaya Ekstra</dt>
                <dd className="font-medium">{formatRupiah(unit.extra_cost) || 'Rp 0'}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <ProfitCalculator 
            bestBid={bestBid}
            referencePrice={ref.price}
            soldPrice={unit.sold_price}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <OfferList 
          unitId={unit.id} 
          modelId={unit.model_id} 
          unitGrade={unit.grade} 
          offers={offers as any} 
          activeShops={activeShops} 
        />
      </div>
    </div>
  )
}
