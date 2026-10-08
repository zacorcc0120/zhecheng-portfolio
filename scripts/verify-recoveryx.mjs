// RecoveryX 五章重构的交互实测。桌面 + 手机两遍，跑的是真点击而不是截图。
// 用法：node scripts/verify-recoveryx.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const URL_TARGET = process.argv[2] || "http://127.0.0.1:3100/work/recoveryx";
const OUT = resolve(process.argv[3] || "shots/r13");

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "rx-verify-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const bail = (e) => { console.error(`verify-recoveryx: ${e}`); try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(1); };
process.on("exit", () => { try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await new Promise((ok, bad) => {
  let buf = "";
  const t = setTimeout(() => bad("浏览器 20 秒内没有启动"), 20000);
  chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); ok(m[1]); } });
});
const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接失败")); });
let seq = 0; const pending = new Map(); const consoleErrors = []; const pageErrors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.no(new Error(m.error.message)); else p.ok(m.result); }
  else if (m.method === "Log.entryAdded" && m.params.entry.level === "error") consoleErrors.push(m.params.entry.text);
  else if (m.method === "Runtime.exceptionThrown") pageErrors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text);
};
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const id = ++seq; pending.set(id, { ok, no }); const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId; ws.send(JSON.stringify(msg)); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cdp = (m, p) => send(m, p, sessionId);
await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Log.enable");
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};
const shoot = async (file) => {
  const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(OUT, file + ".png"), Buffer.from(data, "base64"));
};
// 关键：瞬时滚动 + 等动画落定 + 用量到的真实坐标发原生鼠标事件。
// 页面接管了平滑滚动时，基于选择器的自动点击会落空。
const focusEl = async (selector) => {
  const okFound = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  })()`);
  await sleep(800);
  return okFound;
};
const clickSel = async (selector) => {
  // 先把目标本身滚进视口再量坐标。不这么做的话，被测元素若在上一屏，
  // 量到的 y 超出视口，按下就落空——看起来像组件没响应，其实是探针的锅。
  const found = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), h: window.innerHeight };
  })()`);
  if (!found) return false;
  if (found.y < 0 || found.y > found.h) {
    console.warn(`    ! ${selector} 量到 y=${found.y} 超出视口 ${found.h}，这次点击不可信`);
    return false;
  }
  await sleep(500);
  const r = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
  })()`);
  if (!r) return false;
  await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y, buttons: 0 });
  await sleep(100);
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: r.x, y: r.y, button: "left", clickCount: 1, buttons: 1 });
  await sleep(60);
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.x, y: r.y, button: "left", clickCount: 1, buttons: 0 });
  await sleep(900);
  return true;
};

const report = { url: URL_TARGET, viewports: {}, consoleErrors: [], pageErrors: [] };
for (const vp of [{ name: "desktop", w: 1440, h: 900 }, { name: "mobile", w: 390, h: 844 }]) {
  await cdp("Emulation.setDeviceMetricsOverride", { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: URL_TARGET });
  for (let i = 0; i < 120; i++) { if (await evaluate("document.readyState === 'complete'")) break; await sleep(100); }
  await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
  await sleep(1400);

  const v = { steps: [] };
  const step = (name, extra) => { v.steps.push({ name, ...extra }); console.log(`  ${name} ${JSON.stringify(extra)}`); };

  step("chapters", await evaluate(`({
    navCount: document.querySelectorAll(".case-index-list li").length,
    navTitles: [...document.querySelectorAll(".case-index-title")].map(e => e.textContent.trim()),
    sectionIds: [...document.querySelectorAll(".case-content > section")].map(e => e.id),
  })`));

  // CH02 — 点第 4 步，确认设备台换成该步的截图
  await focusEl(".pj-step:nth-child(4) .pj-step-button");
  const beforeFrame = await evaluate(`(document.querySelector(".pj-frame .pj-shot figcaption") || {}).textContent || null`);
  await clickSel(".pj-step:nth-child(4) .pj-step-button");
  const afterFrame = await evaluate(`({
    caption: (document.querySelector(".pj-frame .pj-shot figcaption") || {}).textContent || null,
    activeIndex: [...document.querySelectorAll(".pj-step")].findIndex(e => e.classList.contains("is-active")),
    progressActive: [...document.querySelectorAll(".pj-progress span")].findIndex(e => e.classList.contains("is-active")),
    frameW: Math.round(document.querySelector(".pj-frame").getBoundingClientRect().width),
  })`);
  step("journey-step4", { before: beforeFrame, after: afterFrame.caption, activeIndex: afterFrame.activeIndex, progressActive: afterFrame.progressActive, frameW: afterFrame.frameW });
  await shoot(vp.name + "-jouray");

  // CH03 — 点第 3 个阶段，确认题号和截图一起换
  await focusEl(".at-node:nth-of-type(3)");
  const stageBefore = await evaluate(`({
    selected: document.querySelector('.at-node[aria-selected="true"]').textContent.replace(/\\s+/g," ").trim(),
    items: [...document.querySelectorAll(".at-item-code")].map(e => e.textContent.trim()),
    shot: (document.querySelector(".at-shot img") || {}).alt || null,
  })`);
  await clickSel(".at-node:nth-of-type(3)");
  const stageAfter = await evaluate(`({
    selected: document.querySelector('.at-node[aria-selected="true"]').textContent.replace(/\\s+/g," ").trim(),
    items: [...document.querySelectorAll(".at-item-code")].map(e => e.textContent.trim()),
    shot: (document.querySelector(".at-shot img") || {}).alt || null,
    limeOnActive: getComputedStyle(document.querySelector('.at-node[aria-selected="true"] .at-node-dot')).backgroundColor,
  })`);
  step("timeline-stage3", { before: stageBefore, after: stageAfter });
  await shoot(vp.name + "-timeline");

  // CH04a — 评分演示：换题 + 换回答，看加权项是否真的重算
  await focusEl(".sd-questions");
  const sdBefore = await evaluate(`({
    q: document.querySelector(".sd-stage-value").textContent.trim(),
    term: document.querySelector(".sd-term-equation").textContent.replace(/\\s+/g," ").trim(),
    meter: document.querySelector(".sd-meter-fill").style.transform,
    value: document.querySelector(".sd-meter-value").textContent.trim(),
  })`);
  await clickSel(".sd-questions li:nth-child(5) .sd-question");   // TRI-22
  await clickSel(".sd-anchors .sd-anchor:nth-child(5)");        // 1 / 10 明显不适合训练
  const sdAfter = await evaluate(`({
    q: document.querySelector(".sd-stage-value").textContent.trim(),
    term: document.querySelector(".sd-term-equation").textContent.replace(/\\s+/g," ").trim(),
    meter: document.querySelector(".sd-meter-fill").style.transform,
    value: document.querySelector(".sd-meter-value").textContent.trim(),
    state: document.querySelector(".sd-state").textContent.trim(),
    flag: document.querySelector(".sd-flag").textContent.trim(),
  })`);
  step("scoring-TRI22", { before: sdBefore, after: sdAfter });
  await shoot(vp.name + "-scoring");

  // CH04b — 反馈：选第 3 档
  await focusEl(".fs-bands");
  await clickSel(".fs-bands li:nth-child(3) .fs-band");
  const fsAfter = await evaluate(`({
    range: document.querySelector(".fs-readout-range").textContent.trim(),
    classify: [...document.querySelectorAll(".fs-classify dd")].map(e => e.textContent.trim()),
    axisActive: [...document.querySelectorAll(".fs-axis-band")].findIndex(e => e.classList.contains("is-active")),
  })`);
  step("feedback-band3", fsAfter);
  await shoot(vp.name + "-feedback");

  // CH04c — 抽屉开/关
  await focusEl(".rq-row");
  await clickSel(".rq-row");
  const drawer = await evaluate(`({
    present: !!document.querySelector(".rq-drawer"),
    role: (document.querySelector(".rq-drawer") || {}).getAttribute && document.querySelector(".rq-drawer").getAttribute("role"),
    bodyOverflow: getComputedStyle(document.body).overflow,
    docHeight: document.documentElement.scrollHeight,
    text: (document.querySelector(".rq-drawer") ? document.querySelector(".rq-drawer").innerText.replace(/\\s+/g," ").trim().slice(0,60) : null),
  })`);
  step("drawer-open", drawer);
  await shoot(vp.name + "-drawer");
  const hBefore = drawer.docHeight;
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await sleep(800);
  step("drawer-escape", await evaluate(`({ present: !!document.querySelector(".rq-drawer"), bodyOverflow: getComputedStyle(document.body).overflow, docHeightDrift: document.documentElement.scrollHeight - ${hBefore} })`));

  // 导航高亮是否跟着滚动走
  await evaluate("document.querySelector('#reflection').scrollIntoView({block:'start',behavior:'instant'}); true");
  await sleep(900);
  step("nav-sync-at-reflection", await evaluate(`({
    activeNav: (document.querySelector(".case-index-list li.is-active .case-index-title") || {}).textContent || null,
    count: document.querySelector(".case-index-count-now").textContent.trim(),
  })`));

  report.viewports[vp.name] = v;
}
report.consoleErrors = consoleErrors;
report.pageErrors = pageErrors;
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("\n控制台错误 " + consoleErrors.length + " 条，页面异常 " + pageErrors.length + " 条");
if (consoleErrors.length) console.log(consoleErrors.slice(0, 5));
if (pageErrors.length) console.log(pageErrors.slice(0, 5));

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);