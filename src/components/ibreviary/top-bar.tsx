'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, CalendarClock, Bell, BookText, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useIbreviary, shiftISO, todayISO, prettyISO } from '@/lib/ibreviary/store'
import { useStatus } from '@/lib/ibreviary/hooks'

export function TopBar({ onBell, unread }: { onBell: () => void; unread: number }) {
  const date = useIbreviary((s) => s.date)
  const setDate = useIbreviary((s) => s.setDate)
  const language = useIbreviary((s) => s.language)
  const setLanguage = useIbreviary((s) => s.setLanguage)
  const setView = useIbreviary((s) => s.setView)
  const status = useStatus()
  const { resolvedTheme, setTheme } = useTheme()

  const isToday = date === todayISO()

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-3 py-2">
        <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => setDate(shiftISO(date, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <label className="relative inline-flex items-center">
          <span className="sr-only">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label="Pick a date"
          />
        </label>

        <Button variant="outline" size="icon" aria-label="Next day" onClick={() => setDate(shiftISO(date, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant={isToday ? 'secondary' : 'default'}
          size="sm"
          className="gap-1.5"
          onClick={() => setDate(todayISO())}
          aria-label="Go to today"
        >
          <CalendarClock className="h-4 w-4" />
          Today
        </Button>

        <span className="hidden md:inline text-sm text-muted-foreground ml-1" suppressHydrationWarning>
          {prettyISO(date)}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Select value={language} onValueChange={(v) => setLanguage(v)}>
            <SelectTrigger className="w-[110px] sm:w-[150px]" aria-label="Language">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {(status.data?.languages.list ?? []).map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span dir={l.direction === 'rtl' ? 'rtl' : 'ltr'}>{l.title}</span>
                </SelectItem>
              ))}
              {!status.data && <SelectItem value="en">English</SelectItem>}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {/* CSS-driven swap keeps SSR and client markup identical */}
            <Sun className="h-4 w-4 hidden dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </Button>

          <Button variant="outline" size="icon" aria-label="Notifications" onClick={onBell} className="relative">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                aria-label={`${unread} unread notifications`}
              >
                {unread}
              </span>
            )}
          </Button>

          <Button variant="outline" size="icon" aria-label="API documentation" onClick={() => setView('docs')}>
            <BookText className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
