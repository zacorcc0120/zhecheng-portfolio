// 找出"组件在用、但 CSS 里没有对应规则"的选择器。
// 手改大样式表时最容易丢的就是这个：删掉一段、选择器被吃掉，
// 页面不报错也不警告，只是那块元素突然没有样式了。
// 用法：node scripts/find-missing-css.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import postcss from "postcss";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if ([".tsx", ".ts"].includes(extname(p))) out.push(p);
  }
  return out;
}

const css = readFileSync("src/app/globals.css", "utf8");
const root = postcss.parse(css, { from: "src/app/globals.css" });
const declared = new Set();
root.walkRules((r) => {
  for (const sel of r.selector.split(",")) {
    for (const m of sel.matchAll(/\.[A-Za-z0-9_-]+/g)) declared.add(m[0].slice(1));
  }
});

const used = new Map();
for (const file of walk("src")) {
  const src = readFileSync(file, "utf8");
  // className="a b" 与 className={`a ${cond ? "b" : "c"}`} 两种都算
  for (const m of src.matchAll(/className=\{?["`]([^"`]*)["`]/g)) {
    for (const token of m[1].split(/[\s${}]+/)) {
      const name = token.trim().replace(/^[^\w-]+/, "");
      if (!name || !/^[A-Za-z][\w-]*$/.test(name)) continue;
      if (!used.has(name)) used.set(name, file);
    }
  }
}

// 项目里本来就有一部分靠 Tailwind 或行内样式，不在此列的才算缺失。
const KNOWN_EXTERNAL = new Set(["case-edited", "section-shell", "cover-light"]);

const missing = [...used.entries()]
  .filter(([name]) => !declared.has(name) && !KNOWN_EXTERNAL.has(name))
  .sort();

console.log(`CSS 声明了 ${declared.size} 个类；组件里用到 ${used.size} 个类`);
if (!missing.length) {
  console.log("没有缺失：所有用到的类都有对应规则");
} else {
  console.log(`\n缺失 ${missing.length} 个：`);
  for (const [name, file] of missing) console.log(`  .${name.padEnd(26)} 首次出现在 ${file}`);
}
process.exit(0);