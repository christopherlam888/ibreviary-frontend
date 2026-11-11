'use client'

import type { Day, VariantRef } from '@/lib/ibreviary/types'
import { useIbreviary } from '@/lib/ibreviary/store'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  day: Day
  onSelect?: (v: VariantRef) => void
}

// Builds the app's day-variant list: the base liturgy, then commemorations
// (mandatory ones carry their saint), then optional events. Selecting one
// only changes which part of the same day payload gets displayed.
export function buildVariants(day: Day): { ref: VariantRef; label: string; sub?: string; kind: string; mandatory?: number; type?: string }[] {
  const out: { ref: VariantRef; label: string; sub?: string; kind: string; mandatory?: number; type?: string }[] = []
  out.push({
    ref: { kind: 'base', index: 0 },
    label: day.day_info.title || 'Day texts',
    sub: day.day_info.day_type,
    kind: 'base',
  })
  ;(day.breviary_memory ?? []).forEach((m, i) =>
    out.push({ ref: { kind: 'memory', index: i }, label: m.title, sub: m.type, kind: 'memory', mandatory: m.mandatory, type: m.type })
  )
  ;(day.event ?? []).forEach((e, i) =>
    out.push({ ref: { kind: 'event', index: i }, label: e.day_info.title, sub: e.day_info.subtitle, kind: 'event', type: e.day_info.type })
  )
  return out
}

export function VariantPicker({ day, onSelect }: Props) {
  const variant = useIbreviary((s) => s.variant)
  const setVariant = useIbreviary((s) => s.setVariant)
  const proper = useIbreviary((s) => s.proper)
  const variants = buildVariants(day)

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3" role="group" aria-label="Celebration to display">
      {variants.map((v) => {
        const active = variant.kind === v.ref.kind && variant.index === v.ref.index
        const pinned = proper && v.kind === 'event' && v.type === proper
        return (
          <button
            key={`${v.ref.kind}-${v.ref.index}`}
            type="button"
            onClick={() => (onSelect ? onSelect(v.ref) : setVariant(v.ref))}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm text-left transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-muted'
            )}
            aria-pressed={active}
          >
            <span className="font-medium">{v.label}</span>
            {v.sub && (
              <span className={cn('ml-2 text-xs', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {v.sub}
              </span>
            )}
            {v.kind === 'memory' && v.mandatory === 1 && (
              <Badge variant="outline" className="ml-2 h-4 px-1.5 text-[10px]">memorial</Badge>
            )}
            {pinned && !active && (
              <Badge variant="outline" className="ml-2 h-4 px-1.5 text-[10px]">pinned proper</Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function resolveBreviary(day: Day, variant: VariantRef) {
  if (variant.kind === 'memory') return day.breviary_memory?.[variant.index]
  if (variant.kind === 'event') return day.event?.[variant.index]?.breviary
  return day.breviary
}

export function resolveMissal(day: Day, variant: VariantRef) {
  if (variant.kind === 'memory') return day.missal_memory?.[variant.index]
  if (variant.kind === 'event') return day.event?.[variant.index]?.missal
  return day.missal?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]
}
