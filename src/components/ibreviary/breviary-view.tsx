'use client'

import { useIbreviary } from '@/lib/ibreviary/store'
import { useDay } from '@/lib/ibreviary/hooks'
import { VariantPicker, resolveBreviary } from './variant-picker'
import { ReadingPane } from './reading-pane'
import { HOUR_LABELS, type HourKey } from '@/lib/ibreviary/types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatus } from '@/lib/ibreviary/hooks'

const BASE_HOURS: HourKey[] = ['officeofreadings', 'lauds', 'daytimeprayers', 'vespers', 'compline', 'previouscompline']

export function BreviaryView() {
  const language = useIbreviary((s) => s.language)
  const date = useIbreviary((s) => s.date)
  const hour = useIbreviary((s) => s.hour)
  const setHour = useIbreviary((s) => s.setHour)
  const variant = useIbreviary((s) => s.variant)
  const day = useDay(language, date)
  const status = useStatus()
  const dir = status.data?.languages.list.find((l) => l.code === language)?.direction === 'rtl' ? 'rtl' : 'ltr'

  if (day.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    )
  }

  if (!day.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        No breviary data available — the day is not published and no offline copy exists.
      </div>
    )
  }

  const hours = resolveBreviary(day.data, variant)
  const available = BASE_HOURS.filter((h) => hours && (h === 'previouscompline' ? hours.previouscompline : hours[h]))
  const current = available.includes(hour) ? hour : available[0]
  const content = hours?.[current]

  const variantTitle =
    variant.kind === 'base'
      ? day.data.day_info.title
      : variant.kind === 'memory'
        ? day.data.breviary_memory?.[variant.index]?.title
        : day.data.event?.[variant.index]?.day_info.title

  return (
    <div className="mx-auto max-w-3xl">
      <VariantPicker day={day.data} />
      <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
        <h2 className="text-base font-semibold">{variantTitle}</h2>
      </div>
      <div className="border-y bg-card sticky top-[52px] z-30">
        <div
          className="mx-auto flex max-w-3xl gap-1 overflow-x-auto slim-scroll px-3 py-1.5"
          role="tablist"
          aria-label="Hour"
        >
          {available.map((h) => (
            <button
              key={h}
              type="button"
              role="tab"
              aria-selected={current === h}
              onClick={() => setHour(h)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                current === h ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {HOUR_LABELS[h]}
            </button>
          ))}
          {available.length === 0 && (
            <span className="px-2 py-1.5 text-sm text-muted-foreground">
              This celebration has no hours on this date.
            </span>
          )}
        </div>
      </div>
      {content ? (
        <ReadingPane dir={dir} html={content.content} />
      ) : (
        <p className="px-4 py-10 text-sm text-muted-foreground">
          {hours ? 'This hour is empty for the selected celebration.' : 'No hours published for this celebration.'}
        </p>
      )}
    </div>
  )
}
