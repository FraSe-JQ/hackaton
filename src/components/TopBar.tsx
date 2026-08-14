import { useEffect, useState } from 'react'
import { CircleAlert, Pause, PhoneOff, Play } from 'lucide-react'
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
    <header className="relative flex h-16 flex-none items-center justify-between bg-green-dark px-6 text-white">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg rounded-bl-sm bg-green text-base font-medium text-green-dark">M</div>
        <div>
          <strong className="block text-sm tracking-wide">MOVISTAR</strong>
          <span className="block text-xs text-white/60">Asistente comercial</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end border-r border-white/20 pr-4 text-xs sm:flex">
          <div className="flex items-center gap-2 text-white/80">
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-green' : 'bg-white/40'}`} />
            {STATUS_LABEL[phase]}
          </div>
          <span className="mt-0.5 text-[10px] text-white/60">Cliente {customer.id}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-xs font-medium text-white/80">
          <span className={`h-1.5 w-1.5 rounded-full ${customer.opportunity === 'mt' ? 'bg-green' : 'bg-blue'}`} />
          {customer.opportunityLabel}
        </span>
        {canEndCall && (
          <button
            type="button"
            aria-pressed={!automationEnabled}
            aria-label={automationEnabled ? 'Pausar simulación automática' : 'Reanudar simulación automática'}
            title={automationEnabled ? 'Pausar simulación automática' : 'Reanudar simulación automática'}
            onClick={onToggleAutomation}
            className={`inline-flex h-9 items-center gap-1.5 rounded-control border px-3 text-xs font-medium transition-colors ${automationEnabled ? 'border-white/25 bg-white/10 text-white hover:bg-white/20' : 'border-green bg-green text-green-dark hover:bg-[#9bd34c]'}`}
          >
            {automationEnabled ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden md:inline">{automationEnabled ? 'Pausar' : 'Reanudar'}</span>
          </button>
        )}
        {canEndCall && (
          <button
            type="button"
            onClick={() => (needsConfirmToEnd ? setConfirming(true) : onEndCall())}
            className="inline-flex h-9 items-center gap-2 rounded-control bg-red px-3 text-xs font-medium text-white transition-colors hover:bg-[#8f3232]"
          >
            <PhoneOff size={14} /> Finalizar llamada
          </button>
        )}
      </div>

      {confirming && (
        <div className="absolute right-6 top-[calc(100%-4px)] z-30 w-[300px] rounded-card border border-line bg-surface p-3 text-ink shadow-lg">
          <p className="flex gap-2 text-xs leading-snug">
            <CircleAlert size={14} className="mt-0.5 flex-none text-amber" />
            Vas a finalizar sin registrar la respuesta del cliente. El ofrecimiento no quedará en el historial.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="h-8 flex-1 rounded-control bg-green text-xs font-medium text-green-dark">Seguir en llamada</button>
            <button type="button" onClick={() => { setConfirming(false); onEndCall() }} className="h-8 flex-1 rounded-control border border-line text-xs font-medium text-muted">Finalizar igual</button>
          </div>
        </div>
      )}
    </header>
  )
}
