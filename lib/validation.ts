// Contratos de los campos utilizados por la interfaz. Se comprueban antes de consumir JSON externo.
export type Check = (value: unknown) => boolean;
export const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const str: Check = (v) => typeof v === "string";
export const num: Check = (v) => typeof v === "number" && Number.isFinite(v);
export const numeric: Check = (v) => num(v) || (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)));
export const bool: Check = (v) => typeof v === "boolean";
export const optional = (check: Check): Check => (v) => v == null || check(v);
export const array = (check: Check): Check => (v) => Array.isArray(v) && v.every(check);
export const shape = (fields: Record<string, Check>): Check => (v) => record(v) && Object.entries(fields).every(([k, check]) => check(v[k]));
export const date: Check = (v) => typeof v === "string" && Number.isFinite(Date.parse(v));
export const url: Check = (v) => {
  if (typeof v !== "string") return false;
  try { return ["https:", "http:"].includes(new URL(v).protocol); } catch { return false; }
};
const named = shape({ name: str });
export const apodCheck = shape({ date, title: str, explanation: str, url, hdurl: optional(url), thumbnail_url: optional(url), copyright: optional(str), media_type: (v) => ["image", "video", "other"].includes(String(v)) });
const approach = shape({ epoch_date_close_approach: num, relative_velocity: shape({ kilometers_per_second: numeric }), miss_distance: shape({ lunar: numeric, kilometers: numeric }) });
const neo = shape({ id: str, name: str, nasa_jpl_url: url, is_potentially_hazardous_asteroid: bool, is_sentry_object: bool,
  estimated_diameter: shape({ meters: shape({ estimated_diameter_min: num, estimated_diameter_max: num }) }),
  close_approach_data: (v) => Array.isArray(v) && v.length > 0 && v.every(approach) });
export const neoCheck = shape({ near_earth_objects: (v) => record(v) && Object.values(v).every(array(neo)) });
export const epicCheck = array(shape({ identifier: str, caption: str, image: str, date, centroid_coordinates: shape({ lat: num, lon: num }) }));
export const flareCheck = array(shape({ flrID: str, beginTime: date, peakTime: date, classType: (v) => typeof v === "string" && /^[ABCMX]\d+(\.\d+)?$/.test(v), sourceLocation: optional(str), activeRegionNum: optional(num) }));
export const stormCheck = array(shape({ gstID: str, startTime: date, allKpIndex: array(shape({ kpIndex: num, observedTime: date })) }));
export const kpHistoryCheck = array(shape({ time_tag: date, Kp: num }));
export const launchCheck = shape({ results: array(shape({ id: str, name: str, net: date, status: shape({ abbrev: str, name: str }), image: optional(url),
  launch_service_provider: optional(named), mission: optional(shape({ description: optional(str) })), pad: optional(shape({ location: optional(named) })) })) });
export const issCheck = shape({ latitude: num, longitude: num, altitude: num, velocity: num, timestamp: num, visibility: str, footprint: num });
export const tleCheck = shape({ line1: (v) => typeof v === "string" && /^1 25544/.test(v) && v.length >= 68, line2: (v) => typeof v === "string" && /^2 25544/.test(v) && v.length >= 68 });
export const kpMinuteCheck = array(shape({ time_tag: date, estimated_kp: num }));

export function validApodDate(value: unknown, now = new Date()): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value >= "1995-06-16" && value <= now.toISOString().slice(0, 10);
}
