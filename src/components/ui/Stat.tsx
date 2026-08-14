export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-line bg-surface p-2.5" title={hint}>
      <span className="block text-xs text-muted">{label}</span>
      <strong className="mt-1 block truncate text-sm font-medium text-ink">{value}</strong>
    </div>
  )
}
