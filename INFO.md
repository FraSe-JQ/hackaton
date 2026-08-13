# INFO.md — Reporte técnico exhaustivo del proyecto

> Documento generado por análisis completo del repositorio. Complementa (no reemplaza) `PRODUCT.md` (producto/negocio) y `DESIGN.md` (sistema visual).

---

## 1. Qué es este proyecto

**Nombre interno:** `movistar-asistente-comercial-ia`
**Tipo:** Single Page Application (SPA) 100% frontend, sin backend.
**Propósito:** Demo/prototipo de un copiloto de IA para asesores comerciales de Movistar. Durante una llamada simulada con un cliente, la herramienta muestra el perfil del cliente, su historial de campañas, recomienda ofertas (NBO — Next Best Offer, o MT — Movistar Total) con una probabilidad estimada, simula una transcripción de la conversación y da sugerencias al asesor sobre qué decir y qué hacer.

Es una demo de **hackatón**: no hay IA real, ni backend, ni autenticación. Todo el "razonamiento IA" es una heurística determinista en TypeScript que corre en el navegador, y la "transcripción" es texto guionado que se revela progresivamente con `setTimeout`.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework UI | React | 18.3.1 |
| Lenguaje | TypeScript | 5.6.3 |
| Build tool | Vite | 5.4.10 |
| Estilos | CSS plano + Tailwind (instalado pero casi no usado) | Tailwind 3.4.17 |
| Iconos | lucide-react | 0.468.0 |
| Parsing CSV | PapaParse | 5.4.1 |
| Hosting | GitHub Pages (vía GitHub Actions) | — |

No hay: router, state management library (Redux/Zustand/etc.), testing framework, linter configurado, backend/API, base de datos, autenticación.

Todo el estado vive en `useState`/`useEffect` de React dentro de un único componente (`App.tsx`).

---

## 3. Estructura de carpetas

```
hackaton/
├── DataSet/                      # CSVs "fuente de verdad" (NO se sirven directo en runtime)
│   ├── dataset_clientes.csv          # 100,000 clientes
│   ├── catalogo_ofertas_entrega.csv  # 22 ofertas/planes
│   └── historial_campanias.csv       # 300,112 ofrecimientos históricos
│
├── scripts/
│   └── prepare-data.mjs          # Script Node que genera un subconjunto "demo" desde DataSet/
│
├── public/data/                  # Salida de prepare-data.mjs — esto es lo que la app carga en runtime
│   ├── catalogo_ofertas_entrega.csv  # copia íntegra del catálogo (22 filas)
│   ├── dataset_clientes_demo.csv     # subconjunto de 30 clientes
│   ├── historial_campanias_demo.csv  # historial filtrado solo para esos 30 clientes
│   └── manifest.json                 # metadata generada (conteos, timestamp)
│
├── src/
│   ├── main.tsx                  # entry point, monta <App /> en #root
│   ├── App.tsx                   # TODO el UI y la lógica de interacción vive aquí (un solo archivo)
│   ├── index.css                 # todo el CSS de la app (sin CSS Modules, sin styled-components)
│   ├── types.ts                  # tipos de dominio: Customer, Offer, CampaignHistory, RecommendedOffer
│   ├── vite-env.d.ts             # tipos de Vite
│   ├── hooks/
│   │   └── useDemoData.ts        # hook que carga los 3 CSVs al montar la app
│   └── lib/
│       ├── csv.ts                 # utilidades: fetch+parse CSV, coerción bool/num/string
│       └── data.ts                # normalización de filas CSV + lógica de scoring de ofertas
│
├── dist/                         # build de producción (generado, versionado en el repo — inusual)
├── index.html                    # HTML raíz, monta src/main.tsx
├── vite.config.ts                # config de Vite (base path condicional para GitHub Pages)
├── tailwind.config.js / postcss.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json
├── PRODUCT.md                    # spec de producto (negocio, usuarios, alcance)
├── DESIGN.md                     # spec de sistema visual (tokens, layout, componentes)
└── .github/workflows/deploy.yml  # CI/CD: build + deploy automático a GitHub Pages en push a main
```

**Nota:** `dist/` está commiteado en el repo (normalmente se ignora vía `.gitignore`). No hay `.gitignore` en la raíz — vale la pena revisar si esto es intencional.

---

## 4. Flujo de datos, de punta a punta

### 4.1. Origen: `DataSet/` (datos "reales" del hackatón)

Tres CSVs enormes provistos como insumo del reto:

- **`dataset_clientes.csv`** — 100,000 filas. Un cliente por fila, con campos de perfil (tipo de cliente, antigüedad, servicios contratados, plan actual, facturación, consumo de datos/voz/SMS, uso de la app, mora, reclamos, canal preferido, ubicación, elegibilidad a Movistar Total).
- **`catalogo_ofertas_entrega.csv`** — 22 filas. El catálogo completo de ofertas/planes (móvil, hogar, bundles), con precio, % de ahorro, GB incluidos, segmento objetivo, si es oferta MT.
- **`historial_campanias.csv`** — 300,112 filas. Cada fila es un ofrecimiento pasado a un cliente: qué oferta se le ofreció, por qué canal, si fue aceptada/rechazada/pendiente, motivo de rechazo, si fue un "rebate" (contraoferta de retención).

Importante: **no hay nombres de personas** en el dataset — el identificador visible es `cliente_id` (ej. `CLI000001`), tal como indica `PRODUCT.md`.

### 4.2. Preparación: `scripts/prepare-data.mjs`

Este script Node (ejecutado con `npm run prepare:data`) **no usa ninguna librería CSV** — implementa su propio parser/serializador CSV minimalista (maneja comillas y comas embebidas) porque corre fuera del entorno Vite/browser.

Lógica:
1. Lee los 3 CSV de `DataSet/`.
2. Selecciona un subconjunto de clientes para la demo: los primeros **10 elegibles a MT** (`elegible_mt === 'True'`) + los primeros **20 no elegibles** (candidatos NBO) → total **30 clientes**.
3. Filtra `historial_campanias.csv` para quedarse solo con las filas cuyo `cliente_id` está en ese subconjunto de 30.
4. Copia el catálogo de ofertas **completo** (las 22 ofertas, sin recortar).
5. Escribe todo a `public/data/`, más un `manifest.json` con conteos y timestamp de generación.

Esto existe porque servir 100k clientes + 300k filas de historial vía `fetch` + PapaParse en el navegador sería lento e innecesario para una demo — se recorta a un dataset chico pero "real" (no sintético, son filas reales del CSV original).

**Este paso debe ejecutarse manualmente o vía CI antes del build** — no es automático en `dev`. Si `public/data/` no existe o está desactualizado, hay que correr `npm run prepare:data`.

### 4.3. Carga en runtime: `src/lib/csv.ts` + `src/hooks/useDemoData.ts`

- `csv.ts` expone `loadCsv<T>(url)`: hace `fetch(url)`, obtiene texto, y lo parsea con **PapaParse** (`header: true`), devolviendo un array de objetos con las columnas como keys (todo como `string` en esta etapa). También expone helpers de coerción: `bool()` (compara contra `'true'` case-insensitive), `num()` (Number() con fallback a 0 si no es finito), `clean()` (trim + stringify seguro de null/undefined).
- `useDemoData.ts` es un hook que, en un `useEffect` al montar, llama a `loadDemoData()` (de `lib/data.ts`) y guarda `customers`, `offers`, `history` en estado, junto con `loading`/`error`.

### 4.4. Normalización y tipado: `src/lib/data.ts`

`loadDemoData()` carga en paralelo (`Promise.all`) los 3 CSV desde `public/data/` (usando `import.meta.env.BASE_URL` para resolver correctamente el path tanto en local como bajo el subpath de GitHub Pages), y aplica tres funciones de normalización que convierten los objetos `Record<string,string>` crudos de PapaParse en los tipos de dominio fuertemente tipados definidos en `types.ts`:

- `normalizeCustomer` → `Customer`
- `normalizeOffer` → `Offer`
- `normalizeHistory` → `CampaignHistory`

Cada campo booleano/numérico pasa por `bool()`/`num()`; los strings por `clean()`. Nótese un detalle de robustez: `consumo_sms_prom` se lee con fallback `row.consumo_sms_min_prom || row.consumo_sms_prom` (tolera una posible variación de nombre de columna).

### 4.5. Lógica de negocio — el "motor de recomendación"

Toda la inteligencia de la demo vive en dos funciones puras de `lib/data.ts`:

**`getOpportunity(customer): 'mt' | 'nbo'`**
Trivial: si `customer.elegible_mt` es `true` → oportunidad `'mt'`, si no → `'nbo'`. Esto determina el chip "Potencial MT" vs "NBO detectado" en el header.

**`scoreOffer(customer, offer, history): RecommendedOffer`** (el corazón heurístico)
Sistema de scoring aditivo, arrancando en una base de **48 puntos**, acotado finalmente a `[34, 96]`:

| Condición | Efecto en score |
|---|---|
| Cliente elegible MT **y** oferta es MT | +31 |
| Oferta compatible con segmento del cliente (`sameSegment`: ambos, o móvil si tiene móvil, o hogar si tiene hogar) | +11 |
| Antigüedad del cliente > 60 meses | +5 |
| Consumo de datos > 35GB **y** oferta incluye > 25GB | +7 |
| Cliente tiene hogar **y** oferta es `plan_hogar` | +8 |
| Esta oferta específica fue **rechazada antes** por el cliente | −10 si el motivo fue `precio`, −3 en cualquier otro caso |
| Esta oferta específica fue **aceptada antes** | +3 |

También genera:
- **`reason`** (texto explicativo, prioridad: elegibilidad MT > rechazo por precio > compatibilidad de segmento > "opción exploratoria")
- **`priority`**: `'Alta'` si score > 75, `'Media'` si > 60, si no `'Exploratoria'`
- **`tags`**: tipo de oferta + si es "perfil compatible" o "alternativa"

**`getRecommendedOffers(customer, offers, history)`** aplica `scoreOffer` a las 22 ofertas del catálogo, ordena descendente por `probability`, y devuelve el **top 3**. Estas son las 3 cards que se muestran en "Ofertas recomendadas".

**`getCustomerHistory(customerId, history)`** filtra el historial completo por `cliente_id` y ordena descendente por fecha (string compare, formato `YYYY-MM-DD` así que funciona correctamente).

Es importante notar: **no hay ML, no hay llamadas a ningún modelo de lenguaje**. "IA" es un nombre de marketing para esta heurística de reglas + pesos fijos. Es coherente con lo que dice `PRODUCT.md`: "Sin backend... ni IA de producción en esta etapa."

---

## 5. La UI: `src/App.tsx`

Es un componente monolítico (~130 líneas de JSX denso, sin dividir en archivos separados por componente — todos los subcomponentes viven en el mismo archivo). Estructura:

### Estado (hooks de React)
- `selectedId` — cliente actualmente seleccionado (se auto-selecciona el primero al cargar datos)
- `query` — texto de búsqueda de cliente (filtra por `cliente_id`, `tipo_cliente`, `ubicacion_departamento`)
- `callState: 'idle' | 'active' | 'ended'` — máquina de estados simple de la llamada
- `visibleLines` — cuántas líneas de la transcripción simulada ya se revelaron
- `selectedOfferId` — cuál de las 3 ofertas recomendadas está seleccionada para presentar
- `outcome: 'accepted' | 'rejected' | null` — resultado registrado de la presentación

### Efectos clave
- Auto-selecciona el primer cliente cuando `customers` carga.
- Al cambiar `selectedId`, resetea todo el estado de llamada/oferta/resultado (evita arrastrar estado entre clientes).
- Mientras `callState === 'active'`, cada 1200ms revela una línea más de transcripción (`setTimeout` recursivo vía efecto), hasta agotar las líneas disponibles.

### `buildTranscript(customer)`
Genera un guion de 4 líneas (Cliente/Asesor alternado) **basado en heurísticas simples** sobre el cliente: si `monto_facturado_prom > 90` → el cliente se queja del precio; si `consumo_datos_gb_prom > 35` → el cliente menciona que necesita más datos. Es texto pre-escrito con 2 variantes por línea, no generación real.

### Layout (ver también `DESIGN.md`)
1. **`topbar`** — logo, botón Iniciar/Finalizar llamada, estado de llamada, chip de oportunidad (MT/NBO), botón de notificaciones (no funcional).
2. **`sidebar`** (25% ancho) — buscador de cliente, selector `<select>`, resumen del cliente (avatar, tipo, ubicación, badge MT/NBO), grid de perfil (antigüedad, plan actual con popover de detalle on-hover, facturación promedio, canal preferido), servicios activos (móvil/hogar/internet como tags), elegibilidad MT, historial de ofrecimientos (últimos 4).
3. **`main-column`**:
   - **`offers-section`** — grid de 3 `OfferCard` (las top-3 recomendaciones), cada una clickeable para seleccionarla como "oferta a presentar".
   - **`live-grid`** con dos paneles lado a lado:
     - **`transcript-panel`** — muestra las líneas de transcripción reveladas progresivamente, con indicador de "IA procesando contexto" (animación de puntos) mientras faltan líneas, y botón "Reiniciar demo".
     - **`suggestions-panel`** — 3 tarjetas de sugerencia IA (fijas por tono: soft/green/blue: "Escucha primero", "Siguiente acción", "Argumento sugerido" — contenido dinámico según consumo del cliente y oferta seleccionada), más la zona de "Resultado de la presentación" con botones Aceptada/Rechazada.

### Subcomponentes internos (todos en `App.tsx`, no exportados)
- `ProfileItem` — celda genérica label/value del grid de perfil.
- `PlanProfileItem` — celda especial para el plan actual, con popover CSS-only (`:hover`/`:focus-visible`) mostrando detalle del plan.
- `HistoryItem` — fila de una entrada de historial.
- `OfferCard` — tarjeta de oferta recomendada con score, precio, razón, y estado seleccionado.
- `Suggestion` — tarjeta de sugerencia IA con icono/tono.

### Utilidades locales en el archivo
- `money(value)` — formatea como `S/ XX.XX` (soles peruanos).
- `prettyDate(value)` — formatea fecha `YYYY-MM-DD` a `DD MMM` en español (`es-PE`), en mayúsculas.
- `label(value)` — reemplaza `_` por espacio, o `'No informado'` si vacío.

---

## 6. Estilos (`src/index.css`, `DESIGN.md`, `tailwind.config.js`)

Aunque Tailwind está instalado y configurado (`@tailwind base/components/utilities` en `index.css`, `content` apuntando a `index.html` y `src/**/*.{ts,tsx}`), **en la práctica no se usan clases utility de Tailwind en `App.tsx`** — todo el diseño está en CSS plano BEM-ish dentro de `index.css` (~215 líneas), con custom properties (`--ink`, `--muted`, `--green`, etc.) para el sistema de tokens descrito en `DESIGN.md`.

Tokens principales (coinciden entre `DESIGN.md` y `index.css`):
- Ink `#14241f`, Muted `#687973`, Surface `#ffffff`, Canvas `#f4f7f5`
- Movistar green `#0a8f58`, Deep green `#063f35`, NBO blue `#2f73d9`
- Radios estándar 9–13px, pills solo para chips de estado.

Responsive con 3 breakpoints (`1120px`, `850px`, `620px`) que van colapsando: sidebar+contenido lado a lado → sidebar arriba → single-column, según especifica `DESIGN.md`. También respeta `prefers-reduced-motion`.

---

## 7. Tipos de dominio (`src/types.ts`)

```ts
Opportunity = 'mt' | 'nbo'

Customer   // 23 campos: identidad, servicios, plan, consumo, mora, reclamos, canal
Offer      // 11 campos: id, nombre, tipo, segmento, precio, ahorro, GB, cluster hogar, descripciones
CampaignHistory  // 17 campos: ofrecimiento, resultado, canal, motivo rechazo, contexto del cliente en ese momento
RecommendedOffer = Offer & { probability, reason, priority, tags }  // extensión de Offer con el output del scoring
```

---

## 8. Build, dev y despliegue

### Scripts (`package.json`)
```json
"dev":           "vite"                    // servidor de desarrollo
"build":         "tsc -b && vite build"    // type-check + build de producción a dist/
"preview":       "vite preview"            // sirve dist/ localmente
"prepare:data":  "node scripts/prepare-data.mjs"  // regenera public/data/ desde DataSet/
```

No hay script de `test` ni de `lint`.

### `vite.config.ts`
```ts
base: process.env.NODE_ENV === 'production' ? '/hackaton/' : '/'
```
Esto es clave: en producción (build para GitHub Pages) el sitio se sirve bajo `https://<usuario>.github.io/hackaton/`, por lo que todos los assets y el fetch de los CSV deben resolverse con ese prefijo — de ahí que `lib/data.ts` use `import.meta.env.BASE_URL` en vez de rutas absolutas `/data/...`.

### CI/CD (`.github/workflows/deploy.yml`)
Workflow de GitHub Actions `Deploy to GitHub Pages`, dispara en push a `main` (o manualmente):
1. Checkout
2. Setup Node 20 con cache de npm
3. `npm ci`
4. `npm run prepare:data` (regenera `public/data/` en cada deploy, garantizando que esté sincronizado con `DataSet/`)
5. `npm run build`
6. Configura GitHub Pages, sube `dist/` como artifact, y lo despliega al ambiente `github-pages`.

Esto significa que **el pipeline de CI es la fuente de verdad del build de producción** — no hace falta commitear `dist/` manualmente (aunque actualmente está commiteado, ver nota de la sección 3).

### TypeScript
- `tsconfig.json` es un root con `references` a `tsconfig.app.json` (config de la app, probablemente `strict: true`, target moderno, JSX react) y `tsconfig.node.json` (config para archivos de config tipo `vite.config.ts`). Proyecto compuesto estándar de plantilla Vite+React+TS.

---

## 9. Puntos a tener en cuenta / posibles mejoras

- **`dist/` versionado en git**: inusual, generalmente se ignora. Si es intencional (ej. para servir sin CI), documentarlo; si no, agregar `.gitignore`.
- **No hay `.gitignore`** en la raíz — ni `node_modules/`, ni `dist/` están excluidos explícitamente.
- **No hay tests** (unit, integración, e2e) ni linter configurado — para una demo de hackatón es razonable, pero limita la confianza en refactors.
- **`App.tsx` es monolítico**: toda la UI en un archivo. Funciona para el tamaño actual, pero si el proyecto crece valdría dividir en componentes propios (`components/OfferCard.tsx`, etc.) como ya insinúa `DESIGN.md` con nombres de componentes.
- **Datos de demo fijos (30 clientes)**: la selección es determinista (primeros N de cada grupo tras filtrar), no aleatoria ni representativa estadísticamente — adecuado solo para demo, no para validar el scoring a escala.
- **Botón de notificaciones (`icon-button`) es decorativo**, sin handler.
- **El "scoring" y las "sugerencias IA" son 100% heurísticas hardcodeadas** en el cliente — si el objetivo real del hackatón evoluciona hacia un modelo de verdad (ML o LLM), este es el punto de reemplazo natural (`scoreOffer` en `lib/data.ts` y `buildTranscript`/sugerencias en `App.tsx`).

---

## 10. Cómo correr el proyecto localmente

```bash
npm install
npm run prepare:data   # genera public/data/ desde DataSet/ (necesario si public/data está vacío o desactualizado)
npm run dev            # http://localhost:5173
```

Para reproducir el build de producción tal como lo hace CI:
```bash
npm ci
npm run prepare:data
npm run build
npm run preview
```
