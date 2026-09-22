import Link from "next/link";
import type { Metadata } from "next";
import { products, videos, categories, money } from "@/lib/data";
export const metadata: Metadata = {
  title: "Painel demonstrativo",
  robots: { index: false, follow: false },
};
export default function Admin() {
  return (
    <div className="page-wrap admin">
      <Link className="back-link" href="/">
        ← Voltar ao catálogo
      </Link>
      <div className="section-heading">
        <div>
          <span className="eyebrow">ISSO FACILITA! / GERENCIAMENTO</span>
          <h1>Seu cantinho de gestão</h1>
        </div>
        <span className="pill">Demonstração</span>
      </div>
      <p className="admin-notice">
        Painel público e estático, sem autenticação. Produtos, vídeos e cliques
        são dados fictícios; nenhuma alteração é salva ou atividade rastreada.
      </p>
      <div className="stats">
        <div>
          <span>Produtos no catálogo</span>
          <strong>{products.length}</strong>
          <small>dados de demonstração</small>
        </div>
        <div>
          <span>Vídeos cadastrados</span>
          <strong>{videos.length}</strong>
          <small>seleções de exemplo</small>
        </div>
        <div>
          <span>Cliques simulados</span>
          <strong>128</strong>
          <small>sem coleta de dados reais</small>
        </div>
      </div>
      <section className="admin-panel">
        <h2>
          Produtos <span className="muted">({products.length})</span>
        </h2>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Produtos demonstrativos do catálogo
            </caption>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>A partir de</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.slug}>
                  <td>
                    {p.published ? (
                      <Link href={"/produto/" + p.slug}>{p.name} ↗</Link>
                    ) : (
                      <span>{p.name} · Rascunho</span>
                    )}
                  </td>
                  <td>{categories.find((c) => c.slug === p.category)?.name}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span className="status">
                      {p.affiliateUrl === "https://shopee.com.br/"
                        ? "Placeholder"
                        : "Afiliado cadastrado"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel">
        <h2>Vídeos</h2>
        <div className="video-list">
          {videos
            .filter((v) => v.published)
            .map((v) => (
              <Link key={v.code} href={"/v/" + v.code}>
                <span className="video-code">#{v.code}</span>
                <h3>{v.title}</h3>
                <p>{v.slugs.length} produtos ↗</p>
              </Link>
            ))}
        </div>
      </section>
      <section className="admin-panel">
        <h2>
          Cliques por origem <small className="muted">· simulação</small>
        </h2>
        {[
          ["Instagram", 76],
          ["TikTok", 42],
          ["Direto", 10],
        ].map(([name, value]) => (
          <div className="click-row" key={name}>
            <span>{name}</span>
            <meter min="0" max="128" value={value} />
            <strong>{value}</strong>
          </div>
        ))}
      </section>
    </div>
  );
}
