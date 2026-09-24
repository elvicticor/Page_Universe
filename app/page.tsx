import { Suspense } from "react";
import Link from "next/link";
import { HeroEarth } from "@/components/three";
import LiveTicker from "@/components/LiveTicker";
import Countdown from "@/components/Countdown";
import { Reveal } from "@/components/ui";
import { getApod, getFlares, getKpHistory, getLaunches, getNeoWeek } from "@/lib/nasa";

export const revalidate = 1800;

function SectionLoading() { return <p role="status" className="label mx-auto max-w-7xl p-8">Cargando las últimas observaciones…</p>; }

async function FeaturedApod() {
 const apod = await getApod();
 return <>      {/* APOD destacado */}
      {apod && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
          <Reveal>
            <Link href="/apod" className="group grid overflow-hidden rounded-3xl border hairline bg-panel/60 md:grid-cols-[1.3fr_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[460px]">
                <img
                  src={apod.media_type === "video" ? apod.thumbnail_url ?? "/textures/2k_stars_milky_way.jpg" : apod.url}
                  loading="lazy"
                  alt={apod.title}
                  className="absolute inset-0 size-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col p-8 sm:p-10">
                <p className="label">Foto astronómica del día · {apod.date}</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{apod.title}</h2>
                <p lang={apod.translated ? "es" : "en"} className="mt-5 line-clamp-6 text-dim">{apod.explanation}</p>
                <p className="mt-3 text-xs text-faint">{apod.translated ? "Traducción automática al español" : "Traducción no disponible; original en inglés"}</p>
                <span className="label mt-auto pt-8 text-sol transition-transform group-hover:translate-x-1">Ver galería →</span>
              </div>
            </Link>
          </Reveal>
        </section>
      )}

</>;
}

function SectionLinks() {
  const sections = [
    { href: "/sistema-solar", n: "01", title: "Sistema solar 3D", text: "Los ocho planetas en su posición real de hoy. Acelera el tiempo y vuela hasta cada uno.", stat: "8 planetas · 1 estrella" },
    { href: "/iss", n: "02", title: "ISS en vivo", text: "La Estación Espacial sobre un globo con día y noche reales, y su próxima órbita.", stat: "~27.600 km/h" },
    { href: "/asteroides", n: "03", title: "Radar de asteroides", text: "Todos los objetos que pasan cerca de la Tierra en los próximos 7 días.", stat: <NeoStat /> },
    { href: "/clima-espacial", n: "04", title: "Clima espacial", text: "El Sol en directo, fulguraciones y tormentas geomagnéticas.", stat: <KpStat /> },
    { href: "/tierra", n: "05", title: "La Tierra desde L1", text: "La cara iluminada del planeta fotografiada a 1,5 millones de km.", stat: "Cámara EPIC" },
    { href: "/lanzamientos", n: "06", title: "Lanzamientos", text: "Próximas misiones de todo el mundo con cuenta regresiva.", stat: <LaunchStat /> },
  ];


 return <>      {/* Secciones */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6">
        <Reveal>
          <h2 className="font-display text-5xl sm:text-6xl">
            Seis ventanas <em className="text-dim">al cosmos</em>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border hairline bg-line sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s, i) => (
            <Reveal key={s.href} delay={i * 0.06} className="bg-void">
              <Link href={s.href} className="group relative flex h-full min-h-64 flex-col p-7 transition-colors hover:bg-panel">
                <div className="flex items-baseline justify-between">
                  <span className="label">{s.n}</span>
                  <span className="font-mono text-xs text-sol"><Suspense fallback="Consultando…">{s.stat}</Suspense></span>
                </div>
                <div aria-hidden className="mt-6 flex h-16 items-center gap-3 text-ion/60"><span className="font-display text-6xl">{["☉", "◉", "⌖", "☀", "◐", "↑"][i]}</span><span className="h-px flex-1 bg-gradient-to-r from-ion/30 to-transparent" /></div>
                <h3 className="mt-5 font-display text-3xl">{s.title}</h3>
                <p className="mt-3 text-sm text-dim">{s.text}</p>
                <span className="mt-auto pt-6 text-dim transition-all group-hover:translate-x-1 group-hover:text-ink">→</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

</>;
}

async function NextLaunch() {
 const launches = await getLaunches(12);
 const next = launches?.find((launch) => new Date(launch.net).getTime() > Date.now());
 return <>      {/* Próximo lanzamiento */}
      {next && (
        <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6">
          <Reveal className="panel flex flex-col gap-6 rounded-3xl p-8 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="label">Próximo lanzamiento · {next.launch_service_provider?.name}</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl">{next.name}</h2>
              <p className="mt-2 text-sm text-dim">{next.pad?.location?.name}</p>
            </div>
            <Countdown to={next.net} />
          </Reveal>
        </section>
      )}
</>;
}

async function NeoStat() {
 const neos = await getNeoWeek();
 if (!neos) return <>Datos no disponibles</>;
 const today = new Date().toISOString().slice(0,10);
 return <>{neos.filter((neo) => new Date(neo.approach).toISOString().slice(0,10) === today).length} pasan hoy (UTC)</>;
}
async function KpStat() {
 const data = await getKpHistory();
 const kp = data?.at(-1)?.Kp;
 return <>{kp == null ? "Kp no disponible" : 'Kp (3 h) ' + kp.toLocaleString("es-ES", {maximumFractionDigits:2})}</>;
}
async function LaunchStat() {
 const data = await getLaunches(12);
 return <>{data ? data.length + " programados" : "Datos no disponibles"}</>;
}

export default function Home() { return <>
      {/* Hero */}
      <section className="relative isolate flex min-h-dvh items-center overflow-hidden">
        <div className="absolute inset-0 -z-10 translate-x-[18%] opacity-70 sm:translate-x-[28%] sm:opacity-100 lg:translate-x-[30%]">
          <HeroEarth />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-void via-void/70 to-transparent lg:via-void/30" />
        <div className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6">
          <Reveal>
            <p className="label flex items-center gap-2">
              <span className="live-dot" /> Observatorio del cosmos · {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
             UTC</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 max-w-3xl font-display text-6xl leading-[0.9] tracking-tight sm:text-8xl lg:text-9xl">
              El universo,
              <br />
              <em className="text-sol">en vivo.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-md text-lg text-dim">
              Esta Tierra está iluminada como ahora mismo: el lado de noche muestra las luces de las ciudades. Explora el
              cosmos con datos abiertos de la NASA.
            </p>
          </Reveal>
          <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-3">
            <Link href="/sistema-solar" className="group rounded-full bg-sol px-6 py-3 font-medium text-void transition-transform hover:scale-[1.03]">
              Explorar el sistema solar <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/iss" className="rounded-full border hairline bg-void/40 px-6 py-3 backdrop-blur transition-colors hover:border-ion/50 hover:text-ion">
              Seguir a la ISS
            </Link>
          </Reveal>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <Suspense fallback={<p className="label px-6 py-4">Consultando observatorios…</p>}><HomeTicker /></Suspense>
        </div>
      </section>

<Suspense fallback={<SectionLoading />}><FeaturedApod /></Suspense>
<SectionLinks />
<Suspense fallback={<SectionLoading />}><NextLaunch /></Suspense></>; }

async function HomeTicker() {
 const [neos, flares] = await Promise.all([getNeoWeek(), getFlares()]);
 return <LiveTicker items={[{k: "Asteroides esta semana", v: neos ? String(neos.length) : "Sin datos"}, {k: "Fulguraciones (30 d)", v: flares ? String(flares.length) : "Sin datos"}]} />;
}
