import { getLocalizedCatalog } from "@/lib/localized-catalog";
import { translate, localizedPath, type Language } from "@/lib/i18n";
import { Suspense } from "react";
import { LanguageSwitcher, LanguageChoices } from "./language-switcher";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { gaMeasurementId } from "@/lib/analytics-config";
import { site, pageMetadata } from "@/lib/site";
import "@/app/globals.css";
export function siteMetadata(language: Language): Metadata {
 const t = (text:string) => translate(language,text);
 return {
  ...pageMetadata({
    title: t(site.title),
    description: t(site.description),
    path: localizedPath("/", language), language,
  }),
  metadataBase: site.url,
  applicationName: site.shortName,
  publisher: site.name,
  category: language === "en" ? "Shopping and lifestyle" : "Compras e estilo de vida",
  robots: { index: true, follow: true },
  alternates: undefined,
  title: {
    default: t(site.title),
    template: `%s · ${site.name}`,
  },
  description: t(site.description),
};
}
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
export default async function RootLayout({
  children,
  language = "pt",
}: {
  children: React.ReactNode; language?: Language;
}) {
  const t = (text:string) => translate(language,text);
  const { settings } = await getLocalizedCatalog(language);
  const year = await currentYear();
  return (
    <html lang={language === "en" ? "en-US" : "pt-BR"}>
      <body>
        <a className="skip-link" href="#conteudo">
          {t("Pular para o conteúdo")}{" "}</a>
        <div className="announcement">
          {t("pequenas descobertas, dias mais bonitos")}{" "}<span>✿</span>
        </div>
        <header className="header">
          <Link href={localizedPath("/", language)} className="brand">
            <span className="brand-icon">✿</span>
            <span>
              {settings.name}<small>{settings.tagline}</small>
            </span>
          </Link>
          <nav aria-label={t("Navegação principal")}>
            <Link href={localizedPath("/#catalogo", language)}>{t("Achadinhos")}</Link>
            <Link href={localizedPath("/#videos", language)}>{t("Dos conteúdos")}</Link>
            <Link href={localizedPath("/#colecoes", language)}>{t("Coleções")}</Link>
          </nav>
          <div className="header-tools"><span className="header-note">{t("feito com carinho ♡")}</span><Suspense fallback={<LanguageChoices language={language}/>}><LanguageSwitcher language={language}/></Suspense></div>
        </header>
        <main id="conteudo">{children}</main>
        <footer>
          <div className="footer-top">
            <Link href={localizedPath("/", language)} className="brand">
              {settings.name} <span>✿</span>
            </Link>
            <p>{t("Um detalhe fofo. Uma rotina mais leve.")}</p>
          </div>
          <p>
            {settings.footerText}
          </p>
          <small>© {year} {settings.name}</small>
          <p><Link href={localizedPath("/privacidade", language)}>{t("Política de Privacidade")}</Link></p>
        </footer>
        {gaMeasurementId && <GoogleAnalytics gaId={gaMeasurementId} />}
      </body>
    </html>
  );
}
