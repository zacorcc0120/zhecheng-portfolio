// 抓 console 的 CDP 探针。three.js 的着色器编译失败只会打一条 console.error，
// 画面表现是完全空白——不抓 console 的话根本分不清是"几何没画出来"还是
// "根本不是画错了，是 shader 没编译过"。
//
// 用法：node scripts/gl-probe.mjs <地址> <选择器> [宽] [高]
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, selector, wArg, hArg] = process.argv.slice(2);
if (!url || !selector) {
  console.error("用法：node scripts/gl-probe.mjs <地址> <选择器> [宽] [高]");
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

const profile = mkdtempSync(join(tmpdir(), "glprobe-"));
const chrome = spawn(findChrome(), [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-extensions", "--force-device-scale-factor=1", "--use-gl=angle",
  "--enable-unsafe-swiftshader", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const bail = (e) => {
  console.error(`gl-probe: ${e}`);
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
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("ws 连接失败")); });

let seq = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.no(new Error(m.error.message));
    else p.ok(m.result);
    return;
  }
  if (m.method === "Runtime.consoleAPICalled") {
    const txt = (m.params.args || [])
      .map((a) => a.value ?? a.description ?? a.unserializableValue ?? `[${a.type}]`)
      .join(" ");
    logs.push({ level: m.params.type, text: txt });
  }
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    logs.push({ level: "exception", text: d.exception?.description || d.text });
  }
  if (m.method === "Log.entryAdded") {
    logs.push({ level: `log:${m.params.entry.level}`, text: m.params.entry.text });
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

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cdp = (m, p) => send(m, p, sessionId);
await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Log.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

await cdp("Page.navigate", { url });
await sleep(4000);
await evaluate(`window.scrollTo(0, document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().top + scrollY)`);
await sleep(4000);

const probe = await evaluate(`(async () => {
  const host = document.querySelector(${JSON.stringify(selector)});
  if (!host) return { found: false };
  const cv = host.querySelector('canvas');
  if (!cv) return { found: true, canvas: false };
  const gl = cv.getContext('webgl2') || cv.getContext('webgl');
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const out = {
    found: true,
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a',
    size: [cv.width, cv.height],
    rect: (() => { const r = cv.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })(),
  };
  // The canvas is created with alpha, so anything the form did not cover is
  // fully transparent. The bounding box of the covered pixels is therefore the
  // object's real position in the frame — which is the only way to tell whether
  // the framing is right, since eyeballing a screenshot of a pale object on a
  // pale ground is guesswork.
  out.coverage = await new Promise(res => requestAnimationFrame(() => {
    const w = cv.width, h = cv.height;
    const buf = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    // Threshold matters: the contact shadow is a large, very faint plane under
    // the object, and at a low alpha cut it counts as "the object" and drags the
    // bounding box down to the bottom of the frame. 110 keeps the solid form and
    // drops the shadow.
    const TH = 110;
    let minX = w, maxX = -1, minY = h, maxY = -1, n = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (buf[(y * w + x) * 4 + 3] > TH) {
          n++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return res({ pixels: 0 });
    // readPixels origin is bottom-left; report in top-left percentages so the
    // numbers can be read straight off a screenshot.
    res({
      pixels: n,
      fill: +(n / (w * h) * 100).toFixed(1),
      left: +(minX / w * 100).toFixed(1),
      right: +(maxX / w * 100).toFixed(1),
      top: +((h - 1 - maxY) / h * 100).toFixed(1),
      bottom: +((h - 1 - minY) / h * 100).toFixed(1),
    });
  }));
  out.glError = gl.getError();
  return out;
})()`);

console.log("=== PROBE ===");
console.log(JSON.stringify(probe, null, 2));
console.log("=== CONSOLE (" + logs.length + ") ===");
for (const l of logs) {
  const body = l.text.length > 2600 ? l.text.slice(0, 2600) + " …[truncated]" : l.text;
  console.log(`[${l.level}] ${body}`);
}
bail("done");
