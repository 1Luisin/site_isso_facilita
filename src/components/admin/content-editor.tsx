"use client";
import Image from "next/image";
import Link from "next/link";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveContent,deleteContent,featureContent } from "@/app/admin/conteudos/actions";
import { mutationToken,adminImageUrl } from "@/lib/admin-products/browser";
import type { AdminContentData } from "@/lib/admin-contents/browser";
import { suggestCode,platforms,publicationProblems,type ContentInput } from "@/lib/admin-contents/validation";
import { contentTypes,type ContentType } from "@/lib/content-types";
import { useAdminAuth } from "./auth-provider";
import { ProductAccess } from "./navigation";
import { useContents } from "./use-contents";
import { ContentMedia } from "./content-media";
function ContentForm({id,data,reload,onSuccess}:{id:string|null;data:AdminContentData;reload:()=>void;onSuccess:(message:string)=>void}){
  const content=data.contents.find(c=>c.id===id),router=useRouter(),{access}=useAdminAuth();
  const initial:ContentInput={id,code:content?.code??suggestCode(data.contents.map(c=>c.code)),content_type:(content?.content_type??"carousel") as ContentType,title:content?.title??"",description:content?.description??"",published:content?.published??false,product_ids:data.memberships.filter(r=>r.content_id===id).map(r=>r.product_id),links:{instagram:"",tiktok:"",youtube:"",...Object.fromEntries(data.links.filter(l=>l.content_id===id&&platforms.some(p=>p===l.platform)).map(l=>[l.platform,l.url]))},expected_updated_at:content?.updated_at??null};
  const [form,setForm]=useState(initial),[busy,setBusy]=useState(false),[pending,startTransition]=useTransition(),[message,setMessage]=useState(""),[failed,setFailed]=useState(false),[confirmation,setConfirmation]=useState(""),[search,setSearch]=useState("");
  if(id&&!content)return <p>Conteúdo não encontrado. <Link href="/admin/conteudos">Voltar</Link></p>;
  const disabled=busy||pending,dirty=JSON.stringify(initial)!==JSON.stringify(form),featured=id===data.featuredId,owner=access.status==="authorized"&&access.profile.role==="owner";
  const selected=form.product_ids.map(id=>data.products.find(p=>p.id===id)).filter(p=>p!==undefined);
  const problems=publicationProblems(selected,!!content?.cover_path);
  const action=(work:()=>Promise<void>)=>startTransition(async()=>{setFailed(false);setMessage("");try{await work();}catch{setFailed(true);setMessage("Não foi possível concluir. Confira sua sessão e conexão.");}});
  const save=(published:boolean)=>action(async()=>{
    const r=await saveContent(await mutationToken(),{...form,published});if(!r.ok){setFailed(true);setMessage(r.message);return;}
    if(!id){router.replace(`/admin/conteudos/${r.id}`);return;}onSuccess(r.warning??(published?"Conteúdo salvo e publicado.":"Rascunho salvo."));reload();
  });
  const move=(index:number,direction:number)=>setForm(f=>{const ids=[...f.product_ids];[ids[index],ids[index+direction]]=[ids[index+direction],ids[index]];return {...f,product_ids:ids};});
  return <><div className="admin-heading"><h1>{id?"Editar conteúdo":"Novo conteúdo"}</h1><Link href="/admin/conteudos">Voltar aos conteúdos</Link></div>
    <form className="admin-card admin-product-form" onSubmit={e=>{e.preventDefault();save(form.published);}}>
      <fieldset disabled={disabled}><legend>Dados principais</legend>
        <label htmlFor="content-code">Código público</label><input id="content-code" required pattern="[0-9]{3,20}" maxLength={20} inputMode="numeric" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))}/><small>Alterar o código muda o endereço /v/ do conteúdo.</small>
        <label htmlFor="content-type">Tipo</label><select id="content-type" value={form.content_type} onChange={e=>setForm(f=>({...f,content_type:e.target.value as ContentType}))}>{Object.entries(contentTypes).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <label htmlFor="content-title">Título</label><input id="content-title" required maxLength={200} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
        <label htmlFor="content-description">Descrição</label><textarea id="content-description" maxLength={4000} rows={4} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
      </fieldset>
      <fieldset disabled={disabled}><legend>Produtos relacionados</legend>
        <ol className="admin-content-products">{selected.map((p,index)=>{const image=data.images.find(i=>i.product_id===p.id);return <li key={p.id}>{image&&<Image src={adminImageUrl(image)} width={48} height={48} alt={p.name} unoptimized/>}<div><strong>{p.name}</strong><small>{p.slug} · {p.published?"Publicado":"Rascunho"}</small></div><div className="admin-actions"><button type="button" disabled={disabled||index===0} aria-label={`Mover ${p.name} para cima`} onClick={()=>move(index,-1)}>↑</button><button type="button" disabled={disabled||index===selected.length-1} aria-label={`Mover ${p.name} para baixo`} onClick={()=>move(index,1)}>↓</button><button type="button" onClick={()=>setForm(f=>({...f,product_ids:f.product_ids.filter(id=>id!==p.id)}))}>Remover</button></div></li>;})}</ol>
        <label htmlFor="product-find">Buscar produto para adicionar</label><input id="product-find" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="admin-product-picker">{data.products.filter(p=>!form.product_ids.includes(p.id)&&`${p.name} ${p.slug}`.toLowerCase().includes(search.toLowerCase())).map(p=>{const image=data.images.find(i=>i.product_id===p.id);return <button type="button" key={p.id} onClick={()=>setForm(f=>({...f,product_ids:[...f.product_ids,p.id]}))}>{image&&<Image src={adminImageUrl(image)} width={40} height={40} alt="" unoptimized/>}<span>Adicionar {p.name}<small>{p.slug} · {p.published?"Publicado":"Rascunho"}</small></span></button>;})}</div>
      </fieldset>
      <fieldset disabled={disabled}><legend>Links sociais (opcionais)</legend>{platforms.map(p=><div key={p}><label htmlFor={`link-${p}`}>{({instagram:"Instagram",tiktok:"TikTok",youtube:"YouTube"})[p]}</label><input id={`link-${p}`} type="url" maxLength={2048} value={form.links[p]} onChange={e=>setForm(f=>({...f,links:{...f.links,[p]:e.target.value}}))}/></div>)}</fieldset>
      <fieldset disabled={disabled}><legend>Publicação</legend><p>{form.published?"Publicado":"Rascunho"}</p>{problems.length>0&&<ul>{problems.map(p=><li key={p}>{p}</li>)}</ul>}
        {featured&&<p>Defina outro conteúdo como destaque antes de despublicar/excluir este.</p>}
        <div className="admin-actions"><button className="primary-button" type="submit">{id?"Salvar conteúdo":"Criar rascunho"}</button>{id&&(form.published?<button type="button" disabled={disabled||featured} onClick={()=>save(false)}>Despublicar</button>:<button type="button" disabled={disabled||problems.length>0} onClick={()=>save(true)}>Publicar</button>)}</div>
      </fieldset>
    </form>
    <p role={failed?"alert":"status"} className={failed?"admin-error":""}>{message}</p>
    {content?<><p>Salve os dados antes de alterar a capa ou o destaque.</p><ContentMedia product={content} disabled={disabled||dirty} setBusy={setBusy} onSaved={m=>{onSuccess(m);reload();}}/>
      <section className="admin-card"><h2>Destaque</h2>{featured?<p>Este é o destaque atual da Home.</p>:<p>Somente o owner pode escolher um conteúdo publicado como destaque.</p>}{owner&&!featured&&<button className="primary-button" disabled={disabled||dirty||!content.published} onClick={()=>action(async()=>{const r=await featureContent(await mutationToken(),content.id,content.updated_at,data.featuredId);if(!r.ok){setFailed(true);setMessage(r.message);return;}onSuccess(r.warning??"Destaque atualizado.");reload();})}>Tornar destaque</button>}</section>
      {owner&&<section className="admin-card"><h2>Exclusão</h2><label htmlFor="content-delete">Digite EXCLUIR para confirmar a exclusão definitiva</label><input id="content-delete" value={confirmation} disabled={disabled||featured} onChange={e=>setConfirmation(e.target.value)}/><button disabled={disabled||featured||confirmation!=="EXCLUIR"} onClick={()=>action(async()=>{const r=await deleteContent(await mutationToken(),content.id,content.updated_at,confirmation);if(!r.ok){setFailed(true);setMessage(r.message);return;}if(r.warning)window.alert(r.warning);router.replace("/admin/conteudos");})}>Excluir conteúdo</button></section>}
    </>:<p>Crie o rascunho para enviar a capa e publicar.</p>}</>;
}
function EditorData({id}:{id:string|null}){const {data,error,reload}=useContents();const [success,setSuccess]=useState("");if(error)return <p role="alert">Não foi possível carregar. <button onClick={reload}>Tentar novamente</button></p>;if(!data)return <p role="status">Carregando conteúdo…</p>;const c=data.contents.find(c=>c.id===id);return <><p role="status">{success}</p><ContentForm key={`${id}:${c?.updated_at}:${data.featuredId}`} id={id} data={data} reload={reload} onSuccess={setSuccess}/></>;}
export function AdminContentEditor({id}:{id:string|null}){return <ProductAccess><EditorData id={id}/></ProductAccess>;}
