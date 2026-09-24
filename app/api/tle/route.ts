import { getJSON } from "@/lib/http";
import { tleCheck } from "@/lib/validation";

export async function GET() {
  const data = await getJSON<{ line1: string; line2: string }>("https://api.wheretheiss.at/v1/satellites/25544/tles", 3600, tleCheck);
  if (!data) return Response.json({ error: "No se pudo obtener la órbita." }, { status: 502 });
  return Response.json({ line1: data.line1, line2: data.line2 });
}
