"use client";

import dynamic from "next/dynamic";

const Loading = ({ label }: { label: string }) => (
  <div className="grid h-full w-full place-items-center">
    <span className="label animate-pulse">{label}</span>
  </div>
);

export const HeroEarth = dynamic(() => import("./HeroEarth"), { ssr: false, loading: () => <Loading label="Cargando la Tierra…" /> });
export const SolarSystemExplorer = dynamic(() => import("./SolarSystemExplorer"), {
  ssr: false,
  loading: () => <div className="h-[calc(100dvh-4rem)]"><Loading label="Calculando órbitas…" /></div>,
});
export const IssExplorer = dynamic(() => import("./IssExplorer"), {
  ssr: false,
  loading: () => <div className="h-[62vh]"><Loading label="Conectando con la ISS…" /></div>,
});
