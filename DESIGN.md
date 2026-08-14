# Asistente Comercial IA — Visual System

## Direction contract

**THESIS:** una mesa de trabajo comercial donde el asesor entiende al cliente, ve la oportunidad y actúa sin cambiar de pantalla.

**OWN-WORLD:** base verde grisácea clara, barra superior verde profunda, superficies blancas con bordes hairline, acentos Movistar verdes y un azul reservado para NBO/asesor.

**STORY:** topbar y funnel dan el estado de la interacción → riel de contexto da identidad y evidencia → la oferta recomendada (héroe) domina la lectura → el copiloto acompaña según el estado real de la llamada.

**FIRST VIEWPORT:** topbar compacto, funnel de 5 pasos, riel de contexto de ~260px y columna principal con la oferta héroe a 2x el peso visual de las alternativas. En escritorio 1440×900/1280×720 la oferta héroe es lo primero que se lee tras el funnel.

**FORM:** herramienta operativa B2B de una sola pantalla. Superficies planas: sin gradientes, sin sombras decorativas, sin glow. Un solo acento por vista — solo el héroe lleva borde/fondo acentuado (`border-success bg-success-soft`); todo lo demás es neutro.

## Tokens (`tailwind.config.js`)

Colores (paleta de marca Movistar). Jerarquía: **azul → celeste → blanco → verde funcional → rojo funcional**.

- `brand` `#009BF4` — azul Movistar: botones, CTAs, títulos activos, enlaces
- `brand-dark` `#0072CE` — azul intenso: cabecera, elementos principales, énfasis
- `cyan` `#00A9E0` — celeste intenso: íconos, estados IA, elementos destacados
- `cyan-soft` `#E8F4FC` — celeste: fondos suaves, badges, tarjetas informativas
- `success` `#78BE20` — verde funcional: "Elegible", disponibilidad, indicadores de estado positivo
- `success-soft` `#EAF6E1` — verde claro: éxito, elegibilidad, ahorro, recomendación positiva
- `danger` `#E51B23` — rojo intenso: "Rechazada", errores, alertas críticas
- `danger-soft` `#FDE8EC` — rojo claro: fondo de rechazo/error
- `ink` `#123B66` — azul texto: textos principales
- `muted` `#5B7896` — texto secundario (derivado de `ink`, contraste AA sobre `surface`/`canvas`)
- `line` `#D9E2EA` — bordes y divisores
- `surface` `#FFFFFF` — cards, modales, áreas principales
- `soft` `#E8F4FC` — superficie de acento suave (alias de `cyan-soft`)
- `canvas` `#F5F7F9` — fondo general de página

Reglas de uso: el azul es identidad y navegación; el celeste marca todo lo que es IA, información o estado del sistema; el verde se usa **únicamente** para "todo está bien / elegible / ahorro"; el rojo **únicamente** para rechazo, error o alerta. El blanco aporta el espacio.

Escala tipográfica explícita (`theme.fontSize`): `xs 12px / sm 13px / base 15px / lg 18px / xl 22px / 2xl 32px`. El único texto en `2xl` es la probabilidad estimada del héroe — todo lo demás baja de tamaño para dejarla respirar. Dos pesos: `regular` y `medium` (`font-medium`); no se usa `font-bold`/`700` en ningún componente.

Ritmo vertical: tokens de espaciado semánticos `xs 6px / sm 10px / md 16px / lg 24px / xl 32px / 2xl 48px`, usados vía utilidades Tailwind (`gap-*`, `p-*`) en vez de márgenes ad hoc.

Radios: `rounded-control` 8px (inputs, botones, bloques de apoyo), `rounded-card` 12px (cards: héroe, riel, panel de copiloto, resumen de cierre). `rounded-full` reservado a píldoras de estado (chip de oportunidad, indicadores de funnel).

Mayúsculas: un único eyebrow en mayúsculas permanece en pantalla ("Contexto", en el riel) — el resto de etiquetas de sección usa sentence case, siguiendo la regla de máximo dos secciones principales en mayúsculas.

## Stack de estilos

Tailwind se adoptó por completo: `tailwind.config.js` concentra los tokens del sistema y todos los componentes se escriben con utilidades. `src/index.css` quedó reducido a las directivas `@tailwind`, el reset mínimo, la tipografía base, el foco de teclado global y `prefers-reduced-motion`. No queda CSS BEM plano ni clases custom sin usar.

## Inventario de componentes

```
App.tsx                  composición y estado de alto nivel (114 líneas)
components/
  TopBar.tsx              logo, cliente en foco, estado de llamada, único chip de oportunidad, CTA iniciar/finalizar
  FunnelBar.tsx           5 pasos (clasificado → contactado → ofrecido → objeción → cierre), estado pendiente/activo/completado
  ContextRail.tsx         compone los 3 bloques del riel izquierdo
    CustomerIdentity.tsx  buscador, selector, identidad, grid de perfil, servicios activos
    ModelSignals.tsx      hasta 3 señales del modelo con dirección (a favor / en contra)
    OfferHistory.tsx      historial plegado (Collapsible), máx. 4 al expandir
  OfferStack.tsx          compone héroe + alternativas
    HeroOffer.tsx          oferta recomendada, 2x peso visual: probabilidad, motivo, precio/ahorro/delta ARPU, canal+momento, objeción+rebate, CTA
    AlternativeOffer.tsx   fila comprimida de una línea con "Ver por qué" expandible
  CopilotPanel.tsx        panel único que cambia de contenido según callState (idle/active/ended), nunca vacío
    OutcomeForm.tsx        registro de resultado (aceptada/rechazada + motivo + nota) y resumen del ofrecimiento tras confirmar
  ui/
    Stat.tsx, Collapsible.tsx
lib/
  viewModel.ts            frontera única entre dominio (Customer/Offer/CampaignHistory) y la UI; aplica las dos guardas de correctitud
  format.ts                money, fechas, "Ilimitado" para GB>999, labels de motivo de rechazo
```

## Responsive

Se mantienen los tres quiebres del brief original (1120 / 850 / 620), ahora expresados con los breakpoints por defecto de Tailwind (`lg`/`md`/`sm` se ajustaron a esos anchos donde aplicaba) más `order-*` para que, en `≤620px`, la oferta héroe siga siendo el primer bloque visible del área de trabajo — el riel de contexto pasa a segundo lugar en el flujo visual aunque siga antes en el DOM por accesibilidad de teclado.

## Nota de accesibilidad

Foco de teclado visible global (`:focus-visible` en `index.css`). Todos los controles interactivos son elementos nativos (`button`, `select`, `input`, `textarea`) navegables por teclado. Los estados de resultado (aceptada/rechazada) y las señales del modelo (favor/contra) no dependen solo de color: llevan ícono/texto (`+`/`−`, `Check`/`X`, texto del chip) además del tono.
