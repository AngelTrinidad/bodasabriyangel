# Web de boda — Sabrina & Angel

**Fecha del spec:** 2026-08-13
**Estado:** aprobado, listo para plan de implementación

## Objetivo

Una página pública, de una sola pantalla con scroll, que muestre dos cuentas regresivas —una a la boda y otra al viaje grupal a Río— junto con la información esencial del evento. El link se comparte con los invitados por WhatsApp.

## Datos del evento

Fuente: `Invitacion Sabri y Angel(1).pdf`.

| Dato | Valor |
|---|---|
| Novios | Sabrina & Angel |
| Fecha de la boda | 3 de octubre de 2026, 17:00 hs |
| Lugar | Iglesia de la Encarnación, Asunción, Paraguay |
| Zona horaria | America/Asuncion (UTC−4 en octubre) |
| Viaje a Río | 6 al 11 de octubre de 2026 |
| Alojamiento en Río | Hotel Windsor Marapendi, Barra da Tijuca |

Fechas objetivo en UTC, hardcodeadas:

- Boda: `2026-10-03T21:00:00Z` — 17:00 de Asunción del 3/10.
- Viaje: `2026-10-06T04:00:00Z` — medianoche de Asunción del 6/10, para que el contador llegue a cero al empezar el día del viaje.

## Alcance

**Incluido (v1):**

1. Hero con la ilustración de la invitación, los nombres y la fecha.
2. Countdown a la boda.
3. Sección de la ceremonia con lugar, horario y botón a Google Maps.
4. Countdown al viaje a Río + descripción breve (fechas, zona, hotel).

**Excluido deliberadamente:**

- Confirmación de asistencia (RSVP). No se pidió; agregarla implicaría backend o un Google Form embebido.
- Lista de regalos o datos bancarios.
- Galería de fotos, playlist, mesa de invitados.
- Información del salón de fiesta o recepción: el PDF solo menciona la ceremonia. Si más adelante hay un segundo lugar, se agrega como un objeto más en `boda.ts` y una sección análoga a `Ceremonia`.
- Tips e itinerario detallado del viaje a Río. La sección del viaje cierra con la línea "Más detalles próximamente" y queda preparada para recibir ese contenido sin cambios estructurales.

## Arquitectura

Sitio estático generado con Astro (`output: 'static'`). Sin framework de UI: los componentes `.astro` no envían JavaScript al cliente, salvo el script del countdown.

```
src/
  data/boda.ts              Toda la información editable del evento
  lib/countdown.ts          timeLeft(target, now) — función pura
  lib/countdown.test.ts     Tests con node --test
  components/Hero.astro
  components/Countdown.astro
  components/Ceremonia.astro
  components/Viaje.astro
  pages/index.astro
  styles/global.css
public/
  ilustracion.png           Acuarela extraída del PDF
```

**Regla de contenido:** ninguna cadena de texto del evento vive en el markup. Todo sale de `src/data/boda.ts`. Cambiar el hotel, sumar tips o corregir un horario es editar un objeto.

### `src/data/boda.ts`

Exporta un objeto con la forma:

```ts
export const boda = {
  novios: { ella: "Sabrina", el: "Angel" },
  ceremonia: {
    fechaISO: "2026-10-03T21:00:00Z",
    fechaTexto: "3 de octubre de 2026",
    horaTexto: "17:00 hs",
    lugar: "Iglesia de la Encarnación",
    ciudad: "Asunción, Paraguay",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Iglesia+de+la+Encarnaci%C3%B3n+Asunci%C3%B3n",
  },
  viaje: {
    fechaISO: "2026-10-06T04:00:00Z",
    fechasTexto: "6 al 11 de octubre de 2026",
    destino: "Río de Janeiro",
    zona: "Barra da Tijuca",
    hotel: "Hotel Windsor Marapendi",
    nota: "Más detalles próximamente.",
  },
} as const;
```

El `mapsUrl` usa la búsqueda por nombre de Google Maps: no requiere API key ni coordenadas y abre la app nativa en el celular. Si aparece el link exacto de la invitación, se reemplaza el valor.

### `src/lib/countdown.ts`

```ts
export type TimeLeft = { dias: number; horas: number; minutos: number; segundos: number; llego: boolean };
export function timeLeft(target: Date, now: Date): TimeLeft
```

Función pura, sin dependencias. Cuando `now >= target` devuelve todos los campos en `0` y `llego: true`. No devuelve números negativos.

### `src/components/Countdown.astro`

Un único componente para los dos contadores. Props: `titulo: string`, `fechaISO: string`, `mensajeLlegada: string`.

Renderiza cuatro celdas (días, horas, minutos, segundos) con sus etiquetas. Un `<script>` de la isla importa `timeLeft`, lo ejecuta con `setInterval` de 1000 ms y actualiza el `textContent` de cada celda. Cuando `llego` es `true`, reemplaza el bloque por `mensajeLlegada` y limpia el intervalo.

El servidor renderiza el valor inicial en tiempo de build, así que la página no muestra ceros ni parpadea antes de que corra el JS. Ese valor queda desactualizado desde el momento del build; el primer tick lo corrige en menos de un segundo.

**Mensajes de llegada:** boda → "¡Hoy nos casamos!"; viaje → "¡Nos vamos a Río!".

## Diseño visual

Paleta tomada de la invitación:

| Rol | Color |
|---|---|
| Fondo | `#f5f1e8` (crema) |
| Texto principal | `#3d3a34` |
| Acento / detalles | `#b08d57` (dorado) |
| Verde suave (separadores) | `#8a9a7b` |

**Tipografías** (Google Fonts, precargadas): una script para los nombres de los novios y los títulos de sección; una serif para el cuerpo. Los números del countdown en la serif, tamaño grande, tabular para que no salten de ancho al cambiar.

**Layout:** mobile-first. Una columna, ancho máximo de 640 px centrado en pantallas grandes. La ilustración del hero se extrae del PDF y se sirve como PNG optimizado desde `public/`, con `width`/`height` explícitos para no provocar salto de layout.

**Accesibilidad:** la ilustración lleva `alt` descriptivo. Los contadores se envuelven en un `aria-live="off"` — la actualización por segundo no debe leerse en voz alta; el texto de la fecha completa queda visible y accesible aparte. Contraste de texto sobre crema verificado a AA.

## Testing

`src/lib/countdown.test.ts`, ejecutado con `node --test` (sin vitest ni configuración adicional). Tres casos:

1. Faltan varios días → devuelve el desglose correcto de días/horas/minutos/segundos.
2. Falta menos de un día → `dias: 0` y las horas correctas.
3. `now` posterior a `target` → todo en `0` y `llego: true`.

El resto —estilos, layout, la sensación general— se verifica abriendo la página. No se agregan tests de componentes.

## Deploy

1. Repositorio git local en la raíz del proyecto, subido a GitHub.
2. Cloudflare Pages conectado al repo: build command `npm run build`, output `dist/`.
3. Cada push a `main` dispara un deploy automático.
4. URL pública: `bodasabriyangel.pages.dev`.

Si más adelante se compra `bodasabriyangel.com`, se agrega como dominio custom en Cloudflare Pages y se apuntan los registros DNS. No requiere ningún cambio en el código.

## Criterios de aceptación

- [ ] La página abre en `bodasabriyangel.pages.dev` desde un celular sin scroll horizontal.
- [ ] Ambos countdowns muestran valores correctos y avanzan cada segundo.
- [ ] El botón "Ver ubicación" abre Google Maps en la Iglesia de la Encarnación.
- [ ] Los tres tests de `countdown.test.ts` pasan.
- [ ] Cambiar un dato en `boda.ts` se refleja en la página sin tocar ningún componente.
