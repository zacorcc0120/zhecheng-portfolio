#!/usr/bin/env node
// 按精确的 scrollY 截图。滚动驱动的段落不能靠选择器定位——同一屏在 10px 之内
// 就是完全不同的阶段，只能按探针量出来的 scrollY 落点。
//
// 用法：node scripts/shot-at.mjs <地址> <输出目录> <宽x高> <scrollY>[,<scrollY> ...] [名字=选择器]
// 例：  node scripts/shot-at.mjs http://127.0.0.1:3000/work/jiko shots/x 1440x900 4118,5036 stage=".jiko-journey-stage"
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const [url, outArg, sizeArg, positionsArg, ...rest] = args;
if (!url || !outArg || !sizeArg || !positionsArg) {
  console.error("用法：node scripts/shot-at.mjs <地址> <输出目录> <宽x高> <scrollY,...> [名字=选择器]");
  process.exit(1);
}
const [w, h] = sizeArg.split("x").map(Number);
const positions = positionsArg.split(",").map(Number);
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

const profile = mkdtempSync(join(tmpdir(), "shot-at-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

function bail(err) {
  console.error(`shot-at: ${err}`);
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
// 所有动画落定再截，避免拍到中间帧。
await evaluate(`document.documentElement.style.scrollBehavior = "auto"`);

for (const y of positions) {
  await evaluate(`window.scrollTo(0, ${y})`);
  await sleep(1200);
  const actual = await evaluate("Math.round(window.scrollY)");
  const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(out, `y${y}.png`), Buffer.from(data, "base64"));
  console.log(`y=${y} -> 实际 ${actual}`);
}

if (rest.length) {
  const t = rest[0];
  const idx = t.indexOf("=");
  const name = idx >= 0 ? t.slice(0, idx) : "clip";
  const selector = idx >= 0 ? t.slice(idx + 1) : t;
  const box = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: r.width, height: r.height };
  })()`);
  if (!box) bail(`没找到 ${selector}`);
  const { data } = await cdp("Page.captureScreenshot", {
    format: "png",
    clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 },
    captureBeyondViewport: true,
  });
  writeFileSync(join(out, `${name}.png`), Buffer.from(data, "base64"));
  console.log(`${name}: ${Math.round(box.width)}x${Math.round(box.height)}`);
}

const overflow = await evaluate("({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })");
console.log(`横向溢出 ${overflow.sw - overflow.cw}px`);

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);