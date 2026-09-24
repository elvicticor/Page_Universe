import "server-only";
import { cache } from "react";
import { getJSON } from "./http";
import { translateEs } from "./translate";
import { apodCheck, array, epicCheck, flareCheck, kpHistoryCheck, launchCheck, neoCheck, stormCheck, validApodDate } from "./validation";

// Todas las llamadas con clave se hacen en el servidor: la clave nunca llega al navegador.
const KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const NASA = "https://api.nasa.gov";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

/* ---------- APOD ---------- */

export type Apod = {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video" | "other";
  thumbnail_url?: string;
  copyright?: string;
  original?: { title: string; explanation: string };
  translated?: boolean;
};

export async function getApod(date?: string) {
  if (date !== undefined && !validApodDate(date)) return null;
  const q = date ? `&date=${date}` : "";
  const apod = await getJSON<Apod>(`${NASA}/planetary/apod?api_key=${KEY}&thumbs=true${q}`, 3600, apodCheck);
  if (!apod) return null;
  const [title, explanation] = await Promise.all([translateEs(apod.title), translateEs(apod.explanation)]);
  return { ...apod, title: title ?? apod.title, explanation: explanation ?? apod.explanation,
    translated: explanation !== null, original: { title: apod.title, explanation: apod.explanation } };
}

export async function getApodRange(days: number) {
  const list = await getJSON<Apod[]>(
    `${NASA}/planetary/apod?api_key=${KEY}&thumbs=true&start_date=${iso(daysAgo(days))}`,
    3600, array(apodCheck),
  );
  return list ? Promise.all([...list].reverse().map(async (a) => ({ ...a, title: await translateEs(a.title) ?? a.title }))) : [];
}

/* ---------- NeoWs: asteroides cercanos ---------- */

type RawNeo = {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  is_potentially_hazardous_asteroid: boolean;
  is_sentry_object: boolean;
  estimated_diameter: { meters: { estimated_diameter_min: number; estimated_diameter_max: number } };
  close_approach_data: {
    epoch_date_close_approach: number;
    relative_velocity: { kilometers_per_second: string };
    miss_distance: { lunar: string; kilometers: string };
  }[];
};

export type Neo = {
  id: string;
  name: string;
  url: string;
  hazardous: boolean;
  sentry: boolean;
  diameterM: number;
  approach: number;
  kmPerSec: number;
  lunar: number;
  km: number;
};

export const getNeoWeek = cache(async (): Promise<Neo[] | null> => {
  const start = new Date();
  const end = new Date(Date.now() + 6 * 86400000);
  const data = await getJSON<{ near_earth_objects: Record<string, RawNeo[]> }>(
    `${NASA}/neo/rest/v1/feed?start_date=${iso(start)}&end_date=${iso(end)}&api_key=${KEY}`,
    3600, neoCheck,
  );
  if (!data) return null;
  return Object.values(data.near_earth_objects)
    .flat()
    .map((n) => {
      const c = n.close_approach_data[0];
      const d = n.estimated_diameter.meters;
      return {
        id: n.id,
        name: n.name.replace(/[()]/g, "").trim(),
        url: n.nasa_jpl_url,
        hazardous: n.is_potentially_hazardous_asteroid,
        sentry: n.is_sentry_object,
        diameterM: (d.estimated_diameter_min + d.estimated_diameter_max) / 2,
        approach: c.epoch_date_close_approach,
        kmPerSec: parseFloat(c.relative_velocity.kilometers_per_second),
        lunar: parseFloat(c.miss_distance.lunar),
        km: parseFloat(c.miss_distance.kilometers),
      };
    })
    .sort((a, b) => a.approach - b.approach);
});

/* ---------- EPIC: la Tierra desde DSCOVR ---------- */

export type EpicImage = {
  identifier: string;
  caption: string;
  image: string;
  date: string;
  centroid_coordinates: { lat: number; lon: number };
  src: string;
};

export async function getEpic(): Promise<EpicImage[] | null> {
  const list = await getJSON<Omit<EpicImage, "src">[]>(`${NASA}/EPIC/api/natural?api_key=${KEY}`, 3600, epicCheck);
  if (!list) return null;
  return list.map((img) => {
    const [y, m, d] = img.date.slice(0, 10).split("-");
    return { ...img, src: `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/jpg/${img.image}.jpg` };
  });
}

/* ---------- DONKI: clima espacial ---------- */

export type Flare = {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string;
  sourceLocation: string;
  activeRegionNum: number | null;
};

export const getFlares = cache(async () => {
  const list = await getJSON<Flare[]>(
    `${NASA}/DONKI/FLR?startDate=${iso(daysAgo(30))}&endDate=${iso(new Date())}&api_key=${KEY}`,
    1800, flareCheck,
  );
  return list ? [...list].reverse() : null;
});

export async function getCmeCount() {
  const list = await getJSON<unknown[]>(
    `${NASA}/DONKI/CME?startDate=${iso(daysAgo(30))}&endDate=${iso(new Date())}&api_key=${KEY}`,
    1800, array(() => true),
  );
  return list?.length ?? null;
}

export type Storm = { gstID: string; startTime: string; allKpIndex: { kpIndex: number; observedTime: string }[] };

export async function getStorms() {
  const list = await getJSON<Storm[]>(
    `${NASA}/DONKI/GST?startDate=${iso(daysAgo(60))}&endDate=${iso(new Date())}&api_key=${KEY}`,
    1800, stormCheck,
  );
  return list ? [...list].reverse() : null;
}

/** Índice Kp planetario de 3 horas, últimos ~7 días (NOAA SWPC). */
export const getKpHistory = cache(async () => {
  const list = await getJSON<{ time_tag: string; Kp: number }[]>(
    "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    600, kpHistoryCheck,
  );
  return list;
});

/* ---------- Lanzamientos (The Space Devs, límite 15 req/h → caché de 1 h) ---------- */

export type Launch = {
  id: string;
  name: string;
  net: string;
  status: { abbrev: string; name: string };
  image?: string | null;
  launch_service_provider?: { name: string };
  rocket?: { configuration?: { full_name?: string } };
  mission?: { description?: string; type?: string; orbit?: { name?: string } } | null;
  pad?: { name?: string; location?: { name?: string } };
  webcast_live?: boolean;
};

export const getLaunches = cache(async (limit = 12) => {
  const data = await getJSON<{ results: Launch[] }>(
    `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=${limit}&hide_recent_previous=true`,
    3600, launchCheck,
  );
  return data?.results ?? null;
});
