import { test } from "node:test";
import assert from "node:assert/strict";
import { validApodDate, issCheck, neoCheck, kpHistoryCheck, apodCheck } from "../lib/validation.ts";
import { advanceTime, rotationAngle, MIN_TIME, MAX_TIME, utcDay, coord } from "../lib/simulation.ts";
import { latLonToVec3, subsolarPoint } from "../lib/astro.ts";
import { getJSON } from "../lib/http.ts";

test("APOD rechaza fechas imposibles, futuras y anteriores al archivo", () => {
  const now = new Date("2026-09-24T00:00:00Z");
  for (const bad of ["2026-02-30", "2025-02-29", "2026-09-25", "1995-06-15", "2026-13-01", "2026-9-1", undefined, ["2026-09-24"]]) assert.equal(validApodDate(bad, now), false);
  for (const good of ["1995-06-16", "2024-02-29", "2026-09-24"]) assert.equal(validApodDate(good, now), true);
});

test("los contratos separan datos vacíos válidos de respuestas rotas", () => {
  assert.equal(neoCheck({ near_earth_objects: {} }), true);
  assert.equal(neoCheck({ near_earth_objects: { hoy: [{ close_approach_data: [] }] } }), false);
  assert.equal(kpHistoryCheck([]), true);
  assert.equal(kpHistoryCheck([{ time_tag: "2026-09-24T00:00:00", Kp: 3 }]), true);
  assert.equal(kpHistoryCheck([["time_tag", "Kp"]]), false);
  assert.equal(issCheck({ latitude: NaN }), false);
  assert.equal(apodCheck({ date: "2026-09-24", title: "Sol", explanation: "Texto", media_type: "image", url: "javascript:alert(1)" }), false);
});

test("pausa, velocidades y límites del reloj son coherentes", () => {
  const time = Date.UTC(2026, 8, 24);
  assert.equal(advanceTime(time, 0.05, 0), time);
  assert.equal(advanceTime(time, 0.05, 86400) - time, 4320000);
  assert.equal(advanceTime(MAX_TIME - 1, 0.05, 86400), MAX_TIME);
  assert.equal(advanceTime(MIN_TIME + 1, 0.05, -86400), MIN_TIME);
  assert.equal(advanceTime(time, 10, 1) - time, 100);
  const epoch = Date.UTC(2000, 0, 1, 12);
  assert.ok(Math.abs(rotationAngle(epoch + 12 * 3600000, 24) - Math.PI) < 1e-10);
  assert.ok(rotationAngle(epoch + 3600000, -24) < 0);
});

test("el radar usa límites UTC y coordenadas estables", () => {
  const time = Date.parse("2026-09-23T23:30:00-05:00");
  assert.equal(new Date(utcDay(time)).toISOString(), "2026-09-24T00:00:00.000Z");
  assert.equal(coord(82.32322932971894), coord(82.32322932971897));
});

test("las coordenadas astronómicas conservan radio y rango", () => {
  for (const lat of [-90, -45, 0, 45, 90]) for (const lon of [-180, -90, 0, 90, 180]) assert.ok(Math.abs(Math.hypot(...latLonToVec3(lat, lon, 5)) - 5) < 1e-10);
  const sun = subsolarPoint(new Date("2026-03-20T12:00:00Z"));
  assert.ok(Math.abs(sun.lat) < 1);
  assert.ok(sun.lon >= -180 && sun.lon <= 180);
});

test("cliente HTTP: valida JSON, configura caché y respeta cuotas", async (t) => {
  let calls = 0;
  const fetchMock = t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls++;
    assert.equal(options.next.revalidate, 5);
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json([{ time_tag: "2026-09-24T00:00:00", Kp: 1 }]);
  });
  assert.equal((await getJSON("https://example.test", 5, kpHistoryCheck)).length, 1);
  fetchMock.mock.mockImplementation(async () => { calls++; return new Response("", {status: 429}); });
  const before = calls;
  assert.equal(await getJSON("https://example.test", 5, kpHistoryCheck), null);
  assert.equal(calls - before, 1);
  fetchMock.mock.mockImplementation(async () => Response.json({ error: "formato cambiado" }));
  assert.equal(await getJSON("https://example.test", 5, kpHistoryCheck), null);
});

test("cliente HTTP recupera un fallo transitorio sin reintentos ilimitados", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => ++calls === 1 ? new Response("", {status: 503}) : Response.json([]));
  assert.deepEqual(await getJSON("https://example.test", 60, kpHistoryCheck), []);
  assert.equal(calls, 2);
});
