import { Sparkles } from 'lucide-react'
import type { OfferSummary } from '../lib/viewModel'
import { RANK_LABEL } from './OfferTile'

export function OfferRow({ offer }: { offer: OfferSummary }) {
  return (
    <li
      className={`rounded-card border bg-surface p-3 ${offer.rank === 1 ? 'border-green' : 'border-line'}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-5 w-5 flex-none place-items-center rounded-full text-xs font-medium ${
            offer.rank === 1 ? 'bg-green text-white' : 'bg-soft text-muted'
          }`}
        >
          {offer.rank}
        </span>
        <strong className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{offer.name}</strong>
        <strong className="flex-none text-sm font-medium text-green-dark">{offer.probability}%</strong>
      </div>

      <div className="mt-1.5 flex items-center gap-2 pl-7 text-xs">
        <span className={offer.rank === 1 ? 'inline-flex items-center gap-1 font-medium text-green-dark' : 'text-muted'}>
          {offer.rank === 1 && <Sparkles size={11} />}
          {RANK_LABEL[offer.rank]}
        </span>
        <span className="text-muted">·</span>
        <span className="text-ink">{offer.priceLabel}</span>
        <span className="text-muted">·</span>
        <span className="truncate text-muted">{offer.gbLabel}</span>
      </div>

      <p className="mt-1.5 line-clamp-2 pl-7 text-xs leading-snug text-muted">{offer.reason}</p>
    </li>
  )
}
