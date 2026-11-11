'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Day, FixedTexts, ServerNotifications, Status } from './types'
import { getDay, getFixed, putDay, putFixed } from './cache'
import { todayISO } from './store'

async function j<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} → ${r.status}`)
  return r.json() as Promise<T>
}

export const fetchStatus = () => j<Status>('/api/ibreviary/status')
export const fetchDay = (lang: string, date: string) =>
  j<Day>(`/api/ibreviary/day?l=${encodeURIComponent(lang)}&d=${date}`)
export const fetchFixed = (lang: string) =>
  j<FixedTexts>(`/api/ibreviary/fixed?l=${encodeURIComponent(lang)}`)
export const fetchNotifications = (lang: string) =>
  j<ServerNotifications>(`/api/ibreviary/notifications?lang=${encodeURIComponent(lang)}`)

export function useStatus() {
  return useQuery({
    queryKey: ['ibreviary', 'status'],
    queryFn: fetchStatus,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

// Day queries hydrate from IndexedDB first so previously downloaded days work
// with no network, the same deal the app gives its users.
export function useDay(lang: string, date: string) {
  return useQuery({
    queryKey: ['ibreviary', 'day', lang, date],
    queryFn: async () => {
      try {
        const day = await fetchDay(lang, date)
        await putDay(lang, date, day)
        return day
      } catch (err) {
        const cached = await getDay<Day>(lang, date)
        if (cached) return cached
        throw err
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: Infinity,
    initialData: undefined,
    initialDataUpdatedAt: undefined,
  })
}

export function useFixed(lang: string) {
  return useQuery({
    queryKey: ['ibreviary', 'fixed', lang],
    queryFn: async () => {
      try {
        const fixed = await fetchFixed(lang)
        await putFixed(lang, fixed)
        return fixed
      } catch (err) {
        const cached = await getFixed<FixedTexts>(lang)
        if (cached) return cached
        throw err
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: Infinity,
  })
}

export function useNotifications(lang: string) {
  return useQuery({
    queryKey: ['ibreviary', 'notifications', lang],
    queryFn: () => fetchNotifications(lang),
    staleTime: 60 * 60 * 1000,
  })
}

// The app's "download the next 7 days" flow: prefetch each day so it lands
// in the query cache and IndexedDB for offline reading.
export async function downloadWeek(queryClient: QueryClient, lang: string, from = todayISO()) {
  const { shiftISO } = await import('./store')
  const dates = Array.from({ length: 7 }, (_, i) => shiftISO(from, i))
  let done = 0
  for (const d of dates) {
    try {
      await queryClient.fetchQuery({
        queryKey: ['ibreviary', 'day', lang, d],
        queryFn: async () => {
          const day = await fetchDay(lang, d)
          await putDay(lang, d, day)
          return day
        },
        staleTime: 24 * 60 * 60 * 1000,
      })
      done++
    } catch {
      // a failed day shouldn't kill the whole week download
    }
  }
  return { done, total: dates.length }
}

export function toastWeekResult(r: { done: number; total: number }, lang: string) {
  if (r.done === r.total) toast.success(`Downloaded ${r.done} days (${lang}) for offline reading`)
  else toast.warning(`${r.done} of ${r.total} days downloaded — the server may not publish all dates yet`)
}
