# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Asesores comerciales de Movistar durante una llamada o interacción con un cliente. Necesitan entender rápidamente el contexto del cliente, elegir una oferta y recibir apoyo para conducir la conversación.

## Product Purpose

Asistente Comercial IA para demostrar un copiloto de Next Best Offer (NBO) y Movistar Total (MT). La demo debe mostrar cómo los datos del cliente, su historial y una conversación simulada ayudan al asesor a decidir qué ofrecer y cómo presentarlo.

## Positioning

La IA acompaña al asesor y hace visible el razonamiento comercial; no reemplaza su criterio ni pretende ser todavía un motor de producción.

## Operating Context

Una sola pantalla de trabajo, priorizada para escritorio en resoluciones 1440x900 y 1280x720. Los datos provienen de `/DataSet` y la llamada, transcripción, aceptación y rechazo se simulan localmente.

## Capabilities and Constraints

- Selector de cliente real y carga de perfil e historial.
- Detección visual de oportunidad MT o NBO.
- Recomendación heurística de ofertas con probabilidad estimada.
- Transcripción simulada y sugerencias empáticas para el asesor.
- Flujo de iniciar/finalizar llamada y aceptar/rechazar una oferta.
- Sin backend, autenticación, APIs externas, audio real ni IA de producción en esta etapa.

## Brand Commitments

Identidad inspirada en Movistar: verde como color principal, base clara, azul para NBO, tono empresarial, humano y directo.

## Evidence on Hand

- `/DataSet/dataset_clientes.csv` (100.000 clientes).
- `/DataSet/catalogo_ofertas_entrega.csv` (22 ofertas).
- `/DataSet/historial_campanias.csv` (300.112 ofrecimientos).
- No existe nombre de persona en el dataset; `cliente_id` es el identificador visible.

## Product Principles

- La IA escucha antes de recomendar.
- Las recomendaciones deben poder rastrearse a datos reales.
- El asesor conserva el control de la interacción.
- La demo prioriza claridad y velocidad de lectura.

## Accessibility & Inclusion

Contraste AA, foco de teclado visible, botones con etiquetas explícitas y estados que no dependan únicamente del color.
