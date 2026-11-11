'use client'

import { useState } from 'react'
import { Providers } from '@/components/ibreviary/providers'
import { TopBar } from '@/components/ibreviary/top-bar'
import { SectionNav } from '@/components/ibreviary/section-nav'
import { HomeView } from '@/components/ibreviary/home-view'
import { BreviaryView } from '@/components/ibreviary/breviary-view'
import { ReadingsView } from '@/components/ibreviary/readings-view'
import { PrayersView } from '@/components/ibreviary/prayers-view'
import { MissalView } from '@/components/ibreviary/missal-view'
import { SettingsView } from '@/components/ibreviary/settings-view'
import { DocsView } from '@/components/ibreviary/docs-view'
import { NotificationSheet } from '@/components/ibreviary/notification-sheet'
import { useIbreviary } from '@/lib/ibreviary/store'
import { useNotifications } from '@/lib/ibreviary/hooks'

export default function Home() {
  return (
    <Providers>
      <Shell />
    </Providers>
  )
}

function Shell() {
  const view = useIbreviary((s) => s.view)
  const language = useIbreviary((s) => s.language)
  const readNotifications = useIbreviary((s) => s.readNotifications)
  const [bellOpen, setBellOpen] = useState(false)
  const notifications = useNotifications(language)
  const unread = (notifications.data?.lista_notifiche ?? []).filter(
    (n) => !readNotifications.includes(n.id)
  ).length

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar onBell={() => setBellOpen(true)} unread={unread} />
      <SectionNav />
      <main className="flex-1">
        {view === 'home' && <HomeView />}
        {view === 'breviary' && <BreviaryView />}
        {view === 'readings' && <ReadingsView />}
        {view === 'prayers' && <PrayersView />}
        {view === 'missal' && <MissalView />}
        {view === 'settings' && <SettingsView />}
        {view === 'docs' && <DocsView />}
      </main>
      <footer className="mt-auto border-t bg-card py-3 hidden md:block">
        <p className="mx-auto max-w-5xl px-4 text-xs text-muted-foreground">
          iBreviary Web — a frontend for the JSON API the iBreviary Android app (3.7.19) talks to.
          Liturgical texts © their publishers; served via www.ibreviary.com. Not affiliated with Pro Terra Sancta.
        </p>
      </footer>
      <NotificationSheet open={bellOpen} onOpenChange={setBellOpen} />
    </div>
  )
}
