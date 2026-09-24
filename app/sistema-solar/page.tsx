import type { Metadata } from "next";
import { SolarSystemExplorer } from "@/components/three";

export const metadata: Metadata = {
  title: "Sistema solar 3D",
  description: "Los planetas del sistema solar en su posición real, en 3D e interactivos.",
};

export default function Page() {
  return (
    <div className="pt-16">
      <h1 className="sr-only">Sistema solar en 3D</h1>
      <SolarSystemExplorer />
      <p className="mx-auto max-w-3xl px-4 pt-6 text-center text-sm text-dim sm:px-6">
        Posiciones calculadas con los elementos orbitales keplerianos de JPL. Los ángulos son reales; las distancias y los
        tamaños están comprimidos para que todo quepa en pantalla. Arrastra para girar, rueda para acercar, clic en un
        planeta para visitarlo.
      </p>
    </div>
  );
}
