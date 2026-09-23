import { notFound } from "next/navigation";
import Link from "next/link";
import { publishedVideos, videoProducts } from "@/lib/data";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const video = publishedVideos.find((video) => video.code === codigo);
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
export const generateStaticParams = () =>
  publishedVideos.map((v) => ({ codigo: v.code }));
export default async function VideoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const video = publishedVideos.find((v) => v.code === codigo);
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
          {videoProducts(video.slugs).length} achadinhos neste vídeo
        </small>
      </div>
      <ProductGrid items={videoProducts(video.slugs)} />
    </div>
  );
}
