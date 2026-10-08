// READ-ONLY diagnostic. Pretty-prints a build artifact from .next/static/css so
// it can be used as ground truth when diffing the hand-authored source.
//
// Guard: an existing tmp/built-*.css is a SNAPSHOT of a specific earlier build.
// `npm run build` overwrites .next, so re-running this would silently replace
// the ground truth with the current source's own output and the diff would
// report "no differences" forever. Refuse unless --force is passed.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const root = process.cwd();
const buildDir = path.join(root, '.next', 'static', 'css');
const outDir = path.join(root, 'tmp');
const force = process.argv.includes('--force');

const existing = fs.existsSync(outDir)
  ? fs.readdirSync(outDir).filter((f) => f.startsWith('built-') && f.endsWith('.css'))
  : [];
if (existing.length && !force) {
  console.error(
    `tmp/ already holds a snapshot: ${existing.join(', ')}\n` +
      'Re-running would overwrite the ground truth with the current build and make\n' +
      'diff-css-vs-build.mjs report "no differences" no matter what the source says.\n' +
      'Pass --force only when you deliberately want a fresh snapshot.'
  );
  process.exit(1);
}

const files = fs.existsSync(buildDir)
  ? fs.readdirSync(buildDir).filter((f) => f.endsWith('.css'))
  : [];
if (!files.length) {
  console.error('no built css found');
  process.exit(1);
}

function serialize(container, indent, lines) {
  for (const n of container.nodes || []) {
    const pad = '  '.repeat(indent);
    if (n.type === 'rule') {
      lines.push(`${pad}${n.selector} {`);
      serialize(n, indent + 1, lines);
      lines.push(`${pad}}`);
    } else if (n.type === 'atrule' && n.nodes) {
      lines.push(`${pad}@${n.name}${n.params ? ' ' + n.params : ''} {`);
      serialize(n, indent + 1, lines);
      lines.push(`${pad}}`);
    } else if (n.type === 'atrule') {
      lines.push(`${pad}@${n.name}${n.params ? ' ' + n.params : ''};`);
    } else if (n.type === 'decl') {
      lines.push(`${pad}${n.prop}: ${n.value}${n.important ? ' !important' : ''};`);
    } else if (n.type === 'comment') {
      lines.push(`${pad}/* ${n.text.trim()} */`);
    }
  }
  return lines;
}

const outDir = path.join(root, 'tmp');
fs.mkdirSync(outDir, { recursive: true });
for (const f of files) {
  const p = path.join(buildDir, f);
  const ast = postcss.parse(fs.readFileSync(p, 'utf8'), { from: p });
  const lines = serialize(ast, 0, []);
  const dest = path.join(outDir, `built-${f}`);
  fs.writeFileSync(dest, lines.join('\n') + '\n', 'utf8');
  console.log(`${dest}  ${lines.length} lines`);
}
