'use client'

import { useState } from 'react'
import { useIbreviary } from '@/lib/ibreviary/store'
import { useFixed, useStatus } from '@/lib/ibreviary/hooks'
import { ReadingPane } from './reading-pane'
import type { PrefaceItem, TitleContent } from '@/lib/ibreviary/types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ORDER_SECTIONS: { key: string; label: string }[] = [
  { key: 'introductory_rites', label: 'Introductory Rites' },
  { key: 'eucharistic_liturgy', label: 'Liturgy of the Eucharist' },
  { key: 'communion_rites', label: 'Communion Rite' },
  { key: 'communion_rites_celebration', label: 'Communion Rite (celebration form)' },
  { key: 'concluding_rites', label: 'Concluding Rites' },
]

type TabKey = 'order' | 'prefaces' | 'eucharistic' | 'faithful' | 'blessings'

export function MissalView() {
  const language = useIbreviary((s) => s.language)
  const fixed = useFixed(language)
  const status = useStatus()
  const dir = status.data?.languages.list.find((l) => l.code === language)?.direction === 'rtl' ? 'rtl' : 'ltr'

  const [tab, setTab] = useState<TabKey>('order')
  const [orderSection, setOrderSection] = useState('introductory_rites')
  const [prefaceIndex, setPrefaceIndex] = useState(0)
  const [epIndex, setEpIndex] = useState(0)
  const [faithfulIndex, setFaithfulIndex] = useState(0)
  const [blessingIndex, setBlessingIndex] = useState(0)

  if (fixed.isPending) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-3">
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-[50vh]" />
      </div>
    )
  }

  if (!fixed.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        Missal parts are unavailable — this language has not been downloaded and no offline copy exists.
      </div>
    )
  }

  const missal = fixed.data.missal
  const order = missal.order_of_mass as Record<string, TitleContent | string>
  const orderParts = ORDER_SECTIONS.filter((s) => order[s.key])
  const activeOrder = orderParts.find((s) => s.key === orderSection) ?? orderParts[0]
  const orderContent = activeOrder ? order[activeOrder.key] as TitleContent : undefined

  const prefaces = missal.preface?.list ?? []
  const preface = prefaces[Math.min(prefaceIndex, prefaces.length - 1)] as PrefaceItem | undefined
  const eucharisticPrayers = missal.eucharistic_liturgy?.list ?? []
  const ep = eucharisticPrayers[Math.min(epIndex, eucharisticPrayers.length - 1)] as TitleContent | undefined
  const faithful = missal.prayers_of_the_faithful?.list ?? []
  const faithfulItem = faithful[Math.min(faithfulIndex, faithful.length - 1)] as TitleContent | undefined
  const blessings = missal.blessing?.list ?? []
  const blessing = blessings[Math.min(blessingIndex, blessings.length - 1)] as TitleContent | undefined

  return (
    <div className="mx-auto max-w-5xl px-3 py-3">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mb-3">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="order">Order of Mass</TabsTrigger>
          <TabsTrigger value="prefaces">Prefaces ({prefaces.length})</TabsTrigger>
          <TabsTrigger value="eucharistic">Eucharistic Prayers ({eucharisticPrayers.length})</TabsTrigger>
          <TabsTrigger value="faithful">Prayers of the Faithful ({faithful.length})</TabsTrigger>
          <TabsTrigger value="blessings">Blessings ({blessings.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* pickers */}
        <div className={cn('rounded-lg border bg-card overflow-hidden', tab === 'order' && 'hidden md:block')}>
          <ul className="max-h-[65vh] overflow-y-auto slim-scroll divide-y text-sm" role="listbox" aria-label="Entries">
            {tab === 'order' && null}
            {tab === 'prefaces' &&
              prefaces.map((p, i) => (
                <li key={p.title + i}>
                  <button
                    type="button"
                    onClick={() => setPrefaceIndex(i)}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(prefaceIndex, prefaces.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {p.time && <span className="text-xs text-muted-foreground block">{p.time}</span>}
                    {p.title}
                    {p.subtitle && <span className="text-xs text-muted-foreground block">{p.subtitle}</span>}
                  </button>
                </li>
              ))}
            {tab === 'eucharistic' &&
              eucharisticPrayers.map((e, i) => (
                <li key={e.title + i}>
                  <button
                    type="button"
                    onClick={() => setEpIndex(i)}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(epIndex, eucharisticPrayers.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {e.title}
                  </button>
                </li>
              ))}
            {tab === 'faithful' &&
              faithful.map((f, i) => (
                <li key={f.title + i}>
                  <button
                    type="button"
                    onClick={() => setFaithfulIndex(i)}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(faithfulIndex, faithful.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {f.title}
                  </button>
                </li>
              ))}
            {tab === 'blessings' &&
              blessings.map((b, i) => (
                <li key={b.title + i}>
                  <button
                    type="button"
                    onClick={() => setBlessingIndex(i)}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(blessingIndex, blessings.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {b.title}
                  </button>
                </li>
              ))}
          </ul>
        </div>

        <div className="rounded-lg border">
          {tab === 'order' && (
            <>
              <div className="border-b bg-card sticky top-[52px] z-30">
                <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto slim-scroll px-3 py-1.5" role="tablist" aria-label="Order of Mass part">
                  {orderParts.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      role="tab"
                      aria-selected={activeOrder?.key === s.key}
                      onClick={() => setOrderSection(s.key)}
                      className={cn(
                        'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
                        activeOrder?.key === s.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {orderContent ? <ReadingPane dir={dir} html={orderContent.content} /> : null}
            </>
          )}
          {tab === 'prefaces' && preface && (
            <ReadingPane
              dir={dir}
              html={preface.content}
              toolbarExtra={
                <span className="text-sm font-medium">
                  {preface.time ? `${preface.time} — ` : ''}{preface.title}
                </span>
              }
            />
          )}
          {tab === 'eucharistic' && ep && (
            <ReadingPane dir={dir} html={ep.content} toolbarExtra={<span className="text-sm font-medium">{ep.title}</span>} />
          )}
          {tab === 'faithful' && faithfulItem && (
            <ReadingPane dir={dir} html={faithfulItem.content} toolbarExtra={<span className="text-sm font-medium">{faithfulItem.title}</span>} />
          )}
          {tab === 'blessings' && blessing && (
            <ReadingPane dir={dir} html={blessing.content} toolbarExtra={<span className="text-sm font-medium">{blessing.title}</span>} />
          )}
        </div>
      </div>
    </div>
  )
}
