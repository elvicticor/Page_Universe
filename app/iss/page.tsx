import type { Metadata } from "next";
import { IssExplorer } from "@/components/three";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "ISS en vivo", description: "Posición de la Estación Espacial Internacional en tiempo real." };

export default function Page() {
  return (
    <>
      <PageHeader kicker="Rastreo en vivo" title={<>La Estación Espacial, <em className="text-sol">ahora mismo</em></>}>
        A 420 km de altura y casi 8 km por segundo. El globo muestra el día y la noche tal como están en este instante.
      </PageHeader>
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <IssExplorer />
      </section>
    </>
  );
}
