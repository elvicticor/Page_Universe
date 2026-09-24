import { test } from "node:test";
import assert from "node:assert/strict";
import { translationChunks, requestTranslation } from "../lib/translation-text.ts";

test("la traducción divide texto UTF-8 respetando el límite del proveedor", () => {
  for (const text of ["A distant galaxy. ".repeat(90).trim(), "🌌".repeat(400), "á".repeat(700)]) {
    const chunks = translationChunks(text);
    assert.ok(chunks.every((chunk) => Buffer.byteLength(chunk) <= 500));
    assert.equal(chunks.join("").replaceAll(" ", ""), text.replaceAll(" ", ""));
    assert.ok(chunks.every((chunk) => !chunk.includes("�")));
  }
  assert.deepEqual(translationChunks("   "), []);
});

test("traducción: idioma, respuesta válida y rechazo de cuota agotada", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(new URL(url).searchParams.get("langpair"), "en|es");
    assert.equal(options.cache, "no-store");
    return Response.json({ responseStatus: 200, responseData: { translatedText: "Una galaxia" } });
  });
  assert.equal(await requestTranslation("A galaxy"), "Una galaxia");
  for (const data of [
    { responseStatus: 403, responseData: { translatedText: "QUOTA EXCEEDED" } },
    { responseStatus: 200, quotaFinished: true, responseData: { translatedText: "QUOTA EXCEEDED" } },
    { responseStatus: 200, responseData: { translatedText: "" } },
    null,
  ]) {
    mock.mock.mockImplementation(async () => Response.json(data));
    await assert.rejects(requestTranslation("A galaxy"));
  }
});
