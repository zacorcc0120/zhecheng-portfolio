import type { ImageLoaderProps } from "next/image";

/**
 * Image loader for the static GitHub Pages build.
 *
 * `next/image` cannot run its optimiser on a static host — there is no server
 * behind `github.io` to do the AVIF/WebP pass. The usual escape is
 * `images.unoptimized`, which serves the original bytes; that would put a 17 MB
 * set of drum-tower PNGs in front of every visitor on a network that is already
 * slow. Instead this loader points each of those plates at a `.webp` sibling
 * generated from the same PNG at identical pixel dimensions, so the static
 * build ships the same picture at ~0.33 MB.
 *
 * Only the paths listed here are rewritten. Anything else falls through
 * untouched, so adding a plate without a webp sibling still renders — it just
 * serves the original file.
 *
 * The Vercel build never loads this file; there the default optimiser runs and
 * does a better job than any pre-baked sibling.
 */
const WEBP_TWINS = new Set([
  "/images/projects/drum-tower/cover-hero.png",
  "/images/projects/drum-tower/parameters.png",
  "/images/projects/drum-tower/grasshopper-system.png",
  "/images/projects/drum-tower/square-model.png",
  "/images/projects/drum-tower/octagonal-model.png",
  "/images/projects/drum-tower/primary-columns.png",
  "/images/projects/drum-tower/horizontal-frame.png",
  "/images/projects/drum-tower/vertical-frame.png",
  "/images/projects/drum-tower/exploded-structure.png",
  "/images/projects/drum-tower/render-octagonal.png",
]);

export default function staticImageLoader({ src }: ImageLoaderProps): string {
  // GitHub Pages serves this repo from a sub-path, so a root-absolute URL would
  // 404. Next hands the loader the un-prefixed src, so the prefix goes back on
  // here.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!src.startsWith("/")) return src;
  if (!WEBP_TWINS.has(src)) return `${basePath}${src}`;
  return `${basePath}${src.replace(/\.png$/, ".webp")}`;
}