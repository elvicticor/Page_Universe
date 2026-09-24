import { getJSON } from "@/lib/http";
import { issCheck } from "@/lib/validation";

export const dynamic = "force-dynamic";
type Position = { latitude: number; longitude: number; altitude: number; velocity: number; timestamp: number; visibility: string; footprint: number };

// La caché de Next comparte la consulta durante cinco segundos entre visitantes.
export async function GET() {
  const data = await getJSON<Position>("https://api.wheretheiss.at/v1/satellites/25544", 5, issCheck);
  if (!data) return Response.json({ error: "No se pudo actualizar la ISS." }, { status: 502 });
  const observedAt = new Date(data.timestamp * 1000).toISOString();
  return Response.json({ ...data, observedAt, stale: Date.now() - data.timestamp * 1000 > 30000 }, { headers: { "Cache-Control": "no-store" } });
}
