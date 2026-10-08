// Asserts that a delivered figure is drawn uncropped, by reading what the
// browser actually painted: the scale the image is drawn at versus its own
// natural size. A scale above 1 on either axis means object-fit: cover is
// magnifying, i.e. part of the source is outside the frame.
// Usage: node scripts/verify-figure-uncropped.mjs [width]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const width = Number(process.argv[2] || 1440);
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";

function findChrome() {
  for (const c of [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ])
    if (c && existsSync(c)) return c;
  throw new Error("找不到 Chrome / Edge");
}

const profile = mkdtempSync(join(tmpdir(), "uncrop-"));
const chrome = spawn(
  findChrome(),
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--mute-audio",
    "--disable-extensions",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
const bail = (e) => {
  console.error(`verify: ${e}`);
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
await cdp("Emulation.setDeviceMetricsOverride", {
  width,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) bail(r.exceptionDetails.exception?.description || "页面脚本抛错");
  return r.result.value;
};

async function check(path, label, boxSel) {
  await cdp("Page.navigate", { url: `${BASE}${path}` });
  for (let i = 0; i < 150; i++) {
    if (await evaluate("document.readyState === 'complete'")) break;
    await sleep(100);
  }
  // Walk the page so lazy images actually load, then settle.
  await evaluate(`(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 140));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));
    return true;
  })()`);
  await sleep(1500);

  const rows = await evaluate(`(() => {
    const out = [];
    for (const box of document.querySelectorAll(${JSON.stringify(boxSel)})) {
      const img = box.querySelector("img");
      if (!img) continue;
      const b = box.getBoundingClientRect();
      const nw = img.naturalWidth, nh = img.naturalHeight;
      if (!nw || !nh) { out.push({ src: img.currentSrc.split("?")[0].split("/").pop(), loaded: false }); continue; }
      // object-fit: cover draws the image scaled so both axes are covered.
      const scale = Math.max(b.width / nw, b.height / nh);
      out.push({
        src: img.currentSrc.split("?")[0].split("/").pop(),
        loaded: true,
        box: Math.round(b.width) + "x" + Math.round(b.height),
        boxRatio: (b.width / b.height).toFixed(3),
        nat: nw + "x" + nh,
        natRatio: (nw / nh).toFixed(3),
        // 1.000 means drawn exactly at its own size, nothing outside the frame.
        scale: scale.toFixed(4),
        cropped: scale > 1.001,
      });
    }
    return out;
  })()`);

  console.log(`\n=== ${label} @ ${width}px ===`);
  let bad = 0;
  for (const r of rows) {
    if (!r.loaded) { console.log(`  ${String(r.src).padEnd(30)} NOT LOADED — 无法判定`); bad++; continue; }
    const flag = r.cropped ? `  <-- CROPPED (放大到 ${r.scale}×)` : "  ok";
    if (r.cropped) bad++;
    console.log(
      `  ${String(r.src).padEnd(30)} box=${r.box.padEnd(11)}(${r.boxRatio}) nat=${r.nat.padEnd(11)}(${r.natRatio}) scale=${r.scale}${flag}`,
    );
  }
  return bad;
}

const a = await check("/work/recoveryx", "case study / plates", ".case-figure-image");
const b = await check("/", "homepage chapter previews", ".chapter-media-link");

console.log(`\n判定：${a + b === 0 ? "全部未裁切" : `${a + b} 处仍有问题`}`);
try { ws.close(); } catch {}
try { chrome.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(a + b === 0 ? 0 : 1);