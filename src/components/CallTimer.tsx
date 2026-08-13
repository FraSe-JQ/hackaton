import { useEffect, useState } from 'react'
import { PhoneCall, PhoneOff } from 'lucide-react'

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60).toString().padStart(2, '0')
  const seconds = (total % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function CallTimer({ startedAt, endedAt }: { startedAt: number; endedAt: number | null }) {
  const running = endedAt === null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const elapsed = (endedAt ?? now) - startedAt

  return (
    <div
      className={`flex flex-none items-center gap-2 rounded-card border px-3 py-2 ${
        running ? 'border-green/40 bg-green/5' : 'border-line bg-surface'
      }`}
      aria-label="Duración de la llamada"
    >
      <span className={`grid h-6 w-6 flex-none place-items-center rounded-control ${running ? 'bg-green/10 text-green-dark' : 'bg-soft text-muted'}`}>
        {running ? <PhoneCall size={13} /> : <PhoneOff size={13} />}
      </span>
      <div className="min-w-0">
        <span className="block text-xs text-muted">{running ? 'Llamada en curso' : 'Duración final'}</span>
        <strong className="block font-mono text-sm font-medium tabular-nums text-ink" aria-live="off">
          {formatElapsed(elapsed)}
        </strong>
      </div>
      {running && <span className="ml-auto h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-green" />}
    </div>
  )
}
