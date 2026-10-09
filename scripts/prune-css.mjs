// Remove CSS rules whose selectors only target classes that no longer exist.
//
// Editing globals.css by hand leaves whole dead sections behind, and a dead
// block is not inert: it still competes on specificity with whatever replaced
// it. Selector-level rather than line-range, because the dead rules are spread
// through several media queries and only some selectors in a given list are
// dead — `.method-note` and `.works-title` can share one rule, and dropping the
// whole rule would take the works layout with it.
//
// Braces are counted. A media query's contents are many rules, not one, and a
// parser that treats the first inner `}` as the end of the query silently eats
// the rest of the file.
//
//   node scripts/prune-css.mjs [--dry]
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");

// Exact class names. A prefix match would be wrong here: `.lattice-method` and
// `.handoff-rule` both contain something in this list and both are alive.
const DEAD = new Set([
  "method",
  "method-head",
  "method-title",
  "method-note",
  "method-chain",
  "method-chain-index",
  "method-chain-id",
  "method-chain-detail",
  "method-disc",
  "method-disc-index",
  "method-disc-name",
  "method-disc-detail",
  "method-disc-note",
  "method-tools",
  "method-stage",
  "method-body",
  "manifesto",
  "manifesto-statement",
  "manifesto-body",
  "manifesto-lead",
  "form-field",
  "form-field-head",
  "form-field-foot",
  "form-field-caption",
  "form-field-mode",
  "form-field-btn",
  "living-process",
  "living-process-head",
  "practice-intro",
]);

const isDeadSelector = (sel) => {
  const classes = [...sel.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)].map((m) => m[1]);
  if (!classes.length) return false;
  return classes.every((c) => DEAD.has(c));
};

const file = "src/app/globals.css";
const lines = readFileSync(file, "utf8").split("\r\n");

const out = [];
const removed = [];

/** Prune a flat list of lines; recurses into at-rules. */
function prune(lines, baseIndent) {
  const acc = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const open = (line.match(/\{/g) || []).length;
    const close = (line.match(/\}/g) || []).length;

    if (open === 0 || open - close <= 0) {
      acc.push(line);
      i += 1;
      continue;
    }

    const indent = line.match(/^\s*/)[0];
    let depth = 0;
    let end = i;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
      end = j;
      if (depth <= 0) break;
    }
    const body = lines.slice(i, end + 1);
    const sel = body[0].replace(/\s*\{.*$/, "").trim();
    const isRule =
      open === close + 1 && !sel.startsWith("@") && !/^\d+%$|^from$|^to$/.test(sel);

    if (!isRule) {
      // A container (@media, @supports, @keyframes). If it holds real rules,
      // prune inside it; if it is a plain at-rule, pass it through untouched.
      const hasInnerRules = body.slice(1, -1).some((l) => l.trim().endsWith("{"));
      if (hasInnerRules) {
        const inner = prune(body.slice(1, -1), indent);
        acc.push(body[0], ...inner, body[body.length - 1]);
      } else {
        acc.push(...body);
      }
      i = end + 1;
      continue;
    }

    const inner = body.slice(1, -1);
    const parts = sel.split(",").map((s) => s.trim());
    const keep = parts.filter((p) => !isDeadSelector(p));
    if (keep.length === parts.length) {
      acc.push(...body);
    } else if (keep.length === 0) {
      removed.push(`${baseIndent}${sel}`);
    } else {
      removed.push(`${baseIndent}${sel}   (kept ${keep.length}/${parts.length})`);
      acc.push(`${indent}${keep.join(",\n" + indent)} {`, ...inner, `${indent}}`);
    }
    i = end + 1;
  }
  return acc;
}

const result = prune(lines, "");
for (const r of removed) out.push("  - " + r);

console.log(`removed ${removed.length} rules:`);
removed.forEach((r) => console.log("  - " + r.slice(0, 100)));
if (!DRY) {
  writeFileSync(file, result.join("\r\n"));
  console.log(`written: ${lines.length} -> ${result.length} lines`);
}
