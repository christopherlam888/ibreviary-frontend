'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HourKey, VariantRef } from '@/lib/ibreviary/types'

export type ViewName = 'home' | 'breviary' | 'readings' | 'prayers' | 'missal' | 'settings' | 'docs'
export type ReadingStyle = 'default' | 'night' | 'accessible' | 'old'

interface IbreviaryState {
  // persisted settings, mirroring the app's SharedPreferences
  language: string
  readingStyle: ReadingStyle
  textSize: number
  ttsEnabled: boolean
  ttsRate: number
  autoDownload: boolean
  proper: string | null
  readNotifications: string[]

  // session navigation state
  view: ViewName
  date: string // ISO yyyy-MM-dd
  hour: HourKey
  variant: VariantRef
  prayerIndex: number
  riteIndex: number
  breviarySpecialIndex: number
  breviarySpecialHour: HourKey
  missalSpecialIndex: number
  missalTab: 'order' | 'prefaces' | 'eucharistic' | 'faithful' | 'blessings'
  missalOrderSection: string

  setLanguage: (l: string) => void
  setReadingStyle: (s: ReadingStyle) => void
  setTextSize: (n: number) => void
  setTtsEnabled: (b: boolean) => void
  setTtsRate: (n: number) => void
  setAutoDownload: (b: boolean) => void
  setProper: (p: string | null) => void
  markNotificationRead: (id: string) => void
  clearReadNotifications: () => void

  setView: (v: ViewName) => void
  setDate: (d: string) => void
  setHour: (h: HourKey) => void
  setVariant: (v: VariantRef) => void
  setPrayerIndex: (i: number) => void
  setRiteIndex: (i: number) => void
  setBreviarySpecialIndex: (i: number) => void
  setBreviarySpecialHour: (h: HourKey) => void
  setMissalSpecialIndex: (i: number) => void
  setMissalTab: (t: IbreviaryState['missalTab']) => void
  setMissalOrderSection: (s: string) => void
}

export const useIbreviary = create<IbreviaryState>()(
  persist(
    (set) => ({
      language: 'en',
      readingStyle: 'default',
      textSize: 17,
      ttsEnabled: false,
      ttsRate: 1,
      autoDownload: false,
      proper: null,
      readNotifications: [],

      view: 'home',
      date: todayISO(),
      hour: 'lauds',
      variant: { kind: 'base', index: 0 },
      prayerIndex: 0,
      riteIndex: 0,
      breviarySpecialIndex: 0,
      breviarySpecialHour: 'lauds',
      missalSpecialIndex: 0,
      missalTab: 'order',
      missalOrderSection: 'introductory_rites',

      setLanguage: (l) => set({ language: l }),
      setReadingStyle: (s) => set({ readingStyle: s }),
      setTextSize: (n) => set({ textSize: n }),
      setTtsEnabled: (b) => set({ ttsEnabled: b }),
      setTtsRate: (n) => set({ ttsRate: n }),
      setAutoDownload: (b) => set({ autoDownload: b }),
      setProper: (p) => set({ proper: p }),
      markNotificationRead: (id) => set((s) => ({ readNotifications: [...s.readNotifications, id] })),
      clearReadNotifications: () => set({ readNotifications: [] }),

      setView: (v) => set({ view: v }),
      setDate: (d) => set({ date: d, variant: { kind: 'base', index: 0 } }),
      setHour: (h) => set({ hour: h }),
      setVariant: (v) => set({ variant: v }),
      setPrayerIndex: (i) => set({ prayerIndex: i }),
      setRiteIndex: (i) => set({ riteIndex: i }),
      setBreviarySpecialIndex: (i) => set({ breviarySpecialIndex: i }),
      setBreviarySpecialHour: (h) => set({ breviarySpecialHour: h }),
      setMissalSpecialIndex: (i) => set({ missalSpecialIndex: i }),
      setMissalTab: (t) => set({ missalTab: t }),
      setMissalOrderSection: (s) => set({ missalOrderSection: s }),
    }),
    {
      name: 'ibreviary-settings',
      partialize: (s) => ({
        language: s.language,
        readingStyle: s.readingStyle,
        textSize: s.textSize,
        ttsEnabled: s.ttsEnabled,
        ttsRate: s.ttsRate,
        autoDownload: s.autoDownload,
        proper: s.proper,
        readNotifications: s.readNotifications,
      }),
    }
  )
)

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

export function isoWeekday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
}

export function prettyISO(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
