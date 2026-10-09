#!/usr/bin/env node
// 点一下、按键、再断言的验收脚本。截图只说明"长什么样"，回答不了"点了会发生
// 什么"——所以这里在每次动作后把状态读回来：aria-expanded、当前高亮、滚动位置、
// 弹层是否存在、body 有没有被锁滚。
//
// 用法：
//   node scripts/act.mjs <地址> <输出目录> <宽x高> <动作> [动作 ...]
// 动作：
//   shot:<名字>                     截图
//   clip:<名字>=<选择器>             只截该元素
//   click:<选择器>                  用真实鼠标事件点击元素中心
//   key:<Key>                       发送按键
//   wait:<毫秒>                     等待
//   assert:<名字>=<表达式>          读回一段 JS 的结果并打印
//   scroll:<scrollY>                瞬时滚动（会先关掉平滑滚动）
//
// 动作里全是选择器和 JS 表达式，双引号必不可少，而 PowerShell 5.1 传给原生程序
// 时会把内嵌的双引号吃掉（表现为 eval 报 Unexpected token '.'）。所以额外支持
// `--file <actions.json>`，动作数组直接从文件读，绕开整条命令行的转义。
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const argvRaw = process.argv.slice(2);
let actions;
{
  const fi = argvRaw.indexOf("--file");
  if (fi >= 0) {
    const file = argvRaw[fi + 1];
    // Windows 上用 Out-File / 记事本存出来的 JSON 会带 BOM，JSON.parse 直接
    // 报 "Unexpected token '﻿'"，看起来像是文件内容写错了而不是编码问题。
    actions = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    argvRaw.splice(fi, 2);
  }
}
const [url, outArg, sizeArg, ...inlineActions] = argvRaw;
if (!actions) actions = inlineActions;
if (!url || !outArg || !sizeArg || !actions.length) {
  console.error("用法：node scripts/act.mjs <地址> <输出目录> <宽x高> <动作...> | --file <actions.json>");
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
  throw new Error("找不到 Chrome / Edge");
}

const profile = mkdtempSync(join(tmpdir(), "act-"));
/* NO_WEBGL=1 launches the browser with WebGL switched off, which is the only
   honest way to see what a reader without it gets. The fallback path is the
   whole point of having one, so it has to be looked at rather than assumed. */
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1",
  ...(process.env["NO_WEBGL"] === "1" ? ["--disable-webgl", "--disable-webgl2"] : []),
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
function bail(err) {
  console.error(`act: ${err}`);
  try { chrome.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(1);
}
process.on("exit", () => { try { chrome.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await new Promise((ok, bad) => {
  let buf = "";
  const t = setTimeout(() => bad("浏览器 20 秒内没有启动"), 20000);
  chrome.stderr.on("data", (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(t); ok(m[1]); }
  });
});
const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接浏览器失败")); });
let seq = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown") {
    errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || "").split("\n")[0]);
  }
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.no(new Error(m.error.message));
    else p.ok(m.result);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((ok, no) => {
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
// REDUCE=1 用降低动效的偏好跑一遍。这条路径不是「动画快一点」，而是另一套布局，
// 必须单独验，否则很容易在动画全开的那条路上把降级分支漏掉。
if (process.env.REDUCE === "1") {
  await cdp("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  console.log("已启用 prefers-reduced-motion: reduce");
}
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(`脚本抛错: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
  return r.result.value;
};

await cdp("Page.navigate", { url });
for (let i = 0; i < 150; i++) {
  if (await evaluate("document.readyState === 'complete'")) break;
  await sleep(100);
}
await sleep(2000);
// 页面接管了平滑滚动，瞬时滚动 + 真实鼠标事件才点得中。
await evaluate(`document.documentElement.style.scrollBehavior = "auto"`);

async function shoot(name, clipSelector) {
  let params = { format: "png", captureBeyondViewport: false };
  if (clipSelector) {
    // captureBeyondViewport 的 clip 用的是文档坐标，不是视口坐标。少加一次
    // scrollX/scrollY 就会拍到视口上方那块空白，看起来像元素根本没渲染。
    const box = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(clipSelector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.max(0, r.left + window.scrollX),
        y: Math.max(0, r.top + window.scrollY),
        width: r.width,
        height: r.height,
      };
    })()`);
    if (!box) return console.log(`  clip ${name}: 没找到 ${clipSelector}`);
    params = { format: "png", captureBeyondViewport: true, clip: { ...box, scale: 1 } };
  }
  const { data } = await cdp("Page.captureScreenshot", params);
  writeFileSync(join(out, `${name}.png`), Buffer.from(data, "base64"));
  console.log(`  已截图 ${name}.png`);
}

async function click(selector) {
  const box = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!box) return console.log(`  click ${selector}: 没找到或不可见`);
  await sleep(500);
  const pt = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await cdp("Input.dispatchMouseEvent", {
      type,
      x: pt.x,
      y: pt.y,
      button: "left",
      buttons: type === "mousePressed" || type === "mouseMoved" ? 1 : 0,
      clickCount: 1,
    });
  }
  console.log(`  已点击 ${selector} @ (${Math.round(pt.x)}, ${Math.round(pt.y)})`);
}

async function hover(x, y, repeats = 6) {
  // A synthetic MouseEvent does not set :hover, so every CSS hover state has to
  // be driven with a real input event. Several moves in a row, not one: the
  // damped pointer fields need a few frames of history before they settle.
  for (let i = 0; i < repeats; i++) {
    await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 0 });
    await sleep(90);
  }
  console.log(`  已悬停 (${Math.round(x)}, ${Math.round(y)})`);
}

console.log(`视口 ${w}x${h}`);
for (const a of actions) {
  const colon = a.indexOf(":");
  const kind = a.slice(0, colon);
  const arg = a.slice(colon + 1);
  if (kind === "shot") await shoot(arg);
  else if (kind === "clip") { const i = arg.indexOf("="); await shoot(arg.slice(0, i), arg.slice(i + 1)); }
  else if (kind === "click") await click(arg);
  else if (kind === "hover") {
    const [hx, hy] = arg.split(",").map(Number);
    await hover(hx, hy);
  }
  else if (kind === "key") {
    const map = { Escape: 27, Enter: 13, ArrowRight: 39, ArrowLeft: 37, Tab: 9 };
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: arg, code: arg, windowsVirtualKeyCode: map[arg] || 0 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: arg, code: arg, windowsVirtualKeyCode: map[arg] || 0 });
    console.log(`  已按键 ${arg}`);
  }
  else if (kind === "wait") await sleep(Number(arg));
  else if (kind === "scroll") { await evaluate(`window.scrollTo(0, ${Number(arg)})`); console.log(`  已滚动到 ${arg}`); }
  else if (kind === "assert") { const i = arg.indexOf("="); console.log(`  断言 ${arg.slice(0, i)} = ${JSON.stringify(await evaluate(arg.slice(i + 1)))}`); }
  else console.log(`  未知动作 ${a}`);
  await sleep(350);
}

const overflow = await evaluate("({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })");
console.log(`横向溢出 ${overflow.sw - overflow.cw}px`);
if (errors.length) console.log(`页面异常（${errors.length}）：\n  ${[...new Set(errors)].slice(0, 10).join("\n  ")}`);

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);