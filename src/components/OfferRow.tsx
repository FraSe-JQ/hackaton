import type { OfferSummary } from '../lib/viewModel'

export function OfferRow({ offer }: { offer: OfferSummary }) {
  const tone = offer.rank === 1
    ? 'border-success bg-success-soft'
    : 'border-line bg-surface'

  return (
    <li className={`flex h-full min-h-[255px] flex-col rounded-card border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-medium ${offer.rank === 1 ? 'bg-brand text-white' : 'bg-soft text-brand-dark'}`}>
            {offer.rank}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">{offer.rank === 1 ? 'Mejor opción' : 'Alternativa'}</span>
        </span>
        <strong className="text-lg font-medium text-brand-dark">{offer.probability}%</strong>
      </div>

      <strong className="mt-4 line-clamp-2 text-lg font-medium leading-tight text-ink">{offer.name}</strong>
      <span className="mt-1.5 text-sm text-muted">{offer.typeLabel} · {offer.gbLabel}</span>
      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{offer.reason}</p>

      <div className="mt-auto grid grid-cols-2 items-end gap-2 border-t border-line/70 pt-3">
        <div>
          <span className="block text-xs uppercase tracking-wide text-muted">Costo mensual</span>
          <strong className="mt-0.5 block text-base font-medium text-ink">{offer.priceLabel}</strong>
        </div>
        <div className="text-right">
          <span className="block text-xs uppercase tracking-wide text-muted">Por qué ofrecerlo</span>
          <strong className="mt-0.5 block line-clamp-2 text-sm font-medium leading-tight text-success" title={offer.savingsLabel ?? offer.deltaLabel}>
            {offer.savingsLabel ?? offer.deltaLabel}
          </strong>
        </div>
      </div>
    </li>
  )
}
