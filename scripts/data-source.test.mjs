import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { getStaticSnapshot } from "../src/lib/data-source/static.ts";
import { validateSnapshot } from "../src/lib/data-source/validate.ts";
import { resolveDataSource, getPublicCatalogSnapshot } from "../src/lib/data-source/index.ts";
import { publicSupabaseConfig } from "../src/lib/supabase/public.ts";
import { createBuildFetch } from "../src/lib/supabase/build-fetch.ts";

test("modo Supabase sem configuração falha sem retornar o snapshot static", () => {
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--input-type=module", "-e",
    'import { getPublicCatalogSnapshot } from "./src/lib/data-source/index.ts"; try { await getPublicCatalogSnapshot(); } catch (error) { console.error(error.message); process.exitCode = 1; }',
  ], { encoding: "utf8", env: { ...process.env, SITE_DATA_SOURCE: "supabase", SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "" } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY/);
});

test("transporte rejeita escrita e outra origem antes de acessar rede", async () => {
  const fetch = createBuildFetch("https://example.com");
  await assert.rejects(fetch("https://example.com/rest/v1/products", { method: "POST" }), /somente leitura/);
  await assert.rejects(fetch("https://other.example.com/rest/v1/products"), /somente leitura/);
  await assert.rejects(fetch("https://example.com/auth/v1/user"), /somente leitura/);
});

test("snapshot público e memoização não carregam preços ou rascunhos", async () => {
  process.env.SITE_DATA_SOURCE = "static";
  const [a,b] = await Promise.all([getPublicCatalogSnapshot(),getPublicCatalogSnapshot()]);
  assert.strictEqual(a,b);
  assert.equal(a.products.length,5);
  assert.equal(a.contents.length,1);
  assert.equal(a.settings.featuredContentCode,"001");
  assert.ok(a.products.every(p => !("price" in p) && !("published" in p)));
});

test("fonte inválida falha; fonte ausente é static", () => {
  const previous = process.env.SITE_DATA_SOURCE;
  try {
    delete process.env.SITE_DATA_SOURCE;
    assert.equal(resolveDataSource(),"static");
    process.env.SITE_DATA_SOURCE = "typo";
    assert.throws(resolveDataSource,/SITE_DATA_SOURCE inválida/);
  } finally {
    if (previous === undefined) delete process.env.SITE_DATA_SOURCE;
    else process.env.SITE_DATA_SOURCE = previous;
  }
});

test("configuração ausente ou chave não publicável não permite fallback", () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    assert.throws(publicSupabaseConfig,/defina SUPABASE_URL/);
    process.env.SUPABASE_URL = "https://example.com";
    process.env.SUPABASE_PUBLISHABLE_KEY = "invalid";
    assert.throws(publicSupabaseConfig,/SUPABASE_PUBLISHABLE_KEY válida/);
    process.env.SUPABASE_URL = "https://example.com/path";
    assert.throws(publicSupabaseConfig,/origem HTTPS/);
  } finally {
    if (url === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = url;
    if (key === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY = key;
  }
});

for (const [name, change, expected] of [
  ["categoria ausente", s => { s.products[0].category = "missing"; }, /sem categoria/],
  ["link primário ausente", s => { s.products[0].affiliateUrl = ""; }, /link primário/],
  ["imagem principal ausente", s => { s.products[0].image = ""; }, /imagem principal/],
  ["imagem local inexistente", s => { s.products[0].image = "/products/missing.webp"; }, /asset local ausente/],
  ["path traversal", s => { s.products[0].image = "/products/../../.env.local"; }, /caminho de imagem local inválido/],
  ["destaque inacessível", s => { s.settings.featuredContentCode = "999"; }, /destacado ausente/],
  ["conteúdo vazio", s => { s.contents[0].slugs = []; }, /sem produtos/],
  ["relação inconsistente", s => { s.contents[0].slugs.push("draft"); }, /produto indisponível/],
]) {
  test(name, async () => {
    const snapshot = structuredClone(getStaticSnapshot());
    change(snapshot);
    await assert.rejects(validateSnapshot(snapshot), expected);
  });
}
