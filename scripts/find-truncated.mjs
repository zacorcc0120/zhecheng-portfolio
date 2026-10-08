// 找出被截断的文字。问的是「这句话读者能不能读完整」。
//
// 上一轮 CH04 的六个问题里，TRI-22 在 1024px 被省略号断在
// 「...这类不是普通酸痛的」——剩下的「异常疼痛？」正好是问题的落点，
// 截断把意思反了过来。交互实测抓不到这类问题：alt、DOM、状态全都正常，
// 只有渲染出来的盒子知道。横向溢出检查也抓不到，因为溢出被 ellipsis 吃掉了。
//
// 判据：元素的 scrollWidth 超过 clientWidth，说明内容比盒子宽且被裁掉。
// 用法：node scripts/find-truncated.mjs [地址] [宽,高 ...]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_TARGET = process.argv[2] || "http://127.0.0.1:3100/work/recoveryx";
const sizes = (process.argv[3] || "1440x900,1280x900,1200x900,1180x900,1100x900,1024x900,960x900,900x900,768x900,721x900,390x844")
  .split(",")
  .map((s) => s.split("x").map(Number));

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome");
}

const profile = mkdtempSync(join(tmpdir(), "trunc-"));
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

// 只报「被 CSS 裁掉」的：scrollWidth > clientWidth 且确实用了 ellipsis/clip。
// 纯 nowrap 且允许横向滚动的元素不算。
const PROBE = `(() => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    if (s.textOverflow !== "ellipsis" && s.overflowX !== "hidden") continue;
    if (el.scrollWidth <= el.clientWidth + 1) continue;
    if (el.clientWidth === 0) continue;
    const full = (el.textContent || "").replace(/\\s+/g, " ").trim();
    const shown = (() => {
      // 近似可见文本：按比例裁掉尾部
      const ratio = el.clientWidth / el.scrollWidth;
      return full.slice(0, Math.max(1, Math.floor(full.length * ratio)));
    })();
    out.push({
      cls: (typeof el.className === "string" ? el.className : "").trim().split(/\\s+/).slice(0, 2).join("."),
      w: el.clientWidth, sw: el.scrollWidth,
      shown, full,
    });
  }
  return out;
})()`;

let bad = 0;
for (const [width, height] of sizes) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: URL_TARGET });
  for (let i = 0; i < 120; i++) { if (await ev("document.readyState === 'complete'")) break; await sleep(100); }
  await ev("document.fonts ? document.fonts.ready.then(() => true) : true");
  await sleep(1000);
  const found = await ev(PROBE);
  if (!found.length) { console.log(`${String(width).padStart(5)}px  0 处截断`); continue; }
  bad += found.length;
  console.log(`${String(width).padStart(5)}px  ${found.length} 处截断`);
  for (const f of found) {
    console.log(`        .${f.cls}  ${f.w}px 装不下 ${f.sw}px`);
    console.log(`          显示: …${f.shown.slice(-30)}`);
    console.log(`          完整: ${f.full.slice(0, 60)}`);
  }
}
console.log(`\n合计 ${bad} 处截断`);

chrome.kill();
process.exit(bad ? 1 : 0);
