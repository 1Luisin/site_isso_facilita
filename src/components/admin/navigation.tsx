"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAdminAuth } from "./auth-provider";
import { AccessState } from "./access-state";
export function AdminNav() {
  const path=usePathname();
  return <nav className="admin-nav" aria-label="Navegação administrativa">
    <Link href="/admin" aria-current={path==="/admin"?"page":undefined}>Dashboard</Link>
    <Link href="/admin/produtos" aria-current={path.startsWith("/admin/produtos")?"page":undefined}>Produtos</Link>
    {["Conteúdos","Coleções","Categorias"].map(label=><button key={label} disabled>{label}<small>em breve</small></button>)}
  </nav>;
}
export function ProductAccess({children}:{children:ReactNode}) {
  const {access,signOut}=useAdminAuth();
  const router=useRouter();
  useEffect(()=>{if(access.status==="anonymous")router.replace("/admin/login");},[access.status,router]);
  if(access.status!=="authorized")return <AccessState/>;
  return <section><div className="admin-heading"><p>Seu acesso: <strong>{access.profile.role}</strong></p><button className="text-button" onClick={()=>void signOut()}>Sair</button></div><AdminNav/>{children}</section>;
}
