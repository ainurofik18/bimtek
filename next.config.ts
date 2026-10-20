import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Foto selfie dikirim lewat Server Action (sudah dikompres di browser, ±100–300 KB)
      bodySizeLimit: "4mb",
      allowedOrigins: ["bimtek.elkpd.id"],
    },
  },
};

export default nextConfig;
