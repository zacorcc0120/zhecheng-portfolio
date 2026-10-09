// 量一下 TIME INTO MEMORY 的真实滚动映射：把每个阶段滚到阅读线，
// 读回实际的 scrollY、framer 写进 SVG 的 transform，以及当前激活阶段。
//
// 用法：node scripts/probe-journey.mjs <地址> [宽] [高]
//
// 为什么要有这个：阶段进度是 useScroll + useTransform 算出来的，光看源码推不出
// 真实值。offset 用 start/end center 时，可滚距离等于元素本身高度而不是它的
// 三分之四——之前按 3 倍映射就错了 4/3，最后一阶段的到达动画被 clamp 成 0，
// 整块内容直接消失。这个脚本就是用来在改映射之后实测一遍的。
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, wArg, hArg] = process.argv.slice(2);
if (!url) {
  console.error("用法：node scripts/probe-journey.mjs <地址> [宽] [高]");
  process.exit(1);
}
const width = Number(wArg || 1440);
const height = Number(hArg || 900);

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ])
    if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}

const profile = mkdtempSync(join(tmpdir(), "probe-journey-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const bail = (e) => {
  console.error(`probe-journey: ${e}`);
  try { chrome.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(1);
};
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
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
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
await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
await sleep(1500);

const geometry = await evaluate(`(() => {
  const ol = document.querySelector(".jiko-journey-steps");
  if (!ol) return { error: "找不到 .jiko-journey-steps" };
  const b = ol.getBoundingClientRect();
  return {
    stepsHeight: Math.round(b.height),
    stepsTop: Math.round(b.top + window.scrollY),
    innerHeight: window.innerHeight,
    docHeight: document.documentElement.scrollHeight,
    stepCount: ol.children.length,
  };
})()`);
if (geometry.error) bail(geometry.error);
console.log(`视口 ${width}x${height}`);
console.log(
  `步骤列 高 ${geometry.stepsHeight} / 顶部 ${geometry.stepsTop} / 共 ${geometry.stepCount} 步 / 文档高 ${geometry.docHeight}`,
);

await evaluate(`document.documentElement.style.scrollBehavior = "auto"`);

const read = async () =>
  evaluate(`(() => {
    const active = document.querySelector(".jiko-journey-dots button[aria-current]");
    const canvas = document.querySelector(".jiko-screen-canvas");
    // 画布的直接子级依次是：时间轴脊、未来脊、四层界面。
    const layers = canvas
      ? Array.from(canvas.children)
          .map((g, i) => \`\${i}:inline=\${g.style.opacity || "-"}/计算=\${Number(getComputedStyle(g).opacity).toFixed(2)}\`)
          .join("  ")
      : "(无画布)";
    // 周条高亮：宽 30 高 64 的圆角矩形，位置由 framer 写成 CSS transform。
    const pill = canvas ? canvas.querySelector('rect[width="30"][height="64"]') : null;
    const pillX = pill ? getComputedStyle(pill).transform : "(none)";
    // 被选中的那一天的日期数字：pill 落在谁身上，谁就是高亮。
    const day = canvas
      ? Array.from(canvas.querySelectorAll("text")).filter((t) => /^\\d{2}$/.test(t.textContent.trim()))
      : [];
    return {
      scrollY: Math.round(window.scrollY),
      active: active ? active.textContent.trim() : "(none)",
      layers,
      pillX,
      hasRunningRow: canvas ? canvas.textContent.includes("记录中") : false,
      days: day.map((t) => t.textContent.trim()).join(","),
    };
  })()`);

console.log("\n每个阶段滚到阅读线之后：");
const total = geometry.stepsHeight;
for (let k = 0; k < geometry.stepCount; k++) {
  // scrollY that puts step k's top on the viewport's vertical middle.
  const target = geometry.stepsTop + (k * total) / geometry.stepCount - geometry.innerHeight / 2;
  await evaluate(`window.scrollTo(0, ${target})`);
  await sleep(900);
  const state = await read();
  console.log(
    `  step ${k + 1}: scrollY=${String(state.scrollY).padStart(6)}  active=${state.active.padEnd(14)} 图层[${state.layers}]  pill=${state.pillX}  有进行中记录=${state.hasRunningRow}`,
  );
}

// The tail: how much readable scroll is left after the last step is centred.
const lastCentre = geometry.stepsTop + total - geometry.innerHeight / 2;
const endOfSteps = geometry.stepsTop + total - geometry.innerHeight;
console.log(
  `\n最后一阶段居中后仍可继续滚动 ${Math.round(endOfSteps - lastCentre)}px，然后该阶段才退出。`,
);

const overflow = await evaluate(
  "({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })",
);
console.log(`横向溢出 ${overflow.sw - overflow.cw}px`);

try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);