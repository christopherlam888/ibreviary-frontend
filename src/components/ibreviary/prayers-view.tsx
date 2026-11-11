'use client'

import { useState } from 'react'
import { useIbreviary } from '@/lib/ibreviary/store'
import { useFixed, useStatus } from '@/lib/ibreviary/hooks'
import { ReadingPane } from './reading-pane'
import { HOUR_LABELS, type HourKey, type TitleContent } from '@/lib/ibreviary/types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Search, ArrowLeft } from 'lucide-react'

type TabKey = 'prayers' | 'rites' | 'breviary' | 'masses'

const SPECIAL_HOURS: { key: 'first_vespers' | 'officeofreadings' | 'lauds' | 'daytimeprayers' | 'vespers' | 'compline'; label: string }[] = [
  { key: 'first_vespers', label: 'First Vespers' },
  { key: 'officeofreadings', label: 'Office of Readings' },
  { key: 'lauds', label: 'Morning Prayer' },
  { key: 'daytimeprayers', label: 'Daytime Prayer' },
  { key: 'vespers', label: 'Evening Prayer' },
  { key: 'compline', label: 'Night Prayer' },
]

export function PrayersView() {
  const language = useIbreviary((s) => s.language)
  const fixed = useFixed(language)
  const status = useStatus()
  const dir = status.data?.languages.list.find((l) => l.code === language)?.direction === 'rtl' ? 'rtl' : 'ltr'

  const prayerIndex = useIbreviary((s) => s.prayerIndex)
  const riteIndex = useIbreviary((s) => s.riteIndex)
  const bsIndex = useIbreviary((s) => s.breviarySpecialIndex)
  const bsHour = useIbreviary((s) => s.breviarySpecialHour)
  const msIndex = useIbreviary((s) => s.missalSpecialIndex)
  // individual selectors: zustand v5 compares by identity, one combined object
  // here would rerender on every store change
  const setPrayerIndex = useIbreviary((s) => s.setPrayerIndex)
  const setRiteIndex = useIbreviary((s) => s.setRiteIndex)
  const setBreviarySpecialIndex = useIbreviary((s) => s.setBreviarySpecialIndex)
  const setBreviarySpecialHour = useIbreviary((s) => s.setBreviarySpecialHour)
  const setMissalSpecialIndex = useIbreviary((s) => s.setMissalSpecialIndex)

  const [tab, setTab] = useState<TabKey>('prayers')
  const [query, setQuery] = useState('')
  const [msSection, setMsSection] = useState<string>('antiphon_and_opening_prayer')
  const [listOpen, setListOpen] = useState(true)

  const prayers = fixed.data?.prayers ?? []
  const rites = fixed.data?.rites ?? []
  const breviarySpecials = fixed.data?.breviary_special ?? []
  const missalSpecials = fixed.data?.missal_special ?? []

  const needle = query.trim().toLowerCase()
  const filtered = {
    prayers: needle ? prayers.filter((i) => i.title.toLowerCase().includes(needle)) : prayers,
    rites: needle ? rites.filter((i) => i.title.toLowerCase().includes(needle)) : rites,
    breviary: needle ? breviarySpecials.filter((i) => i.title.toLowerCase().includes(needle)) : breviarySpecials,
    masses: needle ? missalSpecials.filter((i) => i.title.toLowerCase().includes(needle)) : missalSpecials,
  }

  if (fixed.isPending) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-3">
        <Skeleton className="h-9 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          <Skeleton className="h-[50vh]" />
          <Skeleton className="h-[50vh]" />
        </div>
      </div>
    )
  }

  if (!fixed.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        Fixed texts are unavailable — this language has not been downloaded and no offline copy exists.
        Try again when online.
      </div>
    )
  }

  // the currently selected entry per tab
  const prayer = filtered.prayers[Math.min(prayerIndex, filtered.prayers.length - 1)]
  const rite = filtered.rites[Math.min(riteIndex, filtered.rites.length - 1)]
  const bs = filtered.breviary[Math.min(bsIndex, filtered.breviary.length - 1)]
  const ms = filtered.masses[Math.min(msIndex, filtered.masses.length - 1)]

  const bsHours = bs ? SPECIAL_HOURS.filter((h) => (bs as Record<string, unknown>)[h.key]) : []
  const bsHourKey = (bsHours.find((h) => h.key === bsHour) ?? bsHours[0])?.key
  const bsContent = bs && bsHourKey ? (bs as Record<string, TitleContent>)[bsHourKey] : undefined

  const msContent = ms ? (ms as Record<string, TitleContent>)[msSection] : undefined

  return (
    <div className="mx-auto max-w-5xl px-3 py-3">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="prayers">Prayers ({prayers.length})</TabsTrigger>
            <TabsTrigger value="rites">Rites ({rites.length})</TabsTrigger>
            <TabsTrigger value="breviary">Breviary commons ({breviarySpecials.length})</TabsTrigger>
            <TabsTrigger value="masses">Mass specials ({missalSpecials.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            className="pl-8"
            aria-label="Search titles"
          />
        </div>
        <button
          type="button"
          className="md:hidden text-sm text-muted-foreground underline"
          onClick={() => setListOpen((o) => !o)}
        >
          {listOpen ? 'Show text' : 'Show list'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className={cn('rounded-lg border bg-card overflow-hidden', !listOpen && 'hidden md:block')}>
          <ul className="max-h-[65vh] overflow-y-auto slim-scroll divide-y text-sm" role="listbox" aria-label="Entries">
            {tab === 'prayers' &&
              filtered.prayers.map((p, i) => (
                <li key={p.title + i}>
                  <button
                    type="button"
                    onClick={() => { setPrayerIndex(i); setListOpen(false) }}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(prayerIndex, filtered.prayers.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {p.title}
                  </button>
                </li>
              ))}
            {tab === 'rites' &&
              filtered.rites.map((r, i) => (
                <li key={r.title}>
                  <button
                    type="button"
                    onClick={() => { setRiteIndex(i); setListOpen(false) }}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(riteIndex, filtered.rites.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {r.title}
                  </button>
                </li>
              ))}
            {tab === 'breviary' &&
              filtered.breviary.map((b, i) => (
                <li key={b.title}>
                  <button
                    type="button"
                    onClick={() => { setBreviarySpecialIndex(i); setListOpen(false) }}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(bsIndex, filtered.breviary.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {b.title}
                  </button>
                </li>
              ))}
            {tab === 'masses' &&
              filtered.masses.map((m, i) => (
                <li key={m.title}>
                  <button
                    type="button"
                    onClick={() => { setMissalSpecialIndex(i); setListOpen(false) }}
                    className={cn(
                      'block w-full px-3 py-2 text-left hover:bg-muted',
                      i === Math.min(msIndex, filtered.masses.length - 1) && 'bg-muted font-medium'
                    )}
                  >
                    {m.title}
                  </button>
                </li>
              ))}
          </ul>
        </div>

        <div className={cn('rounded-lg border', listOpen && 'hidden md:block')}>
          {tab === 'prayers' && prayer && <ReadingPane dir={dir} html={prayer.content} toolbarExtra={<span className="text-sm font-medium">{prayer.title}</span>} />}
          {tab === 'rites' && rite && <ReadingPane dir={dir} html={rite.content} toolbarExtra={<span className="text-sm font-medium">{rite.title}</span>} />}
          {tab === 'breviary' && bs && (
            <>
              <div className="border-y bg-card sticky top-[52px] z-30">
                <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto slim-scroll px-3 py-1.5" role="tablist" aria-label="Hour">
                  {bsHours.map((h) => (
                    <button
                      key={h.key}
                      type="button"
                      role="tab"
                      aria-selected={bsHourKey === h.key}
                      onClick={() => setBreviarySpecialHour(h.key as HourKey)}
                      className={cn(
                        'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
                        bsHourKey === h.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
              {bsContent ? (
                <ReadingPane dir={dir} html={bsContent.content} />
              ) : (
                <p className="px-4 py-8 text-sm text-muted-foreground">This common has no hours in the current language.</p>
              )}
            </>
          )}
          {tab === 'masses' && ms && (
            <>
              <div className="border-y bg-card sticky top-[52px] z-30">
                <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto slim-scroll px-3 py-1.5" role="tablist" aria-label="Mass section">
                  {MASS_SPECIAL_SECTIONS.filter((s) => (ms as Record<string, unknown>)[s.key]).map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      role="tab"
                      onClick={() => setMsSection(s.key)}
                      className={cn(
                        'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
                        msSection === s.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {msContent ? (
                <ReadingPane dir={dir} html={msContent.content} />
              ) : (
                <p className="px-4 py-8 text-sm text-muted-foreground">This formulary has no sections in the current language.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const MASS_SPECIAL_SECTIONS: { key: string; label: string }[] = [
  { key: 'introduction', label: 'Introduction' },
  { key: 'antiphon_and_opening_prayer', label: 'Entrance Antiphon and Collect' },
  { key: 'prayer_of_the_faithful', label: 'Prayer of the Faithful' },
  { key: 'prayer_over_the_gifts', label: 'Prayer over the Offerings' },
  { key: 'preface', label: 'Preface' },
  { key: 'antiphon_and_prayer_after_communion', label: 'Antiphon and Prayer after Communion' },
]
