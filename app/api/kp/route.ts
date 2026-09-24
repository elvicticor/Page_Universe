import { getJSON } from "@/lib/http";
import { kpMinuteCheck } from "@/lib/validation";

export async function GET() {
  const list = await getJSON<{ time_tag: string; estimated_kp: number }[]>("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json", 60, kpMinuteCheck);
  const last = list?.at(-1);
  if (!last) return Response.json({ error: "No se pudo obtener el índice Kp." }, { status: 502 });
  const observedAt = /Z$|[+-]\d{2}:\d{2}$/.test(last.time_tag) ? last.time_tag : last.time_tag + "Z";
  return Response.json({ time: last.time_tag, observedAt, kp: last.estimated_kp, stale: Date.now() - Date.parse(observedAt) > 10 * 60000 });
}
