import type { Customer } from '../types'
import type { CustomerView, HistoryEntryView, ModelSignal } from '../lib/viewModel'
import type { CallPhase } from '../lib/callMachine'
import { CallTimer } from './CallTimer'
import { CustomerIdentity } from './CustomerIdentity'
import { ModelSignals } from './ModelSignals'
import { OfferHistory } from './OfferHistory'

export function ContextRail({
  customer,
  customers,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  signals,
  history,
  phase,
  startedAt,
  endedAt,
}: {
  customer: CustomerView
  customers: Customer[]
  query: string
  onQueryChange: (value: string) => void
  selectedId: string
  onSelect: (id: string) => void
  signals: ModelSignal[]
  history: HistoryEntryView[]
  phase: CallPhase
  startedAt: number | null
  endedAt: number | null
}) {
  const inCall = phase !== 'idle'

  return (
    <aside className="order-2 flex min-h-0 w-full flex-col gap-3 overflow-y-auto border-line bg-[#f8faf9] p-4 md:order-1 md:w-[270px] md:flex-none md:border-r">
      {inCall && startedAt !== null && <CallTimer startedAt={startedAt} endedAt={endedAt} />}

      {/* En llamada el historial sube al tope: es lo que el asesor necesita citar ante "ya me ofrecieron eso". */}
      {inCall && <OfferHistory entries={history} defaultOpen />}
      {inCall && <ModelSignals signals={signals} sticky />}

      <CustomerIdentity
        customer={customer}
        customers={customers}
        query={query}
        onQueryChange={onQueryChange}
        selectedId={selectedId}
        onSelect={onSelect}
        locked={inCall}
        dense={inCall}
      />

      {!inCall && <ModelSignals signals={signals} />}
      {!inCall && <OfferHistory entries={history} />}
    </aside>
  )
}
