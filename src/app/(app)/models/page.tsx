import { getModels } from '@/server/models'
import { ModelList } from './ModelList'

export default async function ModelsPage() {
  const models = await getModels()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Katalog Model HP</h1>
        <p className="text-muted-foreground">Kelola database merek dan tipe HP.</p>
      </div>
      <ModelList initialModels={models} />
    </div>
  )
}
