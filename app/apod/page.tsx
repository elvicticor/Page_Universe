import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageHeader, Reveal } from "@/components/ui";
import { getApod, getApodRange, type Apod } from "@/lib/nasa";

export const metadata: Metadata = { title: "Foto del día", description: "Foto astronómica del día de la NASA, en español." };

import { validApodDate } from "@/lib/validation";

function Media({ a, priority = false }: { a: Apod; priority?: boolean }) {
  if (a.media_type === "video" && !a.thumbnail_url) {
    return <iframe src={a.url} title={a.title} className="absolute inset-0 size-full" allowFullScreen />;
  }
  return (
    <img
      src={a.media_type === "video" ? a.thumbnail_url : a.url}
      alt={a.title}
      loading={priority ? "eager" : "lazy"}
      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const requested = (await searchParams).fecha;
  const invalid = requested !== undefined && !validApodDate(requested);
  const fecha = validApodDate(requested) ? requested : undefined;
  const [apod, recent] = await Promise.all([invalid ? Promise.resolve(null) : getApod(fecha), getApodRange(12)]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader kicker="Foto astronómica del día · NASA" title={<>Una imagen del cosmos <em className="text-sol">cada día desde 1995</em></>}>
        Seleccionada y explicada por astrónomos profesionales. Busca la de cualquier fecha, por ejemplo tu cumpleaños.
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <form className="mb-6 flex flex-wrap items-center gap-3" action="/apod">
          <label htmlFor="fecha" className="label">Ir a la fecha</label>
          <input
            id="fecha"
            type="date"
            name="fecha"
            min="1995-06-16"
            max={today}
            defaultValue={fecha ?? ""}
            className="rounded-full border hairline bg-panel px-4 py-2 font-mono text-sm [color-scheme:dark]"
          />
          <button className="rounded-full bg-sol px-5 py-2 text-sm font-medium text-void">Buscar</button>
          {fecha && <Link href="/apod" className="label hover:text-ink">Volver a hoy</Link>}
        </form>

        {apod ? (
          <Reveal>
            <article className="grid overflow-hidden rounded-3xl border hairline bg-panel/60 lg:grid-cols-[1.4fr_1fr]">
              <div className="relative aspect-[4/3] bg-black lg:aspect-auto lg:min-h-[560px]">
                {apod.media_type === "video" ? (
                  <iframe src={apod.url} title={apod.title} className="absolute inset-0 size-full" allowFullScreen />
                ) : (
                  <a href={apod.hdurl ?? apod.url} target="_blank" rel="noreferrer" className="group">
                    <Media a={apod} priority />
                  </a>
                )}
              </div>
              <div className="p-8 sm:p-10">
                <p className="label">{new Date(apod.date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{apod.title}</h2>
                {apod.copyright && <p className="mt-2 font-mono text-xs text-faint">© {apod.copyright.replace(/\n/g, " ").trim()}</p>}
                <p lang={apod.translated ? "es" : "en"} className="mt-6 leading-relaxed text-dim">{apod.explanation}</p>
                <p className="mt-4 text-xs text-faint">{apod.translated ? "Traducción automática al español · MyMemory. Fuente: NASA." : "Traducción temporalmente no disponible. Se muestra el original en inglés."}</p>
                {apod.translated && apod.original && <details className="mt-4 text-sm text-dim">
                  <summary className="cursor-pointer text-sol">Ver original en inglés</summary>
                  <div lang="en" className="mt-3 leading-relaxed"><p className="font-medium">{apod.original.title}</p><p className="mt-2">{apod.original.explanation}</p></div>
                </details>}
              </div>
            </article>
          </Reveal>
        ) : (
          <Empty>{invalid ? "Introduce una fecha válida entre el 16 de junio de 1995 y hoy (UTC)." : "No hay imagen para esa fecha o la API no responde."}</Empty>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-4xl">Días anteriores</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {recent.map((a, i) => (
              <Reveal key={a.date} delay={(i % 4) * 0.05}>
                <Link href={`/apod?fecha=${a.date}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-deep">
                    <Media a={a} />
                    <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-transparent" />
                    <p className="label absolute top-3 left-3 rounded-full bg-void/70 px-2 py-0.5">{a.date}</p>
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm text-dim transition-colors group-hover:text-ink">{a.title}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
