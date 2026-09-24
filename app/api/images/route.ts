import { getJSON } from "@/lib/http";
import { translateEs } from "@/lib/translate";
import { array, record, shape, str, url } from "@/lib/validation";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length > 80) return Response.json({ error: "Escribe una búsqueda de 1 a 80 caracteres.", items: [] }, { status: 400 });
  const data = await getJSON<{ collection: { items: unknown[] } }>(
    `https://images-api.nasa.gov/search?media_type=image&page_size=12&q=${encodeURIComponent(q)}`, 86400,
    shape({ collection: shape({ items: array(() => true) }) }),
  );
  if (!data) return Response.json({ error: "No se pudieron consultar las imágenes.", items: [] }, { status: 502 });
  const items = data.collection.items.flatMap((item) => {
    if (!record(item) || !Array.isArray(item.data) || !Array.isArray(item.links)) return [];
    const d = item.data[0];
    const link = item.links.find((v: unknown) => record(v) && url(v.href));
    if (!record(d) || !shape({ title: str, nasa_id: str, date_created: str })(d) || !record(link)) return [];
    return [{ id: d.nasa_id, title: d.title, date: d.date_created, thumb: link.href, page: `https://images.nasa.gov/details/${encodeURIComponent(String(d.nasa_id))}` }];
  }).slice(0, 9);
  const localized = await Promise.all(items.map(async (item) => {
    const title = await translateEs(String(item.title));
    return { ...item, title: title ?? item.title, originalTitle: item.title, language: title === null ? "en" : "es" };
  }));
  return Response.json({ items: localized });
}
