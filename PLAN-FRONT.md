# Plan de reconstrucción — capa de presentación

Estado revisado: `npm install`, `npm run prepare:data`, `npm run dev` corren sin errores. No se pudo tomar captura visual (extensión de Chrome no conectada), pero `App.tsx`/`index.css` fueron leídos íntegros y contrastados contra `public/data/*.csv` reales — es suficiente para diagnosticar los 15 problemas del brief sin la captura.

Hallazgos confirmados en los datos que afectan el plan:
- El primer cliente por orden de CSV (`CLI000013`) ya es `elegible_mt = True` → criterio de aceptación #1 se cumple "gratis" si mantenemos `customers[0]` como default, pero hay que verificarlo con una guarda explícita (no asumir el orden del CSV para siempre).
- `OF004` y `OF022` tienen `gb_incluidos = 9999`; el `9999` fugado vive en `descripcion_corta` ("... - 9999GB - ..."), no solo en el nombre. Por eso la UI no debe renderizar `descripcion_corta` cruda en ningún lado — todo subtítulo de oferta se construye en `viewModel`/`format` a partir de campos tipados.
- `plan_actual_id` de un cliente coincide con IDs del catálogo (ej. `OF004`, `OF003`) → confirma el bug de recomendar el plan actual como upgrade; la guarda de exclusión en §7 es necesaria.

## 1. Arquitectura de componentes

```
src/
  App.tsx                     // composición, useState de alto nivel (<150 líneas)
  context/
    SelectedCustomerContext.tsx  // (solo si prop drilling se pone feo; evaluar al implementar)
  components/
    TopBar.tsx
    FunnelBar.tsx
    ContextRail.tsx           // wrapper del riel; compone los 3 bloques
    CustomerIdentity.tsx
    ModelSignals.tsx
    OfferHistory.tsx
    OfferStack.tsx            // wrapper: hero + 2 alternativas + ranking
    HeroOffer.tsx
    AlternativeOffer.tsx
    CopilotPanel.tsx          // switch por callState
    CopilotIdle.tsx
    CopilotActive.tsx
    OutcomeForm.tsx           // estado "ended": Aceptada/Rechazada + motivo + resumen
    ui/
      Chip.tsx
      Stat.tsx
      Card.tsx
      Collapsible.tsx
  lib/
    viewModel.ts               // dominio → props de UI (frontera única)
    format.ts                  // money, fechas, "Ilimitado", labels
  hooks/
    useDemoData.ts             // sin cambios
  lib/data.ts                  // sin cambios en scoreOffer; se añade wrapper de guardas
  types.ts                     // sin cambios de dominio; se añaden tipos de ViewModel
```

`viewModel.ts` expone algo como:

```ts
buildCustomerView(customer, offers, history): CustomerView
// -> identity, signals[3], historyEntries[], funnelSteps[]

buildOfferStackView(customer, offers, history): OfferStackView
// -> hero (con motivo/ahorro/delta/canal/momento/objeción/rebate), alternatives[2]
// aplica las dos guardas de §7 antes de rankear

buildCopilotView(callState, customerView, offerStackView): CopilotView
// -> contenido de los 3 estados, nunca vacío
```

La UI (componentes) no importa `Customer`/`Offer`/`CampaignHistory` de `types.ts` directamente salvo en `viewModel.ts` y `App.tsx` (para pasarlos al viewModel). Todo lo demás consume tipos de `ViewModel`.

## 2. Cambios de layout (vs. el objetivo del brief)

- Topbar: un solo chip de oportunidad (ya existe una versión, se simplifica quitando redundancia con el badge del riel). Se elimina el botón de campana.
- Nueva `FunnelBar` de 5 pasos, debajo del topbar, antes del layout de dos columnas.
- Riel de contexto baja de 25% a ~240–260px fijo, con 3 bloques (identidad, señales del modelo, historial plegado).
- Columna principal: hero (2x altura) + 2 alternativas en fila comprimida (no cards iguales) + panel de copiloto único (se colapsan "transcript" y "suggestions" en un solo `CopilotPanel` que cambia de contenido según `callState`, no dos paneles fijos lado a lado).
- El panel de copiloto en estado `idle` deja de estar vacío: muestra apertura sugerida + objeción esperada + rebate (contenido movido desde donde hoy vive disperso en "Sugerencias IA").

## 3. Guardas de correctividad (§7, en `viewModel.ts`, no en `scoreOffer`)

```ts
function excludeCurrentPlan(offers: Offer[], customer: Customer) {
  return offers.filter(o => o.oferta_id !== customer.plan_actual_id)
}

function rankWithExplicitPositions(recommended: RecommendedOffer[]) {
  // asigna rank 1/2/3 por orden de array (ya viene ordenado por score desc)
  // el motivo diferenciado ya lo requiere el criterio de aceptación #3;
  // se resuelve generando 3 plantillas de "reason" distintas basadas en
  // señales distintas del cliente (elegibilidad MT, consumo, canal, antigüedad)
  // en vez de depender de que el score difiera.
}
```

`getRecommendedOffers` se sigue llamando igual; el wrapper vive antes/después de esa llamada dentro de `viewModel.ts`.

## 4. Sistema visual / CSS

- Se elimina Tailwind (`tailwind.config.js`, `postcss.config.js`, directivas `@tailwind` en `index.css`, dependencias del `package.json`) — nos quedamos con CSS plano, ya que es lo que realmente se usa.
- `index.css` se reorganiza en capas: `:root` tokens (colores existentes + escala tipográfica explícita `--text-12/13/15/18/22/32` + `--gap-*`) → reset → layout raíz → componentes por bloque, con comentarios de sección mínimos.
- Se retiran gradientes/sombras decorativas de `.offer-card.primary` y similares; bordes hairline consistentes.
- Radios: 8px controles, 12px cards, píldoras solo en chips de estado (ya mayormente así, se audita).
- Sentence case: se bajan los `text-transform: uppercase` de los `section-kicker`/labels salvo en el heading del riel y el heading de la columna principal (las dos secciones principales permitidas).

## 5. Copy

Se reescribe todo el copy visible según §9 (verbo primero en botones, sin "intervenciones"/"dataset"/"scoring", plantillas de motivo con cifras reales del cliente). Vive directamente en los componentes y en `viewModel.ts` (las plantillas de texto dinámico).

## 6. Orden de commits propuesto

1. `chore: remove tailwind, reorganize css tokens` (solo tokens/reset, sin romper visualmente lo existente)
2. `feat: add format.ts and viewModel.ts with correctness guards`
3. `refactor: extract TopBar, FunnelBar, ContextRail (+ subcomponentes)`
4. `refactor: extract HeroOffer, AlternativeOffer, OfferStack`
5. `refactor: extract CopilotPanel (idle/active/ended) + OutcomeForm`
6. `refactor: slim App.tsx to composition only`
7. `style: visual pass — hierarchy, contrast, spacing, chanel rule`
8. `docs: update DESIGN.md, close out PLAN-FRONT.md`

Cada commit debe dejar `npm run build` verde.

## 7. Decisiones confirmadas (2026-08-12)

- Tailwind: se adoptó por completo (no se quitó). `tailwind.config.js` concentra los tokens; `index.css` quedó reducido a reset + directivas + foco de teclado + `prefers-reduced-motion`.
- Copiloto: se fusionaron transcripción + sugerencias en un único `CopilotPanel` que cambia de contenido según `callState`.
- Context de React: no hizo falta. El prop drilling de `App.tsx` a los componentes de nivel 2–3 se mantuvo manejable con props normales; no se introdujo `SelectedCustomerContext`.

## 8. Estado final — implementación completa

Los 8 commits temáticos del plan se ejecutaron (tokens Tailwind → `viewModel`/`format` con las 2 guardas → extracción de componentes por bloque → `App.tsx` a composición → pase visual). `npm run build` pasa sin errores ni warnings de TypeScript en el estado final.

### Pendiente / no verificado

- **No se pudo verificar visualmente en navegador**: la extensión de Chrome no estuvo disponible durante esta sesión (`tabs_context_mcp` devolvió "extensión no conectada" en los 3 intentos). Todo el trabajo se validó por lectura de código, `npm run build` (type-check + build de producción) y contraste explícito contra los 15 criterios de aceptación del brief. Recomendado: correr `npm run dev` y hacer una pasada visual real antes de dar la demo por cerrada, en particular para confirmar legibilidad del héroe en 1440×900/1280×720 y el comportamiento de `order-*` en 620px.
- **Contraste AA**: se oscurecieron `muted`/`amber`/`red` respecto a los tokens originales para acercarse al mínimo AA sobre `soft`/`canvas`, pero no se corrió un checker de contraste automatizado — vale la pena pasarlo por un validador (ej. axe DevTools) en la primera revisión visual.
- **Reglas "Chanel"**: se aplicó una pasada de reducción (se quitó el glow del indicador de llamada activa en el topbar, se redujo a un solo eyebrow en mayúsculas). No se hizo una segunda pasada exhaustiva elemento por elemento porque no hubo captura visual para juzgarlo con criterio de diseño real.

### Qué asume esta capa del motor futuro (`viewModel.ts`)

- `scoreOffer`/`getRecommendedOffers` (`src/lib/data.ts`) no se tocaron: siguen siendo la heurística determinista existente. `buildOfferStackView` solo envuelve su salida con las dos guardas (excluir plan actual, ranking 1/2/3 con motivo forzado a ser distinto por oferta) y no depende de que el score futuro separe las probabilidades — si el motor real ya las separa, el ranking y el guard de "motivo distinto" siguen funcionando sin cambios.
- `buildModelSignals`, `reasonFor`, `buildIdlePrep` y las plantillas de rebate derivan **señales explicativas propias en la capa de UI**, a partir de los mismos campos crudos que usa `scoreOffer` (elegibilidad MT, segmento, consumo, antigüedad, historial de rechazo/aceptación). Cuando el motor real llegue con su propio conjunto de razones/explicabilidad, estas funciones son el punto de reemplazo natural — la firma esperada por los componentes (`ModelSignal[]`, `reason: string` en `OfferSummary`) no debería cambiar, solo su implementación interna.
- El "canal y momento sugeridos" y la "objeción más probable" son heurísticas deterministas simples (mapeo por `canal_mas_usado` y por motivo de rechazo más frecuente en el historial del cliente). No hay lógica de negocio nueva aquí — son mapeos de conveniencia para no dejar la UI vacía, y están aislados en `CHANNEL_MOMENT` y `REJECTION_REBATE` en `viewModel.ts` para que sean triviales de reemplazar.
- El registro de resultado (`OutcomeForm`) no persiste nada fuera de memoria de React (sin `localStorage`, por restricción explícita del brief) — al cambiar de cliente se resetea. Si el motor real necesita persistir el "medio probatorio", ese es un cambio de alcance nuevo, no cubierto aquí.
