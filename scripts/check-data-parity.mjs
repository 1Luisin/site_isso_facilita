import assert from "node:assert/strict";
const { getStaticSnapshot } = await import("../src/lib/data-source/static.ts");
const { getSupabaseSnapshot } = await import("../src/lib/data-source/supabase.ts");
const { validateSnapshot } = await import("../src/lib/data-source/validate.ts");
try {
  const [editorial, database] = await Promise.all([
    validateSnapshot(getStaticSnapshot()), getSupabaseSnapshot().then(validateSnapshot),
  ]);
  // Domain-only snapshots: no UUIDs, timestamps, drafts or internal prices.
  assert.deepStrictEqual(database, editorial);
  console.log(`Paridade aprovada: ${database.categories.length} categorias, ${database.products.length} produtos, ${database.collections.length} coleções, ${database.contents.length} conteúdos; destaque #${database.settings.featuredContentCode}.`);
} catch (error) {
  // Assertions contain only public domain data. Never print SDK clients or env values.
  console.error(error instanceof Error ? error.message : "Falha na validação de paridade.");
  process.exitCode = 1;
}
