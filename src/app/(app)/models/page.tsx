import { getModels } from '@/server/models'
import { createClient } from '@/lib/supabase/server'
import { ModelList } from './ModelList'
import { summarize } from '@/lib/pricing'

export default async function ModelsPage() {
  const models = await getModels()
  const supabase = await createClient()
  
  // Fetch active manual observations
  const { data: observations } = await supabase
    .from('market_observations')
    .select('model_id, price')
    .eq('listing_state', 'active')

  // Fetch Taufik's offers
  const { data: latestOffers } = await supabase
    .from('latest_offers')
    .select('model_id, price, shop_id')
    
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name')
    
  const taufikShops = shops?.filter(s => s.name.toLowerCase().includes('taufik')).map(s => s.id) || []
    
  // Group by model_id and calculate median
  const modelsWithPrices = models.map(m => {
    const modelObs = observations?.filter(o => o.model_id === m.id).map(o => o.price) || []
    let medianPrice = null
    
    if (modelObs.length > 0) {
      const stats = summarize(modelObs, modelObs.length)
      medianPrice = stats.median
    }
    
    const taufikOffer = latestOffers?.find(o => o.model_id === m.id && taufikShops.includes(o.shop_id))
    
    return { 
      ...m, 
      current_price: medianPrice,
      taufik_price: taufikOffer ? taufikOffer.price : null
    }
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Katalog Model HP</h1>
        <p className="text-muted-foreground">Kelola database merek dan tipe HP.</p>
      </div>
      <ModelList initialModels={modelsWithPrices as any} />
    </div>
  )
}
