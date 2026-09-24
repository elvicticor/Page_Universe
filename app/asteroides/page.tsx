import type { Metadata } from "next";
import AsteroidRadar from "@/components/AsteroidRadar";
import { CountUp, Empty, PageHeader, Reveal } from "@/components/ui";
import { getNeoWeek } from "@/lib/nasa";

export const metadata: Metadata = { title: "Asteroides", description: "Asteroides que pasan cerca de la Tierra esta semana (NASA NeoWs)." };
export const revalidate = 3600;

export default async function Page() {
  const data = await getNeoWeek();
  const neos = data ?? [];
  const initialTime = Date.now();
  const hazardous = neos.filter((n) => n.hazardous).length;
  const closest = [...neos].sort((a, b) => a.lunar - b.lunar)[0];
  const biggest = [...neos].sort((a, b) => b.diameterM - a.diameterM)[0];
  const fastest = [...neos].sort((a, b) => b.kmPerSec - a.kmPerSec)[0];

  return (
    <>
      <PageHeader kicker="NASA NeoWs · próximos 7 días" title={<>Radar de <em className="text-ion">objetos cercanos</em></>}>
        Cada punto es un asteroide que se acerca a la Tierra esta semana. La distancia se mide en distancias lunares (DL):
        1 DL ≈ 384.400 km.
      </PageHeader>

      {neos.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6"><Empty>{data === null ? "No se pudieron cargar los asteroides. Inténtalo más tarde." : "No hay acercamientos catalogados en este intervalo."}</Empty></section>
      ) : (
        <>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border hairline bg-line lg:grid-cols-4">
            {[
              { k: "Objetos esta semana", v: neos.length, d: 0, sub: "catalogados por NASA/JPL" },
              { k: "Potencialmente peligrosos", v: hazardous, d: 0, sub: "por tamaño y órbita, no por riesgo real" },
              { k: "Paso más cercano", v: closest.lunar, d: 2, sub: `DL · ${closest.name}` },
              { k: "Más rápido", v: fastest.kmPerSec, d: 1, sub: `km/s · ${fastest.name}` },
            ].map((s) => (
              <div key={s.k} className="bg-void p-6">
                <p className="label">{s.k}</p>
                <CountUp value={s.v} decimals={s.d} className="mt-3 block font-display text-5xl" />
                <p className="mt-1 truncate font-mono text-xs text-faint">{s.sub}</p>
              </div>
            ))}
            </div>
          </section>

          <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
            <Reveal>
              <AsteroidRadar neos={neos} initialTime={initialTime} />
            </Reveal>
            <p className="mt-4 text-sm text-dim">
              El más grande de la semana es <span className="text-ink">{biggest.name}</span>, de unos{" "}
              {Math.round(biggest.diameterM).toLocaleString("es-ES")} m de diámetro estimado.
            </p>
          </section>
        </>
      )}
    </>
  );
}
