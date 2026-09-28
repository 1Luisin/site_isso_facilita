"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ProductAccess } from "./navigation";
import { useProducts } from "./use-products";
import { adminImageUrl } from "@/lib/admin-products/browser";
function ProductList() {
  const {data,error,reload}=useProducts();
  const [query,setQuery]=useState(""),[filter,setFilter]=useState("all");
  if(error)return <div role="alert"><p>Não foi possível carregar os produtos.</p><button onClick={reload}>Tentar novamente</button></div>;
  if(!data)return <p role="status">Carregando produtos…</p>;
  const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const products=data.products.filter(p=>normalize(p.name+" "+p.slug).includes(normalize(query)) && (filter==="all" || p.published===(filter==="published")));
  return <><div className="admin-heading"><h1>Produtos</h1><Link className="primary-button" href="/admin/produtos/novo">Novo produto</Link></div>
    <div className="admin-product-filters"><label>Buscar por nome ou slug<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Publicação<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="published">Publicados</option><option value="draft">Rascunhos</option></select></label></div>
    <p role="status">{products.length} produtos encontrados</p><div className="admin-product-list">{products.map(p=>{
      const image=data.images.find(i=>i.product_id===p.id);
      return <article className="admin-card admin-product-row" key={p.id}>
        {image ? <Image src={adminImageUrl(image)} alt={image.alt_text || p.name} width={72} height={72} unoptimized/> : <span>Sem imagem</span>}
        <div><h2>{p.name}</h2><p>{p.slug}</p><p>{data.categories.find(c=>c.id===p.category_id)?.name} · {p.published?"Publicado":"Rascunho"}</p><small>{data.links.some(l=>l.product_id===p.id)?"Link afiliado configurado":"Sem link afiliado"}</small></div>
        <Link className="text-button" href={`/admin/produtos/${p.id}`} aria-label={`Editar ${p.name}`}>Editar</Link></article>;
    })}</div></>;
}
export function AdminProducts(){return <ProductAccess><ProductList/></ProductAccess>;}
