import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // AVIF primeiro (mais nitidez por byte), WebP de fallback. Fotos usam quality={88}.
    formats: ["image/avif", "image/webp"],
    qualities: [75, 88],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
