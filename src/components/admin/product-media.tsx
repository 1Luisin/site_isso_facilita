"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";
import { adminImageUrl, mutationToken } from "@/lib/admin-products/browser";
import { MEDIA_BUCKET, mediaKeys } from "@/lib/product-media/paths";
import { processProductImage } from "@/lib/product-media/process";
import { uploadPair } from "@/lib/product-media/upload";
import { setProductImage, removeProductImage } from "@/app/admin/produtos/media-actions";
type Props={product:Tables<"products">;image?:Tables<"product_images">;disabled:boolean;setBusy:(busy:boolean)=>void;onSaved:(message:string)=>void};
export function ProductMedia({product,image,disabled,setBusy,onSaved}:Props){
  const [prepared,setPrepared]=useState<{main:Blob;mobile:Blob}|null>(null);
  const [preview,setPreview]=useState(""),[alt,setAlt]=useState(image?.alt_text || product.name),[message,setMessage]=useState(""),[error,setError]=useState(false),[working,setWorking]=useState(false);
  const generation=useRef(0);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  useEffect(()=>()=>{generation.current++;},[]);
  const select=async(file?:File)=>{
    if(!file)return;
    const current=++generation.current;
    setWorking(true);setBusy(true);setPrepared(null);setPreview("");setError(false);setMessage("Preparando versões da imagem…");
    try{const result=await processProductImage(file);if(current===generation.current){setPrepared(result);setPreview(URL.createObjectURL(result.main));setMessage("Prévia pronta. Salve a imagem para associá-la ao produto.");}}
    catch(e){if(current===generation.current){setError(true);setMessage(e instanceof Error?e.message:"Não foi possível processar esta imagem.");}}
    finally{if(current===generation.current){setWorking(false);setBusy(false);}}
  };
  const save=async()=>{
    if(!prepared || disabled || working)return;
    setWorking(true);setBusy(true);setError(false);setMessage("Verificando sessão…");
    try{
      const client=getBrowserSupabase(); if(!client)throw new Error("Entre novamente para continuar.");
      const jwt=await mutationToken();
      const user=await client.auth.getUser(); if(user.error || !user.data.user)throw new Error("Entre novamente para continuar.");
      const [profile,existing]=await Promise.all([client.from("admin_profiles").select("role,active").eq("user_id",user.data.user.id).single(),client.from("products").select("id").eq("id",product.id).single()]);
      if(profile.error || !profile.data.active || !["owner","editor"].includes(profile.data.role) || existing.error)throw new Error("Seu perfil não tem acesso a este produto.");
      const keys=mediaKeys(product.id,crypto.randomUUID());
      const result=await uploadPair(keys,prepared,{
        upload:async(path,blob)=>{setMessage(path===keys.main?"Enviando imagem principal…":"Enviando versão mobile…");const r=await client.storage.from(MEDIA_BUCKET).upload(path,blob,{contentType:"image/webp",cacheControl:"31536000",upsert:false});if(r.error)throw r.error;},
        cleanup:async(paths)=>{const r=await client.storage.from(MEDIA_BUCKET).remove(paths);if(r.error)throw r.error;},
        associate:async()=>{setMessage("Salvando imagem do produto…");return setProductImage(jwt,{product_id:product.id,bucket:MEDIA_BUCKET,storage_path:keys.main,mobile_storage_path:keys.mobile,alt_text:alt,expected_updated_at:product.updated_at});},
      });
      if(!result.ok){setError(true);setMessage(result.message);return;}
      onSaved(result.warning || "Imagem salva. O produto mantém seu estado de publicação.");
    }catch(e){setError(true);setMessage(e instanceof Error?e.message:"Não foi possível enviar a imagem.");}
    finally{setWorking(false);setBusy(false);}
  };
  const remove=async()=>{
    if(disabled || working || product.published)return;
    setWorking(true);setBusy(true);setError(false);setMessage("Removendo imagem…");
    try{const result=await removeProductImage(await mutationToken(),product.id,product.updated_at);if(result.ok)onSaved(result.warning || "Imagem removida.");else{setError(true);setMessage(result.message);}}
    catch{setError(true);setMessage("Não foi possível remover a imagem. Confira a conexão.");}
    finally{setWorking(false);setBusy(false);}
  };
  return <section className="admin-card admin-media" aria-labelledby="media-heading"><h2 id="media-heading">Imagem do produto</h2>
    {image?<Image className="admin-media-preview" src={adminImageUrl(image)} alt={image.alt_text || product.name} width={280} height={280} unoptimized/>:<p>Selecione uma imagem para preparar este produto para publicação.</p>}
    <label htmlFor="product-file">{image?"Substituir imagem":"Selecionar imagem"}</label><input id="product-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled||working} onChange={e=>{void select(e.target.files?.[0]);e.target.value="";}}/>
    <small>JPG, PNG ou WebP, até 6 MB. A imagem será ajustada sem cortes.</small>
    {preview && prepared && <><Image className="admin-media-preview" src={preview} width={280} height={280} alt="Prévia da nova imagem" unoptimized/><p>Principal: {Math.ceil(prepared.main.size/1024)} KB · Mobile: {Math.ceil(prepared.mobile.size/1024)} KB</p></>}
    <label htmlFor="image-alt">Descrição da imagem</label><input id="image-alt" maxLength={300} value={alt} disabled={disabled||working} onChange={e=>setAlt(e.target.value)} placeholder={product.name}/>
    <div className="admin-actions"><button type="button" className="primary-button" disabled={!prepared||disabled||working} onClick={()=>void save()}>Salvar imagem</button>{image && <button type="button" disabled={disabled||working||product.published} onClick={()=>void remove()}>Remover imagem</button>}</div>
    {image && product.published && <p>Despublique o produto antes de remover a imagem.</p>}
    <p aria-live="polite" role={error?"alert":"status"} className={error?"admin-error":""}>{message}</p>
  </section>;
}
