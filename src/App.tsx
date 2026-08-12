import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, BadgeCheck, BarChart3, Bot, Check, ChevronDown, CircleAlert, Clock3, Headphones,
  History, Lightbulb, Mic2, Phone, Play, RefreshCw, Search, Sparkles, Target, UserRound, X,
} from 'lucide-react'
import { getCustomerHistory, getOpportunity, getRecommendedOffers } from './lib/data'
import { useDemoData } from './hooks/useDemoData'
import type { Customer, Offer, RecommendedOffer } from './types'

const money = (value: number) => `S/ ${value.toFixed(2)}`
const prettyDate = (value: string) => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '').toUpperCase()
const label = (value: string) => value ? value.replaceAll('_', ' ') : 'No informado'

type TranscriptLine = { speaker: 'Cliente' | 'Asesor'; text: string }

function buildTranscript(customer: Customer): TranscriptLine[] {
  const priceConcern = customer.monto_facturado_prom > 90
  const dataConcern = customer.consumo_datos_gb_prom > 35
  return [
    { speaker: 'Cliente', text: priceConcern ? 'Siento que mi recibo mensual ha subido demasiado.' : 'Quisiera revisar si tengo una opción que se ajuste mejor a lo que uso.' },
    { speaker: 'Asesor', text: 'Claro, voy a revisar tu contexto y las alternativas disponibles.' },
    { speaker: 'Cliente', text: dataConcern ? 'Lo que más me importa es tener suficiente internet para mi día a día.' : 'Me interesa mantener mis servicios sin pagar de más.' },
    { speaker: 'Asesor', text: 'Perfecto. Tengo una alternativa que puedo explicarte en un momento.' },
  ]
}

function App() {
  const { customers, offers, history, loading, error } = useDemoData()
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [callState, setCallState] = useState<'idle' | 'active' | 'ended'>('idle')
  const [visibleLines, setVisibleLines] = useState(0)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<'accepted' | 'rejected' | null>(null)

  useEffect(() => { if (!selectedId && customers.length) setSelectedId(customers[0].cliente_id) }, [customers, selectedId])
  const customer = customers.find((item) => item.cliente_id === selectedId) ?? null
  const opportunity = customer ? getOpportunity(customer) : 'nbo'
  const customerHistory = customer ? getCustomerHistory(customer.cliente_id, history) : []
  const recommendations = customer ? getRecommendedOffers(customer, offers, history) : []
  const transcript = customer ? buildTranscript(customer) : []
  const selectedOffer = recommendations.find((offer) => offer.oferta_id === selectedOfferId) ?? recommendations[0]
  const currentPlan = offers.find((offer) => offer.oferta_id === customer?.plan_actual_id) ?? null

  const filteredCustomers = useMemo(() => customers.filter((item) => {
    const text = `${item.cliente_id} ${item.tipo_cliente} ${item.ubicacion_departamento}`.toLowerCase()
    return text.includes(query.toLowerCase())
  }), [customers, query])

  useEffect(() => {
    if (callState !== 'active' || visibleLines >= transcript.length) return
    const timer = window.setTimeout(() => setVisibleLines((current) => current + 1), 1200)
    return () => window.clearTimeout(timer)
  }, [callState, visibleLines, transcript.length])

  useEffect(() => {
    setCallState('idle'); setVisibleLines(0); setSelectedOfferId(null); setOutcome(null)
  }, [selectedId])

  const startCall = () => { setOutcome(null); setCallState('active'); setVisibleLines(1) }
  const endCall = () => setCallState('ended')
  const resetDemo = () => { setCallState('idle'); setVisibleLines(0); setOutcome(null) }

  if (loading) return <div className="loading-screen"><div className="loading-mark">M</div><p>Preparando la vista comercial…</p><span>Cargando datos reales de DataSet</span></div>
  if (error || !customer) return <div className="loading-screen"><CircleAlert size={28} /><h1>No pudimos cargar la demo</h1><p>{error || 'No hay clientes disponibles.'}</p><button className="button button-primary" onClick={() => window.location.reload()}><RefreshCw size={16} /> Reintentar</button></div>

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark">M</div><div><strong>MOVISTAR</strong><span>Asistente Comercial IA</span></div></div>
        <div className="topbar-right">
          <button className={`button navbar-call-button ${callState === 'active' ? 'button-danger' : 'button-primary'}`} onClick={callState === 'active' ? endCall : startCall}>{callState === 'active' ? <><X size={15} /> Finalizar</> : <><Play size={15} /> Iniciar llamada</>}</button>
          <div className={`call-status ${callState === 'active' ? 'is-active' : ''}`}><span className="status-dot" />{callState === 'active' ? 'Llamada en curso' : callState === 'ended' ? 'Llamada finalizada' : 'Listo para atender'}</div>
          <div className={`opportunity-chip ${opportunity}`}><span className="chip-dot" />{opportunity === 'mt' ? 'Potencial MT' : 'NBO detectado'}</div>
          <button className="icon-button" aria-label="Notificaciones"><CircleAlert size={18} /></button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading"><div><span className="section-kicker">CONTEXTO</span><h1>Información del cliente</h1></div><div className="live-pulse" /></div>
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente…" aria-label="Buscar cliente" /></div>
          <label className="field-label" htmlFor="customer-select">Cliente seleccionado</label>
          <div className="select-wrap"><select id="customer-select" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{filteredCustomers.map((item) => <option value={item.cliente_id} key={item.cliente_id}>{item.cliente_id} · {item.tipo_cliente || 'sin tipo'}</option>)}</select><ChevronDown size={16} /></div>
          <div className="customer-summary"><div className="avatar"><UserRound size={21} /></div><div><strong>{customer.cliente_id}</strong><span>{customer.tipo_cliente || 'Tipo no informado'} · {customer.ubicacion_departamento || 'Ubicación no informada'}</span></div><span className={`mini-badge ${opportunity}`}>{opportunity === 'mt' ? 'MT' : 'NBO'}</span></div>
          <div className="profile-grid">
            <ProfileItem label="Antigüedad" value={`${customer.antiguedad_meses} meses`} />
            <PlanProfileItem planId={customer.plan_actual_id} plan={currentPlan} />
            <ProfileItem label="Facturación prom." value={money(customer.monto_facturado_prom)} />
            <ProfileItem label="Canal más usado" value={customer.canal_mas_usado || 'No informado'} />
          </div>
          <div className="service-row"><div><span className="service-label">Servicios activos</span><div className="service-tags"><span className={customer.tiene_movil ? 'tag active' : 'tag'}>Móvil</span><span className={customer.tiene_hogar ? 'tag active' : 'tag'}>Hogar</span><span className={customer.tiene_internet_hogar ? 'tag active' : 'tag'}>Internet</span></div></div><div className={`eligibility ${customer.elegible_mt ? 'eligible' : ''}`}><BadgeCheck size={15} /><span>{customer.elegible_mt ? 'Elegible MT' : 'No elegible MT'}</span></div></div>
          <div className="history-block"><div className="block-heading"><div><span className="section-kicker">ACTIVIDAD</span><h2>Historial de ofrecimientos</h2></div><History size={16} /></div>{customerHistory.slice(0, 4).map((item) => <HistoryItem key={item.ofrecimiento_id} item={item} />)}{!customerHistory.length && <div className="empty-state">Este cliente todavía no tiene ofrecimientos.</div>}</div>
          <div className="data-note"><BarChart3 size={15} /><span>Datos reales · DataSet<br /><small>Perfil demo optimizado para carga local</small></span></div>
        </aside>

        <section className="main-column">
          <section className="offers-section"><div className="section-header"><div><span className="section-kicker">RECOMENDACIÓN EN TIEMPO REAL</span><h2>Ofertas recomendadas</h2></div><span className="estimate-pill"><span className="estimate-dot" />Probabilidad estimada</span></div><div className="offers-grid">{recommendations.map((offer, index) => <OfferCard key={offer.oferta_id} offer={offer} index={index} selected={selectedOffer?.oferta_id === offer.oferta_id} onSelect={() => setSelectedOfferId(offer.oferta_id)} />)}</div></section>
          <div className="live-grid">
            <section className="transcript-panel panel"><div className="panel-header"><div><span className="section-kicker">COPILOTO ACTIVO</span><h2>Transcripción</h2></div><span className={`live-label ${callState === 'active' ? 'active' : ''}`}><span className="status-dot" />{callState === 'active' ? 'En vivo' : callState === 'ended' ? 'Sesión cerrada' : 'Simulación lista'}</span></div><div className="transcript-body">{visibleLines === 0 ? <div className="transcript-empty"><div className="empty-icon"><Mic2 size={19} /></div><strong>Inicia la llamada para activar la transcripción</strong><span>La conversación simulada aparecerá aquí progresivamente.</span></div> : transcript.slice(0, visibleLines).map((line, index) => <div className={`transcript-line ${line.speaker.toLowerCase()}`} key={`${line.speaker}-${index}`}><span className="speaker">{line.speaker === 'Cliente' ? <UserRound size={14} /> : <Headphones size={14} />}{line.speaker}</span><p>{line.text}</p></div>)}{callState === 'active' && visibleLines < transcript.length && <div className="typing"><span /><span /><span /> IA procesando contexto</div>}{callState === 'ended' && <div className="ended-note"><Check size={15} /> Sesión lista para registrar resultado</div>}</div><div className="transcript-footer"><span>{visibleLines}/{transcript.length} intervenciones</span>{callState !== 'idle' && <button className="text-button" onClick={resetDemo}>Reiniciar demo <RefreshCw size={14} /></button>}</div></section>
            <section className="suggestions-panel panel"><div className="panel-header"><div><span className="section-kicker">ASISTENTE IA</span><h2>Sugerencias IA</h2></div><div className="ai-orb"><Bot size={17} /></div></div><div className="suggestion-stack"><Suggestion icon={<Lightbulb size={16} />} label="Escucha primero" text={customer.consumo_datos_gb_prom > 35 ? 'Entiendo que buscas una conexión que acompañe mejor tu consumo diario.' : 'Entiendo que quieres una alternativa que cuide tu presupuesto mensual.'} tone="soft" /><Suggestion icon={<Target size={16} />} label="Siguiente acción" text={outcome === 'rejected' ? 'Presentar la alternativa y explorar un rebate si el precio sigue siendo la barrera.' : `Presentar ${selectedOffer?.nombre_oferta || 'la oferta priorizada'} y validar qué beneficio valora más.`} tone="green" /><Suggestion icon={<ArrowRight size={16} />} label="Argumento sugerido" text={selectedOffer?.reason || 'Conectar la recomendación con los servicios y el historial del cliente.'} tone="blue" /></div><div className="outcome-zone"><span className="field-label">Resultado de la presentación</span><div className="outcome-actions"><button className={`outcome-button accept ${outcome === 'accepted' ? 'selected' : ''}`} onClick={() => setOutcome('accepted')}><Check size={15} /> Aceptada</button><button className={`outcome-button reject ${outcome === 'rejected' ? 'selected' : ''}`} onClick={() => setOutcome('rejected')}><X size={15} /> Rechazada</button></div>{outcome === 'accepted' && <div className="outcome-message success"><Check size={14} /> Registrar aceptación y cerrar seguimiento.</div>}{outcome === 'rejected' && <div className="outcome-message warning"><CircleAlert size={14} /> Considerar rebate y presentar alternativa.</div>}</div></section>
          </div>
        </section>
      </main>
    </div>
  )
}

function ProfileItem({ label: itemLabel, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="profile-item"><span>{itemLabel}</span><strong className={mono ? 'mono' : ''}>{value}</strong></div> }

function PlanProfileItem({ planId, plan }: { planId: string; plan: Offer | null }) {
  const hasDetails = Boolean(plan)
  return <div className={`profile-item plan-profile-item ${hasDetails ? 'has-details' : ''}`} tabIndex={hasDetails ? 0 : undefined} aria-label={hasDetails ? `Ver detalles del plan ${planId}` : 'Plan actual no informado'}>
    <span>Plan actual <span className="info-hint">{hasDetails ? 'i' : ''}</span></span>
    <strong className="mono">{planId || 'No informado'}</strong>
    {hasDetails && <div className="plan-popover" role="tooltip"><div className="popover-title"><span>Detalle del plan</span><strong>{plan?.nombre_oferta}</strong></div><div className="popover-grid"><span>Tipo</span><strong>{label(plan?.tipo_oferta ?? '')}</strong><span>Precio</span><strong>{money(plan?.precio_mensual ?? 0)} / mes</strong><span>Segmento</span><strong>{label(plan?.segmento_objetivo ?? '')}</strong>{(plan?.gb_incluidos ?? 0) > 0 && <><span>Datos incluidos</span><strong>{plan?.gb_incluidos} GB</strong></>}</div><p>{plan?.descripcion_corta || 'Oferta del catálogo Movistar.'}</p></div>}
  </div>
}

function HistoryItem({ item }: { item: ReturnType<typeof getCustomerHistory>[number] }) { return <div className="history-item"><div className="history-date">{prettyDate(item.fecha)}</div><div className="history-detail"><strong>{item.nombre_oferta || item.oferta_id}</strong><span>{item.canal} · {item.motivo_rechazo ? label(item.motivo_rechazo) : 'sin motivo'}</span></div><span className={`result ${item.resultado}`}>{label(item.resultado)}</span></div> }

function OfferCard({ offer, index, selected, onSelect }: { offer: RecommendedOffer; index: number; selected: boolean; onSelect: () => void }) { return <button className={`offer-card ${selected ? 'selected' : ''} ${index === 0 ? 'primary' : ''}`} onClick={onSelect}><div className="offer-topline"><span className={`priority ${index === 0 ? 'recommended' : ''}`}>{index === 0 ? <><Sparkles size={13} /> Recomendada</> : `${String(index + 1).padStart(2, '0')} · ${offer.priority}`}</span><span className="offer-id">{offer.oferta_id}</span></div><div className="offer-title-row"><div><h3>{offer.nombre_oferta}</h3><span>{label(offer.tipo_oferta)} · {offer.descripcion_corta || 'Oferta del catálogo Movistar'}</span></div><div className="probability"><strong>{offer.probability}%</strong><span>aceptación</span></div></div><div className="offer-price">{money(offer.precio_mensual)} <span>/ mes</span>{offer.ahorro_pct > 0 && <em>-{offer.ahorro_pct}% ahorro</em>}</div><div className="offer-reason"><Check size={14} /> {offer.reason}</div><div className="offer-footer"><span>{selected ? 'Seleccionada para presentar' : 'Seleccionar oferta'}</span><ArrowRight size={15} /></div></button> }

function Suggestion({ icon, label: suggestionLabel, text, tone }: { icon: React.ReactNode; label: string; text: string; tone: 'soft' | 'green' | 'blue' }) { return <div className={`suggestion ${tone}`}><div className="suggestion-icon">{icon}</div><div><span>{suggestionLabel}</span><p>{text}</p></div></div> }

export default App
