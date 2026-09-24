"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div role="alert" className="mx-auto max-w-3xl px-6 pt-36"><h1 className="font-display text-4xl">No se pudo cargar esta sección</h1><p className="mt-4 text-dim">Puedes volver a intentarlo. Las otras secciones siguen disponibles desde el menú.</p><button onClick={reset} className="mt-6 rounded-full bg-sol px-6 py-3 text-void">Reintentar</button></div>;
}
