import { useEffect, useRef } from 'react'
import { Lightbulb, ShieldAlert, TrendingUp } from 'lucide-react'
import type { LiveSuggestion } from '../lib/viewModel'

const TONE: Record<LiveSuggestion['tone'], { icon: React.ReactNode; className: string }> = {
  tip: { icon: <Lightbulb size={13} />, className: 'bg-green/10 text-green-dark' },
  objection: { icon: <ShieldAlert size={13} />, className: 'bg-amber/10 text-ink' },
  data: { icon: <TrendingUp size={13} />, className: 'bg-blue/10 text-ink' },
}

export function LiveSuggestions({ suggestions, visibleLines }: { suggestions: LiveSuggestion[]; visibleLines: number }) {
  const endRef = useRef<HTMLDivElement>(null)
  const visible = suggestions.filter((item) => item.afterLine <= visibleLines)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [visible.length])

  return (
    <section aria-label="Sugerencias en vivo" className="flex min-h-[220px] flex-col rounded-card border border-line bg-[#E6F8FA] lg:min-h-0">
      <header className="flex flex-none items-center justify-between gap-2 border-b border-line bg-[#C8F0F5] px-3 py-2">
        <h2 className="text-xs font-medium text-ink">Sugerencias IA en vivo</h2><span className="text-xs text-muted">{visible.length}/{suggestions.length}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3" aria-live="polite">
        <div className="flex min-h-full flex-col justify-end gap-2">
          {visible.length === 0 && <p className="text-xs text-muted">Las sugerencias aparecerán conforme avance la conversación.</p>}
          {visible.map((item, index) => {
            const isLatest = index === visible.length - 1
            return <article key={item.id} className={isLatest ? 'flex animate-rise gap-2.5 rounded-card border border-green/30 bg-surface p-3 shadow-sm' : 'flex gap-2.5 rounded-control bg-soft p-2.5 opacity-70 transition-opacity hover:opacity-100'}>
              <span className={`grid flex-none place-items-center rounded-control ${TONE[item.tone].className} ${isLatest ? 'h-7 w-7' : 'h-6 w-6'}`}>{TONE[item.tone].icon}</span>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`block font-medium text-ink ${isLatest ? 'text-sm' : 'text-xs'}`}>{item.label}</span>{isLatest && <span className="inline-flex flex-none items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-green-dark"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />Ahora</span>}</div><p className={`mt-0.5 leading-snug ${isLatest ? 'text-sm text-ink/80' : 'text-xs text-muted'}`}>{item.text}</p></div>
            </article>
          })}
          <div ref={endRef} />
        </div>
      </div>
    </section>
  )
}
