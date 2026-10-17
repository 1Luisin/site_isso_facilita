import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, site } from "@/lib/site";

const description =
  "Entre no Grupo de achadinhos do Isso Facilita pelo Telegram ou WhatsApp.";

export const metadata: Metadata = {
  title: `Grupo de achadinhos! · ${site.name}`,
  description,
  alternates: { canonical: absoluteUrl("/links") },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    title: `Grupo de achadinhos! · ${site.name}`,
    description,
    url: absoluteUrl("/links"),
    images: [
      {
        url: absoluteUrl(site.socialImage),
        width: 1200,
        height: 630,
        alt: site.name,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Grupo de achadinhos! · ${site.name}`,
    description,
    images: [absoluteUrl(site.socialImage)],
  },
};

function TelegramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M21.6 3.2 18.4 20c-.2 1.2-.9 1.5-1.9.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L5.8 13.8 1 12.3c-1.1-.3-1.1-1 .2-1.5L20 3.6c.9-.3 1.7.2 1.6-.4Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.6 1.4h.1c6.5 0 11.7-5.3 11.7-11.8 0-3.2-1.3-6.1-3.6-8.4Zm-8.2 18.2a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 1 1 8.3 4.6Zm5.4-7.3c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-1-2.5c-.3-.6-.6-.5-.8-.5h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.3 3.4 1.4 3.6c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.2-.3-.4-.4-.7-.5Z" />
    </svg>
  );
}

export default function LinksPage() {
  return (
    <main id="conteudo" className="links-page">
      <div className="links-shell">
        <div className="links-brand" aria-label={site.name}>
          <span className="links-brand-mark" aria-hidden="true">✿</span>
          <span>
            {site.name}
            <small>achadinhos que abraçam a rotina</small>
          </span>
        </div>

        <section className="links-intro" aria-labelledby="links-title">
          <span className="links-eyebrow">OFERTAS, CUPONS E NOVIDADES</span>
          <h1 id="links-title">Grupo de achadinhos!</h1>
          <p>
            Escolha onde você quer receber nossos achados favoritos e ofertas.
          </p>
        </section>

        <div className="links-list" aria-label="Grupos de achadinhos">
          <a
            className="community-link community-link-telegram"
            href="https://t.me/+M-sLqGVWN3pmMGJh"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="community-icon"><TelegramIcon /></span>
            <span className="community-copy">
              <small>ENTRAR PELO</small>
              <strong>Telegram</strong>
            </span>
            <span className="community-arrow" aria-hidden="true">↗</span>
          </a>

          <a
            className="community-link community-link-whatsapp"
            href="https://chat.whatsapp.com/KVVjo9yn2A3AH9Ogotv2iU"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="community-icon"><WhatsAppIcon /></span>
            <span className="community-copy">
              <small>ENTRAR PELO</small>
              <strong>WhatsApp</strong>
            </span>
            <span className="community-arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="links-site-cta">
          <span aria-hidden="true">✦</span>
          <p>Quer ver todos os produtos com calma?</p>
          <Link href="/">Ir para o site <span aria-hidden="true">→</span></Link>
        </div>

        <small className="links-footer">feito com carinho ♡</small>
      </div>
    </main>
  );
}
