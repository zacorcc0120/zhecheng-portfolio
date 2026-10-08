// 找出「在 DOM 里但渲染盒为 0」的元素。上一轮的 .at-shot 就是这样漏过去的：
// 交互实测断言了状态切换（alt 文案换了），但没断言渲染盒有尺寸，于是
// 一张在所有桌面视口都不可见的截图一直没人看见。
//
// 判据：元素有宽度或高度为 0，且不是 display:none 造成的（那类不报），
// 且不是刻意隐藏的（aria-hidden / 0 尺寸的装饰条 / 在 display:none 祖先里）。
//
// 用法：node scripts/find-zero-box.mjs [地址] [宽,高 ...]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_TARGET = process.argv[2] || "http://127.0.0.1:3100/work/recoveryx";
const sizes = (process.argv[3] || "1920x1080,1440x900,1024x900,768x1000,390x844")
  .split(",")
  .map((s) => s.split("x").map(Number));

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome");
}

const profile = mkdtempSync(join(tmpdir(), "zerobox-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

const wsUrl = await new Promise((ok, bad) => {
  let buf = "";
  const t = setTimeout(() => bad("浏览器 20 秒内没有启动"), 20000);
  chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); ok(m[1]); } });
});
const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接失败")); });
let seq = 0; const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.no(new Error(`${m.error.message} (${m.method || "?"})`));
    else p.ok(m.result);
  }
};
const send = (method, params = {}, sessionId) => new Promise((ok, no) => {
  const id = ++seq;
  pending.set(id, { ok, no });
  const msg = { id, method, params };
  if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cdp = (m, p) => send(m, p, sessionId);
await cdp("Page.enable");
await cdp("Runtime.enable");
const ev = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description);
  return r.result.value;
};

// 一旦某个元素被 display:none 隐藏，它就不是 bug。这里显式跳过整条隐藏链，
// 只报「本该可见却塌成 0」的元素。
const PROBE = `(() => {
  const hidden = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === "none" || s.visibility === "hidden") return true;
    }
    return false;
  };
  const out = [];
  for (const el of document.querySelectorAll("img, figure, video, canvas, .pj-shot-image, .at-shot, .case-figure, .asset-slot")) {
    if (hidden(el)) continue;
    const b = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (b.width > 0.5 && b.height > 0.5) continue;
    if (s.position === "absolute" && b.height < 1) continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className && typeof el.className === "string" ? el.className : "").trim().split(/\\s+/).slice(0, 2).join("."),
      w: Math.round(b.width), h: Math.round(b.height),
      position: s.position, height: s.height, aspect: s.aspectRatio,
      alt: (el.getAttribute && el.getAttribute("alt")) || el.getAttribute("src") || "",
    });
  }
  return out;
})()`;

for (const [width, height] of sizes) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: URL_TARGET });
  for (let i = 0; i < 120; i++) { if (await ev("document.readyState === 'complete'")) break; await sleep(100); }
  await ev("document.fonts ? document.fonts.ready.then(() => true) : true");
  await sleep(1200);
  const bad = await ev(PROBE);
  console.log(`\n=== ${width}x${height} : ${bad.length} 个塌陷元素 ===`);
  for (const b of bad) console.log(`  ${b.tag}.${b.cls}  ${b.w}x${b.h}  position=${b.position} height=${b.height} aspect=${b.aspect}  "${String(b.alt).slice(0, 50)}"`);
}

chrome.kill();
process.exit(0);
