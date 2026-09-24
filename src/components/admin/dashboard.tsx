"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useAdminAuth } from "./auth-provider";
import { AccessState } from "./access-state";
type Counts = { products: number; publishedProducts: number; contents: number; publishedContents: number; collections: number; publishedCollections: number; categories: number };
function DashboardData() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const results = await Promise.all([
          client.from("products").select("id", { head: true, count: "exact" }).abortSignal(controller.signal),
          client.from("products").select("id", { head: true, count: "exact" }).eq("published", true).abortSignal(controller.signal),
          client.from("contents").select("id", { head: true, count: "exact" }).abortSignal(controller.signal),
          client.from("contents").select("id", { head: true, count: "exact" }).eq("published", true).abortSignal(controller.signal),
          client.from("collections").select("id", { head: true, count: "exact" }).abortSignal(controller.signal),
          client.from("collections").select("id", { head: true, count: "exact" }).eq("published", true).abortSignal(controller.signal),
          client.from("categories").select("id", { head: true, count: "exact" }).abortSignal(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (results.some(r => r.error || r.count === null)) throw new Error("Contagens indisponíveis");
        const [products, publishedProducts, contents, publishedContents, collections, publishedCollections, categories] = results.map(r => r.count!);
        setCounts({ products, publishedProducts, contents, publishedContents, collections, publishedCollections, categories });
      } catch { if (!controller.signal.aborted) setFailed(true); }
    })();
    return () => controller.abort();
  }, [attempt]);
  if (failed) return <div role="alert" className="admin-card"><p>Não foi possível carregar o resumo.</p><button className="text-button" onClick={() => { setFailed(false); setCounts(null); setAttempt(a => a + 1); }}>Tentar novamente</button></div>;
  if (!counts) return <p role="status">Carregando o resumo da sua curadoria…</p>;
  const cards = [
    { title: "Produtos", total: counts.products, published: counts.publishedProducts },
    { title: "Conteúdos", total: counts.contents, published: counts.publishedContents },
    { title: "Coleções", total: counts.collections, published: counts.publishedCollections },
    { title: "Categorias", total: counts.categories },
  ];
  return <div className="admin-stats">{cards.map(c => <article key={c.title} className="admin-card">
    <h2>{c.title}</h2><strong>{c.total}</strong>
    {c.published !== undefined && <p>{c.published} publicados · {c.total - c.published} rascunhos</p>}
  </article>)}</div>;
}
export function AdminDashboard() {
  const { access, signOut } = useAdminAuth();
  const router = useRouter();
  useEffect(() => { if (access.status === "anonymous") router.replace("/admin/login"); }, [access.status, router]);
  if (access.status !== "authorized") return <AccessState />;
  return <section>
    <div className="admin-heading"><div><span className="eyebrow">SEU CANTINHO DE CURADORIA</span><h1>Olá, {access.profile.display_name || "Administrador"} ♡</h1><p>Seu acesso: <strong>{access.profile.role}</strong></p></div><button className="primary-button" onClick={() => void signOut()}>Sair</button></div>
    <nav className="admin-nav" aria-label="Navegação administrativa">
      <span aria-current="page">Dashboard</span>
      {["Produtos", "Conteúdos", "Coleções", "Categorias"].map(label => <button key={label} disabled>{label}<small>em breve</small></button>)}
    </nav>
    <DashboardData />
    <aside className="admin-card admin-note"><h2>Um passo de cada vez ✿</h2><p>Este é o resumo real da sua curadoria. A edição de produtos, conteúdos, coleções e categorias será adicionada na próxima etapa.</p></aside>
  </section>;
}
