import { useEffect, useState } from 'react'
import { CircleAlert, PhoneOff } from 'lucide-react'
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
  onEndCall,
}: {
  customer: CustomerView
  phase: CallPhase
  canEndCall: boolean
  needsConfirmToEnd: boolean
  onEndCall: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  useEffect(() => { if (!canEndCall) setConfirming(false) }, [canEndCall])

  const live = phase !== 'idle' && phase !== 'wrapup'

  return (
    <header className="relative flex h-16 flex-none items-center justify-between bg-green-dark px-6 text-white">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg rounded-bl-sm bg-green text-base font-medium">M</div>
        <div>
          <strong className="block text-sm tracking-wide">MOVISTAR</strong>
          <span className="block text-xs text-white/60">Asistente comercial</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 border-r border-white/20 pr-4 text-xs text-white/80 sm:flex">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-[#4ee394]' : 'bg-white/40'}`} />
          {customer.id} · {STATUS_LABEL[phase]}
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-xs font-medium ${customer.opportunity === 'mt' ? 'text-[#c9f5dc]' : 'text-[#cfe1ff]'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${customer.opportunity === 'mt' ? 'bg-[#4ee394]' : 'bg-[#76adff]'}`} />
          {customer.opportunityLabel}
        </span>
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
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-8 flex-1 rounded-control bg-green text-xs font-medium text-white"
            >
              Seguir en llamada
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); onEndCall() }}
              className="h-8 flex-1 rounded-control border border-line text-xs font-medium text-muted"
            >
              Finalizar igual
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
