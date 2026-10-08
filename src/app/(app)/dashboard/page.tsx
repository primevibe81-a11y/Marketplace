import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/format'
import { Layers, Scale, Star, PlusCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: models },
    { data: latestOffers },
    { count: offersCount }
  ] = await Promise.all([
    supabase.from('phone_models').select('id, brand, name, watchlist'),
    supabase.from('latest_offers').select('model_id, price, shops(name)'),
    supabase.from('offers').select('*', { count: 'exact', head: true })
  ])

  const watchlistModels = models?.filter(m => m.watchlist) || []
  
  // Dapatkan tawaran tertinggi secara keseluruhan
  const sortedOffers = latestOffers?.sort((a, b) => b.price - a.price) || []
  const topOffers = sortedOffers.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beranda Radar</h1>
          <p className="text-muted-foreground">Pantau pergerakan harga pasar melawan tawaran konter.</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/models">
          <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
              <Layers className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Katalog Model</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/compare">
          <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Tabel Banding</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-medium">Model Dipantau (Watchlist)</h3>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{watchlistModels.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Dari total {models?.length || 0} model</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-medium">Total Tawaran Tercatat</h3>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{offersCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tawaran masuk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HIGH BIDS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tawaran Tertinggi (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {topOffers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada tawaran masuk.</p>
          ) : (
            <div className="space-y-4">
              {topOffers.map((offer, idx) => {
                const model = models?.find(m => m.id === offer.model_id)
                return (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                    <div>
                      <div className="font-semibold">{model?.brand} {model?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Konter: {(offer.shops as any)?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {formatRupiah(offer.price)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
