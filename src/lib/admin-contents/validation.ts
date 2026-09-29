import { isUuid, ProductError } from "../admin-products/validation.ts";
import { contentTypes, type ContentType } from "../content-types.ts";
export class ContentError extends Error {}
export const platforms = ["instagram","tiktok","youtube"] as const;
export type Platform = typeof platforms[number];
export type ContentInput = {id:string|null;code:string;content_type:ContentType;title:string;description:string;published:boolean;product_ids:string[];links:Record<Platform,string>;expected_updated_at:string|null};
export function suggestCode(codes:string[]) { return (codes.reduce((max,c)=>/^\d+$/.test(c) && BigInt(c)>max?BigInt(c):max,BigInt(0))+BigInt(1)).toString().padStart(3,"0"); }
export function validateContentVersion(id:unknown,version:unknown) {if(!isUuid(id)||typeof version!=="string"||!Number.isFinite(Date.parse(version)))throw new ContentError("Reabra o conteúdo antes de salvar.");}
export function validateSocialUrl(platform:Platform,value:string) {
  if(!value)return;
  const hosts={instagram:["instagram.com","www.instagram.com"],tiktok:["tiktok.com","www.tiktok.com","vm.tiktok.com","vt.tiktok.com"],youtube:["youtube.com","www.youtube.com","youtu.be"]};
  try {const url=new URL(value);if(value.length<=2048 && !/\s|\\/.test(value) && value.startsWith("https://") && url.protocol==="https:" && !url.username && !url.password && !url.port && hosts[platform].includes(url.hostname))return;}catch{}
  throw new ContentError(`Informe um link HTTPS válido de ${platform}.`);
}
export function validateContentInput(raw:unknown):ContentInput {
  if(!raw || typeof raw!=="object")throw new ContentError("Confira os campos do conteúdo.");
  const v=raw as Record<string,unknown>;
  if(typeof v.code!=="string"||!/^\d{3,20}$/.test(v.code)||typeof v.content_type!=="string"||!Object.hasOwn(contentTypes,v.content_type))throw new ContentError("Confira o código (3 a 20 dígitos) e o tipo de conteúdo.");
  if(typeof v.title!=="string"||!v.title.trim()||v.title.trim().length>200||typeof v.description!=="string"||v.description.trim().length>4000||typeof v.published!=="boolean")throw new ContentError("Confira título, descrição e publicação.");
  if(!Array.isArray(v.product_ids)||v.product_ids.length>100||!v.product_ids.every(isUuid)||new Set(v.product_ids).size!==v.product_ids.length)throw new ContentError("Selecione produtos válidos, sem repetições.");
  if(v.id!==null)validateContentVersion(v.id,v.expected_updated_at);else if(v.published)throw new ContentError("Crie o rascunho antes de publicar.");
  if(!v.links||typeof v.links!=="object")throw new ContentError("Confira os links sociais.");
  const links={} as Record<Platform,string>;
  for(const p of platforms){const value=(v.links as Record<string,unknown>)[p];if(typeof value!=="string")throw new ContentError("Confira os links sociais.");links[p]=value.trim();validateSocialUrl(p,links[p]);}
  return {id:v.id as string|null,code:v.code,content_type:v.content_type as ContentType,title:v.title.trim(),description:v.description.trim(),published:v.published,product_ids:v.product_ids as string[],links,expected_updated_at:v.id===null?null:v.expected_updated_at as string};
}
export function publicationProblems(products:{name:string;published:boolean}[],cover:boolean) {
  return [...(!cover?["Adicione uma capa válida antes de publicar."]:[]),...(!products.length?["Selecione pelo menos um produto."]:[]),...products.filter(p=>!p.published).map(p=>`Publique ou remova o produto: ${p.name}.`)];
}
export function contentErrorMessage(error:unknown) {
  if(error instanceof ContentError || error instanceof ProductError)return error.message;
  const e=error && typeof error==="object"?error as {code?:string;message?:string}:{};
  if(e.code==="23505")return "Este código já está em uso. Escolha outro código.";
  if(e.code==="40001")return "Este conteúdo ou destaque foi alterado em outra sessão. Recarregue antes de salvar.";
  if(e.code==="23503")return "Este conteúdo possui histórico e não pode ser excluído.";
  if(e.code==="42501")return "Seu acesso não permite esta operação. Entre novamente se necessário.";
  const messages:Record<string,string>={featured_content_protected:"Defina outro conteúdo como destaque antes de despublicar/excluir este.",cover_required:"Adicione uma capa válida antes de publicar.",cover_upload_incomplete:"O envio das duas versões da capa não foi confirmado.",content_products_required:"Selecione pelo menos um produto.",content_products_unpublished:"Publique ou remova os produtos rascunho antes de publicar este conteúdo.",content_product_missing:"Um produto selecionado não está mais disponível.",unpublish_before_cover_removal:"Despublique o conteúdo antes de remover a capa.",feature_published_only:"Publique o conteúdo antes de torná-lo destaque.",content_missing:"Conteúdo não encontrado.",invalid_content_link:"Confira os links HTTPS das plataformas.",create_draft_first:"Crie o rascunho antes de publicar."};
  return messages[e.message??""]??"Não foi possível concluir. Confira os campos, a conexão e sua sessão.";
}
