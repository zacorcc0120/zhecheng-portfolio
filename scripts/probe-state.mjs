#!/usr/bin/env node
// 诊断：滚动时 Journey 的实时 state。同一屏「文案在第 3 步但设备还停在第 1 屏」
// 说明 active 状态没跟着 stageFloat 走，这里把 useScroll 拿到的每一个量都打出来，
// 顺便抓 console / 页面异常。
//
// 用法：node scripts/probe-state.mjs <地址> [宽] [高]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, wArg, hArg] = process.argv.slice(2);
if (!url) {
  console.error("用法：node scripts/probe-state.mjs <地址> [宽] [高]");
  process.exit(1);
}
const width = Number(wArg || 1440);
const height = Number(hArg || 900);

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ]) if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}

const profile = mkdtempSync(join(tmpdir(), "probe-state-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
function bail(e) {
  console.error(`probe-state: ${e}`);
  try { chrome.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(1);
}
process.on("exit", () => {
  try { chrome.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
});

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
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("连接失败")); });
let seq = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.consoleAPICalled") {
    logs.push(`[${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "));
  }
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    logs.push(`[exception] ${d.exception?.description || d.text}`);
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
await cdp("Network.enable");
const failures = [];
const pendingRequests = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Network.loadingFailed") {
    failures.push(`${pendingRequests.get(m.params.requestId) || "?"} — ${m.params.errorText} (${m.params.type})`);
  }
  if (m.method === "Network.requestWillBeSent") {
    pendingRequests.set(m.params.requestId, m.params.request.url);
  }
});
await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};

await cdp("Page.navigate", { url });
for (let i = 0; i < 120; i++) {
  if (await evaluate("document.readyState === 'complete'")) break;
  await sleep(100);
}

// 注水可能只是慢（dev server 首次编译很重），轮询等它，别急着下结论。
// 检测方式：全文档扫一遍，看有没有任何一个节点挂上了 React 的内部键 —— 只查
// 单个节点可能是那个子树被延迟了，扫全文档才能区分「整体没注水」和「局部」。
const hydrationScan = () =>
  evaluate(`(() => {
    let withReact = 0;
    const all = document.querySelectorAll("*");
    for (const el of all) {
      for (const k of Object.keys(el)) {
        if (k.startsWith("__reactFiber") || k.startsWith("__reactContainer")) { withReact++; break; }
      }
    }
    return { total: all.length, withReact };
  })()`);

let hydratedAt = -1;
for (let i = 0; i < 60; i++) {
  const s = await hydrationScan();
  if (s.withReact > 0) { hydratedAt = i * 400; console.log(`首次检测到注水：DOM ${s.total} 个节点中有 ${s.withReact} 个带 React 内部键。`); break; }
  await sleep(400);
}
if (hydratedAt < 0) {
  const s = await hydrationScan();
  console.log(`注水：等待 24s 仍未发生（DOM 共 ${s.total} 个节点，0 个带 React 内部键）。`);
} else {
  console.log(`注水在 load 之后约 ${hydratedAt}ms 完成。`);
}

if (hydratedAt < 0) {
  const scripts = await evaluate(`Array.from(document.querySelectorAll("script")).map((s) => ({
    src: s.src ? s.src.split("/").pop() : "(inline)",
    type: s.type || "classic",
    async: s.async,
    defer: s.defer,
  }))`);
  console.log(`\n脚本清单（${scripts.length} 个）：`);
  for (const s of scripts) console.log(`  ${s.type}${s.async ? " async" : ""}${s.defer ? " defer" : ""}  ${s.src}`);
  console.log(`\n失败的请求（${failures.length} 个）：`);
  for (const f of failures.slice(0, 20)) console.log("  " + f);
}

await sleep(2500);
await evaluate(`document.documentElement.style.scrollBehavior = "auto"`);

const geo = await evaluate(`(() => {
  const ol = document.querySelector(".jiko-journey-steps");
  if (!ol) return { error: "找不到 .jiko-journey-steps" };
  const r = ol.getBoundingClientRect();
  const body = document.querySelector(".jiko-journey-body");
  const stage = document.querySelector(".jiko-journey-stage");
  const stack = document.querySelector(".jiko-journey-stack");
  const cs = (el) => (el ? getComputedStyle(el) : null);
  return {
    stepsTop: Math.round(r.top + window.scrollY),
    stepsHeight: Math.round(r.height),
    bodyDisplay: body ? cs(body).display : "(none)",
    stagePosition: stage ? cs(stage).position : "(none)",
    stageTop: stage ? Math.round(stage.getBoundingClientRect().top + window.scrollY) : null,
    stackDisplay: stack ? cs(stack).display : "(none)",
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
})()`);
if (geo.error) bail(geo.error);
console.log("几何 / 环境：");
console.log(`  步骤列 顶 ${geo.stepsTop} 高 ${geo.stepsHeight}`);
console.log(`  .jiko-journey-body display=${geo.bodyDisplay}  .jiko-journey-stage position=${geo.stagePosition} 顶 ${geo.stageTop}`);
console.log(`  .jiko-journey-stack display=${geo.stackDisplay}   prefers-reduced-motion=${geo.reduceMotion}`);

const read = () =>
  evaluate(`(() => {
    const steps = Array.from(document.querySelectorAll(".jiko-journey-step"));
    const activeStep = steps.findIndex((s) => s.classList.contains("is-active"));
    const dots = Array.from(document.querySelectorAll(".jiko-journey-dots button"));
    const activeDot = dots.findIndex((b) => b.getAttribute("aria-current") !== null);
    const canvas = document.querySelector(".jiko-screen-canvas");
    const layers = canvas ? Array.from(canvas.querySelectorAll("g[data-layer]")).map((g) => ({
      layer: g.getAttribute("data-layer"),
      opacity: g.style.opacity || "(unset)",
    })) : [];
    return {
      scrollY: Math.round(window.scrollY),
      activeStep,
      activeDot,
      layers,
      stageText: (document.querySelector(".jiko-journey-step.is-active .jiko-journey-title") || {}).textContent || "(none)",
    };
  })()`);

const docH = () => evaluate("document.documentElement.scrollHeight");
const h0 = await docH();
await sleep(1200);
const h1 = await docH();
console.log(`\n文档高 加载后 ${h0} → 静置 1.2s 后 ${h1}${h1 === h0 ? "（未变）" : `（变了 ${h1 - h0}px，说明有资源迟到并推移了版面）`}`);

console.log("\n滚动过程：");
for (const y of [4136, 4600, 5036, 5500, 5936, 6400, 6836, 7300]) {
  await evaluate(`window.scrollTo(0, ${y})`);
  await sleep(700);
  const s = await read();
  console.log(
    `  y=${String(s.scrollY).padStart(5)}  step=${s.activeStep}  dot=${s.activeDot}  标题=${s.stageText.replace(/\s+/g, " ").trim()}  图层=[${s.layers.map((l) => `${l.layer}:${l.opacity}`).join("  ")}]`,
  );
}

// 关键区分：滚动值不动，是「framer 根本没收到滚动」，还是「它收到滚动但目标
// 的绝对位置是旧的」。手动派发一次 resize 让它重量一次，值会跟着走就是后者。
console.log("\n在同一滚动位置派发 resize，强制重量目标：");
await evaluate(`window.dispatchEvent(new Event("resize"))`);
await sleep(900);
const afterResize = await read();
console.log(`  y=${afterResize.scrollY}  step=${afterResize.activeStep}  dot=${afterResize.activeDot}  标题=${afterResize.stageText.replace(/\s+/g, " ").trim()}`);

// 另一个可能：整站滚动被某个自定义容器接管了，而不是 window。
const containers = await evaluate(`(() => {
  const out = [];
  let el = document.querySelector(".jiko-journey-steps");
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY)) {
      out.push(el.tagName.toLowerCase() + "." + (el.className || "").toString().split(" ").join(".") + " overflowY=" + cs.overflowY);
    }
    el = el.parentElement;
  }
  return out;
})()`);
console.log(`\n祖先链上的滚动容器：${containers.length ? containers.join(" | ") : "（无，只有 window 滚动）"}`);

// HMR 可能留下一棵孤儿树：探针读到的第一个节点未必是屏幕上那一棵。
const dom = await evaluate(`(() => {
  const q = (s) => document.querySelectorAll(s).length;
  const canvas = document.querySelector(".jiko-screen-canvas");
  const groups = canvas ? Array.from(canvas.querySelectorAll("g")).length : -1;
  const steps = Array.from(document.querySelectorAll(".jiko-journey-step"));
  return {
    sections: q(".jiko-journey"),
    stepLists: q(".jiko-journey-steps"),
    steps: steps.length,
    bodies: q(".jiko-journey-body"),
    devices: q(".jiko-device"),
    canvases: q(".jiko-screen-canvas"),
    dotGroups: q(".jiko-journey-dots"),
    canvasGroups: groups,
    stepTops: steps.map((s) => Math.round(s.getBoundingClientRect().top + window.scrollY)),
  };
})()`);
console.log(`\nDOM 概览：.jiko-journey=${dom.sections}  步骤列=${dom.stepLists}  步骤=${dom.steps}  body=${dom.bodies}  设备=${dom.devices}  画布=${dom.canvases}  圆点组=${dom.dotGroups}`);
console.log(`  画布内 <g> 数量 = ${dom.canvasGroups}   各步骤的文档坐标 = ${dom.stepTops.join(", ")}`);

// 是否真的 hydrate 了：React 在客户端渲染/注水之后才会往 DOM 节点上挂
// __reactFiber$* / __reactProps$* 这些内部键。SSR 完但没注水的话一个都没有。
const hydration = await evaluate(`(() => {
  const probe = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return sel + ": (找不到)";
    const keys = Object.keys(el).filter((k) => k.startsWith("__react"));
    return sel + ": " + (keys.length ? keys.join(",") : "无 React 内部键 → 未注水");
  };
  return [
    probe(".jiko-journey-steps"),
    probe(".jiko-journey-dots button"),
    probe(".site-header"),
  ];
})()`);
console.log("\n注水检查：");
for (const h of hydration) console.log("  " + h);

// 浏览器到底有没有派发 scroll？framer 的 useScroll 就是靠这个事件驱动的。
await evaluate(`(() => {
  window.__scrollEvents = 0;
  window.__lastScrollEvent = null;
  window.addEventListener("scroll", () => {
    window.__scrollEvents++;
    window.__lastScrollEvent = window.scrollY;
  }, { passive: true });
  return true;
})()`);
await evaluate(`window.scrollTo(0, 0)`);
await sleep(400);
await evaluate(`window.scrollTo(0, 5936)`);
await sleep(800);
const evts = await evaluate(`({ n: window.__scrollEvents, last: window.__lastScrollEvent, y: Math.round(window.scrollY), scrollingElement: document.scrollingElement.tagName })`);
console.log(`\n浏览器滚动事件：派发 ${evts.n} 次，最后一次 scrollY=${evts.last}，当前 scrollY=${evts.y}，scrollingElement=${evts.scrollingElement}`);

// framer 的另一个机制（IntersectionObserver）是否正常：结论段的 whileInView。
const outro = await evaluate(`(() => {
  const el = document.querySelector(".jiko-journey-outro");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), h: Math.round(r.height), opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform };
})()`);
if (outro) {
  await evaluate(`window.scrollTo(0, ${Math.max(0, 8000)})`);
  await sleep(1000);
  const outro2 = await evaluate(`(() => {
    const el = document.querySelector(".jiko-journey-outro");
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), opacity: getComputedStyle(el).opacity };
  })()`);
  console.log(`结论段 whileInView：初始 opacity=${outro.opacity} → 滚到后 opacity=${outro2.opacity}（1 表示 IntersectionObserver 那套正常）`);
}

console.log(`\nconsole / 异常（共 ${logs.length} 条）：`);
for (const l of logs.slice(0, 25)) console.log("  " + l);

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);