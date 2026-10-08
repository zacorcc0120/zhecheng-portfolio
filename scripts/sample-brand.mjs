// 从 RecoveryX 真实产品渲染图里采样品牌色，避免凭空另造一套青柠绿。
// 用法：node scripts/sample-brand.mjs
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const dir = resolve("public/images/projects/recoveryx");
const files = ["recovery-center.webp", "feature-overview.webp", "assessment-result.webp"];

// 把图缩到很小再统计：产品界面是大片深色 + 少量高饱和按钮色，
// 高饱和像素会被背景淹没，所以按饱和度筛而不是按出现频次。
for (const f of files) {
  const path = join(dir, f);
  let buf;
  try { buf = readFileSync(path); } catch { console.log(`${f}: 读不到`); continue; }

  const { data, info } = await sharp(buf)
    .resize(160, 160, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const light = (max + min) / 2;
    const sat = max === min ? 0 : (max - min) / (255 - Math.abs(2 * light - 255) || 1);
    // 只要亮且饱和的像素：按钮、进度环、选中态
    if (sat < 0.35 || light < 120 || light > 235) continue;
    // 量化到 8 的网格，容忍压缩噪声
    const key = `${r >> 3},${g >> 3},${b >> 3}`;
    const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    cur.n++; cur.r += r; cur.g += g; cur.b += b;
    buckets.set(key, cur);
  }

  const top = [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((c) => {
      const hex = (n) => Math.round(n / c.n).toString(16).padStart(2, "0");
      return `#${hex(c.r)}${hex(c.g)}${hex(c.b)} ×${c.n}`;
    });
  console.log(`${f} (${info.width}×${info.height}) 高饱和亮色 top: ${top.join("  ") || "无"}`);
}