import { bool, clean, loadCsv, num } from './csv'
import type { CampaignHistory, Customer, Offer, Opportunity, RecommendedOffer } from '../types'

const normalizeCustomer = (row: Record<string, string>): Customer => ({
  cliente_id: clean(row.cliente_id), tipo_cliente: clean(row.tipo_cliente), antiguedad_meses: num(row.antiguedad_meses),
  tiene_movil: bool(row.tiene_movil), tiene_hogar: bool(row.tiene_hogar), oferta_hogar_id: clean(row.oferta_hogar_id),
  tiene_internet_hogar: bool(row.tiene_internet_hogar), es_movistar_total: bool(row.es_movistar_total), elegible_mt: bool(row.elegible_mt),
  plan_actual_id: clean(row.plan_actual_id), monto_facturado_prom: num(row.monto_facturado_prom), edad_rango: clean(row.edad_rango),
  ubicacion_departamento: clean(row.ubicacion_departamento), es_usuario_app: bool(row.es_usuario_app), consumo_datos_gb_prom: num(row.consumo_datos_gb_prom),
  consumo_voz_min_prom: num(row.consumo_voz_min_prom), consumo_sms_prom: num(row.consumo_sms_min_prom || row.consumo_sms_prom),
  uso_app_movistar_prom: num(row.uso_app_movistar_prom), monto_facturado_prom_6m: num(row.monto_facturado_prom_6m), dias_mora_prom: num(row.dias_mora_prom),
  meses_moroso: num(row.meses_moroso), n_reclamos: num(row.n_reclamos), n_actividad_canal: num(row.n_actividad_canal), canal_mas_usado: clean(row.canal_mas_usado),
})

const normalizeOffer = (row: Record<string, string>): Offer => ({
  oferta_id: clean(row.oferta_id), nombre_oferta: clean(row.nombre_oferta), tipo_oferta: clean(row.tipo_oferta), segmento_objetivo: clean(row.segmento_objetivo),
  es_movistar_total: bool(row.es_movistar_total), precio_mensual: num(row.precio_mensual), ahorro_pct: num(row.ahorro_pct), gb_incluidos: num(row.gb_incluidos),
  cluster_hogar: clean(row.cluster_hogar), descripcion_bundle: clean(row.descripcion_bundle), descripcion_corta: clean(row.descripcion_corta),
})

const normalizeHistory = (row: Record<string, string>): CampaignHistory => ({
  ofrecimiento_id: clean(row.ofrecimiento_id), cliente_id: clean(row.cliente_id), oferta_id: clean(row.oferta_id), fecha: clean(row.fecha), canal: clean(row.canal),
  resultado: clean(row.resultado), motivo_rechazo: clean(row.motivo_rechazo), es_rebate: bool(row.es_rebate), contactabilidad: clean(row.contactabilidad), medio_probatorio: clean(row.medio_probatorio),
  tipo_cliente: clean(row.tipo_cliente), antiguedad_meses: num(row.antiguedad_meses), elegible_mt: bool(row.elegible_mt), es_movistar_total: bool(row.es_movistar_total), nombre_oferta: clean(row.nombre_oferta), tipo_oferta: clean(row.tipo_oferta), oferta_es_mt: bool(row.oferta_es_mt),
})

export async function loadDemoData() {
  const [rawCustomers, rawOffers, rawHistory] = await Promise.all([
    loadCsv<Record<string, string>>('/data/dataset_clientes_demo.csv'),
    loadCsv<Record<string, string>>('/data/catalogo_ofertas_entrega.csv'),
    loadCsv<Record<string, string>>('/data/historial_campanias_demo.csv'),
  ])
  return { customers: rawCustomers.map(normalizeCustomer), offers: rawOffers.map(normalizeOffer), history: rawHistory.map(normalizeHistory) }
}

export function getOpportunity(customer: Customer): Opportunity { return customer.elegible_mt ? 'mt' : 'nbo' }

export function getCustomerHistory(customerId: string, history: CampaignHistory[]) {
  return history.filter((row) => row.cliente_id === customerId).sort((a, b) => b.fecha.localeCompare(a.fecha))
}

function scoreOffer(customer: Customer, offer: Offer, history: CampaignHistory[]): RecommendedOffer {
  const customerHistory = getCustomerHistory(customer.cliente_id, history)
  const rejected = customerHistory.find((row) => row.oferta_id === offer.oferta_id && row.resultado === 'rechazada')
  const accepted = customerHistory.some((row) => row.oferta_id === offer.oferta_id && row.resultado === 'aceptada')
  const sameSegment = offer.segmento_objetivo === 'ambos' || (offer.segmento_objetivo === 'movil' && customer.tiene_movil) || (offer.segmento_objetivo === 'hogar' && customer.tiene_hogar)
  let score = 48
  if (customer.elegible_mt && offer.es_movistar_total) score += 31
  if (sameSegment) score += 11
  if (customer.antiguedad_meses > 60) score += 5
  if (customer.consumo_datos_gb_prom > 35 && offer.gb_incluidos > 25) score += 7
  if (customer.tiene_hogar && offer.tipo_oferta === 'plan_hogar') score += 8
  if (rejected) score -= rejected.motivo_rechazo === 'precio' ? 10 : 3
  if (accepted) score += 3
  score = Math.max(34, Math.min(96, score))
  const reason = customer.elegible_mt && offer.es_movistar_total
    ? 'Elegible para MT y con servicios compatibles.'
    : rejected?.motivo_rechazo === 'precio'
      ? 'Alternativa más contenida tras un rechazo por precio.'
      : sameSegment ? 'Compatible con los servicios y consumo actuales.' : 'Opción exploratoria para ampliar cobertura.'
  return { ...offer, probability: score, reason, priority: score > 75 ? 'Alta' : score > 60 ? 'Media' : 'Exploratoria', tags: [offer.tipo_oferta.replace('_', ' '), sameSegment ? 'perfil compatible' : 'alternativa'] }
}

export function getRecommendedOffers(customer: Customer, offers: Offer[], history: CampaignHistory[]) {
  return offers.map((offer) => scoreOffer(customer, offer, history)).sort((a, b) => b.probability - a.probability).slice(0, 3)
}
