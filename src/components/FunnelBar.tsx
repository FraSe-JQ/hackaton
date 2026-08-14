import { Check } from 'lucide-react'
import type { FunnelStep } from '../lib/viewModel'

export function FunnelBar({ steps }: { steps: FunnelStep[] }) {
  return (
    <nav aria-label="Progreso de la interacción" className="flex h-11 flex-none items-center justify-center gap-2 overflow-x-auto border-b border-line bg-surface px-6">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          {index > 0 && <span className="h-px w-6 bg-line" aria-hidden="true" />}
          <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${
              step.status === 'done' ? 'text-brand-dark' : step.status === 'active' ? 'text-ink' : 'text-muted'
            }`}
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-full border text-[10px] ${
                step.status === 'done'
                  ? 'border-brand bg-brand text-white'
                  : step.status === 'active'
                    ? 'border-brand-dark text-brand-dark'
                    : 'border-line text-muted'
              }`}
            >
              {step.status === 'done' ? <Check size={10} /> : index + 1}
            </span>
            {step.label}
          </span>
        </div>
      ))}
    </nav>
  )
}
