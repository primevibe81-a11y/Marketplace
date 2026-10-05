import { getModelDetail, getObservations, getEstimates } from '@/server/observations'
import { ObservationList } from './ObservationList'
import { AiEstimates } from './AiEstimates'
import Link from 'next/link'

export default async function ModelDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const resolvedParams = await params
  const model = await getModelDetail(resolvedParams.id)
  
  const [observations, estimates] = await Promise.all([
    getObservations(resolvedParams.id),
    getEstimates(resolvedParams.id)
  ])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-lg border bg-card p-4 overflow-x-auto">
          <ObservationList 
            modelId={model.id} 
            observations={observations as { id: string; price: number; grade: string; channel: string; listing_state: string; url: string | null; note: string | null; observed_at: string }[]} 
          />
        </div>
        <div className="rounded-lg border bg-card p-4 overflow-x-auto">
          <AiEstimates 
            modelId={model.id}
            grade="normal" // Hardcoded default for MVP, can be expanded to toggle later
            estimates={estimates as { id: string; price_p25: number; price_p50: number; price_p75: number; sample_count: number; confidence: string; sources_urls: string; fetched_at: string }[]} 
          />
        </div>
      </div>
    </div>
  )
}
