import type { Metadata } from "next";
import Countdown from "@/components/Countdown";
import { Empty, PageHeader, Reveal } from "@/components/ui";
import { getLaunches } from "@/lib/nasa";
import { translateEs } from "@/lib/translate";

export const metadata: Metadata = { title: "Lanzamientos", description: "Próximos lanzamientos espaciales de todo el mundo." };
export const revalidate = 3600;

const statusTone: Record<string, string> = {
  Go: "border-aurora/40 text-aurora",
  TBC: "border-sol/40 text-sol",
  TBD: "hairline text-dim",
  Hold: "border-alert/40 text-alert",
  "In Flight": "border-ion/40 text-ion",
  Success: "border-aurora/40 text-aurora",
};

const statusEs: Record<string, string> = {
  Go: "Confirmado",
  TBC: "Por confirmar",
  TBD: "Sin fecha fija",
  Hold: "En espera",
  "In Flight": "En vuelo",
  Success: "Éxito",
  Failure: "Fallo",
};

export default async function Page() {
  const launches = await getLaunches(12) ?? [];
  const [first, ...rest] = launches;
  const originalDescription = first?.mission?.description;
  const descriptionEs = originalDescription ? await translateEs(originalDescription) : null;

  return (
    <>
      <PageHeader kicker="The Space Devs · Launch Library 2" title={<>Próximos <em className="text-sol">despegues</em></>}>
        Cohetes de todas las agencias y empresas del mundo, con su cuenta regresiva. Las fechas pueden cambiar hasta el
        último minuto.
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {!first ? (
          <Empty>No se pudieron cargar los lanzamientos (la API gratuita limita las peticiones por hora).</Empty>
        ) : (
          <>
            <Reveal>
              <article className="relative isolate overflow-hidden rounded-3xl border hairline">
                {first.image && <img src={first.image} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-40" />}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-void via-void/80 to-void/30" />
                <div className="flex min-h-[420px] flex-col justify-end p-8 sm:p-12">
                  <span className={`label self-start rounded-full border px-3 py-1 ${statusTone[first.status.abbrev] ?? "hairline"}`}>
                    {statusEs[first.status.abbrev] ?? first.status.name}
                  </span>
                  <p className="label mt-6">{first.launch_service_provider?.name}</p>
                  <h2 className="mt-2 max-w-3xl font-display text-5xl leading-none sm:text-6xl">{first.name}</h2>
                  {originalDescription && <>
                    <p lang={descriptionEs !== null ? "es" : "en"} className="mt-4 max-w-2xl text-dim line-clamp-3">{descriptionEs ?? originalDescription}</p>
                    {descriptionEs !== null ? <details className="mt-3 max-w-2xl text-sm text-dim">
                      <summary className="cursor-pointer text-sol">Traducción automática · Ver original en inglés</summary>
                      <p lang="en" className="mt-2">{originalDescription}</p>
                    </details> : <p className="mt-3 text-xs text-faint">Traducción no disponible; original en inglés.</p>}
                  </>}
                  <div className="mt-8">
                    <Countdown to={first.net} />
                  </div>
                  <p className="mt-3 font-mono text-xs text-faint">
                    {new Date(first.net).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })} · {first.pad?.location?.name}
                  </p>
                </div>
              </article>
            </Reveal>

            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((l, i) => (
                <Reveal key={l.id} delay={(i % 3) * 0.06}>
                  <article className="panel group flex h-full flex-col overflow-hidden rounded-2xl">
                    <div className="relative aspect-[16/9] overflow-hidden bg-deep">
                      {l.image && (
                        <img src={l.image} alt="" loading="lazy" className="size-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105" />
                      )}
                      <span className={`label absolute top-3 left-3 rounded-full border bg-void/70 px-2 py-0.5 ${statusTone[l.status.abbrev] ?? "hairline"}`}>
                        {statusEs[l.status.abbrev] ?? l.status.name}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="label truncate">{l.launch_service_provider?.name}</p>
                      <h3 className="mt-2 font-display text-2xl leading-tight">{l.name}</h3>
                      <p className="mt-1 text-sm text-dim">{l.pad?.location?.name}</p>
                      <div className="mt-auto flex items-baseline justify-between gap-2 pt-5 text-sm">
                        <span className="text-sol">
                          <Countdown to={l.net} compact />
                        </span>
                        <span className="font-mono text-xs text-faint">
                          {new Date(l.net).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
