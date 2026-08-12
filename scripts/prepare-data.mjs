import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const source = path.join(root, 'DataSet')
const target = path.join(root, 'public', 'data')
fs.mkdirSync(target, { recursive: true })

const readLines = (file) => fs.readFileSync(path.join(source, file), 'utf8').trim().split(/\r?\n/)
const parseLine = (line) => {
  const values = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1 } else quoted = !quoted
    } else if (char === ',' && !quoted) { values.push(current); current = '' } else current += char
  }
  values.push(current)
  return values
}
const csvRows = (file) => {
  const lines = readLines(file)
  const headers = parseLine(lines[0])
  return lines.slice(1).map((line) => Object.fromEntries(parseLine(line).map((value, i) => [headers[i], value])))
}
const csvText = (rows, headers) => [headers.join(','), ...rows.map((row) => headers.map((header) => {
  const value = String(row[header] ?? '')
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}).join(','))].join('\n') + '\n'

const offers = csvRows('catalogo_ofertas_entrega.csv')
const customers = csvRows('dataset_clientes.csv')
const eligible = customers.filter((row) => row.elegible_mt === 'True').slice(0, 10)
const nbo = customers.filter((row) => row.elegible_mt !== 'True').slice(0, 20)
const demoCustomers = [...eligible, ...nbo]
const ids = new Set(demoCustomers.map((row) => row.cliente_id))
const history = csvRows('historial_campanias.csv').filter((row) => ids.has(row.cliente_id))

fs.writeFileSync(path.join(target, 'catalogo_ofertas_entrega.csv'), csvText(offers, Object.keys(offers[0])))
fs.writeFileSync(path.join(target, 'dataset_clientes_demo.csv'), csvText(demoCustomers, Object.keys(demoCustomers[0])))
fs.writeFileSync(path.join(target, 'historial_campanias_demo.csv'), csvText(history, Object.keys(history[0])))
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({
  source: '/DataSet',
  generatedAt: new Date().toISOString(),
  customers: demoCustomers.length,
  offers: offers.length,
  history: history.length,
}, null, 2))

console.log(`Prepared ${demoCustomers.length} customers, ${offers.length} offers and ${history.length} history rows.`)
