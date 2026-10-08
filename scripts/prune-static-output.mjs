// Slims the static export artifact, not the repository.
//
// `next build` with `output: "export"` copies all of public/ verbatim, which
// drags in plates no page references — 03-hierarchy.png alone is 14 MB. Those
// still belong in the repo (they are source material), they just should not be
// uploaded on every deploy.
//
// Rule: inside out/, drop any image that is large AND appears in no exported
// HTML. The threshold keeps ordinary small files even if some future route
// references them from a stylesheet rather than markup.
//
// This only ever touches out/. public/ is never modified.

import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { join, relative } from "node:path";

const OUT = process.argv[2] ?? "out";
const THRESHOLD_BYTES = 512 * 1024;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const all = await walk(OUT);
const html = all.filter((f) => f.endsWith(".html"));
const images = all.filter((f) => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(f));

if (html.length === 0) {
  console.error(`No HTML found under ${OUT} — refusing to prune.`);
  process.exit(1);
}

// Every referenced path, normalised to sit under out/ regardless of basePath.
const referenced = new Set();
for (const file of html) {
  const text = await readFile(file, "utf8");
  for (const m of text.matchAll(/(?:src|href|srcset|content)="([^"]+)"/g)) {
    const raw = m[1].split(/[?#]/)[0];
    const withoutBase = raw.replace(/^https?:\/\/[^/]+/, "").replace(/^\/[^/]*?(?=\/images\/)/, "");
    if (withoutBase.startsWith("/")) referenced.add(withoutBase.slice(1));
  }
}

let freed = 0;
const removed = [];
for (const file of images) {
  const { size } = await stat(file);
  if (size < THRESHOLD_BYTES) continue;
  const key = relative(OUT, file).split("\\").join("/");
  if (referenced.has(key)) continue;
  await unlink(file);
  freed += size;
  removed.push(`${(size / 1024 / 1024).toFixed(1)} MB  ${key}`);
}

if (removed.length === 0) {
  console.log("Nothing to prune — every large image is referenced.");
} else {
  console.log(`Pruned ${removed.length} unreferenced image(s), freed ${(freed / 1024 / 1024).toFixed(1)} MB:`);
  for (const line of removed.sort()) console.log(`  ${line}`);
}