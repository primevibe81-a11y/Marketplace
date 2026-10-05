import { getShops } from '@/server/shops'
import { ShopList } from './ShopList'

export default async function ShopsPage() {
  const shops = await getShops()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Konter</h1>
        <p className="text-muted-foreground">Kelola daftar konter untuk tempat melempar barang.</p>
      </div>
      <ShopList initialShops={shops} />
    </div>
  )
}
