import Link from 'next/link'


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="font-bold">Pemantau HP</div>
        <nav className="flex gap-4">
          <Link href="/units" className="text-sm font-medium hover:underline">Unit</Link>
          <Link href="/compare" className="text-sm font-medium hover:underline">Bandingkan</Link>
          <Link href="/models" className="text-sm font-medium hover:underline">Model</Link>
          <Link href="/shops" className="text-sm font-medium hover:underline">Konter</Link>
          <Link href="/settings" className="text-sm font-medium hover:underline">Pengaturan</Link>
        </nav>
        <form action="/login" method="post" className="hidden">
          {/* We'll handle proper logout action later */}
        </form>
      </header>
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
