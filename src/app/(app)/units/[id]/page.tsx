import { getUnitDetail } from '@/server/units'
import { formatRupiah } from '@/lib/format'
import { ImeiRevealer } from './ImeiRevealer'

export default async function UnitDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const resolvedParams = await params
  const unit = await getUnitDetail(resolvedParams.id)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-sm font-semibold bg-muted px-2 py-0.5 rounded">{unit.code}</span>
          <span className="text-xs uppercase tracking-wider font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            {unit.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {unit.phone_models.brand} {unit.phone_models.name}
        </h1>
        <p className="text-muted-foreground">
          Grade: <span className="font-medium capitalize">{unit.grade}</span> | 
          RAM/Storage: <span className="font-medium">{unit.phone_models.ram_gb || '?'}GB / {unit.phone_models.storage_gb || '?'}GB</span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold border-b pb-2 mb-3">Identitas</h2>
            <div className="space-y-2">
              <ImeiRevealer unitId={unit.id} initialIdentifiers={unit.unit_identifiers} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold border-b pb-2 mb-3">Keuangan & Asal</h2>
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
      </div>

      {/* Tawaran, saran keputusan, laba akan ditambahkan di T1.8 / T1.9 */}
      <div className="rounded-lg border bg-card p-4 text-center text-muted-foreground text-sm">
        (Tawaran dan Perbandingan Harga akan ditambahkan di task selanjutnya)
      </div>
    </div>
  )
}
