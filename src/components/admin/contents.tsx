"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductAccess } from "./navigation";
import { useContents } from "./use-contents";
import { adminCoverUrl } from "@/lib/admin-contents/browser";
import { contentTypeLabel } from "@/lib/content-types";
function ContentList(){
  const {data,error,reload}=useContents();const [search,setSearch]=useState(""),[filter,setFilter]=useState("all");
  if(error)return <p role="alert">Não foi possível carregar os conteúdos. <button onClick={reload}>Tentar novamente</button></p>;
  if(!data)return <p role="status">Carregando conteúdos…</p>;
  const items=data.contents.filter(c=>(`${c.code} ${c.title}`).toLocaleLowerCase().includes(search.toLocaleLowerCase())&&(filter==="all"||c.published===(filter==="published")));
  return <div className="admin-groups admin-contents"><div className="admin-heading"><h1>Conteúdos</h1><Link className="primary-button" href="/admin/conteudos/novo">Novo conteúdo</Link></div>
    <div className="admin-card admin-product-form admin-content-filters"><div><label htmlFor="content-search">Buscar por código ou título</label><input id="content-search" placeholder="Encontre um conteúdo…" value={search} onChange={e=>setSearch(e.target.value)}/></div><fieldset className="admin-filter-options"><legend>Publicação</legend><div>{([["all","Todos"],["published","Publicados"],["draft","Rascunhos"]] as const).map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div></fieldset></div>
    <p className="admin-list-count" aria-live="polite">{items.length} {items.length===1?"conteúdo":"conteúdos"}</p>
    {!items.length&&<p>Nenhum conteúdo encontrado.</p>}
    <div className="admin-content-list">{items.map(c=><article className="admin-card admin-content-card" key={c.id}>
      {c.cover_path&&<Image src={adminCoverUrl(c)} alt={c.title} width={100} height={125} className="admin-content-thumb" unoptimized/>}
      <div><span>#{c.code} · {contentTypeLabel(c.content_type as Parameters<typeof contentTypeLabel>[0])}</span><h2>{c.title}</h2><p><span className={`admin-status ${c.published?"is-live":""}`}>{c.published?"Publicado":"Rascunho"}</span>{c.id===data.featuredId?" · Destaque atual":""}</p><p>{data.memberships.filter(r=>r.content_id===c.id).length} produtos · {data.links.filter(l=>l.content_id===c.id).map(l=>l.platform).join(", ")||"Sem links sociais"}</p><Link className="admin-edit-link" href={`/admin/conteudos/${c.id}`}>Editar conteúdo <span aria-hidden="true">↗</span></Link></div>
    </article>)}</div></div>;
}
export function AdminContents(){return <ProductAccess><ContentList/></ProductAccess>;}
