import { getModelDetail, getObservations, getEstimates } from '@/server/observations'
import { ObservationList } from './ObservationList'
import { AiEstimates } from './AiEstimates'
import Link from 'next/link'
import { PriceChart } from '@/components/PriceChart'
import { formatChartData } from '@/lib/chartData'

export default async function ModelDetailPage({
  params,
  searchParams,
}: {
  params: { id: string },
  searchParams: { grade?: string }
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const grade = resolvedSearchParams.grade || 'normal'

  const model = await getModelDetail(resolvedParams.id)
  
  const [observations, estimates] = await Promise.all([
    getObservations(resolvedParams.id),
    getEstimates(resolvedParams.id)
  ])

  const filteredObservations = observations.filter((o: any) => o.grade === grade)
  const filteredEstimates = estimates.filter((e: any) => e.grade === grade)

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
        
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          {['mulus', 'normal', 'minus', 'rusak'].map(g => (
            <Link 
              key={g} 
              href={`/models/${model.id}?grade=${g}`}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${grade === g ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Tren Harga ({grade})</h2>
        <PriceChart data={formatChartData(filteredObservations as any, filteredEstimates as any)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-lg border bg-card p-4 overflow-x-auto">
          <ObservationList modelId={model.id} observations={filteredObservations as any} currentGrade={grade} />
        </div>
        <div className="rounded-lg border bg-card p-4 overflow-x-auto">
          <AiEstimates 
            modelId={model.id}
            grade={grade}
            estimates={filteredEstimates as any} 
          />
        </div>
      </div>
    </div>
  )
}
