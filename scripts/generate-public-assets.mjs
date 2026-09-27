import { readdir, writeFile } from "node:fs/promises";
const assets = [];
for (const folder of ["products", "videos", "social"]) {
  for (const file of await readdir(new URL(`../public/${folder}/`, import.meta.url), { withFileTypes: true })) {
    if (file.isFile()) assets.push(`/${folder}/${file.name}`);
  }
}
await writeFile(new URL("../src/lib/public-assets.json", import.meta.url), JSON.stringify(assets.sort(), null, 2) + "\n");
