// Measures how much of each delivered figure the page is actually cropping.
// Reads the rendered box next to the intrinsic size of the image being drawn,
// and reports the fraction of the source that object-fit: cover has to drop.
// A delivered crop is only intact when that fraction is ~0.
// Usage: node scripts/probe-figure-fit.mjs [width]
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

const profile = mkdtempSync(join(tmpdir(), "figfit-"));
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
  console.error(`probe: ${e}`);
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

async function probe(path, label, boxSel, imgSel) {
  await cdp("Page.navigate", { url: `${BASE}${path}` });
  for (let i = 0; i < 150; i++) {
    if (await evaluate("document.readyState === 'complete'")) break;
    await sleep(100);
  }
  // Images below the fold are lazy, and decode() on a never-loaded lazy image
  // never settles. Scroll the whole page instead so each one actually loads.
  await evaluate(`(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 200));
    await Promise.all([...document.images]
      .filter(i => i.loading !== "lazy" || i.naturalWidth > 0)
      .map(i => Promise.race([i.decode().catch(() => {}), new Promise(r => setTimeout(r, 400))])));
    return true;
  })()`);
  await sleep(800);

  const rows = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const boxes = [...document.querySelectorAll(${JSON.stringify(boxSel)})];
    const out = [];
    for (const box of boxes) {
      const b = box.getBoundingClientRect();
      const img = box.querySelector(${JSON.stringify(imgSel)}) || box.querySelector("img");
      const nat = img ? { w: img.naturalWidth, h: img.naturalHeight } : null;
      const natRatio = nat && nat.h ? nat.w / nat.h : null;
      const boxRatio = b.height ? b.width / b.height : null;
      let hidden = null, dir = "";
      if (natRatio && boxRatio) {
        if (natRatio > boxRatio) { hidden = 1 - boxRatio / natRatio; dir = "sides"; }
        else { hidden = 1 - natRatio / boxRatio; dir = "top/bottom"; }
      }
      const cap = box.parentElement && box.parentElement.querySelector("figcaption, .chapter-media-caption");
      out.push({
        cls: box.className,
        cap: cap ? cap.textContent.trim().slice(0, 46) : "",
        box: Math.round(b.width) + "x" + Math.round(b.height),
        boxRatio: boxRatio ? boxRatio.toFixed(3) : null,
        src: img ? img.currentSrc.split("/").pop() : null,
        nat: nat ? nat.w + "x" + nat.h : null,
        natRatio: natRatio ? natRatio.toFixed(3) : null,
        fit: img ? getComputedStyle(img).objectFit : null,
        hidden: hidden === null ? null : (hidden * 100).toFixed(1),
        dir,
      });
    }
    return out;
  })()`);

  console.log(`\n=== ${label} @ ${width}px ===`);
  if (!rows.length) { console.log("  (no match)"); return; }
  for (const r of rows) {
    const flag = r.hidden !== null && Number(r.hidden) > 1 ? `  <-- CROPPED ${r.dir}` : "";
    console.log(
      `  ${r.cap.padEnd(46)} ${r.box.padEnd(11)} box=${String(r.boxRatio).padEnd(6)} nat=${String(r.nat).padEnd(11)} natRatio=${String(r.natRatio).padEnd(6)} fit=${r.fit} hidden=${r.hidden}%${flag}`,
    );
    console.log(`     class="${r.cls}"  src=${r.src}`);
  }
}

await probe("/work/recoveryx", "case study / reflection plates", ".case-figure", "img");
await probe("/", "homepage chapter previews", ".chapter-media-link", "img");

await cdp("Target.closeTarget", { targetId });
await browser_close();
async function browser_close() {
  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}