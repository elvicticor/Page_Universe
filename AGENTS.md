# AGENTS.md — Universo en vivo

Web sobre el espacio en español: datos en tiempo real de la NASA y otras APIs abiertas, visualizaciones 3D y animaciones.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 4**: los tokens están en `@theme` dentro de `app/globals.css`. No hay `tailwind.config`.
- **Three.js** con **@react-three/fiber 9** y **@react-three/drei 10** para el 3D
- **motion** (`motion/react`, antes Framer Motion) para las animaciones de interfaz
- **satellite.js 6** para propagar la órbita de la ISS (SGP4) a partir de su TLE. **No actualices a la v7**: incluye un módulo WASM que importa `node:worker_threads`, cuelga la compilación con Turbopack y rompe la de webpack.

## Comandos

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # compilación de producción (también comprueba los tipos)
npm start
npm run typecheck
npm test        # contratos de API, fechas, reloj y coordenadas (Node 22.18+)
```

## Variables de entorno

`.env.local` (no se sube al repositorio; plantilla en `.env.example`):

```
NASA_API_KEY=...
```

La clave **solo se usa en el servidor** (`lib/nasa.ts` importa `server-only`). No la expongas nunca con `NEXT_PUBLIC_` ni la leas desde componentes cliente. Si falta, se usa `DEMO_KEY`, que tiene un límite muy bajo.

## Estructura

```
app/
  layout.tsx            Fuentes (Instrument Serif, Geist, Geist Mono), nav, fondo de estrellas, pie
  page.tsx              Portada: Tierra 3D, ticker en vivo, APOD, accesos a las secciones
  sistema-solar/        Sistema solar 3D con posiciones reales
  iss/                  Globo 3D con la ISS en tiempo real
  asteroides/           Radar de asteroides (NeoWs)
  clima-espacial/       Sol en vivo (SDO), índice Kp (NOAA), fulguraciones (DONKI)
  tierra/               Reproductor de fotos EPIC
  apod/                 Foto del día + búsqueda por fecha (?fecha=AAAA-MM-DD)
  lanzamientos/         Próximos lanzamientos con cuenta regresiva
  api/                  Proxies para el navegador: iss, tle, kp, images
components/
  three/                Escenas 3D (solo cliente)
    index.tsx           Envoltorios next/dynamic con ssr:false; importa las escenas desde aquí
    Earth.tsx           Tierra con shader día/noche, nubes y atmósfera
  ui.tsx                Reveal, CountUp, PageHeader, Empty
lib/
  nasa.ts               Clientes de API del servidor, con tipos y revalidación
  planets.ts            Datos de los planetas + elementos orbitales keplerianos de JPL
  astro.ts              Fecha juliana, punto subsolar, conversión lat/lon → vector 3D
public/textures/        Texturas 2K de Solar System Scope (CC BY 4.0: hay que mantener el crédito)
```

## Fuentes de datos

| Dato | Fuente | Caché |
|---|---|---|
| Foto del día | `api.nasa.gov/planetary/apod` | 1 h |
| Asteroides | `api.nasa.gov/neo/rest/v1/feed` (máx. 7 días) | 1 h |
| Tierra | `api.nasa.gov/EPIC/api/natural`; imágenes en `epic.gsfc.nasa.gov/archive` | 1 h |
| Fulguraciones, CME, tormentas | `api.nasa.gov/DONKI/{FLR,CME,GST}` | 30 min |
| Índice Kp | `services.swpc.noaa.gov` (NOAA) | 1–10 min |
| Sol en vivo | `sdo.gsfc.nasa.gov/assets/img/latest/` | se refresca cada 15 min en el cliente |
| ISS | `api.wheretheiss.at` (posición y TLE) | 5 s compartidos / 1 h |
| Imágenes de planetas | `images-api.nasa.gov/search` (sin clave) | 24 h |
| Lanzamientos | `ll.thespacedevs.com/2.2.0` | 1 h; **límite de 15 peticiones/hora** |

Endpoints que **no funcionan** (comprobado en sept. 2026): Mars Rover Photos (`/mars-photos`, 404) y la lista de astronautas de `open-notify` (desactualizada). No los uses.

## Convenciones

- **Idioma**: toda la interfaz y los comentarios en español. Números y fechas con `toLocaleString("es-ES")`.
- **Carga de datos**: en Server Components mediante las funciones de `lib/nasa.ts`. Devuelven `null` si falla la API; `[]` significa que la consulta fue válida pero no hay resultados, y la página debe mostrar un estado vacío (`<Empty>`) en vez de romperse.
- **Datos en vivo en el cliente**: haz polling a las rutas de `app/api/*`, nunca directamente a APIs que necesiten clave.
- **3D**: cualquier `<Canvas>` va en un componente `"use client"`, se carga con `next/dynamic` y `ssr: false` desde `components/three/index.tsx`, y las texturas se cargan dentro de `<Suspense>`. Marca las texturas de color con `colorSpace = SRGBColorSpace`.
- **Coordenadas**: en la esfera de la Tierra, la longitud −180 corresponde a u = 0 (UV por defecto de three.js). Usa siempre `latLonToVec3`. En el sistema solar, los ángulos son reales y las distancias están comprimidas con `sceneRadius` (raíz cuadrada).
- **Imágenes**: se usa `<img>` normal (vienen de muchos dominios de la NASA), no `next/image`.
- **Estilo**: fondo oscuro `void`; `sol` (ámbar) para acentos, `ion` (cian) para datos secundarios, `alert` para peligro y `aurora` para "tranquilo / en vivo". Títulos en `font-display` (serif), datos en `font-mono` con `tabular-nums`. Clases de apoyo: `.panel`, `.label`, `.hairline`, `.live-dot`.
- **Accesibilidad**: `MotionConfig reducedMotion="user"` en `components/Providers.tsx`; las animaciones CSS se desactivan con `prefers-reduced-motion`.

## Despliegue

En Vercel: importa el repositorio y añade `NASA_API_KEY` en las variables de entorno. No hace falta nada más.

## Fiabilidad y simulación

- `lib/http.ts` limita la espera a 8 s por intento y reintenta una sola vez fallos transitorios. Los contratos se validan en `lib/validation.ts`; nunca registres URLs con claves.
- No conviertas fallos de API en contadores cero. Conserva la distinción entre `null` y listas vacías.
- El radar usa una fecha inicial del servidor y días UTC. Redondea coordenadas SVG con `coord` para evitar diferencias entre motores.
- El reloj solar está limitado a 1800–2050. Sol, planetas y Luna usan ese reloj; sus fases de rotación y la órbita lunar son ilustrativas.
- Usa `SceneCanvas` para carga de texturas, errores WebGL, resolución adaptable y suspensión fuera de pantalla.
- Las consultas periódicas usan `useLiveData`: cancelación, pausa en segundo plano y espera progresiva tras fallos.

## Textos de fuentes externas

- `lib/translate.ts` traduce texto público inglés → español con MyMemory desde el servidor; guarda únicamente traducciones válidas durante 30 días. No envíes información privada a este servicio.
- APOD traduce título y explicación; el archivo reciente y la galería planetaria solo traducen títulos para ahorrar cuota. Lanzamientos traduce únicamente la descripción visible.
- Se conserva el original inglés, accesible en APOD y lanzamientos. Si falla el proveedor, se muestra el original con aviso; nunca presentes errores de cuota como contenido.
- Cuota gratuita: 5.000 caracteres/día; `MYMEMORY_EMAIL` opcional (correo de contacto válido, solo servidor) amplía a 50.000. Documentación: https://mymemory.translated.net/doc/usagelimits.php y https://mymemory.translated.net/doc/spec.php.
