import type { NextConfig } from "next";
const config: NextConfig = {
  cacheComponents: true,
  cacheLife: { catalog: { stale: 30, revalidate: 300, expire: 86400 } },
  images: { unoptimized: true, remotePatterns: [{protocol:"https",hostname:"ijdkjnpfcabivotllngy.supabase.co",port:"",pathname:"/storage/v1/object/public/catalog-media/products/**",search:""},{protocol:"https",hostname:"ijdkjnpfcabivotllngy.supabase.co",port:"",pathname:"/storage/v1/object/public/catalog-media/contents/**",search:""}] },
};
export default config;
