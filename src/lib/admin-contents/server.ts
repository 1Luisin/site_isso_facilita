import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database,Tables } from "../supabase/database.types";
import { MEDIA_BUCKET,validateCoverPair } from "../product-media/paths";
import { rasterDimensions } from "../product-media/process";
import assets from "../public-assets.json";
export async function validCover(client:SupabaseClient<Database>,c:Pick<Tables<"contents">,"id"|"cover_path"|"mobile_cover_path"|"cover_storage_bucket">,verifyBytes=false){
  if(!c.cover_path)return false;
  if(!c.cover_storage_bucket)return assets.includes(c.cover_path) && (!c.mobile_cover_path||assets.includes(c.mobile_cover_path));
  try{validateCoverPair(c.id,c.cover_storage_bucket,c.cover_path,c.mobile_cover_path??"");}catch{return false;}
  for(const [path,w,h] of [[c.cover_path,1080,1350],[c.mobile_cover_path!,540,675]] as const){
    const r=await client.storage.from(MEDIA_BUCKET).info(path);
    if(r.error||r.data.contentType!=="image/webp"||typeof r.data.size!=="number"||r.data.size<=0||r.data.size>6291456)return false;
    if(verifyBytes){const {data,error}=await client.storage.from(MEDIA_BUCKET).download(path);if(error||!data||data.size>6291456)return false;
      try{const d=rasterDimensions(new Uint8Array(await data.arrayBuffer()),"image/webp");if(d.width>w||d.height>h)return false;}catch{return false;}}
  }
  return true;
}
