import type { Customer } from '../types'
import type { CustomerView, HistoryEntryView, ModelSignal } from '../lib/viewModel'
import { isInCall, type CallPhase } from '../lib/callMachine'
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
  const inCall = isInCall(phase)

  return (
    <aside className="relative z-[1000] order-2 flex min-h-0 w-full flex-col gap-3 overflow-y-auto border-line bg-[#F7FBFC] p-4 md:order-1 md:w-[270px] md:flex-none md:overflow-visible md:border-r">
      {inCall && startedAt !== null && <CallTimer startedAt={startedAt} endedAt={endedAt} />}

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

      {inCall && <OfferHistory entries={history} defaultOpen />}
      {inCall && <ModelSignals signals={signals} sticky />}
      {!inCall && <ModelSignals signals={signals} />}
      {!inCall && <OfferHistory entries={history} />}
    </aside>
  )
}
