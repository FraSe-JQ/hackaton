import { Check, Sparkles } from 'lucide-react'
import type { OfferSummary } from '../lib/viewModel'

export const RANK_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Mejor opción',
  2: '2ª opción',
  3: '3ª opción',
}

export function OfferTile({
  offer,
  selected,
  exhausted = false,
  onSelect,
}: {
  offer: OfferSummary
  selected: boolean
  exhausted?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={exhausted}
      aria-pressed={selected}
      className={`flex h-full flex-col rounded-card border p-3 text-left transition-colors ${
        exhausted
          ? 'cursor-not-allowed border-line bg-soft opacity-55'
          : selected
            ? 'border-green ring-1 ring-green'
            : offer.rank === 1
              ? 'border-[#8DC63F] bg-[#EDF7DF] hover:border-green'
              : offer.rank === 2
                ? 'border-[#C4D99B] bg-[#F3F8E9] hover:border-[#8DC63F]'
                : 'border-line bg-[#F8FBF5] hover:border-[#C4D99B]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${exhausted ? 'text-muted' : offer.rank === 1 ? 'text-green-dark' : 'text-muted'}`}>
          {offer.rank === 1 && !exhausted && <Sparkles size={12} />}
          {exhausted ? 'Ya ofrecida' : RANK_LABEL[offer.rank]}
        </span>
        <span
          className={`grid h-4 w-4 flex-none place-items-center rounded-full border ${
            selected ? 'border-green bg-green text-white' : 'border-line text-transparent'
          }`}
          aria-hidden="true"
        >
          <Check size={10} />
        </span>
      </div>

      <strong className="mt-1.5 line-clamp-2 text-sm font-medium leading-tight text-ink">{offer.name}</strong>

      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <strong className="block text-sm font-medium text-ink">{offer.priceLabel}</strong>
        <div className="flex-none text-right">
          <strong className="block text-base font-medium leading-none text-green-dark">{offer.probability}%</strong>
          <span className="block text-xs text-muted">prob.</span>
        </div>
      </div>
    </button>
  )
}
