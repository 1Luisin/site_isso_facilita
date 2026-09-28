export type ProductInput = { id: string | null; name: string; slug: string; description: string; category_id: string; published: boolean; affiliate_url: string; collection_ids: string[]; expected_updated_at: string | null };
export class ProductError extends Error {}
export const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function suggestSlug(name: string) { return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function validateProductInput(raw: unknown): ProductInput {
  if (!raw || typeof raw !== "object") throw new ProductError("Confira os campos do produto.");
  const v = raw as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => {
    if (typeof v[key] !== "string") throw new ProductError("Confira os campos do produto.");
    const t = (v[key] as string).trim();
    if (t.length > max || (required && !t)) throw new ProductError(`Confira o campo ${key === "name" ? "nome" : key === "description" ? "descrição" : key}.`);
    return t;
  };
  const name = text("name",160,true), slug = text("slug",160,true), description = text("description",4000), affiliate_url = text("affiliate_url",2048);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new ProductError("Use apenas letras minúsculas, números e hífens no slug.");
  if (!isUuid(v.category_id) || (v.id !== null && !isUuid(v.id))) throw new ProductError("Selecione uma categoria válida.");
  if (typeof v.published !== "boolean") throw new ProductError("Estado de publicação inválido.");
  if (!Array.isArray(v.collection_ids) || v.collection_ids.length>100 || !v.collection_ids.every(isUuid)) throw new ProductError("Selecione coleções válidas.");
  if (affiliate_url) {
    let url: URL;
    try { url = new URL(affiliate_url); } catch { throw new ProductError("Informe um link HTTPS válido da Shopee."); }
    if (url.protocol !== "https:" || url.username || url.password || url.port || !["shopee.com.br","s.shopee.com.br"].includes(url.hostname) || url.pathname === "/" || /\s/.test(affiliate_url)) throw new ProductError("Informe o link específico do produto na Shopee, começando com https://.");
  }
  if (v.id === null && v.published) throw new ProductError("Crie o rascunho antes de publicar.");
  if (v.id !== null && (typeof v.expected_updated_at !== "string" || !Number.isFinite(Date.parse(v.expected_updated_at)))) throw new ProductError("Reabra o produto antes de salvar.");
  return { id:v.id as string|null,name,slug,description,category_id:v.category_id,published:v.published,affiliate_url,collection_ids:[...new Set(v.collection_ids as string[])],expected_updated_at:v.id === null ? null : v.expected_updated_at as string };
}
export function publicationProblems(categoryActive: boolean, imageExists: boolean, affiliateUrl: string) {
  return [!categoryActive && "Selecione uma categoria ativa antes de publicar.", !imageExists && "Adicione uma imagem principal antes de publicar.", !affiliateUrl && "Defina um link afiliado ativo antes de publicar."].filter((v): v is string => !!v);
}
export function productErrorMessage(error: unknown): string {
  if (error instanceof ProductError) return error.message;
  const e = error && typeof error === "object" ? error as { code?: string; message?: string } : {};
  if(e.message === "unpublish_before_image_removal") return "Despublique o produto antes de remover a imagem.";
  if(e.message === "image_upload_incomplete") return "O envio das duas imagens não foi confirmado. Tente novamente.";
  if(e.message === "invalid_image_change") return "Confira os dados da imagem e reabra o produto.";
  if (e.code === "23505") return "Este slug já está em uso ou houve um conflito de ordem. Confira o slug e tente novamente.";
  if (e.code === "23503") return "Este produto possui histórico e não pode ser excluído. Despublique-o.";
  if (e.code === "40001") return "Este produto foi alterado em outra sessão. Reabra-o antes de salvar.";
  if (e.code === "42501") return "Seu acesso não permite esta operação. Entre novamente se necessário.";
  const messages: Record<string,string> = { image_required:"Adicione uma imagem principal antes de publicar.", affiliate_required:"Defina um link afiliado ativo antes de publicar.", category_inactive:"Selecione uma categoria ativa antes de publicar.", category_missing:"A categoria não está disponível.", collection_missing:"Uma coleção não está mais disponível.", last_content_product:"Este é o último produto de um conteúdo publicado. Mantenha outro produto público nesse conteúdo antes de removê-lo.", product_missing:"Produto não encontrado.", invalid_affiliate:"Informe um link específico e válido da Shopee." };
  return messages[e.message ?? ""] ?? "Não foi possível salvar a alteração. Confira a conexão e tente novamente.";
}
