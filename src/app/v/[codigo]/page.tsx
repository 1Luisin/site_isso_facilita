import { notFound } from "next/navigation";
import Link from "next/link";
import { videos, videoProducts } from "@/lib/data";
import { ProductGrid } from "@/components/catalog";
export const dynamicParams = false;
export const generateStaticParams = () =>
  videos.map((v) => ({ codigo: v.code }));
export default async function VideoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const video = videos.find((v) => v.code === codigo);
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
          {video.slugs.length} achadinhos neste vídeo · seleção demonstrativa
        </small>
      </div>
      <ProductGrid items={videoProducts(video.slugs)} />
    </div>
  );
}
