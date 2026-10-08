import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Run a normal Next dev server on port 3000. Normalize optional preview-host
// arguments without changing Next.js itself or the Vercel production build.
const incoming = process.argv.slice(2);
const args = incoming
  .filter((arg) => arg !== "--strictPort")
  .map((arg) => (arg === "--host" ? "--hostname" : arg));
const cli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const child = spawn(process.execPath, [cli, "dev", "--webpack", ...args], {
  stdio: "inherit",
  env: process.env,
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
