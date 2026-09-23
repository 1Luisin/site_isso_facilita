// Development-only generation with repository fonts rendered as vector paths.
import sharp from "sharp";
import opentype from "opentype.js";
import { join } from "node:path";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const file = (path) => join(root, path);
const dataSource = await readFile(file("src/lib/data.ts"), "utf8");
const dataModule = ts.transpileModule(dataSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { publishedProducts, publishedVideos } = await import(
  `data:text/javascript;base64,${Buffer.from(dataModule).toString("base64")}`
);
await mkdir(file("public/social"), { recursive: true });
// Outlines avoid OS font discovery, fallback and text shaping differences.
const serif = opentype.loadSync(file("scripts/fonts/Gelasio.ttf"));
const sans = opentype.loadSync(file("scripts/fonts/Arimo.ttf"));
function textPath(text, x, y, size, font, color, spacing = 0) {
  const path = font.getPath(text, x, y, size, { letterSpacing: spacing / size });
  path.fill = color;
  return path.toSVG(3);
}
const wrap = (text, max = 24) => {
  const lines = [""];
  for (const word of text.split(" ")) {
    if ((lines.at(-1) + word).length > max) lines.push("");
    lines[lines.length - 1] += (lines.at(-1) ? " " : "") + word;
  }
  return lines;
};
const flower =
  '<g fill="#a64964"><ellipse cx="0" cy="-27" rx="19" ry="28"/><ellipse cx="0" cy="-27" rx="19" ry="28" transform="rotate(72)"/><ellipse cx="0" cy="-27" rx="19" ry="28" transform="rotate(144)"/><ellipse cx="0" cy="-27" rx="19" ry="28" transform="rotate(216)"/><ellipse cx="0" cy="-27" rx="19" ry="28" transform="rotate(288)"/></g><circle r="14" fill="#fffaf5"/>';
function background(title, label, hasImage) {
  const lines = wrap(title, hasImage ? 23 : 34);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#fae9ed"/>
    <rect x="28" y="28" width="1144" height="574" rx="24" fill="#fffcf9" stroke="#e4bdca" stroke-width="2"/>
    <g transform="translate(98 107) scale(.6)">${flower}</g>
    ${textPath("Isso Facilita!", 149, 119, 38, serif, "#503d43")}
    ${textPath(label, 68, 206, 19, sans, "#a64964", 3)}
    ${lines.map((line, i) => textPath(line, 68, 292 + i * 64, hasImage ? 49 : 67, serif, "#503d43")).join("")}
    ${textPath("Pequenos achados. Dias mais leves.", 68, 548, 23, sans, "#806d72")}
    ${hasImage ? '<rect x="711" y="65" width="417" height="500" rx="22" fill="#fae9ed"/>' : `<g transform="translate(1030 348) scale(1.9)">${flower}</g>`}
  </svg>`);
}
async function social(name, title, label, image) {
  let base = sharp(background(title, label, Boolean(image)));
  if (image) {
    const content = await sharp(file(`public${image}`))
      .resize({
        width: 377,
        height: 462,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    const meta = await sharp(content).metadata();
    base = base.composite([
      {
        input: content,
        left: Math.round(919.5 - meta.width / 2),
        top: Math.round(315 - meta.height / 2),
      },
    ]);
  }
  await base
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(file(`public/social/${name}.jpg`));
}
await social(
  "isso-facilita",
  "Achadinhos para o seu dia",
  "ÚTIL, BONITO E ESCOLHIDO COM CARINHO",
);
for (const product of publishedProducts)
  if (product.image) {
    await social(
      `produto-${product.slug}`,
      product.name,
      "UM ACHADINHO PARA O SEU CANTINHO",
      product.image,
    );
  }
for (const video of publishedVideos)
  if (video.cover) {
    await social(
      `carrossel-${video.code}`,
      video.title,
      `PRODUTOS DO CARROSSEL #${video.code}`,
      video.cover,
    );
  }
const icon = await readFile(file("src/app/icon.svg"));
await sharp(icon).resize(180, 180).png().toFile(file("src/app/apple-icon.png"));
// ICO container with a PNG payload, supported by modern browsers.
const png = await sharp(icon).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
const { writeFile } = await import("node:fs/promises");
await writeFile(file("src/app/favicon.ico"), Buffer.concat([header, png]));
console.log("Ícones e imagens sociais gerados.");
