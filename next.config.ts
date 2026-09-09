import type { NextConfig } from "next";

/**
 * One knob decides where this build is going.
 *
 *   unset                        -> ""       root deploy: `npm run dev`, Vercel, Netlify
 *   NEXT_PUBLIC_BASE_PATH=/X     -> "/X"     subpath deploy: GitHub Pages project site
 *
 * Next validates basePath: it must be "" or start with "/", must not be exactly "/",
 * and must not end with "/". The normalization below makes a stray trailing slash
 * from CI harmless.
 *
 * assetPrefix is deliberately NOT set. When assetPrefix is empty and basePath is not,
 * Next copies basePath into assetPrefix itself, so /_next/* already emits as /X/_next/*.
 * Setting it to a different origin would break the offline service worker, which can
 * only cache and serve same-origin requests it controls.
 *
 * The NEXT_PUBLIC_ prefix matters: it inlines the value into the client bundle, so the
 * service worker registration in src/components/ServiceWorkerRegistrar.tsx and the
 * metadata hrefs in src/app/layout.tsx read the same value this config used.
 */
const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = RAW_BASE_PATH === "/" ? "" : RAW_BASE_PATH.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
};

export default nextConfig;
