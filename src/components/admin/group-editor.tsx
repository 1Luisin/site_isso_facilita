"use client";
import Image from "next/image";
import Link from "next/link";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {saveGroup,deleteGroup} from "@/app/admin/grupos-actions";
import {mutationToken,adminImageUrl} from "@/lib/admin-products/browser";
import {suggestSlug} from "@/lib/admin-products/validation";
import {collectionStyles,type GroupKind,type GroupInput} from "@/lib/admin-groups/validation";
import type {GroupData} from "@/lib/admin-groups/browser";
import {ProductAccess} from "./navigation";
import {useGroups} from "./use-groups";
import {useAdminAuth} from "./auth-provider";
function GroupForm({kind,id,data,reload,onSuccess}:{kind:GroupKind;id:string|null;data:GroupData;reload:()=>void;onSuccess:(s:string)=>void}){
 const category=kind==="category",base=category?"categorias":"colecoes",label=category?"categoria":"coleção";
 const record=(category?data.categories:data.collections).find(r=>r.id===id);
 const initial:GroupInput={id,name:record?.name??"",slug:record?.slug??"",description:record?.description??"",sort_order:record?.sort_order??(category?data.categories.length:data.collections.length),expected_updated_at:record?.updated_at??null,active:record&&"active" in record?record.active:false,symbol:record&&"symbol" in record?record.symbol??"":"",published:record&&"published" in record?record.published:false,style_index:record&&"style_index" in record?record.style_index??0:0,product_ids:data.memberships.filter(m=>m.collection_id===id).map(m=>m.product_id)};
 const [form,setForm]=useState(initial),[slugEdited,setSlugEdited]=useState(!!id),[pending,startTransition]=useTransition(),[message,setMessage]=useState(""),[failed,setFailed]=useState(false),[search,setSearch]=useState(""),[confirmation,setConfirmation]=useState("");
 const router=useRouter(),{access}=useAdminAuth();
 if(id&&!record)return <p>Registro não encontrado. <Link href={`/admin/${base}`}>Voltar</Link></p>;
 const selected=form.product_ids.map(id=>data.products.find(p=>p.id===id)).filter(p=>p!==undefined);
 const hasVisible=selected.some(p=>p.published&&data.categories.some(c=>c.id===p.category_id&&c.active));
 const publishedProducts=data.products.filter(p=>p.category_id===id&&p.published).length;
 const save=(visible:boolean)=>startTransition(async()=>{
  setFailed(false);setMessage("");try{const result=await saveGroup(await mutationToken(),kind,{...form,...(category?{active:visible}:{published:visible})});if(!result.ok){setFailed(true);setMessage(result.message);return;}if(!id){router.replace(`/admin/${base}/${result.id}`);return;}onSuccess(result.warning??"Alterações salvas.");reload();}catch{setFailed(true);setMessage("Não foi possível salvar. Confira sua sessão e conexão.");}
 });
 const move=(index:number,delta:number)=>setForm(f=>{const ids=[...f.product_ids];[ids[index],ids[index+delta]]=[ids[index+delta],ids[index]];return {...f,product_ids:ids};});
 return <><div className="admin-heading"><h1>{id?`Editar ${label}`:`Nova ${label}`}</h1><Link href={`/admin/${base}`}>Voltar à lista</Link></div>
  <form className="admin-card admin-product-form" onSubmit={e=>{e.preventDefault();save(category?form.active:form.published);}}>
   <fieldset disabled={pending}><legend>Dados principais</legend><label htmlFor="group-name">Nome</label><input id="group-name" required maxLength={160} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value,...(!slugEdited?{slug:suggestSlug(e.target.value)}:{})}))}/>
    <label htmlFor="group-slug">Slug</label><input id="group-slug" required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>{setSlugEdited(true);setForm(f=>({...f,slug:e.target.value}));}}/><small>Alterar o slug remove o endereço antigo. Não será criado redirecionamento.</small>
    {category&&<><label htmlFor="group-symbol">Símbolo (opcional, até 12 caracteres)</label><input id="group-symbol" maxLength={24} value={form.symbol} onChange={e=>setForm(f=>({...f,symbol:e.target.value}))}/></>}
    <label htmlFor="group-description">Descrição</label><textarea id="group-description" rows={4} maxLength={4000} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
    <label htmlFor="group-order">Posição na lista (começa em zero)</label><input id="group-order" type="number" min={0} max={2147483647} step={1} required value={Number.isNaN(form.sort_order)?"":form.sort_order} onChange={e=>setForm(f=>({...f,sort_order:e.target.valueAsNumber}))}/><small>Posições maiores que a lista colocam o registro no final; os demais são deslocados.</small>
    {!category&&<><label htmlFor="group-style">Estilo visual</label><select id="group-style" value={form.style_index} onChange={e=>setForm(f=>({...f,style_index:Number(e.target.value)}))}>{collectionStyles.map((style,i)=><option value={i} key={i}>{style}</option>)}</select></>}
   </fieldset>
   {!category&&<fieldset disabled={pending}><legend>Produtos da coleção</legend><ol className="admin-content-products">{selected.map((p,index)=>{const image=data.images.find(i=>i.product_id===p.id);return <li key={p.id}>{image&&<Image src={adminImageUrl(image)} width={48} height={48} alt={p.name} unoptimized/>}<div><strong>{p.name}</strong><small>{p.slug} · {p.published?"Publicado":"Rascunho"}</small></div><div className="admin-actions"><button type="button" disabled={pending||index===0} aria-label={`Mover ${p.name} para cima`} onClick={()=>move(index,-1)}>↑</button><button type="button" disabled={pending||index===selected.length-1} aria-label={`Mover ${p.name} para baixo`} onClick={()=>move(index,1)}>↓</button><button type="button" onClick={()=>setForm(f=>({...f,product_ids:f.product_ids.filter(id=>id!==p.id)}))}>Remover</button></div></li>;})}</ol>
    <label htmlFor="group-find-product">Buscar produto</label><input id="group-find-product" value={search} onChange={e=>setSearch(e.target.value)}/><div className="admin-product-picker">{data.products.filter(p=>!form.product_ids.includes(p.id)&&`${p.name} ${p.slug}`.toLowerCase().includes(search.toLowerCase())).map(p=>{const image=data.images.find(i=>i.product_id===p.id);return <button type="button" key={p.id} onClick={()=>setForm(f=>({...f,product_ids:[...f.product_ids,p.id]}))}>{image&&<Image src={adminImageUrl(image)} width={40} height={40} alt="" unoptimized/>}<span>Adicionar {p.name}<small>{p.slug} · {p.published?"Publicado":"Rascunho"}</small></span></button>;})}</div>
   </fieldset>}
   <fieldset disabled={pending}><legend>{category?"Ativação":"Publicação"}</legend><p>{category?(form.active?"Ativa":"Inativa"):(form.published?"Publicada":"Rascunho")}</p>
    {category&&publishedProducts>0&&<p>Despublique ou mova os produtos publicados desta categoria antes de desativá-la.</p>}
    {!category&&!hasVisible&&<p>Selecione pelo menos um produto publicado para publicar a coleção.</p>}
    <div className="admin-actions"><button className="primary-button" type="submit">{id?"Salvar alterações":category?"Criar categoria inativa":"Criar rascunho"}</button>{id&&(category?<button type="button" disabled={pending||(form.active&&publishedProducts>0)} onClick={()=>save(!form.active)}>{form.active?"Desativar":"Ativar"}</button>:<button type="button" disabled={pending||(!form.published&&!hasVisible)} onClick={()=>save(!form.published)}>{form.published?"Despublicar":"Publicar"}</button>)}</div>
   </fieldset>
  </form><p role={failed?"alert":"status"} aria-live="polite" className={failed?"admin-error":""}>{message}</p>
  {record&&access.status==="authorized"&&access.profile.role==="owner"&&<section className="admin-card admin-delete"><h2>Excluir {label}</h2><p>Exclusão definitiva. {category?"Categorias com produtos associados não podem ser excluídas.":"As associações são removidas; os produtos são preservados."}</p><label htmlFor="group-confirm">Digite EXCLUIR para confirmar</label><input id="group-confirm" disabled={pending} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/><button disabled={pending||confirmation!=="EXCLUIR"} onClick={()=>startTransition(async()=>{setFailed(false);try{const r=await deleteGroup(await mutationToken(),kind,record.id,record.updated_at,confirmation);if(!r.ok){setFailed(true);setMessage(r.message);return;}if(r.warning)window.alert(r.warning);router.replace(`/admin/${base}`);}catch{setFailed(true);setMessage("Não foi possível excluir. Confira a conexão.");}})}>Excluir {label}</button></section>}
 </>;
}
function EditorData({kind,id}:{kind:GroupKind;id:string|null}){const {data,error,reload}=useGroups(),[success,setSuccess]=useState("");if(error)return <p role="alert">Não foi possível carregar. <button onClick={reload}>Tentar novamente</button></p>;if(!data)return <p role="status">Carregando…</p>;const r=(kind==="category"?data.categories:data.collections).find(r=>r.id===id);return <><p role="status">{success}</p><GroupForm key={`${id}:${r?.updated_at}`} kind={kind} id={id} data={data} reload={reload} onSuccess={setSuccess}/></>;}
export function AdminGroupEditor({kind,id}:{kind:GroupKind;id:string|null}){return <ProductAccess><EditorData kind={kind} id={id}/></ProductAccess>;}
