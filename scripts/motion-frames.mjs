// 录三处关键动效的「开始 / 中间 / 结束」三帧，供独立评审核对。
// 用法：node scripts/motion-frames.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const URL_TARGET = process.argv[2] || "http://127.0.0.1:3100/work/recoveryx";
const OUT = resolve(process.argv[3] || "shots/r14-motion");

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "motion-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const bail = (e) => { console.error(`motion-frames: ${e}`); try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(1); };
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
await cdp("Page.enable"); await cdp("Runtime.enable");
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};
const frame = async (name) => {
  const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(OUT, name + ".png"), Buffer.from(data, "base64"));
  console.log("  " + name);
};

await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: URL_TARGET });
for (let i = 0; i < 120; i++) { if (await evaluate("document.readyState === 'complete'")) break; await sleep(100); }
await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
await sleep(1500);

// 动作一：Product Journey 的滑动驱动叙事。设备台保持不动，屏幕随滚动切换。
// 采样点取第 2/3/4 步而不是 1/3/5：章节首尾 sticky 本来就会进入与释放，
// 采在钉住区间里，才能证明"设备不动、屏幕在换"。
console.log("动效 1 — 滚动驱动的产品流程（触发动作：滚动）");
const frameTops = [];
for (const [i, step] of [2, 3, 4].entries()) {
  await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const s = document.querySelectorAll(".pj-step")[${step - 1}];
    s.scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  })()`);
  await sleep(1300);
  const info = await evaluate(`({
    step: document.querySelector(".pj-step.is-active .pj-step-code").textContent,
    screen: (document.querySelector(".pj-frame .pj-shot figcaption") || {}).textContent,
    frameTop: Math.round(document.querySelector(".pj-frame").getBoundingClientRect().top),
  })`);
  frameTops.push(info.frameTop);
  console.log(`    第${i + 1}帧 当前步骤=${info.step} 屏幕=${info.screen} 设备台 top=${info.frameTop}`);
  await frame(`1-scroll-step${step}`);
}
console.log(`    → 设备台 top 在三帧之间位移 ${Math.max(...frameTops) - Math.min(...frameTops)}px（越小说明越稳）`);

// 动作二：主操作反馈 —— 点阶段三，屏幕与题号一起换。
console.log("动效 2 — 主操作反馈：选择评估阶段（触发动作：点击 PF 节点）");
await evaluate(`(() => {
  document.documentElement.style.scrollBehavior = "auto";
  document.querySelector(".at-track").scrollIntoView({ block: "center", behavior: "instant" });
  return true;
})()`);
await sleep(900);
await frame("2-stage-00-before");
const pt = await evaluate(`(() => {
  const el = document.querySelectorAll(".at-node")[2];
  el.scrollIntoView({ block: "center", behavior: "instant" });
  const b = el.getBoundingClientRect();
  return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
})()`);
await sleep(500);
await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", clickCount: 1, buttons: 1 });
await sleep(70);
await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", clickCount: 1, buttons: 0 });
await sleep(120);
await frame("2-stage-01-mid");
await sleep(700);
await frame("2-stage-02-after");

// 动作三：内容状态切换 —— 打开问题详情抽屉。
console.log("动效 3 — 内容状态切换：打开问题详情抽屉（触发动作：点击 MRI-1 行）");
await evaluate(`(() => {
  document.documentElement.style.scrollBehavior = "auto";
  const el = document.querySelector(".rq-row");
  el.scrollIntoView({ block: "center", behavior: "instant" });
  return true;
})()`);
await sleep(900);
await frame("3-drawer-00-before");
const dr = await evaluate(`(() => {
  const b = document.querySelector(".rq-row").getBoundingClientRect();
  return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
})()`);
await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: dr.x, y: dr.y, button: "left", clickCount: 1, buttons: 1 });
await sleep(50);
await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: dr.x, y: dr.y, button: "left", clickCount: 1, buttons: 0 });
await sleep(90);
await frame("3-drawer-01-mid");
await sleep(700);
await frame("3-drawer-02-after");

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);