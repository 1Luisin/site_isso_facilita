"use server";
import { updateTag } from "next/cache";
import { authenticatedAdmin } from "@/lib/supabase/admin-server";
import { validateProductInput, publicationProblems, ProductError, isUuid } from "@/lib/admin-products/validation";
import { runProductMutation } from "@/lib/admin-products/mutation";
import { cleanPreviousImage, validStoredImage } from "@/lib/product-media/server";
export async function saveProduct(jwt: string, raw: unknown) {
  return runProductMutation(async()=>{
    const client=await authenticatedAdmin(jwt);
    const p=validateProductInput(raw);
    if(p.published){
      const category=await client.from("categories").select("active").eq("id",p.category_id).maybeSingle();
      const image=p.id ? await client.from("product_images").select("product_id,storage_bucket,storage_path,mobile_storage_path").eq("product_id",p.id).eq("is_primary",true).maybeSingle() : null;
      if(category.error || image?.error) throw new ProductError("Não foi possível verificar os requisitos de publicação.");
      const validImage=!!image?.data && await validStoredImage(client,image.data);
      const problems=publicationProblems(category.data?.active===true,validImage,p.affiliate_url);
      if(problems.length) throw new ProductError(problems.join(" "));
    }
    const {data,error}=await client.rpc("admin_save_product",{p_id:p.id,p_name:p.name,p_slug:p.slug,p_description:p.description,p_category_id:p.category_id,p_published:p.published,p_affiliate_url:p.affiliate_url,p_collection_ids:p.collection_ids,p_expected_updated_at:p.expected_updated_at});
    if(error) throw error;
    if(!data) throw new ProductError("Não foi possível confirmar o salvamento.");
    return data;
  },updateTag);
}
export async function deleteProduct(jwt: string, id: string, updatedAt: string, confirmation: string) {
  let cleanupWarning: string | undefined;
  const result=await runProductMutation(async()=>{
    const client=await authenticatedAdmin(jwt,true);
    if(!isUuid(id) || typeof updatedAt!=="string" || !Number.isFinite(Date.parse(updatedAt)) || confirmation!=="EXCLUIR") throw new ProductError("Confirme a exclusão digitando EXCLUIR.");
    const images=await client.from("product_images").select("storage_bucket,storage_path,mobile_storage_path").eq("product_id",id);
    if(images.error)throw images.error;
    const {data,error}=await client.rpc("admin_delete_product",{p_id:id,p_expected_updated_at:updatedAt});
    if(error) throw error;
    if(!data) throw new ProductError("Não foi possível confirmar a exclusão.");
    for(const image of images.data) cleanupWarning=await cleanPreviousImage(client,{bucket:image.storage_bucket,main:image.storage_path,mobile:image.mobile_storage_path}) || cleanupWarning;
    return data;
  },updateTag);
  return result.ok ? {...result,warning:cleanupWarning} : result;
}
