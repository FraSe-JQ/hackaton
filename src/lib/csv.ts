import Papa from 'papaparse'

export async function loadCsv<T>(url: string): Promise<T[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`)
  const text = await response.text()
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true })
  if (parsed.errors.length) console.warn('CSV warnings', parsed.errors.slice(0, 3))
  return parsed.data
}

export function bool(value: unknown): boolean {
  return String(value ?? '').trim().toLowerCase() === 'true'
}

export function num(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function clean(value: unknown): string {
  return String(value ?? '').trim()
}
