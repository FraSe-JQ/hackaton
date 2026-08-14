import type { HistoryEntryView } from '../lib/viewModel'
import { Collapsible } from './ui/Collapsible'

const TONE_CLASS: Record<HistoryEntryView['resultTone'], string> = {
  accepted: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
  pending: 'bg-cyan-soft text-cyan',
}

export function OfferHistory({ entries, defaultOpen = false }: { entries: HistoryEntryView[]; defaultOpen?: boolean }) {
  return (
    <Collapsible title={`Historial de ofrecimientos (${entries.length})`} defaultOpen={defaultOpen}>
      {entries.length === 0 ? (
        <p className="rounded-control bg-canvas p-2.5 text-xs text-muted">Este cliente todavía no tiene ofrecimientos registrados.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {entries.slice(0, 4).map((item) => (
            <li key={item.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-2 border-b border-line pb-2.5 last:border-0 last:pb-0">
              <span className={`text-xs font-medium leading-tight ${item.isSession ? 'text-brand-dark' : 'text-muted'}`}>
                {item.isSession ? 'HOY' : item.dateLabel}
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-xs font-medium text-ink">
                  {item.offerName}
                  {item.isSession && <span className="ml-1 rounded bg-cyan-soft px-1 py-0.5 text-[10px] font-medium text-brand-dark">esta llamada</span>}
                </strong>
                <span className="block truncate text-xs text-muted">{item.channel}{item.reasonLabel ? ` · ${item.reasonLabel}` : ''}</span>
              </div>
              <span className={`whitespace-nowrap rounded-control px-1.5 py-0.5 text-xs font-medium ${TONE_CLASS[item.resultTone]}`}>{item.resultLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </Collapsible>
  )
}
