"use client";
import Link from "next/link";
import {useState,useTransition} from "react";
import {ProductAccess} from "./navigation";
import {useGroups} from "./use-groups";
import {collectionStyles,type GroupKind} from "@/lib/admin-groups/validation";
import {mutationToken} from "@/lib/admin-products/browser";
import {reorderGroups} from "@/app/admin/grupos-actions";
function GroupList({kind}:{kind:GroupKind}){
 const {data,error,reload}=useGroups(),[search,setSearch]=useState(""),[filter,setFilter]=useState("all"),[pending,startTransition]=useTransition(),[message,setMessage]=useState("");
 const category=kind==="category",base=category?"categorias":"colecoes";
 if(error)return <p role="alert">Não foi possível carregar. <button onClick={reload}>Tentar novamente</button></p>;
 if(!data)return <p role="status">Carregando…</p>;
 const all=category?data.categories:data.collections;
 const status=(item:typeof all[number])=>"active" in item?item.active:item.published;
 const items=all.filter(r=>`${r.name} ${r.slug}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())&&(filter==="all"||status(r)===(filter==="yes")));
 const move=(index:number,delta:number)=>startTransition(async()=>{
  setMessage("");try{const ordered=[...all];[ordered[index],ordered[index+delta]]=[ordered[index+delta],ordered[index]];
   const result=await reorderGroups(await mutationToken(),kind,ordered.map(r=>({id:r.id,updated_at:r.updated_at})));
   if(!result.ok){setMessage(result.message);return;}setMessage(result.warning??"Ordem salva.");reload();
  }catch{setMessage("Não foi possível reordenar. Confira sua sessão e conexão.");}
 });
 return <div className="admin-groups"><div className="admin-heading"><h1>{category?"Categorias":"Coleções"}</h1><Link className="primary-button" href={`/admin/${base}/novo`}>{category?"Nova categoria":"Nova coleção"}</Link></div>
  <div className="admin-card admin-product-form admin-group-filters"><div><label htmlFor="group-search">Buscar por nome ou slug</label><input id="group-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Digite um nome ou slug…"/></div><div><label htmlFor="group-filter">Estado</label><select id="group-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas</option><option value="yes">{category?"Ativas":"Publicadas"}</option><option value="no">{category?"Inativas":"Rascunhos"}</option></select></div><p>Use as setas para organizar a ordem no site. A reordenação fica disponível sem filtros.</p></div>
  <p aria-live="polite" className="admin-group-feedback">{message}</p><p className="admin-list-count">{items.length} {category?"categorias":"coleções"}</p><div className="admin-content-list">{items.map(r=>{
   const products=category?data.products.filter(p=>p.category_id===r.id):data.products.filter(p=>data.memberships.some(m=>m.collection_id===r.id&&m.product_id===p.id));const index=all.findIndex(x=>x.id===r.id);
   return <article className="admin-card admin-group-card" key={r.id}>
    <span className={`admin-group-symbol ${"style_index" in r?`admin-style-${r.style_index??0}`:""}`} aria-hidden="true">{"symbol" in r?r.symbol||"✧":["♡","☼","✧","✿"][r.style_index??0]}</span>
    <div className="admin-group-info"><div className="admin-group-title"><h2>{r.name}</h2><span className={`admin-status ${status(r)?"is-live":""}`}>{category?(status(r)?"Ativa":"Inativa"):(status(r)?"Publicada":"Rascunho")}</span></div>
     <p className="admin-group-slug">/{r.slug}</p>
     <div className="admin-group-details"><span><strong>{products.length}</strong> produtos</span><span><strong>{products.filter(p=>p.published).length}</strong> publicados</span><span>Ordem {r.sort_order}</span></div>
     {"style_index" in r&&<p className="admin-group-caption">{collectionStyles[r.style_index??0]}{r.published_at&&` · Publicada em ${new Date(r.published_at).toLocaleDateString("pt-BR")}`}</p>}
    </div>
    <div className="admin-group-controls"><div className="admin-reorder"><button disabled={pending||!!search||filter!=="all"||index===0} aria-label={`Subir ${r.name}`} onClick={()=>move(index,-1)}>↑</button><button disabled={pending||!!search||filter!=="all"||index===all.length-1} aria-label={`Descer ${r.name}`} onClick={()=>move(index,1)}>↓</button></div><Link className="admin-edit-link" href={`/admin/${base}/${r.id}`}>Editar <span aria-hidden="true">↗</span></Link></div>
   </article>;
  })}</div>{!items.length&&<p className="admin-card">Nenhum registro encontrado. Tente outro nome ou ajuste o filtro.</p>}</div>;
}
export function AdminGroups({kind}:{kind:GroupKind}){return <ProductAccess><GroupList kind={kind}/></ProductAccess>;}
