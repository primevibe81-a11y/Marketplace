import { getModelDetail, getObservations } from '@/server/observations'
import { getActiveShops } from '@/server/shops'
import { createClient } from '@/lib/supabase/server'
import { ObservationList } from './ObservationList'
import { OfferList } from './OfferList'
import Link from 'next/link'
import { PriceChart } from '@/components/PriceChart'

export default async function ModelDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const resolvedParams = await params

  const model = await getModelDetail(resolvedParams.id)
  
  const [observations, shops] = await Promise.all([
    getObservations(resolvedParams.id),
    getActiveShops()
  ])

  const supabase = await createClient()
  const { data: offers } = await supabase
    .from('offers')
    .select('*, shops(name)')
    .eq('model_id', resolvedParams.id)
    .order('offered_at', { ascending: false })

  // Transform data for chart (only observations since AI is removed)
  const chartData = observations.map(obs => ({
    date: new Date(obs.observed_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    price: obs.price,
    source: 'FB'
  })).reverse()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Link href="/models" className="hover:underline">← Kembali ke Katalog Model</Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {model.brand} {model.name}
          </h1>
          <p className="text-muted-foreground">
            RAM: <span className="font-medium">{model.ram_gb || '?'}GB</span> | 
            Storage: <span className="font-medium">{model.storage_gb || '?'}GB</span>
            {model.watchlist && <span className="ml-3 uppercase text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Di Watchlist</span>}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-lg border bg-card p-4 overflow-x-auto">
          <OfferList 
            modelId={model.id}
            activeShops={shops}
            offers={offers as any || []} 
          />
        </div>
        <div className="rounded-lg border bg-card p-4 overflow-x-auto">
          <ObservationList modelId={model.id} observations={observations as any} currentGrade="normal" />
        </div>
      </div>
    </div>
  )
}
