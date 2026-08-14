import { ArrowUpRight, Check, MessageCircleWarning, RotateCcw, Sparkles, X } from 'lucide-react'
import type { LiveSuggestion, OfferSummary, TranscriptLine } from '../lib/viewModel'
import { type AttemptResult, type CallSession, canConfirmOutcome, canOfferAnother } from '../lib/callMachine'
import { REJECTION_REASON_OPTIONS } from '../lib/format'
import { OfferTile, RANK_LABEL } from './OfferTile'
import { TranscriptPanel } from './TranscriptPanel'
import { LiveSuggestions } from './LiveSuggestions'

export function CallStage({
  session,
  offers,
  exhausted,
  likelyObjection,
  rebate,
  transcript,
  suggestions,
  onSelect,
  onPresent,
  onRaiseObjection,
  onHandleObjection,
  onSetOutcome,
  onRejectionReasonChange,
  onCancelOutcome,
  onConfirmOutcome,
}: {
  session: CallSession
  offers: OfferSummary[]
  exhausted: string[]
  likelyObjection: string
  rebate: string
  transcript: TranscriptLine[]
  suggestions: LiveSuggestion[]
  onSelect: (id: string) => void
  onPresent: () => void
  onRaiseObjection: () => void
  onHandleObjection: () => void
  onSetOutcome: (result: AttemptResult) => void
  onRejectionReasonChange: (reason: string) => void
  onCancelOutcome: () => void
  onConfirmOutcome: (andContinue?: boolean) => void
}) {
  const { phase, presentedOffer, pendingOutcome, selectedOfferId, rejectionReason } = session
  const selected = offers.find((offer) => offer.id === selectedOfferId) ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {phase === 'active' && (
        <>
          <PresentBar canPresent={Boolean(selected)} selectedName={selected?.name ?? null} retrying={session.attempts.length > 0} onPresent={onPresent} />
          <div className="grid flex-none grid-cols-1 gap-2.5 sm:grid-cols-3">
            {offers.map((offer) => (
              <OfferTile
                key={offer.id}
                offer={offer}
                selected={offer.id === selectedOfferId}
                exhausted={exhausted.includes(offer.id)}
                onSelect={() => onSelect(offer.id)}
              />
            ))}
          </div>
        </>
      )}

      {phase !== 'active' && presentedOffer && (
        <>
          {pendingOutcome !== null ? (
            <ConfirmBar
              pendingOutcome={pendingOutcome}
              rejectionReason={rejectionReason}
              canConfirm={canConfirmOutcome(session)}
              canOfferAnother={canOfferAnother(session, offers.length)}
              onRejectionReasonChange={onRejectionReasonChange}
              onConfirm={onConfirmOutcome}
              onCancel={onCancelOutcome}
            />
          ) : phase === 'objection' ? (
            <ObjectionBar likelyObjection={likelyObjection} onHandled={onHandleObjection} onReject={() => onSetOutcome('rejected')} />
          ) : (
            <ResponseBar onSetOutcome={onSetOutcome} onRaiseObjection={onRaiseObjection} />
          )}

          <PresentedOffer offer={presentedOffer} pendingOutcome={pendingOutcome} objecting={phase === 'objection'} rebate={rebate} />
        </>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1.1fr_1fr]">
        <TranscriptPanel transcript={transcript} visibleLines={session.visibleLines} />
        <LiveSuggestions suggestions={suggestions} visibleLines={session.visibleLines} />
      </div>
    </div>
  )
}

function PresentBar({ canPresent, selectedName, retrying, onPresent }: { canPresent: boolean; selectedName: string | null; retrying: boolean; onPresent: () => void }) {
  return (
    <div className="flex flex-none items-center justify-between gap-3">
      <p className="min-w-0 truncate text-xs text-muted">
        {canPresent
          ? <>Seleccionado: <strong className="font-medium text-ink">{selectedName}</strong></>
          : retrying
            ? 'Elige otra oferta para el segundo intento.'
            : 'Selecciona uno de los 3 planes para poder presentarlo.'}
      </p>
      <button
        type="button"
        onClick={onPresent}
        disabled={!canPresent}
        className="inline-flex h-9 flex-none items-center gap-2 rounded-control bg-green px-4 text-xs font-medium text-white transition-colors hover:bg-[#087b4b] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        <ArrowUpRight size={14} /> Presentar oferta
      </button>
    </div>
  )
}

function ResponseBar({ onSetOutcome, onRaiseObjection }: { onSetOutcome: (result: AttemptResult) => void; onRaiseObjection: () => void }) {
  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted">Oferta presentada · registra la respuesta del cliente</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRaiseObjection}
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-xs font-medium text-ink transition-colors hover:border-amber"
        >
          <MessageCircleWarning size={14} /> Objeción
        </button>
        <button
          type="button"
          onClick={() => onSetOutcome('accepted')}
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-xs font-medium text-ink transition-colors hover:border-green"
        >
          <Check size={14} /> Aceptado
        </button>
        <button
          type="button"
          onClick={() => onSetOutcome('rejected')}
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-xs font-medium text-ink transition-colors hover:border-red"
        >
          <X size={14} /> Rechazado
        </button>
      </div>
    </div>
  )
}

function ObjectionBar({ likelyObjection, onHandled, onReject }: { likelyObjection: string; onHandled: () => void; onReject: () => void }) {
  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-2 rounded-card border border-amber/40 bg-amber/5 px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs text-ink">
        <MessageCircleWarning size={14} className="flex-none text-amber" />
        Objeción en curso · usa el rebate para <strong className="font-medium">{likelyObjection.toLowerCase()}</strong>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReject}
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-xs font-medium text-ink transition-colors hover:border-red"
        >
          <X size={14} /> No se superó
        </button>
        <button
          type="button"
          onClick={onHandled}
          className="inline-flex h-9 items-center gap-1.5 rounded-control bg-green px-4 text-xs font-medium text-white transition-colors hover:bg-[#087b4b]"
        >
          <Check size={14} /> Objeción superada
        </button>
      </div>
    </div>
  )
}

function ConfirmBar({
  pendingOutcome,
  rejectionReason,
  canConfirm,
  canOfferAnother: offerAnotherAvailable,
  onRejectionReasonChange,
  onConfirm,
  onCancel,
}: {
  pendingOutcome: AttemptResult
  rejectionReason: string
  canConfirm: boolean
  canOfferAnother: boolean
  onRejectionReasonChange: (reason: string) => void
  onConfirm: (andContinue?: boolean) => void
  onCancel: () => void
}) {
  const accepted = pendingOutcome === 'accepted'
  return (
    <div className={`flex flex-none flex-wrap items-center justify-between gap-2 rounded-card border px-3 py-2 ${accepted ? 'border-green/40 bg-green/5' : 'border-red/40 bg-red/5'}`}>
      <p className="text-xs text-ink">
        Vas a registrar: <strong className={`font-medium ${accepted ? 'text-green-dark' : 'text-red'}`}>{accepted ? 'Aceptado' : 'Rechazado'}</strong>
        <span className="text-muted"> · al registrar se finaliza la llamada</span>
      </p>
      <div className="flex items-center gap-2">
        {!accepted && (
          <select
            value={rejectionReason}
            onChange={(event) => onRejectionReasonChange(event.target.value)}
            aria-label="Motivo del rechazo"
            className="h-9 rounded-control border border-line bg-surface px-2.5 text-xs text-ink"
          >
            <option value="">Motivo del rechazo…</option>
            {REJECTION_REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-control border border-line bg-surface px-3 text-xs font-medium text-muted"
        >
          Cancelar
        </button>
        {offerAnotherAvailable && (
          <button
            type="button"
            onClick={() => onConfirm(true)}
            disabled={!canConfirm}
            title={!canConfirm ? 'Selecciona el motivo del rechazo' : undefined}
            className="inline-flex h-9 items-center gap-1.5 rounded-control border border-green bg-surface px-3 text-xs font-medium text-green-dark transition-colors hover:bg-green/5 disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
          >
            <RotateCcw size={14} /> Registrar y ofrecer otra
          </button>
        )}
        <button
          type="button"
          onClick={() => onConfirm(false)}
          disabled={!canConfirm}
          title={!canConfirm ? 'Selecciona el motivo del rechazo' : undefined}
          className="inline-flex h-9 items-center gap-1.5 rounded-control bg-green-dark px-4 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          <Check size={14} /> Registrar y finalizar
        </button>
      </div>
    </div>
  )
}

function PresentedOffer({ offer, pendingOutcome, objecting, rebate }: { offer: OfferSummary; pendingOutcome: AttemptResult | null; objecting: boolean; rebate: string }) {
  return (
    <section
      aria-label="Oferta presentada"
      className={`flex-none rounded-card border-2 bg-surface p-3 ${
        pendingOutcome === 'accepted' ? 'border-green' : pendingOutcome === 'rejected' ? 'border-red' : objecting ? 'border-amber/50' : 'border-green/40'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-dark">
            <Sparkles size={12} /> {RANK_LABEL[offer.rank]} · presentada
          </span>
          <strong className="mt-0.5 block truncate text-base font-medium text-ink">{offer.name}</strong>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{offer.reason}</p>
        </div>

        <dl className="hidden flex-none gap-4 text-xs md:flex">
          <Metric label="Precio" value={offer.priceLabel} hint={offer.savingsLabel} />
          <Metric label="Datos" value={offer.gbLabel} />
          <Metric label="Delta" value={offer.deltaLabel} tone={offer.deltaTone === 'up' ? 'text-green-dark' : 'text-amber'} />
        </dl>

        <div className="flex-none text-right">
          <strong className="block text-lg font-medium leading-none text-green-dark">{offer.probability}%</strong>
          <span className="block text-xs text-muted">probabilidad</span>
        </div>

        {pendingOutcome && (
          <span className={`flex-none rounded-control px-2.5 py-1 text-xs font-medium ${pendingOutcome === 'accepted' ? 'bg-green/10 text-green-dark' : 'bg-red/10 text-red'}`}>
            {pendingOutcome === 'accepted' ? 'Aceptado' : 'Rechazado'}
          </span>
        )}
      </div>

      {objecting && (
        <p className="mt-2.5 rounded-control bg-amber/10 p-2.5 text-xs leading-snug text-ink">
          <strong className="font-medium">Rebate sugerido:</strong> {rebate}
        </p>
      )}
    </section>
  )
}

function Metric({ label, value, hint, tone = 'text-ink' }: { label: string; value: string; hint?: string | null; tone?: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className={`mt-0.5 font-medium ${tone}`}>{value}</dd>
      {hint && <dd className="mt-0.5 text-green-dark">{hint}</dd>}
    </div>
  )
}
