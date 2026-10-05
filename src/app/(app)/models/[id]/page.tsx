import { getModelDetail, getObservations } from '@/server/observations'
import { ObservationList } from './ObservationList'
import Link from 'next/link'

export default async function ModelDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const resolvedParams = await params
  const model = await getModelDetail(resolvedParams.id)
  const observations = await getObservations(resolvedParams.id)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4">
          <ObservationList modelId={model.id} observations={observations as any} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold text-lg mb-4">Estimasi AI (T1.11)</h2>
          <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">
            Fitur Estimasi AI akan ditambahkan di task selanjutnya.
          </div>
        </div>
      </div>
    </div>
  )
}
