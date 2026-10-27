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
    // The Pages build runs with trailingSlash: true, so the served URL of a
    // route is its directory form. Listing the bare path here would point
    // crawlers at a URL that only exists after a redirect.
    url: `${site.url}${path}${path === "" ? "" : "/"}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
