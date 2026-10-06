import { getUnits } from '@/server/units'
import { UnitFilters } from './UnitFilters'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const resolvedSearchParams = await searchParams
  const units = await getUnits(resolvedSearchParams.search, resolvedSearchParams.status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Unit</h1>
          <p className="text-muted-foreground">Kelola stok dan lacak status unit HP.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <a href="/api/export/units" download className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full bg-card">Ekspor CSV</Button>
          </a>
          <Link href="/units/new" className="flex-1 sm:flex-none">
            <Button className="w-full">+ Tambah Unit</Button>
          </Link>
        </div>
      </div>

      <UnitFilters defaultSearch={resolvedSearchParams.search} defaultStatus={resolvedSearchParams.status} />

      <div className="grid gap-3">
        {units.map((unit: any) => (
          <Card key={unit.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">{unit.code}</span>
                <Badge variant={unit.status === 'tersedia' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider">
                  {unit.status}
                </Badge>
              </div>
              <h3 className="font-bold">{unit.phone_models.brand} {unit.phone_models.name}</h3>
            </div>
            <Link href={`/units/${unit.id}`}>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">Lihat Detail</Button>
            </Link>
          </Card>
        ))}

        {units.length === 0 && (
          <div className="text-center p-12 border rounded-xl bg-card text-muted-foreground">
            Tidak ada unit yang ditemukan.
          </div>
        )}
      </div>
    </div>
  )
}
