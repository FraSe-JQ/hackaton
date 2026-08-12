export type Opportunity = 'mt' | 'nbo'

export type Customer = {
  cliente_id: string
  tipo_cliente: string
  antiguedad_meses: number
  tiene_movil: boolean
  tiene_hogar: boolean
  oferta_hogar_id: string
  tiene_internet_hogar: boolean
  es_movistar_total: boolean
  elegible_mt: boolean
  plan_actual_id: string
  monto_facturado_prom: number
  edad_rango: string
  ubicacion_departamento: string
  es_usuario_app: boolean
  consumo_datos_gb_prom: number
  consumo_voz_min_prom: number
  consumo_sms_prom: number
  uso_app_movistar_prom: number
  monto_facturado_prom_6m: number
  dias_mora_prom: number
  meses_moroso: number
  n_reclamos: number
  n_actividad_canal: number
  canal_mas_usado: string
}

export type Offer = {
  oferta_id: string
  nombre_oferta: string
  tipo_oferta: string
  segmento_objetivo: string
  es_movistar_total: boolean
  precio_mensual: number
  ahorro_pct: number
  gb_incluidos: number
  cluster_hogar: string
  descripcion_bundle: string
  descripcion_corta: string
}

export type CampaignHistory = {
  ofrecimiento_id: string
  cliente_id: string
  oferta_id: string
  fecha: string
  canal: string
  resultado: string
  motivo_rechazo: string
  es_rebate: boolean
  contactabilidad: string
  medio_probatorio: string
  tipo_cliente: string
  antiguedad_meses: number
  elegible_mt: boolean
  es_movistar_total: boolean
  nombre_oferta: string
  tipo_oferta: string
  oferta_es_mt: boolean
}

export type RecommendedOffer = Offer & {
  probability: number
  reason: string
  priority: 'Alta' | 'Media' | 'Exploratoria'
  tags: string[]
}
