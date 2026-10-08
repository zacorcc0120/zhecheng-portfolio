#!/usr/bin/env node
// 把指定选择器滚到视口正中再逐个截图，用来验收「这一节有没有被改坏」。
// 同样绕开被接管的平滑滚动：瞬时滚动 + 等动画落定 + 量真实位置。
//
// 用法：node scripts/cdp-shot.mjs <地址> <输出目录> <尺寸> <名字=选择器> [名字=选择器 ...]
// 例：  node scripts/cdp-shot.mjs http://127.0.0.1:3100/work/recoveryx shots/r9 1440x900 \
//         sec03=".case-section:nth-of-type(3)" sec04=".rq-row"
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [url, outArg, sizeArg, ...targets] = process.argv.slice(2);
if (!url || !outArg || !sizeArg || !targets.length) {
  console.error('用法：node scripts/cdp-shot.mjs <地址> <输出目录> <宽x高> <名字=选择器> ...');
  process.exit(1);
}
const [w, h] = sizeArg.split("x").map(Number);
const out = resolve(outArg);
mkdirSync(out, { recursive: true });

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge，用 CHROME_PATH 指定。");
}

const profile = mkdtempSync(join(tmpdir(), "cdp-shot-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

function bail(err) {
  console.error(`cdp-shot: ${err}`);
  try { chrome.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(1);
}
process.on("exit", () => { try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await new Promise((ok) => {
  let buf = "";
  const timer = setTimeout(() => bail("浏览器 20 秒内没有启动"), 20000);
  chrome.stderr.on("data", (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(timer); ok(m[1]); }
  });
});

const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接浏览器失败")); });
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { ok, no } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) no(new Error(msg.error.message));
    else ok(msg.result);
  }
};
const send = (method, params = {}, sessionId) => new Promise((ok, no) => {
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
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });

const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};

await cdp("Page.navigate", { url });
for (let i = 0; i < 120; i++) {
  if (await evaluate("document.readyState === 'complete'")) break;
  await sleep(100);
}
await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
await sleep(1500);

const results = [];
for (const t of targets) {
  const idx = t.indexOf("=");
  const name = t.slice(0, idx);
  const selector = t.slice(idx + 1);
  const found = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { ok: false };
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const r = el.getBoundingClientRect();
    return { ok: true, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
  })()`);
  if (!found.ok) { console.log(`${name}: 没找到 ${selector}`); results.push({ name, found: false }); continue; }
  await sleep(1100);
  const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(out, `${name}.png`), Buffer.from(data, "base64"));
  console.log(`${name}: ${found.w}x${found.h} @top ${found.top}`);
  results.push({ name, selector, ...found });
}

const overflow = await evaluate("({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })");
console.log(`横向溢出 ${overflow.sw - overflow.cw}px（scrollWidth ${overflow.sw} / clientWidth ${overflow.cw}）`);
writeFileSync(join(out, "report.json"), JSON.stringify({ url, size: sizeArg, results, overflowPx: overflow.sw - overflow.cw }, null, 2));

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);