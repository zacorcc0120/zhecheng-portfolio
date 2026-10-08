// 通用探针：查某个元素及其祖先的计算样式和几何，用来定位 sticky/overflow 之类的问题。
// 用法：node scripts/probe.mjs <地址> <选择器> [宽] [高]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, selector, wArg, hArg] = process.argv.slice(2);
if (!url || !selector) { console.error("用法：node scripts/probe.mjs <地址> <选择器> [宽] [高]"); process.exit(1); }
const width = Number(wArg || 1440);
const height = Number(hArg || 900);

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}
const profile = mkdtempSync(join(tmpdir(), "probe-"));
const chrome = spawn(findChrome(), ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--disable-extensions", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const bail = (e) => { console.error(`probe: ${e}`); try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(1); };
process.on("exit", () => { try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await new Promise((ok, bad) => { let buf = ""; const t = setTimeout(() => bad("浏览器 20 秒内没有启动"), 20000); chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); ok(m[1]); } }); });
const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接失败")); });
let seq = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.no(new Error(m.error.message)); else p.ok(m.result); } };
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const id = ++seq; pending.set(id, { ok, no }); const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId; ws.send(JSON.stringify(msg)); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cdp = (m, p) => send(m, p, sessionId);
await cdp("Page.enable"); await cdp("Runtime.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};
await cdp("Page.navigate", { url });
for (let i = 0; i < 120; i++) { if (await evaluate("document.readyState === 'complete'")) break; await sleep(100); }
await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
await sleep(1200);

const chain = await evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { error: "没找到 " + ${JSON.stringify(selector)} };
  const out = [];
  let n = el;
  while (n && n !== document.documentElement) {
    const s = getComputedStyle(n);
    const b = n.getBoundingClientRect();
    out.push({
      node: n.tagName.toLowerCase() + (typeof n.className === "string" && n.className.trim() ? "." + n.className.trim().split(/\\s+/).slice(0,2).join(".") : ""),
      position: s.position,
      overflow: s.overflow + " / " + s.overflowX + " " + s.overflowY,
      overflowY: s.overflowY,
      transform: s.transform === "none" ? "none" : "set",
      contain: s.contain,
      height: Math.round(b.height),
      top: Math.round(b.top + window.scrollY),
    });
    n = n.parentElement;
  }
  return { out };
})()`);

if (chain.error) bail(chain.error);
console.log(`视口 ${width}x${height}`);
for (const r of chain.out) {
  console.log(`  ${r.node.padEnd(34)} position=${r.position.padEnd(9)} overflowY=${r.overflowY.padEnd(7)} transform=${r.transform.padEnd(4)} h=${String(r.height).padStart(5)} docTop=${r.top}`);
}

// 滚到不同位置，看目标元素的视口位置是否真的保持不变
const target = selector;
console.log("\n滚动后目标元素的视口 top（sticky 生效的话应保持不变）：");
for (const frac of [0, 0.15, 0.3, 0.45, 0.6]) {
  const y = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(target)});
    const base = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, base + ${frac} * 1200);
    return window.scrollY;
  })()`);
  await sleep(500);
  const t = await evaluate(`Math.round(document.querySelector(${JSON.stringify(target)}).getBoundingClientRect().top)`);
  console.log(`  scrollY=${String(y).padStart(6)}  →  top=${t}`);
}
try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);