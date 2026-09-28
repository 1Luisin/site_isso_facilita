import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../supabase/database.types";
import { MEDIA_BUCKET, validateMediaPair } from "./paths";
import assets from "../public-assets.json";
import { rasterDimensions } from "./process";
type ImageRow = {product_id:string;storage_bucket:string|null;storage_path:string;mobile_storage_path:string|null};
export async function validStoredImage(client: SupabaseClient<Database>, image: ImageRow, verifyBytes=false) {
  if (!image.storage_bucket) return assets.includes(image.storage_path) && (!image.mobile_storage_path || assets.includes(image.mobile_storage_path));
  try { validateMediaPair(image.product_id,image.storage_bucket,image.storage_path,image.mobile_storage_path ?? ""); }
  catch { return false; }
  const results = await Promise.all([image.storage_path,image.mobile_storage_path!].map(path=>client.storage.from(MEDIA_BUCKET).info(path)));
  if(!results.every(r=>!r.error && r.data?.contentType==="image/webp" && typeof r.data.size==="number" && r.data.size>0 && r.data.size<=6291456))return false;
  if(verifyBytes){
    // Inspect uploaded raster bytes too, not only the browser's declared MIME.
    for(const [path,limit] of [[image.storage_path,900],[image.mobile_storage_path!,480]] as const){
      const {data,error}=await client.storage.from(MEDIA_BUCKET).download(path);
      if(error || !data || data.size>6291456)return false;
      try{const dimensions=rasterDimensions(new Uint8Array(await data.arrayBuffer()),"image/webp");if(dimensions.width>limit || dimensions.height>limit)return false;}
      catch{return false;}
    }
  }
  return true;
}
export async function cleanPreviousImage(client: SupabaseClient<Database>, previous: Json, keep: string[] = []) {
  if(!previous || typeof previous!=="object" || Array.isArray(previous) || previous.bucket!==MEDIA_BUCKET) return undefined;
  const paths=[previous.main,previous.mobile].filter((p):p is string=>typeof p==="string" && !keep.includes(p));
  if(!paths.length)return undefined;
  try {
    const {data,error}=await client.storage.from(MEDIA_BUCKET).remove(paths);
    if(error || data?.length!==paths.length)return "Alteração salva. Não foi possível confirmar a limpeza dos arquivos antigos.";
  } catch {return "Alteração salva. Não foi possível confirmar a limpeza dos arquivos antigos.";}
}
