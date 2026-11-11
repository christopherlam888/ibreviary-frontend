'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useIbreviary, type ReadingStyle } from '@/lib/ibreviary/store'
import { useStatus } from '@/lib/ibreviary/hooks'
import { clearDays, deleteFixed, listDays, listFixed } from '@/lib/ibreviary/cache'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const NO_PROPER = '__none__'

export function SettingsView() {
  const language = useIbreviary((s) => s.language)
  const setLanguage = useIbreviary((s) => s.setLanguage)
  const readingStyle = useIbreviary((s) => s.readingStyle)
  const setReadingStyle = useIbreviary((s) => s.setReadingStyle)
  const textSize = useIbreviary((s) => s.textSize)
  const setTextSize = useIbreviary((s) => s.setTextSize)
  const ttsEnabled = useIbreviary((s) => s.ttsEnabled)
  const setTtsEnabled = useIbreviary((s) => s.setTtsEnabled)
  const ttsRate = useIbreviary((s) => s.ttsRate)
  const setTtsRate = useIbreviary((s) => s.setTtsRate)
  const autoDownload = useIbreviary((s) => s.autoDownload)
  const setAutoDownload = useIbreviary((s) => s.setAutoDownload)
  const proper = useIbreviary((s) => s.proper)
  const setProper = useIbreviary((s) => s.setProper)
  const clearReadNotifications = useIbreviary((s) => s.clearReadNotifications)

  const { theme, setTheme } = useTheme()
  const status = useStatus()
  const qc = useQueryClient()
  const storage = useQuery({
    queryKey: ['ibreviary', 'storage'],
    queryFn: async () => {
      const [days, fixedLangs] = await Promise.all([listDays(), listFixed()])
      return {
        days: days.map((x) => ({ lang: x.lang, date: x.date })),
        fixedLangs,
      }
    },
    staleTime: 0,
  })

  const days = storage.data?.days ?? []
  const fixedLangs = storage.data?.fixedLangs ?? []

  const languages = status.data?.languages.list ?? []
  const propers = status.data?.event_type.list ?? []

  const dayCount = days.length
  const byLang = days.reduce<Record<string, number>>((acc, d) => {
    acc[d.lang] = (acc[d.lang] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 pb-24 md:pb-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2 max-w-sm">
            {([
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ] as const).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                aria-pressed={theme === t.value}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  theme === t.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Dark theme for night reading and low-light churches; System follows your device preference.
            The moon/sun button in the top bar toggles it anywhere.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Select value={language} onValueChange={(v) => setLanguage(v)}>
            <SelectTrigger className="w-[220px]" aria-label="Language">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.title} <span className="text-xs text-muted-foreground">({l.code})</span>
                </SelectItem>
              ))}
              {!status.data && <SelectItem value="en">English</SelectItem>}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Thirteen languages including three full rites: Ambrosian (ra), Monastic (mo), Vetus Ordo (vt).
            Arabic switches the reading direction to right-to-left.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="style">Style</label>
            <Select value={readingStyle} onValueChange={(v) => setReadingStyle(v as ReadingStyle)}>
              <SelectTrigger id="style" className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="accessible">Accessible</SelectItem>
                <SelectItem value="old">Old (Garamond)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The four reading stylesheets shipped inside the APK, ported unchanged.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="size">
              Text size <span className="text-muted-foreground">{textSize}px</span>
            </label>
            <Slider
              id="size"
              value={[textSize]}
              min={14}
              max={26}
              step={1}
              onValueChange={(v) => setTextSize(v[0])}
              aria-label="Text size"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Text-to-speech</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium" htmlFor="tts">Enable listen controls on texts</label>
            <Switch id="tts" checked={ttsEnabled} onCheckedChange={setTtsEnabled} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="rate">
              Reading speed <span className="text-muted-foreground">{ttsRate.toFixed(1)}×</span>
            </label>
            <Slider id="rate" value={[ttsRate]} min={0.5} max={2} step={0.1} onValueChange={(v) => setTtsRate(v[0])} />
          </div>
          <p className="text-xs text-muted-foreground">
            Uses the browser speech engine — the same role the app&apos;s TTS engine plays. Availability depends
            on the voices installed in the browser.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proper (celebration pin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* radix forbids empty-string item values, so None rides a sentinel */}
          <Select value={proper ?? NO_PROPER} onValueChange={(v) => setProper(v === NO_PROPER ? null : v)}>
            <SelectTrigger className="w-[220px]" aria-label="Proper">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROPER}>None</SelectItem>
              {propers.map((p) => (
                <SelectItem key={p.type} value={p.type}>
                  {p.title?.en ?? p.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Pinning a proper flags its celebrations across the day views, matching the app&apos;s Proper setting
            (Terra Santa, Guanelliani, …). It never changes the request sent upstream.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offline storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium" htmlFor="auto">Auto-download next 7 days when online</label>
            <Switch id="auto" checked={autoDownload} onCheckedChange={setAutoDownload} />
          </div>

          <div className="text-sm">
            <p className="font-medium mb-1">Cached in this browser</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{dayCount} days</Badge>
              {Object.entries(byLang).map(([lang, count]) => (
                <Badge key={lang} variant="secondary">{lang}: {count}</Badge>
              ))}
              {fixedLangs.map((l) => (
                <Badge key={l} variant="secondary">fixed: {l}</Badge>
              ))}
              {dayCount === 0 && fixedLangs.length === 0 && (
                <span className="text-xs text-muted-foreground">nothing stored yet</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => storage.refetch()}>Refresh</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await clearDays()
                for (const l of fixedLangs) await deleteFixed(l)
                await qc.invalidateQueries({ queryKey: ['ibreviary', 'storage'] })
                toast.success('Offline storage cleared')
              }}
            >
              Clear all offline data
            </Button>
            <Button variant="outline" size="sm" onClick={() => { clearReadNotifications(); toast.success('Notification read-state cleared') }}>
              Clear notification read-state
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Data source: the iBreviary JSON API (www.ibreviary.com), the same endpoints the Android app calls.
        This site is a frontend for that data and is not affiliated with Pro Terra Sancta.
      </p>
    </div>
  )
}
