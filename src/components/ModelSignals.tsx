import { Minus, Plus } from 'lucide-react'
import type { ModelSignal } from '../lib/viewModel'

export function ModelSignals({ signals, sticky = false }: { signals: ModelSignal[]; sticky?: boolean }) {
  if (!signals.length) return null
  return (
    <div className={`border-t border-line pt-3 ${sticky ? 'sticky top-0 z-10 -mx-4 border-b bg-surface px-4 pb-3' : ''}`}>
      <span className="block text-xs font-medium text-muted">Señales del modelo</span>
      <ul className="mt-2.5 flex flex-col gap-2">
        {signals.map((signal, index) => (
          <li key={index} className="flex items-start gap-2 text-xs leading-snug text-ink">
            <span
              className={`mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full ${
                signal.direction === 'favor' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
              }`}
              aria-hidden="true"
            >
              {signal.direction === 'favor' ? <Plus size={10} /> : <Minus size={10} />}
            </span>
            <span>
              {signal.text}
              <span className="sr-only">{signal.direction === 'favor' ? ' (a favor)' : ' (en contra)'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
