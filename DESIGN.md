# Asistente Comercial IA — Visual System

## Direction contract

**THESIS:** una mesa de trabajo comercial donde el asesor entiende al cliente, ve la oportunidad y actúa sin cambiar de pantalla.

**OWN-WORLD:** base verde grisácea clara, barra superior verde profunda, superficies blancas con bordes suaves, acentos Movistar verdes y un azul reservado para NBO.

**STORY:** primero contexto e historial; después ranking de ofertas; finalmente conversación, empatía y siguiente acción.

**FIRST VIEWPORT:** header compacto, sidebar de cliente de 25% y área principal con recomendación, transcripción y sugerencias IA. La acción primaria “Iniciar llamada” vive junto al contexto de oportunidad.

**FORM:** herramienta operativa B2B de una sola pantalla, con cards únicamente donde comunican selección o jerarquía. Motion limitado a estados de llamada, selección y typing.

## Tokens

- Ink: `#14241f`
- Muted text: `#687973`
- Surface: `#ffffff`
- Canvas: `#f4f7f5`
- Movistar green: `#0a8f58`
- Deep green: `#063f35`
- NBO blue: `#2f73d9`
- Standard radius: 9–13px; pills only for status chips.

## Components

Header, CustomerSidebar, OfferCard, TranscriptPanel, SuggestionsPanel, OpportunityChip, CallControls and outcome controls live in `src/App.tsx` and are supported by typed data adapters in `src/lib`.

## Responsive rules

Desktop prioritizes a 25/75 split. At 850px the sidebar stacks above the workspace and the live panels stack. At 620px cards become a single column and call actions become full-width.
