'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useIbreviary, todayISO } from '@/lib/ibreviary/store'
import { downloadWeek } from '@/lib/ibreviary/hooks'

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
        },
      })
  )

  return (
    <QueryClientProvider client={qc}>
      <AutoDownload client={qc} />
      {children}
      <ThemedToaster />
    </QueryClientProvider>
  )
}

// Toasts follow the site theme (light/dark) instead of the OS default.
function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return <Toaster position="top-center" richColors theme={resolvedTheme ?? 'system'} />
}

// Mirrors the app's auto-download setting: on load, quietly fetch the next
// 7 days so they are readable with no network later.
function AutoDownload({ client }: { client: QueryClient }) {
  const autoDownload = useIbreviary((s) => s.autoDownload)
  const language = useIbreviary((s) => s.language)

  useEffect(() => {
    if (!autoDownload) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    downloadWeek(client, language, todayISO()).catch(() => {})
  }, [autoDownload, language, client])

  return null
}
