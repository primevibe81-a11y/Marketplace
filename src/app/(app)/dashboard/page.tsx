import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/format'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: activeUnits },
    { data: openOffers }
  ] = await Promise.all([
    supabase.from('units').select('id, code, acquired_price, extra_cost, phone_models(brand, name)').in('status', ['bought', 'ready', 'listed']),
    supabase.from('offers').select('id, price, status, offered_at, shops(name), phone_models(brand, name), unit_id').eq('status', 'open').order('offered_at', { ascending: false }).limit(10)
  ])

  const totalCapital = activeUnits?.reduce((acc: number, u: any) => acc + (u.acquired_price || 0) + (u.extra_cost || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Beranda</h1>
        <p className="text-muted-foreground">Ringkasan inventaris dan penawaran aktif.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Unit Tersedia</h3>
          <p className="text-3xl font-bold">{activeUnits?.length || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Modal: {formatRupiah(totalCapital)}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Tawaran Menggantung</h3>
          <p className="text-3xl font-bold text-amber-600">{openOffers?.length || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Menunggu keputusan (konter)</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm p-4">
        <h2 className="font-semibold border-b pb-2 mb-4">Tawaran Terbaru Belum Direspons</h2>
        {openOffers && openOffers.length > 0 ? (
          <div className="space-y-3">
            {openOffers.map((o: any) => (
              <div key={o.id} className="flex justify-between items-center p-3 rounded bg-muted/30">
                <div>
                  <div className="font-semibold">{o.phone_models.brand} {o.phone_models.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Konter: {o.shops.name} &bull; {new Date(o.offered_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{formatRupiah(o.price)}</div>
                  {o.unit_id ? (
                    <Link href={`/units/${o.unit_id}`}>
                      <span className="text-xs text-blue-600 hover:underline">Lihat Unit</span>
                    </Link>
                  ) : (
                    <Link href={`/compare`}>
                      <span className="text-xs text-blue-600 hover:underline">Bandingkan</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center p-4">Tidak ada tawaran baru.</p>
        )}
      </div>
    </div>
  )
}
