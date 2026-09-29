import { contentTypeLabel } from "@/lib/content-types";
import { socialImage } from "@/lib/social-image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCatalogSnapshot } from "@/lib/data-source";
import { productsBySlugs } from "@/lib/data-source/types";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const snapshot = await getPublicCatalogSnapshot();
  const { contents } = snapshot;
  const { codigo } = await params;
  const video = contents.find((video) => video.code === codigo);
  if (!video) notFound();
  return pageMetadata({
    title: `Produtos do ${contentTypeLabel(video.contentType)} #${video.code}`,
    description: video.description,
    path: `/v/${video.code}`,
    image: socialImage(`/social/carrossel-${video.code}.jpg`),
    imageAlt: video.title,
  });
}
export async function generateStaticParams() {
  const { contents } = await getPublicCatalogSnapshot();
  return contents.map(item => ({ codigo: item.code }));
}
export default async function VideoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const snapshot = await getPublicCatalogSnapshot();
  const { contents } = snapshot;
  const { codigo } = await params;
  const video = contents.find((v) => v.code === codigo);
  if (!video) notFound();
  return (
    <div className="page-wrap">
      <Link className="back-link" href="/#videos">
        ← Todas as publicações
      </Link>
      <div className="page-heading">
        <span className="pill">▶ {contentTypeLabel(video.contentType)} #{video.code}</span>
        <h1>{video.title}</h1>
        <p>{video.description}</p>
        <small>
          {productsBySlugs(snapshot, video.slugs).length} achadinhos neste {contentTypeLabel(video.contentType)}
        </small>
      </div>
      <div className="video-social-links">{Object.entries(video.links).map(([platform,url])=><a key={platform} href={url} target="_blank" rel="noopener noreferrer">Ver no {({instagram:"Instagram",tiktok:"TikTok",youtube:"YouTube"} as Record<string,string>)[platform]??platform} ↗</a>)}</div>
      <ProductGrid pageType="content" contentCode={video.code} items={productsBySlugs(snapshot, video.slugs)} />
    </div>
  );
}
