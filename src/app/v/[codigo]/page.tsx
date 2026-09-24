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
    title: `Produtos do carrossel #${video.code}`,
    description: video.description,
    path: `/v/${video.code}`,
    image: video.cover ? `/social/carrossel-${video.code}.jpg` : undefined,
    imageAlt: video.title,
  });
}
export const dynamicParams = false;
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
        ← Todos os vídeos
      </Link>
      <div className="page-heading">
        <span className="pill">▶ VÍDEO #{video.code}</span>
        <h1>{video.title}</h1>
        <p>{video.description}</p>
        <small>
          {productsBySlugs(snapshot, video.slugs).length} achadinhos neste vídeo
        </small>
      </div>
      <ProductGrid pageType="content" contentCode={video.code} items={productsBySlugs(snapshot, video.slugs)} />
    </div>
  );
}
