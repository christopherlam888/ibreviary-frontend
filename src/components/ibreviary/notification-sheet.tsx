'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIbreviary } from '@/lib/ibreviary/store'
import { useNotifications } from '@/lib/ibreviary/hooks'
import { ExternalLink } from 'lucide-react'

export function NotificationSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const language = useIbreviary((s) => s.language)
  const readNotifications = useIbreviary((s) => s.readNotifications)
  const markNotificationRead = useIbreviary((s) => s.markNotificationRead)
  const notifications = useNotifications(language)
  const list = notifications.data?.lista_notifiche ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Notifications ({list.length})</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-6">
          {notifications.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
          {notifications.data && list.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No server notifications for language &ldquo;{language}&rdquo;. The list varies by language and one
              localized item can appear without a translation in yours.
            </p>
          )}
          {list.map((n) => {
            const c = n.contenuto_localizzato
            const isRead = readNotifications.includes(n.id)
            return (
              <div key={n.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant={n.type === '7' ? 'secondary' : 'outline'}>type {n.type}</Badge>
                  <p className="font-medium text-sm leading-snug flex-1">
                    {c?.titolo ?? `Notification ${n.id} (no ${language} localization)`}
                  </p>
                  {!isRead && <span className="h-2 w-2 rounded-full bg-primary" aria-label="unread" />}
                </div>
                {c?.contenuto && <p className="text-sm whitespace-pre-line">{c.contenuto}</p>}
                <div className="flex gap-2">
                  {c?.link && (
                    <Button asChild size="sm" variant="outline" onClick={() => markNotificationRead(n.id)}>
                      <a href={c.link} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                        {c.link_titolo || 'Open'} <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {!c?.link && !isRead && (
                    <Button size="sm" variant="ghost" onClick={() => markNotificationRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  id {n.id} · recurring {n.regola_ricorrente} · frequency {n.giorni_frequenza} · pin {n.sempre_presente_in_home}
                </p>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
