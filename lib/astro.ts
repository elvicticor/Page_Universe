// Utilidades astronómicas ligeras (sin dependencias). Precisión suficiente para visualización.

const DEG = Math.PI / 180;

export function julianDate(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Punto de la Tierra donde el Sol está en el cénit (lat/lon en grados). */
export function subsolarPoint(date: Date) {
  const d = julianDate(date) - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * DEG;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const e = (23.439 - 0.00000036 * d) * DEG;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / DEG;
  const dec = Math.asin(Math.sin(e) * Math.sin(L)) / DEG;
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  let lon = ra - gmst * 15;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return { lat: dec, lon };
}

/**
 * Convierte lat/lon a un punto sobre una esfera de three.js con UVs por defecto
 * (la textura equirectangular empieza en lon -180 en u = 0).
 */
export function latLonToVec3(lat: number, lon: number, r: number): [number, number, number] {
  const theta = (90 - lat) * DEG;
  const phi = (lon + 180) * DEG;
  return [-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta)];
}
