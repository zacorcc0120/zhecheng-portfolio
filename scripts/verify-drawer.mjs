#!/usr/bin/env node
// RecoveryX 04「问卷与评分规则」索引 + 抽屉的交互验收。
//
// 为什么不用 shoot.mjs：这一页接管了滚动（wheel 7000px 只走 90px），
// shoot 内部用 scrollIntoView + 点击，指针会落在动画中途的旧位置上，
// 连纯 CSS :hover 都不出现。这里改成：
//   1. 瞬时滚动（behavior:'instant'）+ 关掉 scroll-behavior:smooth
//   2. 滚完再量 getBoundingClientRect()，用真实坐标发原生鼠标事件
//   3. 每次状态变化都等动画结束再截图
//
// 用法：node scripts/verify-drawer.mjs
// 依赖：Node 22+（全局 WebSocket）+ 本机 Chrome，零第三方包。
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const URL_TARGET = process.argv[2] || "http://127.0.0.1:3100/work/recoveryx";
const OUT = resolve(process.argv[3] || "shots/r8");
const VIEWPORTS = [
  { name: "desktop", w: 1440, h: 900 },
  { name: "mobile", w: 390, h: 844 },
];

function findChrome() {
  const candidates = [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ];
  for (const c of candidates) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge，用环境变量 CHROME_PATH 指定。");
}

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "rq-verify-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

function bail(err) {
  console.error(`verify-drawer: ${err}`);
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
const events = [];
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { ok, no } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) no(new Error(msg.error.message));
    else ok(msg.result);
  } else if (msg.method) events.push(msg);
};
const send = (method, params = {}, sessionId) => new Promise((ok, no) => {
  const id = ++seq;
  pending.set(id, { ok, no });
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cdp = (method, params) => send(method, params, sessionId);

await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Log.enable");

async function evaluate(expression) {
  const r = await cdp("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
}

async function shoot(file) {
  const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const path = join(OUT, `${file}.png`);
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

async function clickAt(x, y) {
  const base = { x, y, button: "left", clickCount: 1, buttons: 1 };
  await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 0 });
  await sleep(120);
  await cdp("Input.dispatchMouseEvent", { ...base, type: "mousePressed" });
  await sleep(60);
  await cdp("Input.dispatchMouseEvent", { ...base, type: "mouseReleased", buttons: 0 });
}

async function pressEscape() {
  const base = { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", ...base });
  await sleep(40);
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", ...base });
}

// 抽屉状态探针：只读 DOM 与计算样式，返回可判定的数字。
const PROBE = `(() => {
  const q = (s) => document.querySelector(s);
  const drawer = q(".rq-drawer");
  const scrim = q(".rq-scrim");
  const rows = document.querySelectorAll(".rq-row");
  const firstRow = rows[0];
  return {
    rows: rows.length,
    scrollY: Math.round(window.scrollY),
    docHeight: document.documentElement.scrollHeight,
    bodyOverflow: getComputedStyle(document.body).overflow,
    firstRowTop: firstRow ? Math.round(firstRow.getBoundingClientRect().top) : null,
    drawerPresent: !!drawer,
    drawerRect: drawer ? (({ x, y, width, height }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) }))(drawer.getBoundingClientRect()) : null,
    drawerTransform: drawer ? getComputedStyle(drawer).transform : null,
    drawerOpacity: drawer ? getComputedStyle(drawer).opacity : null,
    drawerRole: drawer ? drawer.getAttribute("role") : null,
    drawerAriaModal: drawer ? drawer.getAttribute("aria-modal") : null,
    drawerText: drawer ? drawer.innerText.replace(/\\s+/g, " ").trim().slice(0, 160) : null,
    drawerTextLen: drawer ? drawer.innerText.replace(/\\s+/g, " ").trim().length : 0,
    scrimPresent: !!scrim,
    scrimOpacity: scrim ? getComputedStyle(scrim).opacity : null,
  };
})()`;

const report = { url: URL_TARGET, viewports: {}, consoleErrors: [], pageErrors: [] };

for (const vp of VIEWPORTS) {
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: false,
  });
  await cdp("Page.navigate", { url: URL_TARGET });

  // 等 load 完成，再等字体与首屏动画落定。
  for (let i = 0; i < 120; i++) {
    if (await evaluate("document.readyState === 'complete'")) break;
    await sleep(100);
  }
  await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
  await sleep(1200);

  // 关掉平滑滚动，把索引行瞬时滚到视口正中，然后等一切动画停。
  await evaluate(`(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    const target = document.querySelector(".rq-row");
    if (target) target.scrollIntoView({ block: "center", behavior: "instant" });
    return !!target;
  })()`);
  await sleep(900);

  const v = { steps: [] };
  const step = (name, extra) => { v.steps.push({ name, ...extra }); console.log(`  ${name}`, JSON.stringify(extra)); };

  const closed = await evaluate(PROBE);
  step("closed", { rows: closed.rows, drawerPresent: closed.drawerPresent, firstRowTop: closed.firstRowTop, docHeight: closed.docHeight });
  await shoot(`${vp.name}-1-closed`);

  if (!closed.rows) { report.viewports[vp.name] = v; continue; }

  // 点第一行：先量坐标，再用原生鼠标事件点。
  const rect = await evaluate(`(() => {
    const r = document.querySelector(".rq-row").getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  await clickAt(rect.x, rect.y);
  await sleep(1100);

  const opened = await evaluate(PROBE);
  step("opened", {
    drawerPresent: opened.drawerPresent, drawerRect: opened.drawerRect,
    drawerOpacity: opened.drawerOpacity, scrimOpacity: opened.scrimOpacity,
    bodyOverflow: opened.bodyOverflow, textLen: opened.drawerTextLen,
    rowsStillThere: opened.rows, scrollYDrift: opened.scrollY - closed.scrollY,
    docHeightDrift: opened.docHeight - closed.docHeight,
  });
  await shoot(`${vp.name}-2-drawer-open`);

  // Escape 关闭
  await pressEscape();
  await sleep(900);
  const afterEsc = await evaluate(PROBE);
  step("after-escape", {
    drawerPresent: afterEsc.drawerPresent, bodyOverflow: afterEsc.bodyOverflow,
    rowsStillThere: afterEsc.rows, docHeightDrift: afterEsc.docHeight - opened.docHeight,
  });

  // 重新打开，点遮罩关闭
  const rect2 = await evaluate(`(() => {
    const r = document.querySelector(".rq-row").getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  await clickAt(rect2.x, rect2.y);
  await sleep(1000);
  const reopened = await evaluate(PROBE);
  step("reopened", { drawerPresent: reopened.drawerPresent, drawerRect: reopened.drawerRect });
  if (reopened.drawerPresent) {
    await shoot(`${vp.name}-3-drawer-second`);
    const scrimPoint = await evaluate(`(() => {
      const s = document.querySelector(".rq-scrim").getBoundingClientRect();
      return { x: Math.round(s.left + 40), y: Math.round(s.top + s.height / 2), w: Math.round(s.width) };
    })()`);
    await clickAt(scrimPoint.x, scrimPoint.y);
    await sleep(900);
    const afterScrim = await evaluate(PROBE);
    step("after-scrim-click", { drawerPresent: afterScrim.drawerPresent, scrimW: scrimPoint.w });
  }

  // 关闭按钮
  const rect3 = await evaluate(`(() => {
    const r = document.querySelector(".rq-row").getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  await clickAt(rect3.x, rect3.y);
  await sleep(1000);
  const closeBtn = await evaluate(`(() => {
    const b = document.querySelector(".rq-drawer button");
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), label: (b.innerText || b.getAttribute("aria-label") || "").trim() };
  })()`);
  if (closeBtn) {
    await clickAt(closeBtn.x, closeBtn.y);
    await sleep(900);
    const afterBtn = await evaluate(PROBE);
    step("after-close-button", { buttonLabel: closeBtn.label, drawerPresent: afterBtn.drawerPresent });
  } else {
    step("after-close-button", { error: "抽屉里没有 button" });
  }
  await shoot(`${vp.name}-4-closed-again`);

  v.final = await evaluate(PROBE);
  report.viewports[vp.name] = v;
}

// 控制台与页面异常
for (const ev of events) {
  if (ev.method === "Log.entryAdded" && ev.params.entry.level === "error") report.consoleErrors.push(ev.params.entry.text);
  if (ev.method === "Runtime.exceptionThrown") report.pageErrors.push(ev.params.exceptionDetails?.exception?.description || ev.params.exceptionDetails?.text);
}

writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("\n=== 汇总 ===");
for (const [name, v] of Object.entries(report.viewports)) {
  const o = v.steps.find((s) => s.name === "opened");
  const e = v.steps.find((s) => s.name === "after-escape");
  const sc = v.steps.find((s) => s.name === "after-scrim-click");
  const cb = v.steps.find((s) => s.name === "after-close-button");
  console.log(`${name}: 点开=${o?.drawerPresent === true} Escape关=${e?.drawerPresent === false} 遮罩关=${sc?.drawerPresent === false} 按钮关=${cb?.drawerPresent === false} 正文位移=${o?.scrollYDrift}px 页长变化=${o?.docHeightDrift}px`);
}
console.log(`控制台错误 ${report.consoleErrors.length} 条，页面异常 ${report.pageErrors.length} 条`);
if (report.consoleErrors.length) console.log(report.consoleErrors.slice(0, 5));
if (report.pageErrors.length) console.log(report.pageErrors.slice(0, 5));

await cdp("Target.closeTarget", { targetId });
try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);