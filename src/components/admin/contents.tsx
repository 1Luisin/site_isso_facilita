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
  return <><div className="admin-heading"><h1>Conteúdos</h1><Link className="primary-button" href="/admin/conteudos/novo">Novo conteúdo</Link></div>
    <div className="admin-card admin-product-form"><label htmlFor="content-search">Buscar por código ou título</label><input id="content-search" value={search} onChange={e=>setSearch(e.target.value)}/><label htmlFor="content-filter">Publicação</label><select id="content-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="published">Publicados</option><option value="draft">Rascunhos</option></select></div>
    {!items.length&&<p>Nenhum conteúdo encontrado.</p>}
    <div className="admin-content-list">{items.map(c=><article className="admin-card" key={c.id}>
      {c.cover_path&&<Image src={adminCoverUrl(c)} alt={c.title} width={100} height={125} className="admin-content-thumb" unoptimized/>}
      <div><span>#{c.code} · {contentTypeLabel(c.content_type as Parameters<typeof contentTypeLabel>[0])}</span><h2>{c.title}</h2><p>{c.published?"Publicado":"Rascunho"}{c.id===data.featuredId?" · Destaque atual":""}</p><p>{data.memberships.filter(r=>r.content_id===c.id).length} produtos · {data.links.filter(l=>l.content_id===c.id).map(l=>l.platform).join(", ")||"Sem links sociais"}</p><Link href={`/admin/conteudos/${c.id}`}>Editar conteúdo</Link></div>
    </article>)}</div></>;
}
export function AdminContents(){return <ProductAccess><ContentList/></ProductAccess>;}
