import { getSettings } from '@/server/settings'
import { SettingsForm } from './SettingsForm'

export const metadata = {
  title: 'Pengaturan | Pemantau HP'
}

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">Sesuaikan parameter kalkulasi dan peringatan aplikasi dengan gaya bisnis Anda.</p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
        <SettingsForm initialData={settings} />
      </div>
    </div>
  )
}
