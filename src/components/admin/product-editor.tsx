"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProduct,deleteProduct } from "@/app/admin/produtos/actions";
import { mutationToken,type AdminProductData } from "@/lib/admin-products/browser";
import { suggestSlug,publicationProblems,type ProductInput } from "@/lib/admin-products/validation";
import { useAdminAuth } from "./auth-provider";
import { ProductAccess } from "./navigation";
import { useProducts } from "./use-products";
function ProductForm({id,data,reload,onSuccess}:{id:string|null;data:AdminProductData;reload:()=>void;onSuccess:(message:string)=>void}) {
  const product=data.products.find(p=>p.id===id);
  const image=data.images.find(p=>p.product_id===id);
  const link=data.links.find(p=>p.product_id===id);
  const [form,setForm]=useState<ProductInput>({id,name:product?.name??"",slug:product?.slug??"",description:product?.description??"",category_id:product?.category_id??data.categories.find(c=>c.active)?.id??"",published:product?.published??false,affiliate_url:link?.url??"",collection_ids:data.memberships.filter(r=>r.product_id===id).map(r=>r.collection_id),expected_updated_at:product?.updated_at??null});
  const [slugEdited,setSlugEdited]=useState(!!id),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false),[confirming,setConfirming]=useState(false),[confirmation,setConfirmation]=useState("");
  const {access}=useAdminAuth();
  const router=useRouter();
  if(id && !product)return <div className="admin-card"><h1>Produto não encontrado</h1><Link href="/admin/produtos">Voltar aos produtos</Link></div>;
  const problems=publicationProblems(data.categories.some(c=>c.id===form.category_id && c.active),!!image,form.affiliate_url.trim());
  const save=async(published:boolean)=>{
    if(busy)return;
    setBusy(true);setMessage("");setFailed(false);
    try{
      const result=await saveProduct(await mutationToken(),{...form,published});
      if(!result.ok){setFailed(true);setMessage(result.message);return;}
      if(!id){router.replace(`/admin/produtos/${result.id}`);return;}
      onSuccess(published!==form.published ? (published?"Produto publicado.":"Produto despublicado.") : "Produto salvo.");
      // Re-read updated_at and relationships; do not reuse an old concurrency token.
      reload();
    }catch{setFailed(true);setMessage("Não foi possível concluir. Confira a conexão e sua sessão.");}
    finally{setBusy(false);}
  };
  const remove=async()=>{
    if(!product || busy)return;
    setBusy(true);setFailed(false);
    try{
      const result=await deleteProduct(await mutationToken(),product.id,product.updated_at,confirmation);
      if(!result.ok){setFailed(true);setMessage(result.message);return;}
      router.replace("/admin/produtos");
    }catch{setFailed(true);setMessage("Não foi possível excluir. Confira a conexão e tente novamente.");}
    finally{setBusy(false);}
  };
  return <><div className="admin-heading"><h1>{id?"Editar produto":"Novo produto"}</h1><Link href="/admin/produtos">Voltar aos produtos</Link></div>
    <form className="admin-card admin-product-form" onSubmit={e=>{e.preventDefault();void save(form.published);}} aria-describedby="product-feedback">
      <fieldset disabled={busy}><legend>Informações do produto</legend>
        <label htmlFor="product-name">Nome</label><input id="product-name" required maxLength={160} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value,...(!slugEdited?{slug:suggestSlug(e.target.value)}:{})}))}/>
        <label htmlFor="product-slug">Slug (endereço público)</label><input id="product-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} value={form.slug} onChange={e=>{setSlugEdited(true);setForm(f=>({...f,slug:e.target.value}));}} aria-describedby="slug-help"/><small id="slug-help">Letras minúsculas, números e hífens. Alterar o slug remove o endereço anterior.</small>
        <label htmlFor="product-description">Descrição</label><textarea id="product-description" rows={5} maxLength={4000} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        <label htmlFor="product-category">Categoria</label><select id="product-category" required value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))}><option value="">Selecione</option>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name}{!c.active?" (inativa)":""}</option>)}</select>
        <label htmlFor="product-affiliate">Link principal Shopee</label><input id="product-affiliate" type="url" maxLength={2048} placeholder="https://s.shopee.com.br/…" value={form.affiliate_url} onChange={e=>setForm(f=>({...f,affiliate_url:e.target.value}))}/>
        <fieldset className="admin-collections"><legend>Coleções</legend>{data.collections.map(c=><label key={c.id}><input type="checkbox" checked={form.collection_ids.includes(c.id)} onChange={e=>setForm(f=>({...f,collection_ids:e.target.checked?[...f.collection_ids,c.id]:f.collection_ids.filter(id=>id!==c.id)}))}/>{c.name}{!c.published?" (rascunho)":""}</label>)}</fieldset>
      </fieldset>
      <div className="admin-product-image">{image?<Image src={image.storage_path} width={200} height={200} alt={image.alt_text||form.name} unoptimized/>:<p>Imagem ainda não configurada. O upload será disponibilizado na próxima etapa.</p>}</div>
      <p><strong>{form.published?"Publicado":"Rascunho"}</strong></p>
      {problems.length>0 && <div className="admin-note admin-card"><p>Para publicar:</p><ul>{problems.map(p=><li key={p}>{p}</li>)}</ul></div>}
      <p id="product-feedback" role={failed?"alert":"status"} className={failed?"admin-error":""}>{message}</p>
      <div className="admin-actions"><button className="primary-button" disabled={busy} type="submit">{busy?"Salvando…":id?"Salvar produto":"Criar rascunho"}</button>
        {id && (form.published?<button className="text-button" type="button" disabled={busy} onClick={()=>void save(false)}>Despublicar</button>:<button className="text-button" type="button" disabled={busy||problems.length>0} onClick={()=>void save(true)}>Publicar</button>)}
      </div>
    </form>
    {id && access.status==="authorized" && access.profile.role==="owner" && <section className="admin-card admin-delete"><h2>Excluir produto</h2><p>A exclusão é definitiva. Para retirar da vitrine mantendo os dados, use Despublicar.</p>
      {!confirming?<button className="text-button" disabled={busy} onClick={()=>setConfirming(true)}>Excluir definitivamente</button>:<><label htmlFor="delete-confirm">Digite EXCLUIR para confirmar</label><input id="delete-confirm" autoComplete="off" value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/><div className="admin-actions"><button className="primary-button" disabled={busy||confirmation!=="EXCLUIR"} onClick={()=>void remove()}>Confirmar exclusão definitiva</button><button disabled={busy} onClick={()=>{setConfirming(false);setConfirmation("");}}>Cancelar</button></div></>}
    </section>}
  </>;
}
function EditorData({id}:{id:string|null}){
  const {data,error,reload}=useProducts();
  const [success,setSuccess]=useState("");
  if(error)return <div role="alert"><p>Não foi possível carregar o produto.</p><button onClick={reload}>Tentar novamente</button></div>;
  if(!data)return <p role="status">Carregando produto…</p>;
  const product=data.products.find(p=>p.id===id);
  return <><p role="status">{success}</p><ProductForm key={`${id??"new"}:${product?.updated_at??""}`} id={id} data={data} reload={reload} onSuccess={setSuccess}/></>;
}
export function AdminProductEditor({id}:{id:string|null}){return <ProductAccess><EditorData id={id}/></ProductAccess>;}
