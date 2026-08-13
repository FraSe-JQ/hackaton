import type { CampaignHistory, Customer } from '../types'
import type { OfferSummary } from './viewModel'

export type CallPhase =
  | 'idle' // Pantalla 1: sin llamada
  | 'active' // Pantalla 2: en llamada, explorando los 3 planes
  | 'presented' // Pantalla 3: oferta sobre la mesa, esperando respuesta
  | 'objection' // Pantalla 3: el cliente objetó, copiloto en modo rebate
  | 'wrapup' // Pantalla 4: llamada finalizada, resumen

export type AttemptResult = 'accepted' | 'rejected'

/** Tramos del guion de llamada que ya se reprodujeron, en orden. */
export type ScriptSegment = 'opening' | 'present' | 'objection' | 'accepted' | 'rejected'

/**
 * Cada tramo guarda la oferta que estaba sobre la mesa cuando ocurrió: sin este
 * snapshot, presentar una segunda oferta reescribiría las líneas de la primera.
 */
export type PlayedSegment = { key: ScriptSegment; offer: OfferSummary | null }

export type OfferAttempt = {
  offer: OfferSummary
  result: AttemptResult
  reason: string | null
  hadObjection: boolean
  at: number
}

export type CallSession = {
  phase: CallPhase
  selectedOfferId: string | null
  /** Snapshot: la oferta puede salir del top-3 tras registrarse un rechazo en sesión. */
  presentedOffer: OfferSummary | null
  pendingOutcome: AttemptResult | null
  rejectionReason: string
  hadObjection: boolean
  attempts: OfferAttempt[]
  segments: PlayedSegment[]
  visibleLines: number
  startedAt: number | null
  endedAt: number | null
  noOfferReason: string
}

export const initialSession: CallSession = {
  phase: 'idle',
  selectedOfferId: null,
  presentedOffer: null,
  pendingOutcome: null,
  rejectionReason: '',
  hadObjection: false,
  attempts: [],
  segments: [],
  visibleLines: 0,
  startedAt: null,
  endedAt: null,
  noOfferReason: '',
}

export type CallAction =
  | { type: 'reset' }
  | { type: 'start'; at: number }
  | { type: 'selectOffer'; offerId: string }
  | { type: 'present'; offer: OfferSummary }
  | { type: 'raiseObjection' }
  | { type: 'handleObjection' }
  | { type: 'setPendingOutcome'; result: AttemptResult }
  | { type: 'cancelOutcome' }
  | { type: 'setRejectionReason'; reason: string }
  /** Registrar cierra la llamada salvo que se pida seguir con otra oferta. */
  | { type: 'confirmOutcome'; at: number; andContinue?: boolean }
  | { type: 'endCall'; at: number }
  | { type: 'setNoOfferReason'; reason: string }
  | { type: 'advanceTranscript' }

const IN_CALL: CallPhase[] = ['active', 'presented', 'objection']

export function callReducer(state: CallSession, action: CallAction): CallSession {
  switch (action.type) {
    case 'reset':
      return initialSession

    case 'start':
      if (state.phase !== 'idle') return state
      return { ...initialSession, phase: 'active', startedAt: action.at, segments: [{ key: 'opening', offer: null }] }

    case 'selectOffer':
      if (state.phase !== 'active') return state
      return { ...state, selectedOfferId: action.offerId }

    case 'present':
      if (state.phase !== 'active') return state
      return {
        ...state,
        phase: 'presented',
        presentedOffer: action.offer,
        selectedOfferId: action.offer.id,
        segments: [...state.segments, { key: 'present', offer: action.offer }],
      }

    case 'raiseObjection': {
      if (state.phase !== 'presented') return state
      const last = state.segments[state.segments.length - 1]
      // Reabrir la misma objeción no vuelve a reproducir el tramo.
      const repeated = last?.key === 'objection' && last.offer?.id === state.presentedOffer?.id
      return {
        ...state,
        phase: 'objection',
        hadObjection: true,
        // Objetar invalida una respuesta a medio registrar.
        pendingOutcome: null,
        segments: repeated ? state.segments : [...state.segments, { key: 'objection', offer: state.presentedOffer }],
      }
    }

    case 'handleObjection':
      if (state.phase !== 'objection') return state
      return { ...state, phase: 'presented' }

    case 'setPendingOutcome':
      if (state.phase !== 'presented' && state.phase !== 'objection') return state
      return {
        ...state,
        phase: 'presented',
        pendingOutcome: action.result,
        rejectionReason: action.result === 'accepted' ? '' : state.rejectionReason,
      }

    case 'cancelOutcome':
      if (state.pendingOutcome === null) return state
      return { ...state, pendingOutcome: null, rejectionReason: '' }

    case 'setRejectionReason':
      if (state.pendingOutcome !== 'rejected') return state
      return { ...state, rejectionReason: action.reason }

    case 'confirmOutcome': {
      if (!canConfirmOutcome(state) || !state.presentedOffer || !state.pendingOutcome) return state
      const attempt: OfferAttempt = {
        offer: state.presentedOffer,
        result: state.pendingOutcome,
        reason: state.pendingOutcome === 'rejected' ? state.rejectionReason : null,
        hadObjection: state.hadObjection,
        at: action.at,
      }
      const registered: CallSession = {
        ...state,
        attempts: [...state.attempts, attempt],
        segments: [...state.segments, { key: state.pendingOutcome, offer: state.presentedOffer }],
        pendingOutcome: null,
        rejectionReason: '',
      }

      // Seguir con otra oferta devuelve al listado; por defecto, registrar cierra la llamada.
      if (action.andContinue) {
        return { ...registered, phase: 'active', presentedOffer: null, selectedOfferId: null, hadObjection: false }
      }
      return { ...registered, phase: 'wrapup', endedAt: action.at }
    }

    case 'endCall':
      if (!IN_CALL.includes(state.phase)) return state
      return { ...state, phase: 'wrapup', endedAt: action.at, pendingOutcome: null }

    case 'setNoOfferReason':
      if (state.phase !== 'wrapup') return state
      return { ...state, noOfferReason: action.reason }

    case 'advanceTranscript':
      if (!IN_CALL.includes(state.phase)) return state
      return { ...state, visibleLines: state.visibleLines + 1 }

    default:
      return state
  }
}

// ---------- Selectores ----------

export function lastAttempt(state: CallSession): OfferAttempt | null {
  return state.attempts.length ? state.attempts[state.attempts.length - 1] : null
}

export function canConfirmOutcome(state: CallSession): boolean {
  if (state.pendingOutcome === null) return false
  if (state.pendingOutcome === 'rejected' && !state.rejectionReason) return false
  return true
}

export function isInCall(phase: CallPhase): boolean {
  return IN_CALL.includes(phase)
}

/** Ofertas ya intentadas en esta llamada: no se vuelven a ofrecer. */
export function exhaustedOfferIds(state: CallSession): string[] {
  return state.attempts.map((attempt) => attempt.offer.id)
}

/**
 * Tras registrar un rechazo aún queda catálogo por ofrecer. Se evalúa antes de
 * confirmar, así que el intento en curso todavía no está en `attempts`.
 */
export function canOfferAnother(state: CallSession, availableOffers: number): boolean {
  return state.pendingOutcome === 'rejected' && exhaustedOfferIds(state).length + 1 < availableOffers
}

/** Colgar con una oferta presentada y sin respuesta registrada pierde el ofrecimiento. */
export function hasUnregisteredOffer(state: CallSession): boolean {
  return (state.phase === 'presented' || state.phase === 'objection') && state.presentedOffer !== null
}

// ---------- Persistencia de la sesión ----------

export const SESSION_ENTRY_PREFIX = 'SESION-'

export function attemptToHistory(customer: Customer, attempt: OfferAttempt): CampaignHistory {
  return {
    ofrecimiento_id: `${SESSION_ENTRY_PREFIX}${attempt.at}`,
    cliente_id: customer.cliente_id,
    oferta_id: attempt.offer.id,
    fecha: new Date(attempt.at).toISOString().slice(0, 10),
    canal: customer.canal_mas_usado || 'Call Out',
    resultado: attempt.result === 'accepted' ? 'aceptada' : 'rechazada',
    motivo_rechazo: attempt.reason ?? '',
    es_rebate: attempt.hadObjection,
    contactabilidad: 'contactado',
    medio_probatorio: 'grabacion_llamada',
    tipo_cliente: customer.tipo_cliente,
    antiguedad_meses: customer.antiguedad_meses,
    elegible_mt: customer.elegible_mt,
    es_movistar_total: customer.es_movistar_total,
    nombre_oferta: attempt.offer.name,
    tipo_oferta: attempt.offer.typeLabel,
    oferta_es_mt: attempt.offer.isMovistarTotal,
  }
}
