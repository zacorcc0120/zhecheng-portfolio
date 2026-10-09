/**
 * Re-encode the drum-tower webp twins from their source PNGs.
 *
 * These siblings exist so the static Pages build does not have to ship 17 MB of
 * PNG (see src/lib/image-loader.ts). The first pass hit quality 20-ish and
 * produced ~18 KB files for photographic plates — visibly mushy roof tiles and
 * smeared window lattice, which is worse than a large file. This regenerates
 * them at a quality that is visually indistinguishable from the PNG at 1:1
 * while still cutting roughly an order of magnitude off the bytes.
 *
 * Run: node scripts/encode-drum-webp.mjs
 * Pixel dimensions are asserted against the source so a renamed or resized
 * plate can never silently ship a mis-sized twin.
 */
import sharp from "sharp";
import { statSync, readdirSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

const DIR = resolve("public/images/projects/drum-tower");
const QUALITY = 88;

const pairs = readdirSync(DIR)
  .filter((f) => extname(f).toLowerCase() === ".png")
  .map((f) => ({
    png: resolve(DIR, f),
    webp: resolve(DIR, `${basename(f, ".png")}.webp`),
  }))
  // Only re-encode where a twin already exists; the loader points at specific
  // names and an untouched plate should stay untouched.
  .filter(({ webp }) => {
    try {
      statSync(webp);
      return true;
    } catch {
      return false;
    }
  });

let before = 0;
let after = 0;

for (const { png, webp } of pairs) {
  const srcMeta = await sharp(png).metadata();
  const buf = await sharp(png, { sequentialRead: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();

  const outMeta = await sharp(buf).metadata();
  if (outMeta.width !== srcMeta.width || outMeta.height !== srcMeta.height) {
    throw new Error(
      `${basename(png)}: size drift ${outMeta.width}x${outMeta.height} != ${srcMeta.width}x${srcMeta.height}`,
    );
  }

  const prev = statSync(webp).size;
  before += prev;
  after += buf.length;

  const kb = (n) => `${(n / 1024).toFixed(0).padStart(5)} KB`;
  console.log(
    `${basename(png).padEnd(28)} ${srcMeta.width}x${srcMeta.height}  ` +
      `${kb(prev)} -> ${kb(buf.length)}   (png ${(statSync(png).size / 1024 / 1024).toFixed(1)} MB)`,
  );

  const { writeFileSync } = await import("node:fs");
  writeFileSync(webp, buf);
}

console.log(
  `\n${pairs.length} file(s), q=${QUALITY}: ` +
    `${(before / 1024 / 1024).toFixed(2)} MB -> ${(after / 1024 / 1024).toFixed(2)} MB`,
);