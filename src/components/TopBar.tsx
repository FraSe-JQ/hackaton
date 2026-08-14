import { useEffect, useState } from 'react'
import { CircleAlert, Pause, PhoneOff, Play } from 'lucide-react'
import { MovistarLogo } from './MovistarLogo'
import type { CustomerView } from '../lib/viewModel'
import type { CallPhase } from '../lib/callMachine'

const STATUS_LABEL: Record<CallPhase, string> = {
  idle: 'Listo para atender',
  active: 'Llamada en curso',
  presented: 'Oferta presentada',
  objection: 'Manejando objeción',
  wrapup: 'Llamada finalizada',
}

export function TopBar({
  customer,
  phase,
  canEndCall,
  needsConfirmToEnd,
  automationEnabled,
  onToggleAutomation,
  onEndCall,
}: {
  customer: CustomerView
  phase: CallPhase
  canEndCall: boolean
  needsConfirmToEnd: boolean
  automationEnabled: boolean
  onToggleAutomation: () => void
  onEndCall: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  useEffect(() => { if (!canEndCall) setConfirming(false) }, [canEndCall])

  const live = phase !== 'idle' && phase !== 'wrapup'

  return (
    <header className="relative flex h-16 flex-none items-center justify-between bg-gradient-to-r from-brand-dark to-brand px-6 text-white">
      <div className="flex items-center gap-3">
        <MovistarLogo size={40} className="flex-none" />
        <div>
          <strong className="block text-sm tracking-[0.14em]">MOVISTAR</strong>
          <span className="block text-xs text-white/70">Asistente Comercial IA</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end border-r border-white/20 pr-4 text-xs sm:flex">
          <div className="flex items-center gap-2 text-white/80">
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-success' : 'bg-white/40'}`} />
            {STATUS_LABEL[phase]}
          </div>
          <span className="mt-0.5 text-[10px] text-white/60">Cliente {customer.id}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-xs font-medium text-white/80">
          <span className={`h-1.5 w-1.5 rounded-full ${customer.opportunity === 'mt' ? 'bg-success' : 'bg-white/60'}`} />
          {customer.opportunityLabel}
        </span>
        {canEndCall && (
          <button
            type="button"
            aria-pressed={!automationEnabled}
            aria-label={automationEnabled ? 'Pausar simulación automática' : 'Reanudar simulación automática'}
            title={automationEnabled ? 'Pausar simulación automática' : 'Reanudar simulación automática'}
            onClick={onToggleAutomation}
            className={`inline-flex h-9 items-center gap-1.5 rounded-control border px-3 text-xs font-medium transition-colors ${automationEnabled ? 'border-white/25 bg-white/10 text-white hover:bg-white/20' : 'border-white bg-white text-brand-dark hover:bg-white/90'}`}
          >
            {automationEnabled ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden md:inline">{automationEnabled ? 'Pausar' : 'Reanudar'}</span>
          </button>
        )}
        {canEndCall && (
          <button
            type="button"
            onClick={() => (needsConfirmToEnd ? setConfirming(true) : onEndCall())}
            className="inline-flex h-9 items-center gap-2 rounded-control bg-danger px-3 text-xs font-medium text-white transition-colors hover:bg-[#c4161d]"
          >
            <PhoneOff size={14} /> Finalizar llamada
          </button>
        )}
      </div>

      {confirming && (
        <div className="absolute right-6 top-[calc(100%-4px)] z-30 w-[300px] rounded-card border border-line bg-surface p-3 text-ink shadow-lg">
          <p className="flex gap-2 text-xs leading-snug">
            <CircleAlert size={14} className="mt-0.5 flex-none text-danger" />
            Vas a finalizar sin registrar la respuesta del cliente. El ofrecimiento no quedará en el historial.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="h-8 flex-1 rounded-control bg-brand text-xs font-medium text-white">Seguir en llamada</button>
            <button type="button" onClick={() => { setConfirming(false); onEndCall() }} className="h-8 flex-1 rounded-control border border-line text-xs font-medium text-muted">Finalizar igual</button>
          </div>
        </div>
      )}
    </header>
  )
}
