const UNLIMITED_GB_THRESHOLD = 999

export function formatMoney(value: number): string {
  return `S/ ${value.toFixed(2)}`
}

export function formatMoneySigned(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}S/ ${Math.abs(value).toFixed(2)}`
}

export function formatShortDate(value: string): string {
  if (!value) return 'Sin fecha'
  const formatted = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
  return formatted.replace('.', '').toUpperCase()
}

export function formatLabel(value: string): string {
  return value ? value.replaceAll('_', ' ') : 'No informado'
}

export function formatGb(value: number): string {
  return value > UNLIMITED_GB_THRESHOLD ? 'Ilimitado' : `${value} GB`
}

export function formatTenure(months: number): string {
  if (months < 12) return `${months} meses`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest === 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : `${years} a. ${rest} m.`
}

const REJECTION_REASON_LABELS: Record<string, string> = {
  precio: 'Precio',
  mal_momento: 'Mal momento',
  no_necesita: 'No lo necesita',
  no_confia: 'No confía en el beneficio',
  ya_tiene_similar: 'Ya tiene algo similar',
  otro: 'Otro motivo',
}

export function formatRejectionReason(value: string): string {
  return REJECTION_REASON_LABELS[value] ?? formatLabel(value)
}

export const REJECTION_REASON_OPTIONS = Object.entries(REJECTION_REASON_LABELS).map(([value, label]) => ({ value, label }))
