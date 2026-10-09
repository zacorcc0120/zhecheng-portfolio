// 首页动效性能探针：用 CDP Performance 域量真实 CPU 时间与堆占用。
//
// 目的不是给出一个"好看"的帧率数字，而是验证三件事：
//   1. 两个图形都离开视口时，页面的脚本时间应当显著下降（§16.1）
//   2. 长时间停留在形态场上，堆不应持续增长（§16.11）
//   3. 标签页不可见时绘制停机（§16.2）——通过 CDP 切到后台再取指标
//
// 用法：node scripts/perf-home.mjs <地址> [宽] [高]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, wArg, hArg] = process.argv.slice(2);
const width = Number(wArg || 1440);
const height = Number(hArg || 900);
const SAMPLE_MS = 6000;

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}
const profile = mkdtempSync(join(tmpdir(), "perf-"));
const chrome = spawn(findChrome(), ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--disable-extensions", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const bail = (e) => { console.error(`perf: ${e}`); try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(1); };
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
await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Performance.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};

await cdp("Page.navigate", { url });
for (let i = 0; i < 150; i++) { if (await evaluate("document.readyState === 'complete'")) break; await sleep(100); }
await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
await sleep(2000);

const metrics = async () => {
  const { metrics: m } = await cdp("Performance.getMetrics");
  const get = (n) => m.find((x) => x.name === n)?.value ?? 0;
  return { task: get("TaskDuration"), script: get("ScriptDuration"), layout: get("LayoutDuration"), recalc: get("RecalcStyleDuration"), heap: get("JSHeapUsedSize"), nodes: get("Nodes"), listeners: get("JSEventListeners") };
};

// 平均帧率由页面自己数，与 CDP 的采样窗口无关。
const fps = () => evaluate(`new Promise(res=>{let n=0;const t0=performance.now();const f=()=>{n++;performance.now()-t0<3000?requestAnimationFrame(f):res(Math.round(n/((performance.now()-t0)/1000)))};requestAnimationFrame(f)})`);

async function sample(label, goto) {
  if (goto) { await evaluate(goto); await sleep(1400); }
  const before = await metrics();
  const rate = await fps();
  const after = await metrics();
  const s = (SAMPLE_MS / 1000);
  const pct = (a, b) => ((a / b) * 100).toFixed(1);
  console.log(
    `${label.padEnd(26)} fps=${String(rate).padStart(3)}  ` +
    `script=${pct(after.script - before.script, s)}%  task=${pct(after.task - before.task, s)}%  ` +
    `style=${pct(after.recalc - before.recalc, s)}%  layout=${pct(after.layout - before.layout, s)}%  ` +
    `heap=${(after.heap / 1048576).toFixed(1)}MB  nodes=${after.nodes}  listeners=${after.listeners}`,
  );
  return after;
}

const to = (sel, back = 120) =>
  `window.scrollTo(0,document.querySelector('${sel}').getBoundingClientRect().top+scrollY-${back})`;

console.log(`视口 ${width}x${height}，采样窗口 ${SAMPLE_MS / 1000}s\n`);
await sample("Hero（Hero Field 在跑）", "window.scrollTo(0,0)");
await sample("PRACTICE（雕塑在跑）", to(".sculpture-practice"));
await sample("RULES（雕塑在跑）", to(".sculpture-study"));
await sample("页脚（两图都离屏）", "window.scrollTo(0,document.documentElement.scrollHeight)");

console.log("\n— RULES 雕塑长时间运行 40s，看堆与监听器是否漂移 —");
await evaluate(to(".sculpture-study"));
await sleep(1200);
const t0 = await metrics();
for (let i = 0; i < 8; i++) {
  await sleep(5000);
  const m = await metrics();
  console.log(`  t+${(i + 1) * 5}s  heap=${(m.heap / 1048576).toFixed(2)}MB (${((m.heap - t0.heap) / 1024).toFixed(0)}KB)  nodes=${m.nodes}  listeners=${m.listeners}  script=${(((m.script - t0.script) / (i + 1))).toFixed(1)}s`);
}

console.log("\n— 标签页切到后台 6s（§16.2）—");
await cdp("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
const hidden = await cdp("Page.setWebLifecycleState", { state: "frozen" }).then(() => true).catch(() => false);
const b2 = await metrics();
await sleep(6000);
const a2 = await metrics();
console.log(`  Page.setWebLifecycleState(frozen) ${hidden ? "已接受" : "被拒绝"}  脚本时间增量 ${(a2.script - b2.script).toFixed(3)}s`);

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);