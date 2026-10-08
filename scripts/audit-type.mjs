// 判定「正文 < 15px」与「技术标签是否真的用了等宽」——只看源文件不够：
// 很多规则不写 font-family，靠继承拿到等宽或无衬线，两者都合法但结论相反。
// 这里直接读运行页面的计算样式。
//
// 用法：node scripts/audit-type.mjs [地址] [宽x高]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_TARGET = process.argv[2] || "http://127.0.0.1:3100/work/recoveryx";
const [width, height] = (process.argv[3] || "1440x900").split("x").map(Number);

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome");
}

const profile = mkdtempSync(join(tmpdir(), "typeaudit-"));
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

await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: URL_TARGET });
for (let i = 0; i < 120; i++) { if (await ev("document.readyState === 'complete'")) break; await sleep(100); }
await ev("document.fonts ? document.fonts.ready.then(() => true) : true");
await sleep(1200);

// 抽屉默认关闭，把它打开，否则抽屉里的文字量不到。
await ev(`(() => { const b = document.querySelector(".rq-row"); if (b) b.click(); return true; })()`);
await sleep(900);

const rows = await ev(`(() => {
  const MONO = /mono|courier|consolas|menlo/i;
  const seen = new Map();
  for (const el of document.querySelectorAll("body *")) {
    // 只看直接承载文字的元素
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    if (Number(s.opacity) < 0.15) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const size = Math.round(parseFloat(s.fontSize) * 10) / 10;
    const mono = MONO.test(s.fontFamily);
    const key = el.tagName.toLowerCase() + "." + (typeof el.className === "string" ? el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "");
    if (seen.has(key)) continue;
    seen.set(key, {
      key, size, mono,
      color: s.color,
      text: (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 34),
    });
  }
  return [...seen.values()];
})()`);

const small = rows.filter((r) => !r.mono && r.size < 15);
const monoNotSmall = rows.filter((r) => r.mono && r.size < 15);
console.log(`视口 ${width}x${height}：承载文字元素 ${rows.length} 个`);
console.log(`\n=== 非等宽且 < 15px（正文候选，需判定是否可接受）: ${small.length} ===`);
for (const r of small.sort((a, b) => a.size - b.size)) {
  console.log(`  ${String(r.size).padStart(5)}px  ${r.key.padEnd(38)} ${r.color.padEnd(20)} "${r.text}"`);
}
console.log(`\n=== 等宽且 < 15px（技术标签/数值/公式，合规）: ${monoNotSmall.length} ===`);
for (const r of monoNotSmall.sort((a, b) => a.size - b.size)) {
  console.log(`  ${String(r.size).padStart(5)}px  ${r.key.padEnd(38)} "${r.text}"`);
}

chrome.kill();
process.exit(0);
