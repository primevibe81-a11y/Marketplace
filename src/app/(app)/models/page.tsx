import { getModels } from '@/server/models'
import { createClient } from '@/lib/supabase/server'
import { ModelList } from './ModelList'

export default async function ModelsPage() {
  const models = await getModels()
  const supabase = await createClient()
  const { data: estimates } = await supabase.from('latest_estimates').select('*')
  const modelsWithPrices = models.map(m => {
    const est = estimates?.find(e => e.model_id === m.id && e.grade === 'normal')
    return { ...m, current_price: est?.price_p50 || null }
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
