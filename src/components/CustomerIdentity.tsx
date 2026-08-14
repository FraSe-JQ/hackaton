import { useEffect, useState } from 'react'
import { Lock, Search, UserRound } from 'lucide-react'
import type { Customer } from '../types'
import type { CustomerView } from '../lib/viewModel'
import { Stat } from './ui/Stat'

export function CustomerIdentity({
  customer,
  customers,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  locked,
  dense,
}: {
  customer: CustomerView
  customers: Customer[]
  query: string
  onQueryChange: (value: string) => void
  selectedId: string
  onSelect: (id: string) => void
  locked: boolean
  dense: boolean
}) {
  // Durante la llamada el cambio de cliente reinicia la sesión: se pide confirmación explícita.
  const [unlocked, setUnlocked] = useState(false)
  const [confirming, setConfirming] = useState(false)
  useEffect(() => { if (!locked) { setUnlocked(false); setConfirming(false) } }, [locked])

  const showPicker = !locked || unlocked

  return (
    <div>
      {!locked && (
        <>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Contexto</span>
          <h1 className="mt-1 text-lg font-medium text-ink">Información del cliente</h1>
        </>
      )}

      <div className={`flex items-center gap-2.5 rounded-card border border-line bg-surface p-3 ${locked ? '' : 'mt-3'}`}>
        <div className="grid h-9 w-9 flex-none place-items-center rounded-control bg-soft text-green-dark">
          <UserRound size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-medium text-ink">{customer.id}</strong>
          <span className="block truncate text-xs text-muted">{customer.typeLabel} · {customer.location}</span>
        </div>
        {locked && !unlocked && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex-none text-xs font-medium text-muted underline-offset-2 hover:text-green-dark hover:underline"
          >
            Cambiar
          </button>
        )}
      </div>

      {locked && !unlocked && confirming && (
        <div className="mt-2 rounded-card border border-amber/40 bg-amber/5 p-3">
          <p className="flex gap-1.5 text-xs leading-snug text-ink">
            <Lock size={13} className="mt-0.5 flex-none text-amber" />
            Cambiar de cliente reinicia la llamada en curso y borra el avance registrado.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => { setUnlocked(true); setConfirming(false) }}
              className="h-8 flex-1 rounded-control border border-amber/50 bg-surface text-xs font-medium text-amber"
            >
              Sí, cambiar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-8 flex-1 rounded-control bg-ink/5 text-xs font-medium text-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showPicker && (
        <>
          <div className="mt-3 flex h-9 items-center gap-2 rounded-control border border-line bg-surface px-2.5">
            <Search size={15} className="text-muted" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por ID, tipo o ubicación"
              aria-label="Buscar cliente"
              className="w-full border-0 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
            />
          </div>

          <label htmlFor="customer-select" className="mt-2 block text-xs text-muted">
            Cliente seleccionado
          </label>
          <select
            id="customer-select"
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            className="mt-1.5 h-9 w-full rounded-control border border-line bg-surface px-2.5 text-xs font-medium text-ink"
          >
            {customers.map((item) => (
              <option value={item.cliente_id} key={item.cliente_id}>
                {item.cliente_id} · {item.tipo_cliente || 'sin tipo'}
              </option>
            ))}
          </select>
        </>
      )}

      {dense ? (
        <dl className="mt-3 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface text-xs">
          <DenseStat label="Antigüedad" value={customer.tenureLabel} />
          <DenseStat label="Plan actual" value={customer.currentPlanName} />
          <DenseStat label="Facturación" value={customer.billingAvgLabel} />
          <DenseStat label="Canal" value={customer.preferredChannel} />
        </dl>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line">
          <Stat label="Antigüedad" value={customer.tenureLabel} />
          <Stat label="Plan actual" value={customer.currentPlanName} hint={customer.currentPlanId} />
          <Stat label="Facturación prom." value={customer.billingAvgLabel} />
          <Stat label="Canal más usado" value={customer.preferredChannel} />
        </div>
      )}

      <div className="mt-3 flex items-end justify-between gap-2 pb-3">
        <div>
          <span className="block text-xs text-muted">Servicios activos</span>
          <div className="mt-1.5 flex gap-1.5">
            <ServiceTag active={customer.services.mobile}>Móvil</ServiceTag>
            <ServiceTag active={customer.services.home}>Hogar</ServiceTag>
            <ServiceTag active={customer.services.internet}>Internet</ServiceTag>
          </div>
        </div>
        <span className={`whitespace-nowrap text-xs ${customer.eligibleMt ? 'text-green-dark' : 'text-muted'}`}>
          {customer.eligibleMt ? 'Elegible MT' : 'No elegible MT'}
        </span>
      </div>
    </div>
  )
}

function DenseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-2.5 py-1.5">
      <dt className="flex-none text-muted">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-ink" title={value}>{value}</dd>
    </div>
  )
}

function ServiceTag({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-control px-1.5 py-1 text-xs ${active ? 'bg-soft font-medium text-green-dark' : 'bg-canvas text-muted'}`}>
      {children}
    </span>
  )
}
