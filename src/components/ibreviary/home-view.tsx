'use client'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useIbreviary, prettyISO, todayISO, shiftISO } from '@/lib/ibreviary/store'
import { useDay, useStatus, useNotifications, downloadWeek } from '@/lib/ibreviary/hooks'
import { buildVariants } from './variant-picker'
import { HOUR_LABELS, type HourKey, type Saint } from '@/lib/ibreviary/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, BookOpen, WifiOff } from 'lucide-react'
import { useState } from 'react'

export function HomeView() {
  const language = useIbreviary((s) => s.language)
  const date = useIbreviary((s) => s.date)
  const setView = useIbreviary((s) => s.setView)
  const setHour = useIbreviary((s) => s.setHour)
  const setVariant = useIbreviary((s) => s.setVariant)
  const day = useDay(language, date)
  const status = useStatus()
  const qc = useQueryClient()
  const [downloading, setDownloading] = useState(false)

  const saints = day.data?.saint ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 pb-24 md:pb-8 space-y-4">
      {/* calendar header */}
      <section aria-label="Liturgical day">
        {day.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : day.data ? (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <CardTitle className="text-lg leading-snug">
                  {day.data.day_info.title || 'Texts not published for this date'}
                </CardTitle>
                <Badge variant="outline">{day.data.day_info.day_type}</Badge>
                <Badge variant="outline">{day.data.day_info.day_time}</Badge>
                {day.data.day_info.code && (
                  <span className="text-xs text-muted-foreground font-mono">{day.data.day_info.code}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{day.data.day_info.date}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Language {language} · {prettyISO(date)} · {day.data.day_info.complete === 1 ? 'texts complete' : 'partial texts'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                No data for this day and it is not in offline storage. Pick another day or retry when online.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* celebrations */}
      {day.data && (
        <section aria-label="Celebrations of this day" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Celebrations ({buildVariants(day.data).length})
          </h2>
          <p className="text-sm text-muted-foreground -mt-2">
            One request returns them all: the weekday liturgy, its commemorations, and any optional celebrations.
            The picker the app has — same data.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {buildVariants(day.data).map((v) => (
              <Card
                key={`${v.ref.kind}-${v.ref.index}`}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => {
                  setVariant(v.ref)
                  setView('breviary')
                }}
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-base leading-snug">{v.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  {v.kind === 'base' && <Badge>base liturgy</Badge>}
                  {v.kind === 'memory' && <Badge variant="secondary">commemoration</Badge>}
                  {v.kind === 'event' && <Badge variant="secondary">optional celebration</Badge>}
                  {v.sub && <Badge variant="outline">{v.sub}</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> open in Breviary
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* saints of the day */}
      {saints.length > 0 && (
        <section aria-label="Saints of the day" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Saints</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saints.map((s) => (
              <SaintCard key={s.id} saint={s} />
            ))}
          </div>
        </section>
      )}

      {/* quick hours */}
      {day.data?.breviary && (
        <section aria-label="Hours" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hours</h2>
          <div className="flex flex-wrap gap-2">
            {(['officeofreadings', 'lauds', 'daytimeprayers', 'vespers', 'compline', 'previouscompline'] as HourKey[])
              .filter((h) => day.data?.breviary?.[h])
              .map((h) => (
                <Button
                  key={h}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVariant({ kind: 'base', index: 0 })
                    setHour(h)
                    setView('breviary')
                  }}
                >
                  {HOUR_LABELS[h]}
                </Button>
              ))}
          </div>
        </section>
      )}

      {/* offline downloads */}
      <section aria-label="Offline" className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Offline</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true)
              const r = await downloadWeek(qc, language, todayISO())
              setDownloading(false)
              if (r.done === r.total) toast.success(`Downloaded ${r.done} days (${language}) for offline reading`)
              else toast.warning(`${r.done} of ${r.total} days downloaded — the server may not publish all dates yet`)
            }}
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Downloading…' : 'Download next 7 days'}
          </Button>
          <span className="text-xs text-muted-foreground">
            Days are stored in this browser (IndexedDB), the web equivalent of the app&apos;s offline day storage.
          </span>
        </div>
      </section>
    </div>
  )
}

function SaintCard({ saint }: { saint: Saint }) {
  const [open, setOpen] = useState(false)
  const img = saint.image?.replace(/^http:\/\/www\.ibreviary\.com\/img_db\.php\?/, '/api/ibreviary/img?') ?? ''
  return (
    <Card>
      <CardContent className="flex gap-3 pt-4">
        {img && (
          <img
            src={img}
            alt={saint.name}
            className="h-16 w-16 rounded-md border object-cover"
            loading="lazy"
            width={64}
            height={64}
          />
        )}
        <div className="min-w-0">
          <p className="font-medium leading-snug">{saint.name}</p>
          <p className="text-sm text-muted-foreground">{saint.subtitle}</p>
          <Badge variant="outline" className="mt-1">{saint.type}</Badge>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="link" size="sm" className="h-6 px-0 mt-1">
                Read the life
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {saint.name} <span className="text-sm font-normal text-muted-foreground">— {saint.subtitle}</span>
                </DialogTitle>
              </DialogHeader>
              <div
                className="liturgy liturgy-default max-h-[60vh] overflow-y-auto slim-scroll -mx-2"
                dangerouslySetInnerHTML={{ __html: saint.text }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
