import { useEffect, useMemo, useReducer, useState } from 'react'
import { CircleAlert, RefreshCw } from 'lucide-react'
import type { CampaignHistory } from './types'
import { useDemoData } from './hooks/useDemoData'
import { TopBar } from './components/TopBar'
import { ContextRail } from './components/ContextRail'
import { IdleStage } from './components/IdleStage'
import { CallStage } from './components/CallStage'
import { WrapUpStage } from './components/WrapUpStage'
import {
  attemptToHistory, callReducer, canConfirmOutcome, exhaustedOfferIds, hasUnregisteredOffer, initialSession, isInCall,
} from './lib/callMachine'
import {
  buildCustomerView, buildHistoryView, buildIdlePrep, buildLiveSuggestions, buildOfferStackView,
  buildTranscript,
} from './lib/viewModel'

// Demo automatizada: el guion completo dura aproximadamente 24 segundos.
const TRANSCRIPT_TICK_MS = 2300
const AUTOMATION_STEP_MS = 1100

function App() {
  const { customers, offers, history, loading, error } = useDemoData()
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [session, dispatch] = useReducer(callReducer, initialSession)
  /** Ofrecimientos registrados en esta demo: se suman al historial del cliente. */
  const [sessionLog, setSessionLog] = useState<CampaignHistory[]>([])
  const [automationEnabled, setAutomationEnabled] = useState(true)

  useEffect(() => { if (!selectedId && customers.length) setSelectedId(customers[0].cliente_id) }, [customers, selectedId])
  useEffect(() => { dispatch({ type: 'reset' }) }, [selectedId])

  const customer = customers.find((item) => item.cliente_id === selectedId) ?? null
  const fullHistory = useMemo(() => [...history, ...sessionLog], [history, sessionLog])

  const offerStack = useMemo(
    () => (customer ? buildOfferStackView(customer, offers, fullHistory) : { hero: null, all: [], alternatives: [], signals: [] }),
    [customer, offers, fullHistory],
  )

  const transcript = useMemo(
    () => (customer ? buildTranscript(customer, session.segments, offerStack.hero?.likelyObjection ?? 'el precio') : []),
    [customer, session.segments, offerStack.hero],
  )

  const suggestions = useMemo(
    () => (customer ? buildLiveSuggestions(customer, offerStack.hero, session.segments) : []),
    [customer, offerStack.hero, session.segments],
  )

  useEffect(() => {
    if (!automationEnabled || !isInCall(session.phase) || session.visibleLines >= transcript.length) return
    const timer = window.setTimeout(() => dispatch({ type: 'advanceTranscript' }), TRANSCRIPT_TICK_MS)
    return () => window.clearTimeout(timer)
  }, [automationEnabled, session.phase, session.visibleLines, transcript.length])

  const filteredCustomers = useMemo(() => customers.filter((item) => {
    const text = `${item.cliente_id} ${item.tipo_cliente} ${item.ubicacion_departamento}`.toLowerCase()
    return text.includes(query.toLowerCase())
  }), [customers, query])

  const confirmOutcome = (andContinue = false) => {
    if (!customer) return
    const { presentedOffer, pendingOutcome, rejectionReason, hadObjection } = session
    if (!canConfirmOutcome(session) || !presentedOffer || !pendingOutcome) return
    const at = Date.now()
    dispatch({ type: 'confirmOutcome', at, andContinue })
    setSessionLog((current) => [
      ...current,
      attemptToHistory(customer, {
        offer: presentedOffer,
        result: pendingOutcome,
        reason: pendingOutcome === 'rejected' ? rejectionReason : null,
        hadObjection,
        at,
      }),
    ])
  }

  useEffect(() => {
    if (!automationEnabled || !customer || !offerStack.hero || !isInCall(session.phase)) return
    const lastSegment = session.segments[session.segments.length - 1]?.key
    if (session.visibleLines < transcript.length) return

    let timer: number | undefined
    if (session.phase === 'active' && lastSegment === 'opening') {
      timer = window.setTimeout(() => {
        if (!session.selectedOfferId) dispatch({ type: 'selectOffer', offerId: offerStack.hero!.id })
        else dispatch({ type: 'present', offer: offerStack.hero! })
      }, AUTOMATION_STEP_MS)
    } else if (session.phase === 'presented' && lastSegment === 'present' && session.pendingOutcome === null) {
      timer = window.setTimeout(() => dispatch({ type: 'raiseObjection' }), AUTOMATION_STEP_MS)
    } else if (session.phase === 'objection' && lastSegment === 'objection') {
      timer = window.setTimeout(() => dispatch({ type: 'handleObjection' }), AUTOMATION_STEP_MS)
    } else if (session.phase === 'presented' && lastSegment === 'objection' && session.pendingOutcome === null) {
      timer = window.setTimeout(() => dispatch({ type: 'setPendingOutcome', result: 'accepted' }), AUTOMATION_STEP_MS)
    } else if (session.phase === 'presented' && session.pendingOutcome === 'accepted') {
      timer = window.setTimeout(() => { confirmOutcome(false) }, AUTOMATION_STEP_MS)
    }
    return () => { if (timer) window.clearTimeout(timer) }
  }, [automationEnabled, customer, offerStack.hero, session.phase, session.segments, session.visibleLines, session.selectedOfferId, session.pendingOutcome, transcript.length])

  if (loading) {
    return <div className="grid min-h-dvh place-content-center justify-items-center gap-2 text-muted">
      <div className="grid h-12 w-12 place-items-center rounded-lg rounded-bl-sm bg-green text-xl font-medium text-white">M</div>
      <p className="font-medium text-ink">Preparando la vista comercial…</p>
    </div>
  }
  if (error || !customer) {
    return <div className="grid min-h-dvh place-content-center justify-items-center gap-2 text-center text-muted">
      <CircleAlert size={28} />
      <h1 className="text-lg font-medium text-ink">No pudimos cargar la demo</h1>
      <p>{error || 'No hay clientes disponibles.'}</p>
      <button className="mt-2 inline-flex h-9 items-center gap-2 rounded-control bg-green px-3 text-sm font-medium text-white" onClick={() => window.location.reload()}>
        <RefreshCw size={16} /> Reintentar
      </button>
    </div>
  }

  const customerView = buildCustomerView(customer, offers)
  const historyView = buildHistoryView(customer.cliente_id, fullHistory)
  const idlePrep = buildIdlePrep(customer, offerStack.hero)

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:overflow-hidden">
      <TopBar
        customer={customerView}
        phase={session.phase}
        canEndCall={isInCall(session.phase)}
        needsConfirmToEnd={hasUnregisteredOffer(session)}
        automationEnabled={automationEnabled}
        onToggleAutomation={() => setAutomationEnabled((current) => !current)}
        onEndCall={() => dispatch({ type: 'endCall', at: Date.now() })}
      />
      <main className="flex min-h-0 flex-1 flex-col md:flex-row md:overflow-hidden">
        <ContextRail
          customer={customerView}
          customers={filteredCustomers}
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          onSelect={setSelectedId}
          signals={offerStack.signals}
          history={historyView}
          phase={session.phase}
          startedAt={session.startedAt}
          endedAt={session.endedAt}
        />

        <section className="order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 md:order-2">
          {session.phase === 'idle' && (
            <IdleStage
              prep={idlePrep}
              offers={offerStack.all}
              onStartCall={() => { setAutomationEnabled(true); dispatch({ type: 'start', at: Date.now() }) }}
            />
          )}

          {isInCall(session.phase) && (
            <CallStage
              session={session}
              offers={offerStack.all}
              exhausted={exhaustedOfferIds(session)}
              likelyObjection={offerStack.hero?.likelyObjection ?? 'el precio'}
              rebate={offerStack.hero?.rebate ?? 'Explora la objeción puntual antes de insistir con el precio.'}
              transcript={transcript}
              suggestions={suggestions}
              onSelect={(offerId) => dispatch({ type: 'selectOffer', offerId })}
              onPresent={() => {
                const offer = offerStack.all.find((item) => item.id === session.selectedOfferId)
                if (offer) dispatch({ type: 'present', offer })
              }}
              onRaiseObjection={() => dispatch({ type: 'raiseObjection' })}
              onHandleObjection={() => dispatch({ type: 'handleObjection' })}
              onSetOutcome={(result) => dispatch({ type: 'setPendingOutcome', result })}
              onRejectionReasonChange={(reason) => dispatch({ type: 'setRejectionReason', reason })}
              onCancelOutcome={() => dispatch({ type: 'cancelOutcome' })}
              onConfirmOutcome={confirmOutcome}
            />
          )}

          {session.phase === 'wrapup' && (
            <WrapUpStage
              session={session}
              customerId={customer.cliente_id}
              onNoOfferReasonChange={(reason) => dispatch({ type: 'setNoOfferReason', reason })}
              onFinish={() => dispatch({ type: 'reset' })}
            />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
