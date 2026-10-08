// CSS 完整性审计：先做容错扫描，一次列出所有"花括号外的声明"残骸，
// 再交给 postcss 做权威语法校验。两者都过才算干净。
//
// 用法：node scripts/css-audit.mjs [文件] [要确认存在的选择器 ...]
import { readFileSync } from "node:fs";
import postcss from "postcss";

const file = process.argv[2] || "src/app/globals.css";
const css = readFileSync(file, "utf8");
const lines = css.split(/\r?\n/);

let depth = 0;
let inComment = false;
const anomalies = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  if (inComment) {
    if (trimmed.includes("*/")) inComment = false;
    continue;
  }
  if (trimmed.startsWith("/*")) {
    if (!trimmed.includes("*/")) inComment = true;
    continue;
  }
  if (trimmed.startsWith("//")) continue;

  if (depth === 0) {
    // 顶层允许：选择器（以 { 或 , 结尾）、收尾的 }、@规则、空行、纯变量声明。
    const isSelector = trimmed.endsWith("{") || trimmed.endsWith(",");
    const isClose = trimmed === "}";
    const isAtRule = trimmed.startsWith("@");
    if (trimmed && !isSelector && !isClose && !isAtRule) {
      anomalies.push({ line: i + 1, kind: "顶层出现声明", text: trimmed.slice(0, 70) });
    }
  }

  for (const ch of line) {
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth < 0) {
        anomalies.push({ line: i + 1, kind: "花括号提前闭合", text: trimmed.slice(0, 70) });
        depth = 0;
      }
    }
  }
}

console.log(`扫描 ${lines.length} 行，最终花括号深度 ${depth}${depth === 0 ? "（平衡）" : "（不平衡！）"}`);
if (anomalies.length) {
  console.log(`\n异常 ${anomalies.length} 处：`);
  for (const a of anomalies) console.log(`  ${a.line}: [${a.kind}] ${a.text}`);
} else {
  console.log("无顶层悬挂声明");
}

let root = null;
try {
  root = postcss.parse(css, { from: file });
  const ruleCount = root.nodes.length;
  console.log(`\npostcss 解析通过，顶层节点 ${ruleCount} 个`);
} catch (error) {
  console.error(`\npostcss 语法错误：${error.reason} @ ${error.line}:${error.column}`);
  process.exitCode = 1;
}

if (root) {
  const selectors = [];
  root.walkRules((r) => selectors.push(r.selector));
  const expected = process.argv.slice(3);
  const missing = expected.filter((s) => !selectors.some((sel) => sel.includes(s)));
  if (expected.length) {
    console.log(missing.length ? `\n缺失的选择器：${missing.join("  ")}` : "\n所有指定选择器都存在");
  }
  const dupes = [...new Set(selectors.filter((s, i) => selectors.indexOf(s) !== i && !s.includes(",")))];
  if (dupes.length) console.log(`\n重复定义：${dupes.slice(0, 10).join("  ")}`);
}

process.exit(process.exitCode || 0);