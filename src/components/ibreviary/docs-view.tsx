'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { todayISO } from '@/lib/ibreviary/store'

const ENDPOINTS = [
  { key: 'status', label: 'get_status', needs: ['—'], url: '/api/ibreviary/status' },
  { key: 'day', label: 'get_daily_text', needs: ['l', 'd'], url: '/api/ibreviary/day' },
  { key: 'fixed', label: 'get_fixed_text', needs: ['l'], url: '/api/ibreviary/fixed' },
  { key: 'notifications', label: 'getNot', needs: ['lang'], url: '/api/ibreviary/notifications' },
  { key: 'img', label: 'img_db', needs: ['id', 'n', 't'], url: '/api/ibreviary/img' },
] as const

export function DocsView() {
  const [ep, setEp] = useState<string>('day')
  const [lang, setLang] = useState('en')
  const [date, setDate] = useState(todayISO())
  const [id, setId] = useState('1320')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    const e = ENDPOINTS.find((x) => x.key === ep)!
    let url = e.url
    if (ep === 'day') url += `?l=${encodeURIComponent(lang)}&d=${date}`
    if (ep === 'fixed') url += `?l=${encodeURIComponent(lang)}`
    if (ep === 'notifications') url += `?lang=${encodeURIComponent(lang)}`
    if (ep === 'img') url += `?t=r&id=${id}&n=2`
    setLoading(true)
    setResult('')
    try {
      const r = await fetch(url)
      const ct = r.headers.get('content-type') ?? ''
      if (ct.startsWith('image/')) {
        const blob = await r.blob()
        setResult(`image/${ct.split('/')[1]} — ${(blob.size / 1024).toFixed(1)} KB, ${url}`)
      } else {
        const text = await r.text()
        try {
          const j = JSON.parse(text)
          const pretty = JSON.stringify(j, null, 2)
          setResult(pretty.length > 60000 ? pretty.slice(0, 60000) + '\n… (truncated; run it yourself for the full body)' : pretty)
        } catch {
          setResult(text.slice(0, 2000))
        }
      }
    } catch (err) {
      setResult(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 pb-24 md:pb-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>iBreviary API — reversed from Android 3.7.19</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            The app (com.netguru.ibreviary, Retrofit + Moshi, base URL http://www.ibreviary.com/) calls four JSON
            endpoints. No keys, no signing, no special headers. These routes proxy the same upstream calls with
            CORS opened, so any web client can consume them.
          </p>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1.5 pr-4 font-medium">This site</th>
                <th className="py-1.5 pr-4 font-medium">Upstream</th>
                <th className="py-1.5 font-medium">Params</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-b"><td className="py-1.5 pr-4">/api/ibreviary/status</td><td className="py-1.5 pr-4">services.php?s=get_status</td><td className="py-1.5">—</td></tr>
              <tr className="border-b"><td className="py-1.5 pr-4">/api/ibreviary/day?l=en&amp;d=2026-11-11</td><td className="py-1.5 pr-4">services.php?s=get_daily_text</td><td className="py-1.5">l, d (yyyy-MM-dd)</td></tr>
              <tr className="border-b"><td className="py-1.5 pr-4">/api/ibreviary/fixed?l=en</td><td className="py-1.5 pr-4">services.php?s=get_fixed_text</td><td className="py-1.5">l</td></tr>
              <tr className="border-b"><td className="py-1.5 pr-4">/api/ibreviary/notifications?lang=it</td><td className="py-1.5 pr-4">iOS/services.php?type=getNot</td><td className="py-1.5">lang</td></tr>
              <tr><td className="py-1.5 pr-4">/api/ibreviary/img?t=r&amp;id=1320&amp;n=2</td><td className="py-1.5 pr-4">img_db.php</td><td className="py-1.5">t, id, n (saint images)</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Tabs defaultValue="playground">
        <TabsList>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="day">Day model</TabsTrigger>
          <TabsTrigger value="fixed">Fixed texts</TabsTrigger>
          <TabsTrigger value="notes">Quirks</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="block text-xs mb-1 text-muted-foreground">Endpoint</span>
              <Input
                readOnly
                value={ENDPOINTS.find((x) => x.key === ep)!.label}
                className="w-40 font-mono text-xs"
                onFocus={(e) => e.target.select()}
              />
            </label>
            <div className="flex gap-1 flex-wrap">
              {ENDPOINTS.map((e) => (
                <Button key={e.key} size="sm" variant={ep === e.key ? 'default' : 'outline'} onClick={() => { setEp(e.key); setResult('') }}>
                  {e.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {(ep === 'day' || ep === 'fixed' || ep === 'notifications') && (
              <label className="block">
                <span className="block text-xs mb-1 text-muted-foreground">language</span>
                <Input value={lang} onChange={(e) => setLang(e.target.value)} className="w-20 font-mono" />
              </label>
            )}
            {ep === 'day' && (
              <label className="block">
                <span className="block text-xs mb-1 text-muted-foreground">date</span>
                <Input value={date} onChange={(e) => setDate(e.target.value)} className="w-32 font-mono" />
              </label>
            )}
            {ep === 'img' && (
              <label className="block">
                <span className="block text-xs mb-1 text-muted-foreground">saint id</span>
                <Input value={id} onChange={(e) => setId(e.target.value)} className="w-24 font-mono" />
              </label>
            )}
            <Button onClick={run} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Requesting…' : 'Run'}
            </Button>
          </div>
          {result && (
            <pre className="max-h-[55vh] overflow-auto slim-scroll rounded-lg border bg-card p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words">
              {result}
            </pre>
          )}
        </TabsContent>

        <TabsContent value="day" className="space-y-2 text-sm">
          <p>
            One <code className="font-mono text-xs">get_daily_text</code> response carries every celebration of the day.
            The app pages through them client-side; there is no per-celebration request.
          </p>
          <pre className="overflow-auto slim-scroll rounded-lg border bg-card p-3 text-[11px] leading-relaxed">{`{
  "day_info": { "date", "title", "day_type", "day_time", "complete", "code", "event": ["Guanelliani"] },
  "saint": [ { "id", "image", "name", "subtitle", "type", "text" } ],
  "breviary": {                       // base liturgy, e.g. Wednesday Ordinary Time
    "officeofreadings" | "lauds" | "daytimeprayers" | "vespers"
    | "compline" | "previouscompline": { "title", "content" }
  },
  "breviary_memory": [ {             // commemorations, e.g. Saint Martin of Tours
    "title", "type", "mandatory", "saint_id",
    "officeofreadings"|"lauds"|"daytimeprayers"|"vespers"|"compline": {…}
  } ],
  "missal": [ { "variant", "order", "antiphon_and_opening_prayer", "first_reading",
    "responsorial_psalm", "second_reading", "gospel_acclamation", "gospel",
    "prayer_of_the_faithful", "prayer_over_the_gifts", "preface",
    "antiphon_and_prayer_after_communion" } ],
  "missal_memory": [ { same as missal + "title", "type", "mandatory", "saint_id" } ],
  "event": [ {                        // optional celebrations keyed by proper type
    "day_info": { "date", "title", "subtitle", "type": "TerraSanta" },
    "breviary": {…}, "missal": {…}
  } ]
}`}</pre>
        </TabsContent>

        <TabsContent value="fixed" className="space-y-2 text-sm">
          <p>
            <code className="font-mono text-xs">get_fixed_text</code> (~9 MB for English) returns the
            language-static texts. Cache per language and re-fetch only when
            <code className="font-mono text-xs"> get_status.fixed_text.last_update</code> moves — the app&apos;s own invalidation rule.
          </p>
          <pre className="overflow-auto slim-scroll rounded-lg border bg-card p-3 text-[11px] leading-relaxed">{`{
  "languages": { "missal_ancor_text": [...], "readings_title" },
  "missal": {
    "order_of_mass": { "introductory_rites", "eucharistic_liturgy",
                       "communion_rites", "communion_rites_celebration",
                       "concluding_rites" },
    "preface":  { "list": [ { "time", "title", "subtitle", "content" } ] },  // 85
    "eucharistic_liturgy": { "list": [...] },                                 // 18
    "prayers_of_the_faithful": { "list": [...] },
    "blessing": { "list": [...] }
  },
  "prayers":  [ { "type", "title", "content", "use" } ],  // 130; type Guanelliani/Mercedari, use Credo
  "rites":    [ { "title", "content" } ],                 // 24: Easter Vigil, funerals, Chrism Mass…
  "breviary_special": [ { "title", "first_vespers", "officeofreadings", "lauds",
                           "daytimeprayers", "vespers", "compline" } ],  // 24 commons
  "missal_special":  [ { "title", "type", "introduction", "antiphon_and_opening_prayer",
                           "prayer_of_the_faithful", "prayer_over_the_gifts", "preface",
                           "antiphon_and_prayer_after_communion" } ],     // 161 formularies
  "last_update": "yyyy-MM-dd HH:mm"
}`}</pre>
        </TabsContent>

        <TabsContent value="notes" className="space-y-2 text-sm">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Upstream answers HTTP 200 even for degenerate bodies — treat <code className="font-mono text-xs">complete</code> and key presence as the health signal.</li>
            <li>Far-future dates (tested 2027-01-01) come back partial: empty <code className="font-mono text-xs">day_info.title</code>, no <code className="font-mono text-xs">missal</code>. The server publishes a rolling window.</li>
            <li>Past dates work (2020-11-11 returned the same St Martin memorial as 2026).</li>
            <li><code className="font-mono text-xs">ra</code>/<code className="font-mono text-xs">mo</code>/<code className="font-mono text-xs">vt</code> change the rite wholesale, not just the strings.</li>
            <li>Notification payload field names are Italian and date from the shared iOS endpoint.</li>
            <li>No CORS on the origin — that&apos;s why these proxy routes exist.</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            The full schema with field-by-field tables and raw sample payloads:{' '}
            <a className="underline" href="/docs/API_SCHEMA.md" target="_blank" rel="noopener noreferrer">
              API_SCHEMA.md
            </a>
            . It ships alongside eleven raw JSON captures in the deliverable folder.
          </p>
          <div className="flex gap-2 flex-wrap pt-1">
            <Badge variant="outline">13 languages</Badge>
            <Badge variant="outline">4 JSON endpoints</Badge>
            <Badge variant="outline">9.3 MB fixed texts (en)</Badge>
            <Badge variant="outline">no auth headers</Badge>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
