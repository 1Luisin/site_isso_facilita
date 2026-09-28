"use server";
import { updateTag } from "next/cache";
import { authenticatedAdmin } from "@/lib/supabase/admin-server";
import { PUBLIC_CATALOG_TAG } from "@/lib/data-source/cache-policy";
import { isUuid, ProductError, productErrorMessage } from "@/lib/admin-products/validation";
import { imageAlt, validateMediaPair } from "@/lib/product-media/paths";
import { cleanPreviousImage, validStoredImage } from "@/lib/product-media/server";
import type { MediaResult } from "@/lib/product-media/upload";
function validateVersion(id: string, updatedAt: string) {
  if(!isUuid(id) || typeof updatedAt!=="string" || !Number.isFinite(Date.parse(updatedAt))) throw new ProductError("Reabra o produto antes de alterar sua imagem.");
}
export async function setProductImage(jwt: string, input: {product_id:string;bucket:string;storage_path:string;mobile_storage_path:string;alt_text:string;expected_updated_at:string}): Promise<MediaResult> {
  try {
    const client=await authenticatedAdmin(jwt);
    validateVersion(input.product_id,input.expected_updated_at);
    try { validateMediaPair(input.product_id,input.bucket,input.storage_path,input.mobile_storage_path); }
    catch {throw new ProductError("Os caminhos da imagem não correspondem ao produto.");}
    const product=await client.from("products").select("name").eq("id",input.product_id).single();
    if(product.error)throw new ProductError("Produto não encontrado.");
    let alt:string;
    try {alt=imageAlt(input.alt_text,product.data.name);}catch{throw new ProductError("A descrição da imagem deve ter até 300 caracteres.");}
    if(!await validStoredImage(client,{...input,storage_bucket:input.bucket},true))throw new ProductError("O envio das duas imagens não foi confirmado. Tente novamente.");
    const {data,error}=await client.rpc("admin_set_product_image",{p_id:input.product_id,p_bucket:input.bucket,p_main:input.storage_path,p_mobile:input.mobile_storage_path,p_alt:alt,p_expected_updated_at:input.expected_updated_at});
    if(error)throw error;
    // The database committed. Return success even if invalidation/cleanup fails:
    // the browser must never compensate by deleting the newly active files.
    let warning:string|undefined;
    try{updateTag(PUBLIC_CATALOG_TAG);}catch{warning="Imagem salva, mas a atualização pública não foi confirmada.";}
    const cleanup=await cleanPreviousImage(client,data,[input.storage_path,input.mobile_storage_path]);
    return {ok:true,warning:[warning,cleanup].filter(Boolean).join(" ") || undefined};
  } catch(error){return {ok:false,message:productErrorMessage(error)};}
}
export async function removeProductImage(jwt:string,id:string,updatedAt:string):Promise<MediaResult>{
  try {
    const client=await authenticatedAdmin(jwt); validateVersion(id,updatedAt);
    const {data,error}=await client.rpc("admin_remove_product_image",{p_id:id,p_expected_updated_at:updatedAt});
    if(error)throw error;
    let warning:string|undefined;
    try{updateTag(PUBLIC_CATALOG_TAG);}catch{warning="Imagem removida, mas a atualização pública não foi confirmada.";}
    const cleanup=await cleanPreviousImage(client,data);
    return {ok:true,warning:[warning,cleanup].filter(Boolean).join(" ") || undefined};
  }catch(error){return {ok:false,message:productErrorMessage(error)};}
}
