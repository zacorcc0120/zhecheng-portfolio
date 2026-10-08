// READ-ONLY diagnostic. Tolerant brace-matching parser for the hand-authored
// globals.css (works even while the file is damaged), compared against the
// pre-damage build artifact produced by scripts/beautify-built-css.mjs.
//
// The build pipeline flattens nested @media and normalises at-rule params, so
// the source is put through the same normalisation before comparing:
//   @media A { @media B { .x {} } }   ->   "@media A and B > .x"
//   "(max-width: 700px)"              ->   "(max-width:700px)"
//
// Each rule is keyed by its at-rule ancestry plus selector, so `.sd-questions`
// at top level and inside @media are compared separately. Declaration order is
// ignored because the build artifact reorders declarations.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const currentPath = path.join(root, 'src', 'app', 'globals.css');
const buildDir = path.join(root, 'tmp');

const normParams = (s) => s.replace(/\s+/g, ' ').replace(/\s*:\s*/g, ':').trim();

// lightningcss rewrites a few value forms, so compare on a normalised value:
// `#11111138` -> `rgba(17,17,17,.22)`, `0.7fr` -> `.7fr`, spaces dropped.
function normValue(v) {
  let s = v.replace(/\s+/g, '');
  s = s.replace(
    /#([0-9a-f]{8})/gi,
    (_, h) => {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      const a = parseInt(h.slice(6, 8), 16) / 255;
      const short = (n) => String(Math.round(n * 1000) / 1000);
      return `rgba(${r},${g},${b},${short(a)})`;
    }
  );
  s = s.replace(/(^|[(,])0+\./g, '$1.');
  return s.toLowerCase();
}


function collect(text) {
  const rules = new Map();
  let buf = '';
  let i = 0;
  const n = text.length;
  // Each occurrence of a selector is kept as its own entry, so two blocks that
  // share a key (e.g. two @media (max-width:640px) sections) are compared
  // position-by-position instead of being silently merged.
  const addDecls = (key, body) => {
    if (!key) return;
    if (!rules.has(key)) rules.set(key, []);
    const set = new Set();
    for (const d of body.split(';')) {
      // The build minifier drops spaces inside values, so compare with all
      // whitespace removed from the value. Selectors are not touched.
      const t = d.replace(/\s+/g, ' ').trim();
      if (t && !t.startsWith('*')) {
        const i = t.indexOf(':');
        if (i > 0) set.add(normValue(t.slice(0, i + 1)) + normValue(t.slice(i + 1)));
        else set.add(normValue(t));
      }
    }
    rules.get(key).push(set);
  };

  // Every block pushes a frame, so `}` pops exactly what its `{` pushed. An
  // earlier version popped the media stack on every `}`, which mis-attributed
  // declarations to the enclosing @media and hid real damage.
  const stack = []; // { kind: 'media'|'rule'|'anon'|'at', key }
  const mediaChain = () => stack.filter((f) => f.kind === 'media').map((f) => f.key);

  while (i < n) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = text.indexOf(c, i + 1);
      i = end === -1 ? n : end + 1;
      continue;
    }
    if (c === '{') {
      const prelude = buf.replace(/\s+/g, ' ').trim();
      buf = '';
      if (!prelude) {
        // Anonymous block (nested rule grouping): inherit the enclosing key.
        const keys = keysFor(mediaChain(), null);
        stack.push({ kind: 'anon', keys });
        for (const k of keys) addDecls(k, '');
      } else if (prelude.startsWith('@media')) {
        stack.push({ kind: 'media', key: normParams(prelude.slice(6)) });
        for (const k of keysFor(mediaChain(), null)) addDecls(k, '');
      } else if (prelude.startsWith('@')) {
        // @keyframes / @font-face / @layer / @supports: key by the at-rule.
        const keys = [`@${normParams(prelude.slice(1))}`];
        stack.push({ kind: 'at', keys });
        for (const k of keys) addDecls(k, '');
      } else {
        const keys = keysFor(mediaChain(), prelude);
        stack.push({ kind: 'rule', keys });
        for (const k of keys) addDecls(k, '');
      }
      i += 1;
      continue;
    }
    if (c === '}') {
      const frame = stack.pop();
      // Declarations belong to the block being closed; an anon frame inherits
      // the key of whatever is still on the stack.
      const keys = frame ? frame.keys : keysFor(mediaChain(), null);
      for (const k of keys ?? []) addDecls(k, buf);
      buf = '';
      i += 1;
      continue;
    }
    if (c === ';') {
      // A `;` inside a block separates declarations and must stay in the
      // buffer. Only a top-level `;` ends a statement at-rule
      // (e.g. `@layer a, b, c;`), which is flushed away.
      if (stack.length === 0) {
        addDecls('', buf);
        buf = '';
      } else {
        buf += c;
      }
      i += 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  return rules;
}

// One key per individual selector, because the minifier both sorts a rule's
// selector list and merges separate rules that share declarations
// (`.a,.b{}` vs `.a{} .b{}`). Splitting makes those compare equal. `::before`
// and `:before` are likewise the same selector to lightningcss.
function normSel(s) {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s*([>+~])\s*/g, '$1') // `.a > .b` and `.a>.b` are the same selector
    .replace(/::/g, ':')
    .trim();
}
function keysFor(mediaStack, sel) {
  const media = mediaStack.filter(Boolean);
  const head = media.length ? `@media ${media.join(' and ')}` : '';
  if (!sel) return head ? [head] : [];
  const parts = sel.split(',').map(normSel).filter(Boolean).sort();
  return parts.map((p) => (head ? `${head} > ${p}` : p));
}

const buildFile = fs
  .readdirSync(buildDir)
  .find((f) => f.startsWith('built-') && f.endsWith('.css'));
if (!buildFile) {
  console.error('run scripts/beautify-built-css.mjs first');
  process.exit(1);
}

const build = collect(fs.readFileSync(path.join(buildDir, buildFile), 'utf8'));
const current = collect(fs.readFileSync(currentPath, 'utf8'));

// Occurrence order can differ legitimately (e.g. a selector later moved into a
// different @media block), so compare each key as a sorted multiset of its
// occurrence sets.
const sig = (sets) =>
  sets
    .map((s) => [...s].sort().join(';'))
    .sort()
    .join(' || ');

const buildSig = new Map([...build].map(([k, v]) => [k, sig(v)]));
const currentSig = new Map([...current].map(([k, v]) => [k, sig(v)]));

const missing = [];
const changed = [];
const extra = [];
for (const [k, decls] of build) {
  const b = buildSig.get(k);
  if (!currentSig.has(k)) {
    missing.push({ k, decls });
    continue;
  }
  if (currentSig.get(k) !== b) {
    const curSet = current.get(k);
    const pairs = [];
    for (const s of decls) {
      const text = [...s].sort().join('; ');
      const hit = curSet.find((c) => [...c].sort().join('; ') === text);
      pairs.push(hit ? `      = ${text}` : `      - ${text}`);
    }
    for (const s of curSet) {
      const text = [...s].sort().join('; ');
      if (!decls.find((d) => [...d].sort().join('; ') === text))
        pairs.push(`      + ${text}`);
    }
    changed.push({ k, pairs });
  }
}
for (const [k, decls] of current) {
  if (!buildSig.has(k) && decls.some((s) => s.size)) extra.push(k);
}

const ROUND8 = /(\.pj|\.at-|\.sd|\.fs|\.ra-|\.rq|\.case-outcome-status)/;
// Only flag media blocks that actually contain a round-8 selector; a bare
// "@media (...)" key would otherwise pull in every breakpoint in the file.
const isR8 = (k) => {
  const sel = k.includes(' > ') ? k.slice(k.indexOf(' > ') + 3) : k;
  return ROUND8.test(sel);
};

const r8Missing = missing.filter((x) => isR8(x.k));
const r8Changed = changed.filter((c) => isR8(c.k));
const r8Extra = extra.filter(isR8);
const flat = (sets) =>
  [...new Set(sets.flatMap((s) => [...s]))].sort().join('; ') || '(empty)';

console.log(`build rules ${build.size} / source rules ${current.size}`);
console.log(
  `ALL      missing ${missing.length}  changed ${changed.length}  extra ${extra.length}`
);
console.log(
  `ROUND 8  missing ${r8Missing.length}  changed ${r8Changed.length}  extra ${r8Extra.length}`
);
console.log('');
console.log(`=== ROUND 8 MISSING (${r8Missing.length}) ===`);
for (const m of r8Missing) {
  console.log(`  ${m.k}`);
  console.log(`      build had: ${flat(m.decls)}`);
}
console.log(`=== ROUND 8 CHANGED (${r8Changed.length}) ===`);
for (const c of r8Changed) {
  console.log(`  ${c.k}`);
  for (const p of c.pairs) console.log(p);
}
console.log(`=== ROUND 8 EXTRA (${r8Extra.length}) ===`);
for (const k of r8Extra) console.log(`  ${k}`);

if (process.argv[2] === '--all') {
  console.log('');
  console.log(`=== ALL MISSING (${missing.filter((x) => !isR8(x.k)).length}) ===`);
  for (const m of missing.filter((x) => !isR8(x.k))) {
    console.log(`  ${m.k}`);
    console.log(`      build had: ${flat(m.decls)}`);
  }
  console.log(`=== ALL CHANGED (${changed.filter((c) => !isR8(c.k)).length}) ===`);
  for (const c of changed.filter((x) => !isR8(x.k))) {
    console.log(`  ${c.k}`);
    for (const p of c.pairs) console.log(p);
  }
  console.log(`=== ALL EXTRA (${extra.filter((x) => !isR8(x)).length}) ===`);
  for (const k of extra.filter((x) => !isR8(x))) console.log(`  ${k}`);
}
