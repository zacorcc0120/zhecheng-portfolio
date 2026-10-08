import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["terminal.local"],
  // The project plates are fine 1px linework on a light ground, which is the
  // worst case for lossy codecs: at the default q=75 the AVIF pass smears the
  // roof ridges and the timber members. These are re-encoded at q=90.
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
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
