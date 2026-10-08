// 找出把页面撑宽的元素。不猜——直接量每个元素的几何，找右边缘越界的。
// 用法：node scripts/find-overflow.mjs <地址> <宽> [高]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, wArg, hArg] = process.argv.slice(2);
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

const profile = mkdtempSync(join(tmpdir(), "overflow-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const bail = (e) => { console.error(`find-overflow: ${e}`); try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(1); };
process.on("exit", () => { try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await new Promise((ok, bad) => {
  let buf = "";
  const t = setTimeout(() => bad("浏览器 20 秒内没有启动"), 20000);
  chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); ok(m[1]); } });
});
const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接失败")); });
let seq = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.no(new Error(m.error.message)); else p.ok(m.result); } };
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const id = ++seq; pending.set(id, { ok, no }); const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId; ws.send(JSON.stringify(msg)); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cdp = (m, p) => send(m, p, sessionId);
await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "脚本抛错");
  return r.result.value;
};

await cdp("Page.navigate", { url });
for (let i = 0; i < 120; i++) { if (await evaluate("document.readyState === 'complete'")) break; await sleep(100); }
await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
await sleep(1500);

// 滚一遍，触发懒加载与 scroll-driven 的元素进入布局
await evaluate(`(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += window.innerHeight / 2) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 400));
  return true;
})()`);

const result = await evaluate(`(() => {
  const limit = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const right = r.right + window.scrollX;
    if (right <= limit + 1) continue;
    // 只报告"最外层"越界元素：父元素也越界时不重复报子元素
    const style = getComputedStyle(el);
    if (style.position === "fixed") continue;
    bad.push({
      tag: el.tagName.toLowerCase(),
      path: (() => {
        const parts = [];
        let n = el;
        for (let i = 0; i < 5 && n; i++) {
          const c = n.className && typeof n.className === "string" ? n.className.trim().split(/\\s+/).slice(0, 2).join(".") : "";
          parts.push(n.tagName.toLowerCase() + (c ? "." + c : ""));
          n = n.parentElement;
        }
        return parts.join(" < ");
      })(),
      text: (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 40),
      left: Math.round(r.left + window.scrollX),
      right: Math.round(right),
      width: Math.round(r.width),
      overflow: Math.round(right - limit),
      depth: (() => { let d = 0, n = el; while ((n = n.parentElement)) d++; return d; })(),
    });
  }
  return { limit, scrollWidth: document.documentElement.scrollWidth, bad: bad.sort((a,b) => a.depth - b.depth).slice(0, 25) };
})()`);

console.log(`视口 ${width}px，clientWidth ${result.limit}，scrollWidth ${result.scrollWidth}，溢出 ${result.scrollWidth - result.limit}px`);
if (!result.bad.length) console.log("没有元素越界（溢出可能来自伪元素或 transform）");
for (const b of result.bad) console.log(`  +${String(b.overflow).padStart(4)}px  w=${b.width} [${b.left}..${b.right}]  ${b.path}\n           "${b.text}"`);

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);