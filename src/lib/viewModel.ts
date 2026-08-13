import type { CampaignHistory, Customer, Offer } from '../types'
import type { CallSession, PlayedSegment, ScriptSegment } from './callMachine'
import { SESSION_ENTRY_PREFIX } from './callMachine'
import { getCustomerHistory, getOpportunity, getRecommendedOffers } from './data'
import { formatGb, formatLabel, formatMoney, formatMoneySigned, formatRejectionReason, formatShortDate, formatTenure } from './format'

export type Direction = 'favor' | 'contra'
export type ModelSignal = { text: string; direction: Direction }

export type FunnelStepKey = 'clasificado' | 'contactado' | 'ofrecido' | 'objecion' | 'cierre'
export type FunnelStatus = 'pending' | 'active' | 'done'
export type FunnelStep = { key: FunnelStepKey; label: string; status: FunnelStatus }

export type HistoryEntryView = {
  id: string
  dateLabel: string
  offerName: string
  channel: string
  resultLabel: string
  resultTone: 'accepted' | 'rejected' | 'pending'
  reasonLabel: string | null
  isSession: boolean
}

export type CustomerView = {
  id: string
  typeLabel: string
  location: string
  tenureLabel: string
  currentPlanName: string
  currentPlanId: string
  billingAvgLabel: string
  preferredChannel: string
  services: { mobile: boolean; home: boolean; internet: boolean }
  opportunity: 'mt' | 'nbo'
  opportunityLabel: string
  eligibleMt: boolean
}

export type OfferSummary = {
  id: string
  rank: 1 | 2 | 3
  name: string
  typeLabel: string
  priceLabel: string
  gbLabel: string
  probability: number
  reason: string
  deltaLabel: string
  deltaTone: 'up' | 'down'
  savingsLabel: string | null
  isMovistarTotal: boolean
}

export type HeroOfferView = OfferSummary & {
  channelSuggestion: string
  momentSuggestion: string
  likelyObjection: string
  rebate: string
}

export type OfferStackView = {
  hero: HeroOfferView | null
  all: OfferSummary[]
  alternatives: OfferSummary[]
  signals: ModelSignal[]
}

export type TranscriptLine = { speaker: 'Cliente' | 'Asesor'; text: string }

export type IdlePrepView = {
  opening: string
  expectedObjection: string
  rebate: string
  channelSuggestion: string
  momentSuggestion: string
}

export type LiveSuggestion = {
  id: string
  tone: 'tip' | 'objection' | 'data'
  label: string
  text: string
  afterLine: number
}

// ---------- Cliente ----------

export function buildCustomerView(customer: Customer, offers: Offer[]): CustomerView {
  const opportunity = getOpportunity(customer)
  const currentPlan = offers.find((offer) => offer.oferta_id === customer.plan_actual_id) ?? null
  return {
    id: customer.cliente_id,
    typeLabel: formatLabel(customer.tipo_cliente),
    location: customer.ubicacion_departamento || 'Ubicación no informada',
    tenureLabel: formatTenure(customer.antiguedad_meses),
    currentPlanName: currentPlan?.nombre_oferta ?? 'No informado',
    currentPlanId: customer.plan_actual_id,
    billingAvgLabel: formatMoney(customer.monto_facturado_prom),
    preferredChannel: customer.canal_mas_usado || 'No informado',
    services: { mobile: customer.tiene_movil, home: customer.tiene_hogar, internet: customer.tiene_internet_hogar },
    opportunity,
    opportunityLabel: opportunity === 'mt' ? 'Potencial Movistar Total' : 'Next best offer',
    eligibleMt: customer.elegible_mt,
  }
}

export function buildHistoryView(customerId: string, history: CampaignHistory[]): HistoryEntryView[] {
  return getCustomerHistory(customerId, history).map((item) => ({
    id: item.ofrecimiento_id,
    dateLabel: formatShortDate(item.fecha),
    offerName: item.nombre_oferta || item.oferta_id,
    channel: item.canal,
    resultLabel: formatLabel(item.resultado),
    resultTone: item.resultado === 'aceptada' ? 'accepted' : item.resultado === 'rechazada' ? 'rejected' : 'pending',
    reasonLabel: item.motivo_rechazo ? formatRejectionReason(item.motivo_rechazo) : null,
    isSession: item.ofrecimiento_id.startsWith(SESSION_ENTRY_PREFIX),
  }))
}

// ---------- Señales del modelo ----------

const sameSegment = (customer: Customer, offer: Offer) =>
  offer.segmento_objetivo === 'ambos' ||
  (offer.segmento_objetivo === 'movil' && customer.tiene_movil) ||
  (offer.segmento_objetivo === 'hogar' && customer.tiene_hogar)

export function buildModelSignals(customer: Customer, heroOffer: Offer, history: CampaignHistory[]): ModelSignal[] {
  const customerHistory = getCustomerHistory(customer.cliente_id, history)
  const rejectedHero = customerHistory.find((row) => row.oferta_id === heroOffer.oferta_id && row.resultado === 'rechazada')
  const acceptedBefore = customerHistory.find((row) => row.resultado === 'aceptada')
  const consumo = customer.consumo_datos_gb_prom.toFixed(0)
  const candidates: (ModelSignal | null)[] = [
    customer.elegible_mt && heroOffer.es_movistar_total
      ? { text: `Elegible a Movistar Total y esta oferta agrupa sus servicios`, direction: 'favor' }
      : sameSegment(customer, heroOffer)
        ? { text: `Tiene servicios de ${formatLabel(heroOffer.segmento_objetivo)} activos, compatibles con la oferta`, direction: 'favor' }
        : null,
    customer.consumo_datos_gb_prom > 35
      ? { text: `Consume ${consumo}GB al mes · supera lo cubierto por su plan actual`, direction: 'favor' }
      : null,
    rejectedHero
      ? { text: `Rechazó esta oferta el ${formatShortDate(rejectedHero.fecha)} por ${formatRejectionReason(rejectedHero.motivo_rechazo).toLowerCase()}`, direction: 'contra' }
      : acceptedBefore
        ? { text: `Aceptó una oferta similar el ${formatShortDate(acceptedBefore.fecha)}`, direction: 'favor' }
        : null,
    customer.antiguedad_meses > 60
      ? { text: `Cliente hace ${formatTenure(customer.antiguedad_meses)} · relación estable`, direction: 'favor' }
      : { text: `Cliente hace ${formatTenure(customer.antiguedad_meses)} · relación reciente`, direction: 'contra' },
    customer.n_reclamos > 0
      ? { text: `Registra ${customer.n_reclamos} reclamo${customer.n_reclamos === 1 ? '' : 's'} en su historial`, direction: 'contra' }
      : null,
  ]
  return candidates.filter((signal): signal is ModelSignal => signal !== null).slice(0, 3)
}

// ---------- Ofertas ----------

const CHANNEL_MOMENT: Record<string, { channel: string; moment: string }> = {
  Digital: { channel: 'Digital (app o web)', moment: 'cuando revise su consumo mensual' },
  'Call In': { channel: 'Call center (entrante)', moment: 'en su próxima llamada de soporte' },
  'Call Out': { channel: 'Call center (saliente)', moment: 'a inicio de mes, tras recibir su recibo' },
  Tienda: { channel: 'Tienda', moment: 'en su próxima visita a tienda' },
}

const REJECTION_REBATE: Record<string, (customer: Customer, offer: Offer) => string> = {
  precio: (customer, offer) =>
    `Si objeta el precio, resalta que su facturación pasa de ${formatMoney(customer.monto_facturado_prom)} a ${formatMoney(offer.precio_mensual)} al mes.`,
  mal_momento: (customer) => `Si no es buen momento, propone agendar el cambio para el cierre de mes, cuando factura ${formatMoney(customer.monto_facturado_prom)}.`,
  no_necesita: (customer) => `Si dice que no lo necesita, conecta con su consumo real de ${customer.consumo_datos_gb_prom.toFixed(0)}GB al mes.`,
  no_confia: (_customer, offer) => `Si duda del beneficio, comparte el detalle del ${offer.ahorro_pct}% de ahorro en su próxima factura.`,
  ya_tiene_similar: () => `Si cree que ya tiene algo similar, compara punto a punto contra su plan actual.`,
  otro: () => `Explora la objeción puntual antes de insistir con el precio.`,
}

function reasonFor(customer: Customer, offer: Offer, rejectedThis: CampaignHistory | undefined): string {
  if (customer.elegible_mt && offer.es_movistar_total) {
    return `Es elegible a Movistar Total desde hace ${customer.antiguedad_meses} meses; agrupa sus servicios con ${offer.ahorro_pct}% de ahorro frente a contratarlos por separado.`
  }
  if (offer.tipo_oferta === 'plan_hogar' && customer.tiene_hogar) {
    return `Ya tiene servicios de hogar activos y factura en promedio ${formatMoney(customer.monto_facturado_prom)}; esta suma ${formatLabel(offer.tipo_oferta)} a ${formatMoney(offer.precio_mensual)} al mes.`
  }
  if (customer.consumo_datos_gb_prom > 35 && offer.gb_incluidos > 25) {
    return `Su consumo promedio de ${customer.consumo_datos_gb_prom.toFixed(0)}GB supera lo cubierto hoy; este plan incluye ${formatGb(offer.gb_incluidos)}.`
  }
  if (rejectedThis) {
    return `Alternativa más contenida frente a su facturación de ${formatMoney(customer.monto_facturado_prom)}, tras el rechazo del ${formatShortDate(rejectedThis.fecha)}.`
  }
  return `Opción exploratoria a ${formatMoney(offer.precio_mensual)} dentro de su segmento ${formatLabel(offer.segmento_objetivo)}, con ${customer.antiguedad_meses} meses de relación.`
}

export function buildOfferStackView(customer: Customer, offers: Offer[], history: CampaignHistory[]): OfferStackView {
  // Guarda 1: nunca recomendar el plan que el cliente ya tiene, ni el que acaba
  // de aceptar en esta sesión (el CSV no se actualiza, pero ya es su plan).
  const acceptedInSession = new Set(
    getCustomerHistory(customer.cliente_id, history)
      .filter((row) => row.ofrecimiento_id.startsWith(SESSION_ENTRY_PREFIX) && row.resultado === 'aceptada')
      .map((row) => row.oferta_id),
  )
  const eligibleOffers = offers.filter(
    (offer) => offer.oferta_id !== customer.plan_actual_id && !acceptedInSession.has(offer.oferta_id),
  )
  const ranked = getRecommendedOffers(customer, eligibleOffers, history)
  if (ranked.length === 0) return { hero: null, all: [], alternatives: [], signals: [] }

  const customerHistory = getCustomerHistory(customer.cliente_id, history)
  // Guarda 2: ranking explícito 1/2/3 con motivo diferenciado, sin depender de que el score difiera.
  const summaries: OfferSummary[] = ranked.map((offer, index) => {
    const rejectedThis = customerHistory.find((row) => row.oferta_id === offer.oferta_id && row.resultado === 'rechazada')
    const delta = offer.precio_mensual - customer.monto_facturado_prom
    const savingsSoles = offer.ahorro_pct > 0 ? Math.round((offer.precio_mensual * offer.ahorro_pct) / 100) : 0
    return {
      id: offer.oferta_id,
      rank: (index + 1) as 1 | 2 | 3,
      name: offer.nombre_oferta,
      typeLabel: formatLabel(offer.tipo_oferta),
      priceLabel: formatMoney(offer.precio_mensual),
      gbLabel: formatGb(offer.gb_incluidos),
      probability: offer.probability,
      reason: reasonFor(customer, offer, rejectedThis),
      deltaLabel: `${formatMoneySigned(delta)} vs. facturación`,
      deltaTone: delta >= 0 ? 'up' : 'down',
      savingsLabel: savingsSoles > 0 ? `Ahorra ${formatMoney(savingsSoles)} al mes (${offer.ahorro_pct}%)` : null,
      isMovistarTotal: offer.es_movistar_total,
    }
  })

  const heroOffer = ranked[0]
  const heroSummary = summaries[0]
  const rejectionHistory = customerHistory.filter((row) => row.resultado === 'rechazada')
  const likelyReasonKey = mostFrequentReason(rejectionHistory) ?? (customer.monto_facturado_prom > 90 ? 'precio' : 'mal_momento')
  const channelKey = customer.canal_mas_usado in CHANNEL_MOMENT ? customer.canal_mas_usado : 'Tienda'
  const { channel, moment } = CHANNEL_MOMENT[channelKey]

  const hero: HeroOfferView = {
    ...heroSummary,
    channelSuggestion: channel,
    momentSuggestion: moment,
    likelyObjection: formatRejectionReason(likelyReasonKey),
    rebate: (REJECTION_REBATE[likelyReasonKey] ?? REJECTION_REBATE.otro)(customer, heroOffer),
  }

  return { hero, all: summaries, alternatives: summaries.slice(1), signals: buildModelSignals(customer, heroOffer, history) }
}

function mostFrequentReason(rows: CampaignHistory[]): string | null {
  if (!rows.length) return null
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!row.motivo_rechazo) continue
    counts.set(row.motivo_rechazo, (counts.get(row.motivo_rechazo) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [reason, count] of counts) {
    if (count > bestCount) { best = reason; bestCount = count }
  }
  return best
}

// ---------- Copiloto ----------

export type CallScript = Record<ScriptSegment, TranscriptLine[]>

/** El guion crece por tramos: cada transición de la llamada aporta líneas nuevas. */
export function buildCallScript(customer: Customer, offer: OfferSummary | null, objection: string): CallScript {
  const priceConcern = customer.monto_facturado_prom > 90
  const dataConcern = customer.consumo_datos_gb_prom > 35
  const offerName = offer?.name ?? 'la alternativa'

  return {
    opening: [
      { speaker: 'Cliente', text: priceConcern ? 'Siento que mi recibo mensual ha subido demasiado.' : 'Quisiera revisar si tengo una opción que se ajuste mejor a lo que uso.' },
      { speaker: 'Asesor', text: 'Claro, voy a revisar tu contexto y las alternativas disponibles.' },
      { speaker: 'Cliente', text: dataConcern ? 'Lo que más me importa es tener suficiente internet para mi día a día.' : 'Me interesa mantener mis servicios sin pagar de más.' },
      { speaker: 'Asesor', text: 'Déjame ver qué opciones tengo para tu perfil.' },
    ],
    present: [
      { speaker: 'Asesor', text: `Tengo ${offerName} por ${offer?.priceLabel ?? ''}, con ${offer?.gbLabel ?? 'más datos'} incluidos.` },
      { speaker: 'Cliente', text: 'Cuéntame un poco más, ¿qué cambia respecto a lo que tengo hoy?' },
    ],
    objection: [
      { speaker: 'Cliente', text: `La verdad, ${objection.toLowerCase()} me hace dudar.` },
      { speaker: 'Asesor', text: 'Entiendo, déjame explicarte ese punto con tu propio consumo.' },
    ],
    accepted: [
      { speaker: 'Cliente', text: 'Está bien, avancemos con esa opción.' },
      { speaker: 'Asesor', text: 'Perfecto, lo dejo activado y te llega la confirmación hoy mismo.' },
    ],
    rejected: [
      { speaker: 'Cliente', text: 'Por ahora prefiero dejarlo así.' },
      { speaker: 'Asesor', text: 'Sin problema, lo registro y quedamos atentos para una próxima.' },
    ],
  }
}

/** Aplana los tramos ya reproducidos, cada uno con la oferta que estaba sobre la mesa. */
export function buildTranscript(customer: Customer, segments: PlayedSegment[], objection: string): TranscriptLine[] {
  return segments.flatMap(({ key, offer }) => buildCallScript(customer, offer, objection)[key])
}

export function buildIdlePrep(customer: Customer, hero: HeroOfferView | null): IdlePrepView {
  if (!hero) {
    return {
      opening: `Saluda a ${customer.cliente_id} y confirma el motivo de contacto antes de ofrecer algo.`,
      expectedObjection: 'Sin ofertas disponibles para anticipar objeción.',
      rebate: 'Revisa el catálogo antes de iniciar la llamada.',
      channelSuggestion: customer.canal_mas_usado || 'No informado',
      momentSuggestion: 'sin momento sugerido',
    }
  }
  return {
    opening: `Abre mencionando que su facturación promedio es ${formatMoney(customer.monto_facturado_prom)} y que tienes una alternativa pensada para su consumo.`,
    expectedObjection: hero.likelyObjection,
    rebate: hero.rebate,
    channelSuggestion: hero.channelSuggestion,
    momentSuggestion: hero.momentSuggestion,
  }
}

// ---------- Sugerencias en vivo ----------

export function buildLiveSuggestions(customer: Customer, hero: HeroOfferView | null, segments: PlayedSegment[]): LiveSuggestion[] {
  return segments.flatMap(({ key, offer }, index) =>
    suggestionsFor(customer, offer ?? hero, hero)[key].map((suggestion) => ({
      ...suggestion,
      // Un mismo tramo puede repetirse tras una re-oferta: la clave debe ser única.
      id: `${suggestion.id}-${index}`,
    })),
  )
}

function suggestionsFor(
  customer: Customer,
  offer: OfferSummary | HeroOfferView | null,
  hero: HeroOfferView | null,
): Record<ScriptSegment, LiveSuggestion[]> {
  const target = offer ?? hero
  if (!target) return { opening: [], present: [], objection: [], accepted: [], rejected: [] }
  const consumo = customer.consumo_datos_gb_prom.toFixed(0)

  // Las del tramo de apertura se revelan al ritmo de la transcripción (afterLine);
  // el resto aparece completo en cuanto su tramo entra en juego (afterLine 0).
  return {
    opening: [
      {
        id: 'apertura',
        tone: 'tip',
        label: 'Apertura',
        text: `Confirma el motivo de contacto y menciona que revisaste su cuenta: factura ${formatMoney(customer.monto_facturado_prom)} en promedio.`,
        afterLine: 1,
      },
      {
        id: 'escucha',
        tone: 'data',
        label: 'Dato para usar ahora',
        text: `Consume ${consumo}GB al mes y ${target.name} incluye ${target.gbLabel}. Úsalo como puente hacia la oferta.`,
        afterLine: 2,
      },
      {
        id: 'valor',
        tone: 'tip',
        label: 'Antes del precio',
        text: `Pregunta qué beneficio valora más antes de decir ${target.priceLabel}. Cierra el valor primero, el número después.`,
        afterLine: 3,
      },
    ],
    present: [
      {
        id: 'presente-valor',
        tone: 'tip',
        label: 'Oferta presentada',
        text: `Explica ${target.name} en beneficios concretos antes de volver al precio. Deja que confirme qué le sirve.`,
        afterLine: 0,
      },
      {
        id: 'presente-delta',
        tone: 'data',
        label: 'Compara con lo que paga',
        text: target.savingsLabel ?? `${target.deltaLabel} frente a su facturación promedio.`,
        afterLine: 0,
      },
    ],
    objection: [
      {
        id: 'objecion-rebate',
        tone: 'objection',
        label: `Rebate para: ${hero?.likelyObjection ?? 'objeción'}`,
        text: hero?.rebate ?? 'Explora la objeción puntual antes de insistir con el precio.',
        afterLine: 0,
      },
      {
        id: 'objecion-escucha',
        tone: 'tip',
        label: 'No insistas todavía',
        text: 'Reformula lo que dijo el cliente para confirmar que entendiste la objeción antes de responder.',
        afterLine: 0,
      },
    ],
    accepted: [
      {
        id: 'cierre-aceptado',
        tone: 'tip',
        label: 'Cierre',
        text: `Confirma el siguiente paso: activación de ${target.name} y aviso por su canal habitual (${customer.canal_mas_usado || 'su canal preferido'}).`,
        afterLine: 0,
      },
    ],
    rejected: [
      {
        id: 'cierre-rechazado',
        tone: 'objection',
        label: 'Rechazo registrado',
        text: 'Agradece el tiempo y deja abierta la puerta: pregunta cuándo sería un mejor momento para retomarlo.',
        afterLine: 0,
      },
    ],
  }
}

// ---------- Funnel ----------

export function buildFunnelSteps(session: CallSession): FunnelStep[] {
  const statusFor = (done: boolean, active: boolean): FunnelStatus => (done ? 'done' : active ? 'active' : 'pending')
  const { phase, presentedOffer, attempts, hadObjection, pendingOutcome } = session
  const offered = presentedOffer !== null || attempts.length > 0
  const objectionSeen = hadObjection || attempts.some((attempt) => attempt.hadObjection)
  const closed = attempts.length > 0

  return [
    { key: 'contactado', label: 'Contactado', status: statusFor(phase !== 'idle', phase === 'idle') },
    { key: 'ofrecido', label: 'Ofrecido', status: statusFor(offered, phase === 'active') },
    { key: 'objecion', label: 'Objeción', status: phase === 'objection' ? 'active' : statusFor(objectionSeen || closed, false) },
    { key: 'cierre', label: 'Cierre', status: statusFor(closed, pendingOutcome !== null || phase === 'wrapup') },
  ]
}
