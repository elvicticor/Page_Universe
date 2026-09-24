export const MIN_TIME = Date.UTC(1800, 0, 1);
export const MAX_TIME = Date.UTC(2050, 0, 1);
const EPOCH = Date.UTC(2000, 0, 1, 12);

export function advanceTime(time: number, seconds: number, speed: number) {
  return Math.min(MAX_TIME, Math.max(MIN_TIME, time + Math.min(Math.max(seconds, 0), 0.1) * 1000 * speed));
}

/** Fase ilustrativa referida a J2000; el periodo y el sentido siguen el reloj simulado. */
export function rotationAngle(time: number, hours: number) {
  return (((time - EPOCH) / (hours * 3600000)) % 1) * Math.PI * 2;
}

export const utcDay = (time: number) => Math.floor(time / 86400000) * 86400000;
export const coord = (value: number) => Number(value.toFixed(4));
