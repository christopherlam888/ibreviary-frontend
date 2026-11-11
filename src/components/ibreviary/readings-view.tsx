'use client'

import { useIbreviary } from '@/lib/ibreviary/store'
import { useDay, useStatus } from '@/lib/ibreviary/hooks'
import { VariantPicker, resolveMissal } from './variant-picker'
import { ReadingPane } from './reading-pane'
import { READING_SECTIONS } from '@/lib/ibreviary/types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'

export function ReadingsView() {
  const language = useIbreviary((s) => s.language)
  const date = useIbreviary((s) => s.date)
  const variant = useIbreviary((s) => s.variant)
  const day = useDay(language, date)
  const status = useStatus()
  const dir = status.data?.languages.list.find((l) => l.code === language)?.direction === 'rtl' ? 'rtl' : 'ltr'
  const [section, setSection] = useState<string | null>(null)

  if (day.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    )
  }

  if (!day.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        No readings data available — the day is not published and no offline copy exists.
      </div>
    )
  }

  const missal = resolveMissal(day.data, variant)
  const present = READING_SECTIONS.filter((s) => missal && (missal as Record<string, unknown>)[s.key])
  const active = present.find((s) => s.key === section) ?? present[0]
  const content = active && missal ? (missal as Record<string, { title: string; content: string }>)[active.key] : undefined

  const variantTitle =
    variant.kind === 'base'
      ? day.data.day_info.title
      : variant.kind === 'memory'
        ? day.data.missal_memory?.[variant.index]?.title
        : day.data.event?.[variant.index]?.day_info.title

  return (
    <div className="mx-auto max-w-3xl">
      <VariantPicker day={day.data} />
      <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
        <h2 className="text-base font-semibold">{variantTitle} — Mass</h2>
      </div>
      <div className="border-y bg-card sticky top-[52px] z-30">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto slim-scroll px-3 py-1.5" role="tablist" aria-label="Mass section">
          {present.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={active?.key === s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active?.key === s.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {s.label}
            </button>
          ))}
          {present.length === 0 && (
            <span className="px-2 py-1.5 text-sm text-muted-foreground">No Mass texts for this celebration on this date.</span>
          )}
        </div>
      </div>
      {content ? <ReadingPane dir={dir} html={content.content} /> : null}
    </div>
  )
}
