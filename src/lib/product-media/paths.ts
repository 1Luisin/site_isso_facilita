export const MEDIA_BUCKET = "catalog-media";
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
export const contentObjectPattern = new RegExp(`^contents/(${uuid})/(${uuid})/(cover|mobile)\\.webp$`);
const objectPattern = new RegExp(`^products/(${uuid})/(${uuid})/(main|mobile)\\.webp$`);
export function mediaKeys(productId: string, version: string) {
  const main = `products/${productId}/${version}/main.webp`;
  if (!objectPattern.test(main)) throw new Error("Identificador de imagem inválido.");
  return { main, mobile: main.replace(/main\.webp$/, "mobile.webp") };
}
export function validateMediaPair(productId: string, bucket: string, main: string, mobile: string) {
  const match = objectPattern.exec(main);
  if (bucket !== MEDIA_BUCKET || !match || match[1] !== productId || match[3] !== "main" || mobile !== main.replace(/main\.webp$/, "mobile.webp"))
    throw new Error("Os caminhos da imagem não correspondem ao produto.");
}
export function mediaUrl(origin: string, bucket: string | null, path: string) {
  if (!bucket) {
    if (!/^\/products\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/.test(path)) throw new Error("Imagem local inválida.");
    return path;
  }
  if (bucket !== MEDIA_BUCKET || !(objectPattern.test(path) || contentObjectPattern.test(path))) throw new Error("Imagem Storage inválida.");
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.username || url.password || url.search || url.hash) throw new Error("Origem Storage inválida.");
  return `${url.origin}/storage/v1/object/public/${bucket}/${path}`;
}
export function isMediaUrl(value: string, origin: string) {
  try {
    const prefix = `${new URL(origin).origin}/storage/v1/object/public/${MEDIA_BUCKET}/`;
    return value.startsWith(prefix) && (objectPattern.test(value.slice(prefix.length)) || contentObjectPattern.test(value.slice(prefix.length)));
  } catch { return false; }
}
export function imageAlt(value: unknown, name: string) {
  if (typeof value !== "string" || value.trim().length > 300) throw new Error("A descrição da imagem deve ter até 300 caracteres.");
  return value.trim() || name;
}
export function validateImageFile(file: { type: string; size: number }) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Selecione uma imagem JPG, PNG ou WebP.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("A imagem deve ter no máximo 6 MB.");
}
export function fitImage(width: number, height: number, limit: number, heightLimit = limit) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 12000 || height > 12000 || width * height > 40000000)
    throw new Error("A imagem tem dimensões muito grandes. Use até 40 megapixels e 12.000 pixels por lado.");
  const scale = Math.min(1, limit / width, heightLimit / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function coverKeys(id: string, version: string) {
  const main=`contents/${id}/${version}/cover.webp`;
  if(!contentObjectPattern.test(main))throw new Error("Identificador de capa inválido.");
  return {main,mobile:main.replace(/cover\.webp$/,"mobile.webp")};
}
export function validateCoverPair(id:string,bucket:string,main:string,mobile:string){
  const match=contentObjectPattern.exec(main);
  if(bucket!==MEDIA_BUCKET || !match || match[1]!==id || match[3]!=="cover" || mobile!==main.replace(/cover\.webp$/,"mobile.webp"))throw new Error("Os caminhos da capa não correspondem ao conteúdo.");
}
export function coverUrl(origin:string,bucket:string|null,path:string){
  if(!bucket){if(!/^\/videos\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/.test(path))throw new Error("Capa local inválida.");return path;}
  if(!contentObjectPattern.test(path))throw new Error("Capa Storage inválida.");
  return mediaUrl(origin,bucket,path);
}
