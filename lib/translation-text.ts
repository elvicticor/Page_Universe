/** Fragmentos de hasta 500 bytes, sin cortar caracteres Unicode. */
export function translationChunks(text: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (const word of text.trim().split(/\s+/u)) {
    if (new TextEncoder().encode(`${current} ${word}`.trim()).length > 500 && current) {
      parts.push(current);
      current = "";
    }
    for (const char of (current ? " " : "") + word) {
      if (new TextEncoder().encode(current + char).length > 500) {
        parts.push(current);
        current = "";
      }
      current += char;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export async function requestTranslation(text: string, email = ""): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair: "en|es" });
  if (email) params.set("de", email);
  const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
    cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Traducción no disponible");
  const data = await response.json();
  if (Number(data?.responseStatus) !== 200 || data?.quotaFinished ||
      typeof data?.responseData?.translatedText !== "string" || !data.responseData.translatedText.trim()) {
    throw new Error("Traducción no disponible");
  }
  return data.responseData.translatedText.trim();
}
