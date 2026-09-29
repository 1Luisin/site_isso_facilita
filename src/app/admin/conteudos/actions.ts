"use server";
import { updateTag } from "next/cache";
import { authenticatedAdmin } from "@/lib/supabase/admin-server";
import { validateContentInput,validateContentVersion,publicationProblems,ContentError } from "@/lib/admin-contents/validation";
import { runContentMutation } from "@/lib/admin-contents/mutation";
import { validCover } from "@/lib/admin-contents/server";
import { cleanPreviousImage } from "@/lib/product-media/server";
import { validateCoverPair } from "@/lib/product-media/paths";
export async function saveContent(jwt:string,raw:unknown){return runContentMutation(async()=>{
  const client=await authenticatedAdmin(jwt),v=validateContentInput(raw);
  if(v.published){
    const [content,products]=await Promise.all([client.from("contents").select("*").eq("id",v.id!).single(),client.from("products").select("id,name,published").in("id",v.product_ids)]);
    if(content.error||products.error)throw new ContentError("Não foi possível verificar os requisitos de publicação.");
    if(products.data.length!==v.product_ids.length)throw new ContentError("Um produto selecionado não está disponível.");
    const problems=publicationProblems(products.data,await validCover(client,content.data));
    if(problems.length)throw new ContentError(problems.join(" "));
  }
  const {data,error}=await client.rpc("admin_save_content",{p_id:v.id,p_code:v.code,p_type:v.content_type,p_title:v.title,p_description:v.description,p_published:v.published,p_products:v.product_ids,p_links:Object.fromEntries(Object.entries(v.links).filter(([,url])=>url)),p_expected_updated_at:v.expected_updated_at});
  if(error)throw error;if(!data)throw new ContentError("Salvamento não confirmado.");return {id:data};
},updateTag);}
export async function deleteContent(jwt:string,id:string,version:string,confirmation:string){return runContentMutation(async()=>{
  const client=await authenticatedAdmin(jwt,true);validateContentVersion(id,version);
  if(confirmation!=="EXCLUIR")throw new ContentError("Confirme digitando EXCLUIR.");
  const {data,error}=await client.rpc("admin_delete_content",{p_id:id,p_expected_updated_at:version});if(error)throw error;
  return {id,warning:await cleanPreviousImage(client,data)};
},updateTag);}
export async function featureContent(jwt:string,id:string,version:string,expectedFeatured:string){return runContentMutation(async()=>{
  const client=await authenticatedAdmin(jwt,true);validateContentVersion(id,version);
  const {error}=await client.rpc("admin_feature_content",{p_id:id,p_expected_updated_at:version,p_expected_featured_id:expectedFeatured});if(error)throw error;return {id};
},updateTag);}
export async function setContentCover(jwt:string,input:{id:string;bucket:string;main:string;mobile:string;version:string}){return runContentMutation(async()=>{
  const client=await authenticatedAdmin(jwt);validateContentVersion(input.id,input.version);
  try{validateCoverPair(input.id,input.bucket,input.main,input.mobile);}catch{throw new ContentError("Os caminhos da capa não correspondem ao conteúdo.");}
  if(!await validCover(client,{id:input.id,cover_storage_bucket:input.bucket,cover_path:input.main,mobile_cover_path:input.mobile},true))throw new ContentError("O envio das duas versões da capa não foi confirmado.");
  const {data,error}=await client.rpc("admin_set_content_cover",{p_id:input.id,p_bucket:input.bucket,p_main:input.main,p_mobile:input.mobile,p_expected_updated_at:input.version});if(error)throw error;
  return {id:input.id,warning:await cleanPreviousImage(client,data,[input.main,input.mobile])};
},updateTag);}
export async function removeContentCover(jwt:string,id:string,version:string){return runContentMutation(async()=>{
  const client=await authenticatedAdmin(jwt);validateContentVersion(id,version);
  const {data,error}=await client.rpc("admin_remove_content_cover",{p_id:id,p_expected_updated_at:version});if(error)throw error;
  return {id,warning:await cleanPreviousImage(client,data)};
},updateTag);}
