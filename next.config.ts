import type { NextConfig } from "next";

// The GitHub Pages build is a second, independent deployment target of this same
// repository. It is switched on by NEXT_OUTPUT_EXPORT=1 alone, so the Vercel
// build below stays byte-for-byte what it was before Pages existed: same server
// output, same image optimiser, no base path.
const isPages = process.env.NEXT_OUTPUT_EXPORT === "1";

const nextConfig: NextConfig = {
  // Static hosts get a directory per route; this is what makes `/work` resolve
  // as a directory instead of relying on Pages' extension-less fallback.
  ...(isPages ? { output: "export" as const, trailingSlash: true } : {}),
  // GitHub Pages serves this repo at /zhecheng-portfolio while it uses the
  // default *.github.io host. Once the repo owns zhecheng-portfolio.site the
  // site moves to the root and this must be empty, so it comes from the
  // environment rather than being baked in.
  ...(isPages && process.env.NEXT_PUBLIC_BASE_PATH
    ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["terminal.local"],
  images: isPages
    ? {
        // See src/lib/image-loader.ts — pre-baked webp siblings instead of a
        // runtime optimiser that a static host cannot run.
        loader: "custom",
        loaderFile: "./src/lib/image-loader.ts",
      }
    : {
        formats: ["image/avif", "image/webp"],
        qualities: [75, 90],
        // The project plates are fine 1px linework on a light ground, which is the
        // worst case for lossy codecs: at the default q=75 the AVIF pass smears the
        // roof ridges and the timber members. These are re-encoded at q=90.
        // Next's default is 4 hours, which is fine in steady state but means a
        // swapped plate keeps serving stale bytes from the browser cache for that
        // long. A minute keeps the art self-healing; the whole vernacular set is
        // ~1.5 MB of already-optimized AVIF, so the revalidation is cheap.
        minimumCacheTTL: 60,
        // Next caps the generated srcset at 3840w by default. The vernacular plates
        // are delivered at native source resolution (up to 7680w), and a 4K display
        // at 2x asks for ~7360 device pixels across the full-bleed cover — without
        // these the optimizer would downscale-then-upscale it back.
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840, 5120, 7680],
      },
};
export default nextConfig;