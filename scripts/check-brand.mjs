// 把四张真实渲染图里出现产品名的位置放大出来核对。截图里那两个字太小，
// 「迹」和「逝」差一个走之底，缩略图上根本分不出来——而报告里要写清楚这四张图
// 到底需不需要重拍，不能靠印象。
//
// 用法：node scripts/check-brand.mjs <输出目录>
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2] || "shots/brand-check";
mkdirSync(out, { recursive: true });

const FILES = [
  ["ai-assistant", "public/images/projects/jiko/ai-assistant.webp"],
  ["weekly-review", "public/images/projects/jiko/weekly-review.webp"],
  ["theme-system", "public/images/projects/jiko/theme-system.webp"],
  ["appearance-system", "public/images/projects/jiko/appearance-system.webp"],
];

// 每张图里产品名出现的位置不同：一张在导航栏标题，一张在页面内的小标题。
// 这里统一取顶部 22% 并放大 3 倍，导航栏标题与小标题都会落在这块里。
for (const [name, file] of FILES) {
  const img = sharp(file);
  const meta = await img.metadata();
  const w = meta.width;
  const h = Math.round(meta.height * 0.22);
  await sharp(file)
    .extract({ left: 0, top: 0, width: w, height: h })
    .resize({ width: w * 3, kernel: "lanczos3" })
    .png()
    .toFile(join(out, `${name}.png`));
  console.log(`${name}: ${w}x${meta.height} → 顶部 22% 放大 3 倍 = ${w * 3}x${h * 3}`);
}