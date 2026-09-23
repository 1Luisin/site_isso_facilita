import type { Metadata } from "next";
import Link from "next/link";
import { site, pageMetadata } from "@/lib/site";
import "./globals.css";
export const metadata: Metadata = {
  ...pageMetadata({
    title: site.title,
    description: site.description,
    path: "/",
  }),
  metadataBase: site.url,
  applicationName: site.shortName,
  publisher: site.name,
  category: "Compras e estilo de vida",
  robots: { index: true, follow: true },
  alternates: undefined,
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={site.language}>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <div className="announcement">
          pequenas descobertas, dias mais bonitos <span>✿</span>
        </div>
        <header className="header">
          <Link href="/" className="brand">
            <span className="brand-icon">✿</span>
            <span>
              Isso Facilita!<small>achadinhos que abraçam a rotina</small>
            </span>
          </Link>
          <nav aria-label="Navegação principal">
            <Link href="/#catalogo">Achadinhos</Link>
            <Link href="/#videos">Dos vídeos</Link>
            <Link href="/#colecoes">Coleções</Link>
          </nav>
          <span className="header-note">feito com carinho ♡</span>
        </header>
        <main id="conteudo">{children}</main>
        <footer>
          <div className="footer-top">
            <Link href="/" className="brand">
              Isso Facilita! <span>✿</span>
            </Link>
            <p>Um detalhe fofo. Uma rotina mais leve.</p>
          </div>
          <p>
            Alguns links podem ser de afiliado e podemos receber comissão pela
            compra, sem custo adicional para você.
          </p>
          <small>© {new Date().getFullYear()} Isso Facilita!</small>
        </footer>
      </body>
    </html>
  );
}
