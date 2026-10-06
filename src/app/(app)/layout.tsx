import { ThemeToggle } from '@/components/ThemeToggle'
import { DesktopNav, BottomNav } from '@/components/Navigation'
import { ViewTransition } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col pb-16 sm:pb-0">
      {/* Sticky Header Desktop & Mobile */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="font-bold text-lg text-primary tracking-tight">Pemantau HP</div>
          <DesktopNav />
          <ThemeToggle />
        </div>
      </header>
      
      {/* Main Content with View Transitions */}
      <ViewTransition name="page-content">
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 sm:py-8">
          {children}
        </main>
      </ViewTransition>

      <BottomNav />
    </div>
  )
}
