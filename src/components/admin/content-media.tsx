"use client";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";
import { mutationToken } from "@/lib/admin-products/browser";
import { MEDIA_BUCKET, coverKeys } from "@/lib/product-media/paths";
import { processContentCover } from "@/lib/product-media/process";
import { uploadPair } from "@/lib/product-media/upload";
import { setContentCover, removeContentCover } from "@/app/admin/conteudos/actions";
import { adminCoverUrl } from "@/lib/admin-contents/browser";
type Props={product:Tables<"contents">;disabled:boolean;setBusy:(busy:boolean)=>void;onSaved:(message:string)=>void};
export function ContentMedia({product,disabled,setBusy,onSaved}:Props){
  const image=product.cover_path;
  const [pending,startTransition]=useTransition();
  const [prepared,setPrepared]=useState<{main:Blob;mobile:Blob}|null>(null);
  const [preview,setPreview]=useState(""),[message,setMessage]=useState(""),[error,setError]=useState(false),[working,setWorking]=useState(false);
  const generation=useRef(0);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  useEffect(()=>()=>{generation.current++;},[]);
  const select=async(file?:File)=>{
    if(!file)return;
    const current=++generation.current;
    setWorking(true);setBusy(true);setPrepared(null);setPreview("");setError(false);setMessage("Preparando versões da capa…");
    try{const result=await processContentCover(file);if(current===generation.current){setPrepared(result);setPreview(URL.createObjectURL(result.main));setMessage("Prévia pronta. Salve a capa para associá-la ao conteúdo.");}}
    catch(e){if(current===generation.current){setError(true);setMessage(e instanceof Error?e.message:"Não foi possível processar esta capa.");}}
    finally{if(current===generation.current){setWorking(false);setBusy(false);}}
  };
  const save=async()=>{
    if(!prepared || disabled || working)return;
    setWorking(true);setBusy(true);setError(false);setMessage("Verificando sessão…");
    try{
      const client=getBrowserSupabase(); if(!client)throw new Error("Entre novamente para continuar.");
      const jwt=await mutationToken();
      const user=await client.auth.getUser(); if(user.error || !user.data.user)throw new Error("Entre novamente para continuar.");
      const [profile,existing]=await Promise.all([client.from("admin_profiles").select("role,active").eq("user_id",user.data.user.id).single(),client.from("contents").select("id").eq("id",product.id).single()]);
      if(profile.error || !profile.data.active || !["owner","editor"].includes(profile.data.role) || existing.error)throw new Error("Seu perfil não tem acesso a este conteúdo.");
      const keys=coverKeys(product.id,crypto.randomUUID());
      const result=await uploadPair(keys,prepared,{
        upload:async(path,blob)=>{setMessage(path===keys.main?"Enviando capa principal…":"Enviando versão mobile…");const r=await client.storage.from(MEDIA_BUCKET).upload(path,blob,{contentType:"image/webp",cacheControl:"31536000",upsert:false});if(r.error)throw r.error;},
        cleanup:async(paths)=>{const r=await client.storage.from(MEDIA_BUCKET).remove(paths);if(r.error)throw r.error;},
        associate:async()=>{setMessage("Salvando capa do conteúdo…");return setContentCover(jwt,{id:product.id,bucket:MEDIA_BUCKET,main:keys.main,mobile:keys.mobile,version:product.updated_at});},
      });
      if(!result.ok){setError(true);setMessage(result.message);return;}
      onSaved(result.warning || "Capa salva. O conteúdo mantém seu estado de publicação.");
    }catch(e){setError(true);setMessage(e instanceof Error?e.message:"Não foi possível enviar a capa.");}
    finally{setWorking(false);setBusy(false);}
  };
  const remove=async()=>{
    if(disabled || working || product.published)return;
    setWorking(true);setBusy(true);setError(false);setMessage("Removendo capa…");
    try{const result=await removeContentCover(await mutationToken(),product.id,product.updated_at);if(result.ok)onSaved(result.warning || "Capa removida.");else{setError(true);setMessage(result.message);}}
    catch{setError(true);setMessage("Não foi possível remover a capa. Confira a conexão.");}
    finally{setWorking(false);setBusy(false);}
  };
  return <section className="admin-card admin-media" aria-labelledby="media-heading"><h2 id="media-heading">Capa do conteúdo</h2>
    {image?<Image className="admin-media-preview" src={adminCoverUrl(product)} alt={product.title} width={280} height={280} unoptimized/>:<p>Selecione uma capa para preparar este conteúdo para publicação.</p>}
    <label htmlFor="content-file">{image?"Substituir capa":"Selecionar capa"}</label><input id="content-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled||working||pending} onChange={e=>{void select(e.target.files?.[0]);e.target.value="";}}/>
    <small>JPG, PNG ou WebP, até 6 MB. A capa será ajustada sem cortes.</small>
    {preview && prepared && <><Image className="admin-media-preview" src={preview} width={280} height={280} alt="Prévia da nova capa" unoptimized/><p>Principal: {Math.ceil(prepared.main.size/1024)} KB · Mobile: {Math.ceil(prepared.mobile.size/1024)} KB</p></>}
    <div className="admin-actions"><button type="button" className="primary-button" disabled={!prepared||disabled||working||pending} onClick={()=>startTransition(save)}>Salvar capa</button>{image && <button type="button" disabled={disabled||working||pending||product.published} onClick={()=>startTransition(remove)}>Remover capa</button>}</div>
    {image && product.published && <p>Despublique o conteúdo antes de remover a capa.</p>}
    <p aria-live="polite" role={error?"alert":"status"} className={error?"admin-error":""}>{message}</p>
  </section>;
}
