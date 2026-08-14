import { Check, CircleAlert, Clock, MessageCircleWarning, RotateCcw, X } from 'lucide-react'
import type { CallSession, OfferAttempt } from '../lib/callMachine'
import { REJECTION_REASON_OPTIONS, formatRejectionReason } from '../lib/format'

const NO_OFFER_REASONS = [
  { value: 'sin_interes', label: 'El cliente no quiso escuchar la oferta' },
  { value: 'solo_soporte', label: 'La llamada fue solo de soporte' },
  { value: 'sin_tiempo', label: 'El cliente no tenía tiempo' },
  { value: 'no_elegible', label: 'No había oferta adecuada' },
  { value: 'corte', label: 'Se cortó la llamada' },
]

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes > 0 ? `${minutes} min ${seconds.toString().padStart(2, '0')} s` : `${seconds} s`
}

export function WrapUpStage({
  session,
  customerId,
  onNoOfferReasonChange,
  onFinish,
}: {
  session: CallSession
  customerId: string
  onNoOfferReasonChange: (reason: string) => void
  onFinish: () => void
}) {
  const { attempts, startedAt, endedAt, presentedOffer, noOfferReason } = session
  const duration = startedAt !== null && endedAt !== null ? formatDuration(endedAt - startedAt) : '—'
  const accepted = attempts.find((attempt) => attempt.result === 'accepted') ?? null
  // Colgó con la oferta sobre la mesa: quedó sin registrar.
  const unregistered = presentedOffer !== null && !attempts.some((attempt) => attempt.offer.id === presentedOffer.id)
  const needsNoOfferReason = attempts.length === 0
  const canFinish = !needsNoOfferReason || noOfferReason !== ''

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-2">
      <div className="w-full max-w-[640px]">
        <header className="flex items-center gap-3">
          <span
            className={`grid h-10 w-10 flex-none place-items-center rounded-full ${
              accepted ? 'bg-success-soft text-success' : attempts.length ? 'bg-danger-soft text-danger' : 'bg-canvas text-muted'
            }`}
          >
            {accepted ? <Check size={20} /> : attempts.length ? <X size={20} /> : <CircleAlert size={20} />}
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-medium leading-tight text-ink">
              {accepted ? 'Llamada cerrada con venta' : attempts.length ? 'Llamada cerrada sin venta' : 'Llamada sin ofrecimiento'}
            </h2>
            <p className="text-xs text-muted">
              Cliente {customerId} · <Clock size={11} className="inline -translate-y-px" /> {duration}
            </p>
          </div>
        </header>

        <section className="mt-4 rounded-card border border-line bg-surface">
          <h3 className="border-b border-line px-3 py-2 text-xs font-medium text-muted">
            Ofrecimientos registrados ({attempts.length})
          </h3>
          {attempts.length === 0 ? (
            <p className="p-3 text-xs text-muted">No se presentó ninguna oferta en esta llamada.</p>
          ) : (
            <ul className="divide-y divide-line">
              {attempts.map((attempt) => (
                <AttemptRow key={attempt.at} attempt={attempt} />
              ))}
            </ul>
          )}
        </section>

        {unregistered && (
          <p className="mt-2 flex items-start gap-2 rounded-card border border-danger/40 bg-danger-soft p-3 text-xs leading-snug text-ink">
            <CircleAlert size={14} className="mt-0.5 flex-none text-danger" />
            Se presentó <strong className="font-medium">{presentedOffer?.name}</strong> y se finalizó sin registrar la respuesta. Ese ofrecimiento no quedó en el historial.
          </p>
        )}

        {needsNoOfferReason && (
          <div className="mt-2 rounded-card border border-line bg-surface p-3">
            <label htmlFor="no-offer-reason" className="block text-xs font-medium text-ink">
              ¿Por qué no se presentó una oferta?
            </label>
            <select
              id="no-offer-reason"
              value={noOfferReason}
              onChange={(event) => onNoOfferReasonChange(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-control border border-line bg-surface px-2.5 text-xs text-ink"
            >
              <option value="">Selecciona un motivo…</option>
              {NO_OFFER_REASONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {canFinish ? 'Al volver, el historial del cliente ya incluye esta gestión.' : 'Indica el motivo para cerrar la gestión.'}
          </p>
          <button
            type="button"
            onClick={onFinish}
            disabled={!canFinish}
            className="inline-flex h-10 flex-none items-center gap-2 rounded-control bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            <RotateCcw size={15} /> Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}

function AttemptRow({ attempt }: { attempt: OfferAttempt }) {
  const rejected = attempt.result === 'rejected'
  const reasonLabel = attempt.reason
    ? REJECTION_REASON_OPTIONS.find((option) => option.value === attempt.reason)?.label ?? formatRejectionReason(attempt.reason)
    : null

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-medium text-ink">{attempt.offer.name}</strong>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {attempt.offer.priceLabel}
          {attempt.hadObjection && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-cyan">
                <MessageCircleWarning size={11} /> con objeción
              </span>
            </>
          )}
          {reasonLabel && <><span>·</span>{reasonLabel}</>}
        </span>
      </div>
      <span className={`flex-none rounded-control px-2 py-1 text-xs font-medium ${rejected ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`}>
        {rejected ? 'Rechazada' : 'Aceptada'}
      </span>
    </li>
  )
}
