import { getPublicCatalogSnapshot } from "@/lib/data-source";
import type { Metadata } from "next";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { gaMeasurementId } from "@/lib/analytics-config";
import { site, pageMetadata } from "@/lib/site";
import "./globals.css";
// Read fresh catalog data at build time without opting into runtime rendering.
export const dynamic = "force-static";
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
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = await getPublicCatalogSnapshot();
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
              {settings.name}<small>{settings.tagline}</small>
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
              {settings.name} <span>✿</span>
            </Link>
            <p>Um detalhe fofo. Uma rotina mais leve.</p>
          </div>
          <p>
            {settings.footerText}
          </p>
          <small>© {new Date().getFullYear()} {settings.name}</small>
          <p><Link href="/privacidade">Política de Privacidade</Link></p>
        </footer>
        {gaMeasurementId && <GoogleAnalytics gaId={gaMeasurementId} />}
      </body>
    </html>
  );
}
