'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Volume2, Square } from 'lucide-react'
import { useIbreviary } from '@/lib/ibreviary/store'

interface Props {
  html: string
  dir?: 'ltr' | 'rtl'
  toolbarExtra?: React.ReactNode
}

// Renders upstream HTML fragments. The content carries in-page anchors
// (<a name="ps24">, href="#hymn">) that worked inside the app's WebView;
// here they are intercepted and turned into smooth scrolls.
export function ReadingPane({ html, dir, toolbarExtra }: Props) {
  const readingStyle = useIbreviary((s) => s.readingStyle)
  const textSize = useIbreviary((s) => s.textSize)
  const ttsRate = useIbreviary((s) => s.ttsRate)
  const setTtsRate = useIbreviary((s) => s.setTtsRate)
  const containerRef = useRef<HTMLDivElement>(null)
  const speaking = useRef(false)

  const styleClass = `liturgy liturgy-${readingStyle}`

  const onClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const anchor = target.closest?.('a') as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute('href') ?? ''
    if (!href.startsWith('#')) return
    const name = href.slice(1)
    const root = containerRef.current
    if (!root || !name) return
    const dest =
      root.querySelector(`a[name="${name}"]`) ??
      root.querySelector(`[id="${name}"]`) ??
      root.querySelector(`[name="${name}"]`)
    if (dest) {
      e.preventDefault()
      dest.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const stopSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    speaking.current = false
    window.speechSynthesis.cancel()
  }, [])

  useEffect(() => stopSpeech, [stopSpeech, html])

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const root = containerRef.current
    if (!root || !root.innerText.trim()) return
    stopSpeech()
    speaking.current = true
    // chunk at sentence ends so the stop button takes effect immediately
    const text = root.innerText.replace(/\s+/g, ' ').trim()
    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text]
    for (const s of sentences) {
      if (!speaking.current) break
      const u = new SpeechSynthesisUtterance(s.trim())
      u.rate = ttsRate
      window.speechSynthesis.speak(u)
    }
  }, [ttsRate, stopSpeech])

  const hasTts = useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    []
  )

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2 border-b flex-wrap">
        {hasTts && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={speak}
              aria-label="Read this text aloud"
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Listen
            </Button>
            <Button variant="ghost" size="sm" onClick={stopSpeech} aria-label="Stop reading" className="gap-2">
              <Square className="h-4 w-4" />
              Stop
            </Button>
            <div className="flex items-center gap-2 w-40">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Speed</span>
              <Slider
                value={[ttsRate]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(v) => setTtsRate(v[0])}
                aria-label="Reading speed"
              />
            </div>
          </>
        )}
        {toolbarExtra}
      </div>
      <div
        ref={containerRef}
        className={styleClass}
        dir={dir}
        style={{ ['--liturgy-size' as string]: `${textSize}px` }}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
