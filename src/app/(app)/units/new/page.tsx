import { getModels } from '@/server/models'
import { UnitForm } from './UnitForm'

export default async function NewUnitPage() {
  const models = await getModels()
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrasi Unit Baru</h1>
        <p className="text-muted-foreground">Catat unit HP yang baru masuk.</p>
      </div>
      <UnitForm models={models} />
    </div>
  )
}
