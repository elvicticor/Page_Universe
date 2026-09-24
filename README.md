# Universo en vivo

Explora el espacio en español con datos de la NASA y otras fuentes abiertas: sistema solar 3D, ISS en vivo, asteroides, clima espacial, fotografías de la Tierra, foto astronómica del día y próximos lanzamientos.

**🌐 [Visitar Universo en vivo](https://page-universe.vercel.app/)**

## Desarrollo local

Requiere Node.js 22.18 o posterior.

```bash
npm install
```

Copia `.env.example` a `.env.local` y configura `NASA_API_KEY`. La variable `MYMEMORY_EMAIL` es opcional para ampliar la cuota de traducciones. Las variables se utilizan solo en el servidor; no subas `.env.local` al repositorio.

```bash
npm run dev
```

Abre [localhost:3000](http://localhost:3000).

## Comprobaciones

```bash
npm test
npm run typecheck
npm run build
```

## Publicación

La web está alojada en [Vercel](https://page-universe.vercel.app/). Los cambios enviados a `main` generan un despliegue automático.

Construida con Next.js, React y Three.js. Texturas planetarias de [Solar System Scope](https://www.solarsystemscope.com/textures/), bajo licencia CC BY 4.0.
