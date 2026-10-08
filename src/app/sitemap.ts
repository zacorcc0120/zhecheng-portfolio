import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { site } from "@/data/site";

// See the note in robots.ts — required by the static export build.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // "/lab" is deliberately absent while that section is parked — see the noindex
  // on its page. A route that is not ready for the public must not be advertised
  // here as a finished part of the site.
  const paths = ["", "/work", "/about", ...projects.map((p) => `/work/${p.slug}`)];
  return paths.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
