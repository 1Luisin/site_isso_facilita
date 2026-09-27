// Test-only Node preload. Never imported by application code.
import { readFileSync } from "node:fs";
const fixture = process.env.CATALOG_TEST_FIXTURE;
if (!fixture) throw new Error("Fixture explícita obrigatória.");
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.origin === "https://catalog-test.example.com") {
    const table = url.pathname.replace("/rest/v1/", "");
    const rows = JSON.parse(readFileSync(fixture, "utf8"))[table];
    if (!rows || request.method !== "GET") throw new Error("Consulta de fixture inesperada.");
    return Response.json(rows);
  }
  return original(input, init);
};
