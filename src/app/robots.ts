import type { MetadataRoute } from "next";
import { site } from "@/data/site";

// The static GitHub Pages build has no server to render this on demand. It is
// already prerendered on Vercel, so this only states what was already true.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
