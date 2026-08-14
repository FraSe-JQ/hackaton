import { useEffect, useRef } from 'react'
import { Headphones, UserRound } from 'lucide-react'
import type { TranscriptLine } from '../lib/viewModel'

export function TranscriptPanel({ transcript, visibleLines }: { transcript: TranscriptLine[]; visibleLines: number }) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [visibleLines])

  const streaming = visibleLines < transcript.length

  return (
    <section aria-label="Transcripción" className="flex min-h-[220px] flex-col rounded-card border border-line bg-surface lg:min-h-0">
      <header className="flex flex-none items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="text-xs font-medium text-ink">Transcripción</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${streaming ? 'animate-pulse bg-green' : 'bg-line'}`} />
          {streaming ? 'En vivo' : 'Sin audio nuevo'}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {visibleLines === 0 && <p className="text-xs text-muted">Escuchando el inicio de la conversación…</p>}
        {transcript.slice(0, visibleLines).map((line, index) => (
          <div key={index} className={`max-w-[88%] ${line.speaker === 'Asesor' ? 'ml-auto text-right' : ''}`}>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${line.speaker === 'Asesor' ? 'justify-end text-blue' : 'text-muted'}`}>
              {line.speaker === 'Cliente' ? <UserRound size={12} /> : <Headphones size={12} />}
              {line.speaker}
            </span>
            <p className={`mt-1 inline-block rounded-control px-3 py-2 text-sm leading-snug text-ink ${line.speaker === 'Asesor' ? 'bg-blue/10' : 'bg-soft'}`}>
              {line.text}
            </p>
          </div>
        ))}
        {streaming && (
          <div className="flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
            <span className="h-1 w-1 animate-pulse rounded-full bg-green" />
            Transcribiendo…
          </div>
        )}
        <div ref={endRef} />
      </div>
    </section>
  )
}
