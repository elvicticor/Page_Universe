import type { Metadata } from "next";
import EpicPlayer from "@/components/EpicPlayer";
import { Empty, PageHeader, Reveal } from "@/components/ui";
import { getEpic } from "@/lib/nasa";

export const metadata: Metadata = { title: "La Tierra desde L1", description: "Fotos recientes de la cámara EPIC de la NASA." };
export const revalidate = 3600;

export default async function Page() {
  const images = await getEpic();
  return (
    <>
      <PageHeader kicker="NASA EPIC · DSCOVR" title={<>Un día en la Tierra, <em className="text-ion">visto desde 1,5 millones de km</em></>}>
        La cámara EPIC toma una docena de fotos diarias de la cara iluminada del planeta. Juntas, muestran una rotación
        completa.
      </PageHeader>
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {images?.length ? (
          <Reveal>
            <EpicPlayer images={images} />
          </Reveal>
        ) : (
          <Empty>La API EPIC no ha devuelto imágenes ahora mismo.</Empty>
        )}
      </section>
    </>
  );
}
