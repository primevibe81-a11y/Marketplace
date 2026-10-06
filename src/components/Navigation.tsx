'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Smartphone, Scale, Layers, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/units', label: 'Unit', icon: Smartphone },
  { href: '/compare', label: 'Banding', icon: Scale },
  { href: '/models', label: 'Katalog', icon: Layers },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 px-2 backdrop-blur-md sm:hidden">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        )
      })}
      
      {/* "Lainnya" trigger (for settings, shops, etc) */}
      <Link
        href="/settings"
        className={cn(
          "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
          pathname.startsWith('/settings') || pathname.startsWith('/shops') ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-[10px] font-medium leading-none">Lainnya</span>
      </Link>
    </div>
  )
}

export function DesktopNav() {
  const pathname = usePathname()
  
  const allItems = [
    ...navItems,
    { href: '/shops', label: 'Konter', icon: undefined },
    { href: '/settings', label: 'Pengaturan', icon: undefined }
  ]

  return (
    <nav className="hidden sm:flex items-center gap-1">
      {allItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
