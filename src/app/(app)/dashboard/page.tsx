import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRupiah } from '@/lib/format'
import { PlusCircle, ShoppingBag, Eye, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current date boundaries for monthly stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: activeUnits },
    { data: openOffers },
    { data: soldUnits },
    { data: settingsData }
  ] = await Promise.all([
    supabase.from('units').select('id, code, status, acquired_price, extra_cost, acquired_at, created_at, phone_models(brand, name)').in('status', ['bought', 'ready', 'listed']),
    supabase.from('offers').select('id, price, status, offered_at, shops(name), phone_models(brand, name), unit_id').eq('status', 'open').order('offered_at', { ascending: false }),
    supabase.from('units').select('acquired_price, extra_cost, sold_price').eq('status', 'sold').gte('sold_at', startOfMonth),
    supabase.from('settings').select('stock_age_days').single()
  ])

  const STOCK_AGE_DAYS = settingsData?.stock_age_days || 5

  const totalCapital = activeUnits?.reduce((acc: number, u: any) => acc + (u.acquired_price || 0) + (u.extra_cost || 0), 0) || 0

  // D2: Monthly P&L
  const monthlyProfit = soldUnits?.reduce((acc: number, u: any) => {
    const profit = (u.sold_price || 0) - (u.acquired_price || 0) - (u.extra_cost || 0)
    return acc + profit
  }, 0) || 0
  const monthlySold = soldUnits?.length || 0

  // D3: Dead Stock
  const staleUnits = activeUnits?.filter((u: any) => {
    const start = new Date(u.acquired_at || u.created_at).getTime()
    const diff = (now.getTime() - start) / (1000 * 3600 * 24)
    return diff > STOCK_AGE_DAYS
  }) || []

  // D4: Top Margin Opportunities
  const unitMargins: Array<{ unit: any, offer: any, margin: number }> = []
  if (activeUnits && openOffers) {
    activeUnits.forEach(u => {
      const modal = (u.acquired_price || 0) + (u.extra_cost || 0)
      if (modal === 0) return

      // Find the highest offer for this specific unit
      const specificOffers = openOffers.filter(o => o.unit_id === u.id)
      if (specificOffers.length > 0) {
        const bestSpecific = specificOffers.reduce((prev, current) => (prev.price > current.price) ? prev : current)
        const margin = bestSpecific.price - modal
        if (margin > 0) {
          unitMargins.push({ unit: u, offer: bestSpecific, margin })
        }
      }
    })
  }
  unitMargins.sort((a, b) => b.margin - a.margin)
  const topMargins = unitMargins.slice(0, 3)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beranda</h1>
          <p className="text-muted-foreground">Ringkasan inventaris dan performa bisnis.</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/units/new">
          <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
              <PlusCircle className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Tambah Unit</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/units">
          <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Input Tawaran</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/models">
          <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
              <Eye className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Catat Pasaran</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/compare">
          <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Bandingkan</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden col-span-2">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="w-24 h-24" />
          </div>
          <h3 className="font-semibold text-muted-foreground mb-2">Laba Bersih Bulan Ini</h3>
          <p className="text-3xl font-bold text-green-600">{formatRupiah(monthlyProfit)}</p>
          <p className="text-sm text-muted-foreground mt-1">Dari {monthlySold} unit terjual</p>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Unit Tersedia</h3>
          <p className="text-2xl font-bold">{activeUnits?.length || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Modal: {formatRupiah(totalCapital)}</p>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Menggantung</h3>
          <p className="text-2xl font-bold text-amber-600">{openOffers?.length || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Tawaran dari konter</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* TOP MARGIN OPPORTUNITIES */}
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <h2 className="font-semibold border-b pb-2 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" /> Peluang Cuan Tertinggi
          </h2>
          {topMargins.length > 0 ? (
            <div className="space-y-3">
              {topMargins.map((item) => (
                <div key={item.unit.id} className="flex justify-between items-center p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
                  <div>
                    <div className="font-semibold">{item.unit.phone_models.brand} {item.unit.phone_models.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Tawaran {item.offer.shops.name} ({formatRupiah(item.offer.price)})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+{formatRupiah(item.margin)}</div>
                    <Link href={`/units/${item.unit.id}`}>
                      <Button variant="link" size="sm" className="h-auto p-0">Lihat / Eksekusi</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center p-8 border border-dashed rounded-lg">
              Belum ada tawaran menguntungkan untuk unit aktif.
            </p>
          )}
        </div>

        {/* DEAD STOCK ALERT */}
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <h2 className="font-semibold border-b pb-2 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" /> Peringatan Stok {'>'} {STOCK_AGE_DAYS} Hari
          </h2>
          {staleUnits.length > 0 ? (
            <div className="space-y-3">
              {staleUnits.map((u: any) => {
                const start = new Date(u.acquired_at || u.created_at).getTime()
                const days = Math.floor((now.getTime() - start) / (1000 * 3600 * 24))
                
                return (
                  <div key={u.id} className="flex justify-between items-center p-3 rounded-lg border bg-destructive/5 border-destructive/20">
                    <div>
                      <div className="font-semibold">{u.phone_models.brand} {u.phone_models.name}</div>
                      <div className="text-sm text-destructive">
                        Tertahan: {days} hari
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatRupiah(u.acquired_price + u.extra_cost)}</div>
                      <Link href={`/compare`}>
                        <Button variant="link" size="sm" className="h-auto p-0 text-destructive hover:text-destructive/80">Cek Tawaran</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center p-8 border border-dashed rounded-lg">
              Semua stok aman, tidak ada barang lama!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
