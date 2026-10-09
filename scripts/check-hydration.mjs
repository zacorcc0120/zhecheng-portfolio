#!/usr/bin/env node
// 通用的「注水体检」：打开一个或多个地址，报告
//   1) 整棵 DOM 里有多少节点挂上了 React 的内部键（注水成功的标志）
//   2) console 与未捕获异常
//   3) 有没有 Next.js 的错误浮层
//
// 为什么要单独一个脚本：滚动驱动的段落一旦没注水，useScroll / whileInView /
// 任何 onClick 全部静默失效，页面看起来却完全正常（SSR 的 HTML 已经在那里了），
// 很容易被误判成「动效参数算错了」。先证明树是活的，再谈参数。
//
// 用法：node scripts/check-hydration.mjs <地址> [地址 ...] [--wait 8000]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const argv = process.argv.slice(2);
let wait = 8000;
const wi = argv.indexOf("--wait");
if (wi >= 0) { wait = Number(argv[wi + 1]) || 8000; argv.splice(wi, 2); }
const urls = argv;
if (!urls.length) {
  console.error("用法：node scripts/check-hydration.mjs <地址> [地址 ...] [--wait 8000]");
  process.exit(1);
}

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}

const profile = mkdtempSync(join(tmpdir(), "check-hydration-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
function bail(e) {
  console.error(`check-hydration: ${e}`);
  try { chrome.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(1);
}
process.on("exit", () => { try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await new Promise((ok, bad) => {
  let buf = "";
  const t = setTimeout(() => bad("浏览器 20 秒内没有启动"), 20000);
  chrome.stderr.on("data", (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(t); ok(m[1]); }
  });
});
const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接失败")); });
let seq = 0;
const pending = new Map();
let logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.consoleAPICalled") {
    const text = m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" ");
    if (!/React DevTools/.test(text)) logs.push(`[${m.params.type}] ${text}`);
  }
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    logs.push(`[异常] ${(d.exception?.description || d.text || "").split("\n").slice(0, 4).join(" | ")}`);
  }
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.no(new Error(m.error.message));
    else p.ok(m.result);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((ok, no) => {
    const id = ++seq;
    pending.set(id, { ok, no });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cdp = (m, p) => send(m, p, sessionId);
await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};

for (const url of urls) {
  logs = [];
  await cdp("Page.navigate", { url });
  for (let i = 0; i < 150; i++) {
    if (await evaluate("document.readyState === 'complete'")) break;
    await sleep(100);
  }
  await sleep(wait);
  const r = await evaluate(`(() => {
    const all = document.querySelectorAll("*");
    let withReact = 0;
    for (const el of all) {
      for (const k of Object.keys(el)) {
        if (k.startsWith("__reactFiber") || k.startsWith("__reactContainer")) { withReact++; break; }
      }
    }
    const overlay = document.querySelector("nextjs-portal");
    // Next 的错误浮层挂在 shadow DOM 里，textContent 永远是空的，得往里钻。
    const deepText = (root, depth = 0) => {
      if (!root || depth > 6) return "";
      let out = "";
      for (const node of root.children || []) {
        out += " " + (node.shadowRoot ? deepText(node.shadowRoot, depth + 1) : (node.textContent || ""));
        if (!node.shadowRoot) out += " " + deepText(node, depth + 1);
      }
      return out;
    };
    return {
      total: all.length,
      withReact,
      overlay: !!overlay,
      overlayText: overlay ? (overlay.shadowRoot ? deepText(overlay.shadowRoot) : "") : "",
      flightScripts: document.querySelectorAll('script[src*="_next"]').length,
    };
  })()`);
  const pct = ((r.withReact / r.total) * 100).toFixed(1);
  console.log(`\n=== ${url}`);
  console.log(`  DOM ${r.total} 个节点，带 React 内部键 ${r.withReact} 个（${pct}%）  →  ${r.withReact > 50 ? "已注水" : "未注水"}`);
  console.log(`  Next 错误浮层：${r.overlay ? "有" : "无"}`);
  const overlayWords = (r.overlayText || "").replace(/\s+/g, " ").trim();
  console.log(`  浮层内容：${overlayWords ? overlayWords.slice(0, 600) : "（空）"}`);
  if (!overlayWords) {
    // 浮层在但没文字，通常是 dev tools 指示器而不是错误。再问一次全局错误缓冲。
    const g = await evaluate(`({
      nextError: (typeof window.__next_error__ !== "undefined") ? String(window.__next_error__) : null,
      hasPortalChildren: (() => { const p = document.querySelector("nextjs-portal"); return p ? p.children.length : -1; })(),
    })`);
    console.log(`  浮层子节点 ${g.hasPortalChildren} 个，__next_error__ = ${g.nextError || "(无)"}`);
  }
  console.log(`  console / 异常（${logs.length} 条）：`);
  for (const l of logs.slice(0, 12)) console.log("    " + l.slice(0, 400));
}

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);