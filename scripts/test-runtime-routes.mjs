import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { getStaticSnapshot } from "../src/lib/data-source/static.ts";

// Uses the real Next production build, but a local in-process Data API fixture.
// No database writes, credentials or API endpoint added to the application.
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
const marker = "teste-runtime-novo";
assert.ok(!Object.keys(manifest.routes).some(route => route.includes(marker)));
const s = structuredClone(getStaticSnapshot());
s.categories.push({ ...s.categories[0], slug: marker, name: "Categoria runtime" });
s.products.push({ ...s.products[0], slug: marker, name: "Produto runtime", category: marker, collections: [] });
s.collections.push({ ...s.collections[0], slug: marker, name: "Coleção runtime", slugs: [marker] });
s.contents.push({ ...s.contents[0], code: "998", title: "Conteúdo runtime", slugs: [marker] });
const expectedUrls = 2 + s.categories.filter(c => s.products.some(p => p.category === c.slug)).length + s.products.length + s.collections.length + s.contents.length;
const tables = {
  categories: s.categories.map(c => ({ ...c, id: c.slug, active: true })),
  products: s.products.map(p => ({ ...p, id:p.slug, category_id:p.category, published:true })),
  product_affiliate_links: s.products.map(p => ({ id:p.slug, product_id:p.slug, url:p.affiliateUrl, active:true, is_primary:true })),
  product_images: s.products.map(p => ({ id:p.slug, product_id:p.slug, storage_path:p.image, mobile_storage_path:p.mobileImage, is_primary:true })),
  collections: s.collections.map(c => ({ ...c, id:c.slug, style_index:c.styleIndex, published:true })),
  collection_products: s.collections.flatMap(c => c.slugs.map((slug,sort_order) => ({ collection_id:c.slug, product_id:slug, sort_order }))),
  contents: s.contents.map(c => ({ ...c, id:c.code, content_type:c.contentType, cover_path:c.cover, mobile_cover_path:c.mobileCover, published:true })),
  content_products: s.contents.flatMap(c => c.slugs.map((slug,sort_order) => ({ content_id:c.code, product_id:slug, sort_order }))),
  content_links: s.contents.flatMap(c => Object.entries(c.links).map(([platform,url]) => ({ content_id:c.code, platform,url }))),
  site_settings: [{ id:true, site_name:s.settings.name, tagline:s.settings.tagline, footer_text:s.settings.footerText, featured_content_id:s.settings.featuredContentCode, instagram_url:null, tiktok_url:null, youtube_url:null }],
};
const temp = await mkdtemp(path.join(tmpdir(), "isso-runtime-"));
const file = path.join(temp,"tables.json");
await writeFile(file,JSON.stringify(tables));
const port = 3014;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)], {
  env: { ...process.env, SITE_DATA_SOURCE:"supabase", SUPABASE_URL:"https://catalog-test.example.com", SUPABASE_PUBLISHABLE_KEY:"sb_publishable_runtime_fixture_only", CATALOG_TEST_FIXTURE:file,
    NEXT_PUBLIC_SITE_URL:"https://isso-facilita-ci.example.com", NODE_OPTIONS:`--import=${pathToFileURL(path.resolve("scripts/runtime-fixture-fetch.mjs"))}` },
  stdio:["ignore","pipe","pipe"],
});
let output = "";
child.stdout.on("data", b => { output += b; });
child.stderr.on("data", b => { output += b; });
try {
  for (let i=0;i<60 && !output.includes("Ready");i++) {
    if (child.exitCode !== null) throw new Error("Servidor de teste falhou: " + output);
    await delay(500);
  }
  for (const route of [`/produto/${marker}`,`/categoria/${marker}`,`/colecao/${marker}`,"/v/998"]) {
    let response, html;
    for (let attempt=0; attempt<70; attempt++) {
      response = await fetch(`http://127.0.0.1:${port}${route}`);
      html = await response.text();
      if (html.includes("runtime</h1>")) break;
      if (attempt % 12 === 0) console.log("Aguardando revalidação temporal da fixture:",route);
      await delay(5000);
    }
    assert.equal(response.status,200,route);
    assert.ok(html.includes("runtime"),route);
    assert.ok(html.includes("runtime</h1>"), "heading: " + route);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/);
    assert.equal(new URL(canonical?.[1] ?? "https://missing.example.com").pathname,route,"canonical runtime");
    if (route.startsWith("/produto/") || route.startsWith("/v/")) assert.ok(html.includes("/social/isso-facilita.jpg"),"fallback OG");
    console.log("Rota inédita resolvida sem rebuild:",route);
  }
  let sitemap;
  for (let attempt=0; attempt<70; attempt++) {
    sitemap = await (await fetch(`http://127.0.0.1:${port}/sitemap.xml`)).text();
    if (sitemap.includes(`/produto/${marker}`)) break;
    await delay(5000);
  }
  assert.equal((sitemap.match(/<loc>/g) || []).length,expectedUrls,"sitemap inclui novos itens");
  console.log(`Sitemap atualizado sem rebuild: ${expectedUrls} URLs na fixture.`);
  // Simulate the anon/RLS result after unpublishing all new editorial items.
  tables.products = tables.products.filter(p => p.slug !== marker);
  tables.product_images = tables.product_images.filter(p => p.product_id !== marker);
  tables.product_affiliate_links = tables.product_affiliate_links.filter(p => p.product_id !== marker);
  tables.collections = tables.collections.filter(c => c.slug !== marker);
  tables.collection_products = tables.collection_products.filter(r => r.product_id !== marker);
  tables.contents = tables.contents.filter(c => c.code !== "998");
  tables.content_products = tables.content_products.filter(r => r.content_id !== "998");
  tables.content_links = tables.content_links.filter(r => r.content_id !== "998");
  await writeFile(file,JSON.stringify(tables));
  let unpublished;
  for (let attempt=0; attempt<75; attempt++) {
    unpublished = await (await fetch(`http://127.0.0.1:${port}/produto/${marker}`)).text();
    if (!unpublished.includes("Produto runtime</h1>") && unpublished.includes("NEXT_HTTP_ERROR_FALLBACK;404")) break;
    if (attempt % 12 === 0) console.log("Aguardando revalidação após despublicar fixture...");
    await delay(5000);
  }
  assert.ok(!unpublished.includes("Produto runtime</h1>"));
  assert.ok(unpublished.includes("NEXT_HTTP_ERROR_FALLBACK;404"));
  console.log("Produto despublicado retorna notFound após revalidação, sem rebuild.");
  const missing = await (await fetch(`http://127.0.0.1:${port}/produto/nao-existe`)).text();
  assert.ok(missing.includes("NEXT_HTTP_ERROR_FALLBACK;404") || missing.includes("não encontrado"));
  console.log("Ausente retorna notFound; fixture somente em memória/arquivo temporário, sem escrita no Supabase.");
} finally {
  if (child.exitCode === null) {
    const exited = new Promise(resolve => child.once("exit",resolve));
    child.kill();
    await exited;
  }
  assert.equal(path.dirname(path.resolve(temp)),path.resolve(tmpdir()));
  assert.ok(path.basename(temp).startsWith("isso-runtime-"));
  await rm(temp,{recursive:true,force:true});
}
