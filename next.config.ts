import type { NextConfig } from "next";
const config: NextConfig = {
  cacheComponents: true,
  cacheLife: { catalog: { stale: 30, revalidate: 300, expire: 86400 } },
  images: { unoptimized: true },
};
export default config;
