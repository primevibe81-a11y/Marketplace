import { getUnits } from '@/server/units'
import { UnitFilters } from './UnitFilters'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  // Await searchParams as required in Next.js 16+
  const resolvedSearchParams = await searchParams
  const units = await getUnits(resolvedSearchParams.search, resolvedSearchParams.status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Unit</h1>
          <p className="text-muted-foreground">Kelola stok dan lacak status unit HP.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/units" download>
            <Button variant="outline">Ekspor CSV</Button>
          </a>
          <Link href="/units/new">
            <Button>+ Tambah Unit</Button>
          </Link>
        </div>
      </div>

      <UnitFilters defaultSearch={resolvedSearchParams.search} defaultStatus={resolvedSearchParams.status} />

      <div className="grid gap-4">
        {units.map((unit: { id: string, code: string, status: string, phone_models: { brand: string, name: string }, unit_identifiers: { kind: string, value: string }[] }) => (
          <div key={unit.id} className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-semibold bg-muted px-2 py-0.5 rounded">{unit.code}</span>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{unit.status}</span>
              </div>
              <h3 className="font-bold">{unit.phone_models.brand} {unit.phone_models.name}</h3>
              <div className="text-sm text-muted-foreground mt-1">
                {unit.unit_identifiers.map((i: { kind: string, value: string }) => (
                  <span key={i.kind} className="mr-3">
                    <span className="uppercase text-[10px]">{i.kind}:</span> <span className="font-mono">{i.value}</span>
                  </span>
                ))}
              </div>
            </div>
            <Link href={`/units/${unit.id}`}>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">Lihat Detail</Button>
            </Link>
          </div>
        ))}

        {units.length === 0 && (
          <div className="text-center p-8 border rounded-lg bg-muted/20 text-muted-foreground">
            Tidak ada unit yang cocok dengan filter.
          </div>
        )}
      </div>
    </div>
  )
}
