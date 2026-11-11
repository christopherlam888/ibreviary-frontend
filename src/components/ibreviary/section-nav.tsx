'use client'

import { useIbreviary, type ViewName } from '@/lib/ibreviary/store'
import { cn } from '@/lib/utils'
import { House, BookOpen, BookMarked, HeartHandshake, Church, Settings2 } from 'lucide-react'

const SECTIONS: { view: ViewName; label: string; icon: React.ReactNode }[] = [
  { view: 'home', label: 'Home', icon: <House className="h-4 w-4" /> },
  { view: 'breviary', label: 'Breviary', icon: <BookOpen className="h-4 w-4" /> },
  { view: 'readings', label: 'Readings', icon: <BookMarked className="h-4 w-4" /> },
  { view: 'prayers', label: 'Prayers', icon: <HeartHandshake className="h-4 w-4" /> },
  { view: 'missal', label: 'Missal', icon: <Church className="h-4 w-4" /> },
  { view: 'settings', label: 'More', icon: <Settings2 className="h-4 w-4" /> },
]

export function SectionNav() {
  const view = useIbreviary((s) => s.view)
  const setView = useIbreviary((s) => s.setView)

  return (
    <>
      {/* desktop/top tabs */}
      <nav aria-label="Sections" className="hidden md:block border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-3 py-1.5">
          {SECTIONS.map((s) => (
            <button
              key={s.view}
              type="button"
              onClick={() => setView(s.view)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === s.view ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={view === s.view ? 'page' : undefined}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* mobile bottom bar, matching the app's five-menu layout */}
      <nav
        aria-label="Sections"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-card"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-6">
          {SECTIONS.map((s) => (
            <button
              key={s.view}
              type="button"
              onClick={() => setView(s.view)}
              className={cn(
                'flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium',
                view === s.view ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-current={view === s.view ? 'page' : undefined}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
