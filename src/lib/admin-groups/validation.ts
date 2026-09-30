import {isUuid,ProductError} from "../admin-products/validation.ts";
export type GroupKind="category"|"collection";
export class GroupError extends Error {}
export type GroupInput={id:string|null;name:string;slug:string;description:string;sort_order:number;expected_updated_at:string|null;active:boolean;symbol:string;published:boolean;style_index:number;product_ids:string[]};
export const collectionStyles=["Rosa · coração ♡","Neutro · sol ☼","Pêssego · estrela ✧","Lilás · flor ✿"] as const;
export function validateKind(kind:unknown):asserts kind is GroupKind {if(kind!=="category"&&kind!=="collection")throw new GroupError("Tipo de registro inválido.");}
export function validateGroupVersion(id:unknown,stamp:unknown){if(!isUuid(id)||typeof stamp!=="string"||!Number.isFinite(Date.parse(stamp)))throw new GroupError("Reabra o registro antes de salvar.");}
export function validateGroupInput(kind:GroupKind,raw:unknown):GroupInput{
 validateKind(kind);if(!raw||typeof raw!=="object")throw new GroupError("Confira os campos do registro.");const v=raw as Record<string,unknown>;
 const text=(key:string,max:number,required=false)=>{if(typeof v[key]!=="string")throw new GroupError("Confira os campos do registro.");const s=(v[key] as string).trim();if(Array.from(s).length>max||(required&&!s))throw new GroupError(`Confira ${key==="name"?"o nome":key==="description"?"a descrição":key==="symbol"?"o símbolo":"o slug"}.`);return s;};
 const name=text("name",160,true),slug=text("slug",160,true),description=text("description",4000);
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw new GroupError("Use letras minúsculas, números e hífens no slug.");
 if(!Number.isInteger(v.sort_order)||Number(v.sort_order)<0||Number(v.sort_order)>2147483647)throw new GroupError("A ordem deve ser um número inteiro maior ou igual a zero.");
 if(v.id!==null)validateGroupVersion(v.id,v.expected_updated_at);
 let symbol="",active=false,published=false,style_index=0,product_ids:string[]=[];
 if(kind==="category"){
  symbol=text("symbol",12);if(typeof v.active!=="boolean")throw new GroupError("Estado de ativação inválido.");active=v.active;
  if(v.id===null&&active)throw new GroupError("Crie a categoria inativa antes de ativar.");
 }else{
  if(typeof v.published!=="boolean"||!Number.isInteger(v.style_index)||Number(v.style_index)<0||Number(v.style_index)>3)throw new GroupError("Escolha um dos quatro estilos e um estado de publicação válido.");
  published=v.published;style_index=Number(v.style_index);
  if(v.id===null&&published)throw new GroupError("Crie o rascunho antes de publicar.");
  if(!Array.isArray(v.product_ids)||v.product_ids.length>100||!v.product_ids.every(isUuid)||new Set(v.product_ids).size!==v.product_ids.length)throw new GroupError("Selecione produtos válidos, sem repetições.");product_ids=v.product_ids;
 }
 return {id:v.id as string|null,name,slug,description,sort_order:Number(v.sort_order),expected_updated_at:v.id===null?null:v.expected_updated_at as string,active,symbol,published,style_index,product_ids};
}
export function validateGroupOrder(kind:GroupKind,items:unknown):{id:string;updated_at:string}[]{
 validateKind(kind);if(!Array.isArray(items)||items.length>1000)throw new GroupError("Recarregue a lista antes de ordenar.");
 const result=items.map(item=>{if(!item||typeof item!=="object")throw new GroupError("Ordem inválida.");validateGroupVersion(item.id,item.updated_at);return {id:item.id as string,updated_at:item.updated_at as string};});
 if(new Set(result.map(i=>i.id)).size!==result.length)throw new GroupError("A ordem contém registros repetidos.");return result;
}
export function groupErrorMessage(error:unknown){
 if(error instanceof GroupError||error instanceof ProductError)return error.message;
 const e=error&&typeof error==="object"?error as {message?:string;code?:string}:{};
 if(e.message==="category_has_products")return "Esta categoria possui produtos associados e não pode ser excluída.";
 if(e.code==="23503")return "Este registro possui dependências e não pode ser excluído.";
 if(e.code==="23505")return "Este slug já está em uso ou a ordem mudou. Confira o slug e recarregue a lista.";
 if(e.code==="40001")return "Este registro foi alterado em outra sessão. Recarregue antes de salvar.";
 if(e.code==="42501")return "Seu acesso não permite esta operação. Entre novamente se necessário.";
 const messages:Record<string,string>={category_has_published_products:"Despublique ou mova os produtos publicados desta categoria antes de desativá-la.",collection_public_product_required:"Mantenha pelo menos um produto publicado na coleção ou despublique a coleção primeiro.",group_missing:"Registro não encontrado.",group_product_missing:"Um produto selecionado não está mais disponível.",invalid_order:"Confira a ordem e recarregue a lista.",create_inactive_first:"Crie a categoria inativa antes de ativar.",create_draft_first:"Crie o rascunho antes de publicar."};
 return messages[e.message??""]??"Não foi possível salvar. Confira os campos e sua conexão.";
}
