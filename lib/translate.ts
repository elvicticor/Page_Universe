import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { requestTranslation, translationChunks } from "./translation-text";

// Solo se guardan resultados válidos; los fallos no contaminan la caché mensual.
const chunkEs = unstable_cache(requestTranslation, ["public-text-es-v1"], { revalidate: 2592000 });

export const translateEs = cache(async (text: string): Promise<string | null> => {
  if (!text.trim()) return text;
  const chunks = translationChunks(text);
  if (chunks.length > 20) return null;
  try {
    const translated = await Promise.all(chunks.map((chunk) => chunkEs(chunk, process.env.MYMEMORY_EMAIL ?? "")));
    return translated.join(" ");
  } catch {
    return null;
  }
});
