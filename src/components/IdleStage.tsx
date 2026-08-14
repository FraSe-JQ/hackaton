import { Clock, Lightbulb, MessageCircle, Phone, Radio } from 'lucide-react'
import type { IdlePrepView, OfferSummary } from '../lib/viewModel'
import { OfferRow } from './OfferRow'

export function IdleStage({ prep, offers, onStartCall }: { prep: IdlePrepView; offers: OfferSummary[]; onStartCall: () => void }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <PrepColumn prep={prep} />

      <div className="flex flex-col items-center justify-center gap-3 lg:px-2">
        <button
          type="button"
          onClick={onStartCall}
          className="group grid h-36 w-36 place-items-center rounded-full bg-green text-white shadow-[0_10px_24px_rgba(10,143,88,0.28)] ring-8 ring-green/10 transition-transform hover:scale-105 active:scale-100"
        >
          <span className="flex flex-col items-center gap-1.5">
            <Phone size={26} />
            <span className="text-sm font-medium leading-tight">Iniciar<br />llamada</span>
          </span>
        </button>
        <p className="max-w-[190px] text-center text-xs leading-snug text-muted">
          Al iniciar verás la transcripción y las sugerencias en vivo.
        </p>
      </div>

      <section aria-label="Planes recomendados" className="flex min-h-0 flex-col">
        <header className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">Planes recomendados</h2>
          <span className="text-xs text-muted">Orden por probabilidad</span>
        </header>
        {offers.length === 0 ? (
          <p className="mt-2 rounded-card border border-line bg-surface p-3 text-xs text-muted">
            No hay ofertas disponibles para este cliente.
          </p>
        ) : (
          <ul className="mt-2 flex min-h-0 flex-col gap-2 overflow-y-auto pr-0.5">
            {offers.map((offer) => (
              <OfferRow key={offer.id} offer={offer} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PrepColumn({ prep }: { prep: IdlePrepView }) {
  return (
    <section aria-label="Sugerencias previas a la llamada" className="flex min-h-0 flex-col">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-ink">Sugerencias IA · antes de llamar</h2>
      </header>
      <div className="mt-2 flex min-h-0 flex-col gap-2 overflow-y-auto pr-0.5">
        <PrepCard icon={<MessageCircle size={15} />} label="Apertura sugerida" text={prep.opening} />
        <PrepCard icon={<Lightbulb size={15} />} label={`Objeción esperada: ${prep.expectedObjection}`} text={prep.rebate} />
        <PrepCard icon={<Radio size={15} />} label="Canal sugerido" text={prep.channelSuggestion} />
        <PrepCard icon={<Clock size={15} />} label="Mejor momento" text={prep.momentSuggestion} />
      </div>
    </section>
  )
}

function PrepCard({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex gap-2.5 rounded-card border border-line bg-surface p-3">
      <div className="grid h-7 w-7 flex-none place-items-center rounded-control bg-soft text-green-dark">{icon}</div>
      <div className="min-w-0">
        <span className="block text-xs font-medium text-ink">{label}</span>
        <p className="mt-1 text-xs leading-snug text-muted">{text}</p>
      </div>
    </div>
  )
}
