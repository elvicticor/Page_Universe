import type { Metadata } from "next";
import { KpChart, FlareChart } from "@/components/SpaceWeatherCharts";
import { kpColor, kpLabel, flux } from "@/lib/space-weather";
import SunViewer from "@/components/SunViewer";
import { CountUp, Empty, PageHeader, Reveal } from "@/components/ui";
import { getCmeCount, getFlares, getKpHistory, getStorms, type Flare } from "@/lib/nasa";

export const metadata: Metadata = { title: "Clima espacial", description: "El Sol en vivo, índice Kp y fulguraciones solares." };
export const revalidate = 900;

export default async function Page() {
  const [kpData, flareData, cmes, stormData] = await Promise.all([getKpHistory(), getFlares(), getCmeCount(), getStorms()]);
  const kp = kpData ?? [], flares = flareData ?? [], storms = stormData ?? [];
  const lastKp = kp.at(-1)?.Kp ?? null;
  const maxKp = kp.reduce((m, d) => Math.max(m, d.Kp), 0);
  const strong = flares.filter((f) => f.classType[0] === "X" || f.classType[0] === "M");
  const biggest = [...flares].sort((a, b) => flux(b.classType) - flux(a.classType))[0];

  return (
    <>
      <PageHeader kicker="SDO · NOAA SWPC · NASA DONKI" title={<>El tiempo <em className="text-sol">que hace en el Sol</em></>}>
        Las fulguraciones y eyecciones de masa coronal viajan hasta la Tierra y pueden provocar auroras, apagones de radio y
        problemas en satélites.
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SunViewer />
        </Reveal>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border hairline bg-line lg:grid-cols-4">
          <div className="bg-void p-6">
            <p className="label">Último Kp · intervalo de 3 h</p>
            <p className="mt-3 font-display text-5xl" style={{ color: lastKp != null ? kpColor(lastKp) : undefined }}>
              {lastKp != null ? lastKp.toLocaleString("es-ES", { maximumFractionDigits: 2 }) : "—"}
            </p>
            <p className="mt-1 font-mono text-xs text-faint">{lastKp != null ? kpLabel(lastKp) : "sin datos"}</p>
          </div>
          <div className="bg-void p-6">
            <p className="label">Fulguraciones (30 d)</p>
            {flareData ? <CountUp value={flares.length} className="mt-3 block font-display text-5xl" /> : <p className="mt-3 text-5xl">—</p>}
            <p className="mt-1 font-mono text-xs text-faint">{flareData ? `${strong.length} de clase M o X` : "Sin datos disponibles"}</p>
          </div>
          <div className="bg-void p-6">
            <p className="label">La más intensa</p>
            <p className="mt-3 font-display text-5xl text-sol">{biggest?.classType ?? "—"}</p>
            <p className="mt-1 font-mono text-xs text-faint">
              {biggest ? new Date(biggest.peakTime).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : ""}
            </p>
          </div>
          <div className="bg-void p-6">
            <p className="label">Eyecciones coronales (30 d)</p>
            {cmes != null ? <CountUp value={cmes} className="mt-3 block font-display text-5xl" /> : <p className="mt-3 font-display text-5xl">—</p>}
            <p className="mt-1 font-mono text-xs text-faint">{stormData ? `${storms.length} tormentas geomagnéticas (60 d)` : "Tormentas: sin datos"}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal className="panel rounded-3xl p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Índice Kp</h2>
            <p className="label">cada 3 h · máx {kp.length ? maxKp.toLocaleString("es-ES", { maximumFractionDigits: 1 }) : "—"}</p>
          </div>
          <p className="mt-1 mb-6 text-sm text-dim">
            Perturbación del campo magnético terrestre, de 0 a 9. Con Kp ≥ 5 hay auroras a latitudes medias.
          </p>
          {kp.length ? <><KpChart data={kp} /><p className="mt-3 text-xs text-dim">Última observación: {kp.at(-1)!.time_tag.replace("T", " ")} UTC</p></> : <Empty>No hay observaciones Kp disponibles.</Empty>}
        </Reveal>
        <Reveal delay={0.1} className="panel rounded-3xl p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Fulguraciones</h2>
            <p className="label">últimos 30 días</p>
          </div>
          <p className="mt-1 mb-6 text-sm text-dim">
            Intensidad en rayos X (escala logarítmica). Cada letra es 10 veces más potente que la anterior.
          </p>
          {flares.length ? <FlareChart flares={flares} end={Date.now()} /> : <Empty>{flareData ? "Sin fulguraciones registradas en el intervalo." : "No se pudieron consultar las fulguraciones."}</Empty>}
        </Reveal>
      </section>
    </>
  );
}
