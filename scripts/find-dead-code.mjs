// Computes src modules unreachable from every runtime root, plus node tests that only test them.
// Usage (from repo root): node scripts/find-dead-code.mjs .local/dead-code.json
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, posix } from 'node:path';

const repo = process.cwd();
const outJson = process.argv[2];
const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const norm = p => relative(repo, p).split('\\').join('/');
const srcFiles = tracked.filter(f => f.startsWith('src/') && /\.(tsx?|mjs|js|css)$/.test(f) && !f.endsWith('.d.ts'));

// Extract static and dynamic import specifiers (including `import type` and re-exports).
const specRe = /(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|@import\s+['"]([^'"]+)['"]/g;
const exts = ['', '.ts', '.tsx', '.mjs', '.js', '.css', '/index.ts', '/index.tsx', '/index.js'];
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('/src/')) return null;
  const base = spec.startsWith('/src/') ? resolve(repo, spec.slice(1)) : resolve(repo, dirname(fromFile), spec.split('?')[0]);
  for (const e of exts) { const p = base + e; if (existsSync(p) && tracked.includes(norm(p))) return norm(p); }
  return null;
}
const importsOf = file => { const text = readFileSync(file, 'utf8'); const out = new Set(); for (const m of text.matchAll(specRe)) { const r = resolveSpec(file, m[1] || m[2] || m[3]); if (r) out.add(r); } return out; };

async function reachable(roots) {
  const browser = roots.filter(r => r.startsWith('src/') || r.startsWith('.storybook/') || r.startsWith('tests/'));
  const node = roots.filter(r => !browser.includes(r));
  const common = { bundle: true, write: false, metafile: true, logLevel: 'silent', outdir: 'out', format: 'esm', splitting: true,
    loader: { '.css': 'empty', '.png': 'empty', '.jpg': 'empty', '.svg': 'empty', '.woff2': 'empty', '.woff': 'empty', '.ttf': 'empty' },
    external: ['node:*', '*?url', '*?raw', '/node_modules/*', '/src/*'] };
  const live = new Set();
  for (const [entries, extra] of [[browser, { platform: 'browser' }], [node, { platform: 'node', packages: 'external' }]]) {
    if (!entries.length) continue;
    const r = await build({ ...common, ...extra, entryPoints: entries });
    for (const input of Object.keys(r.metafile.inputs)) live.add(input.split('?')[0]);
  }
  // Type-only imports are erased by esbuild; keep anything a live file imports at all.
  let grew = true;
  while (grew) { grew = false; for (const f of [...live]) { if (!existsSync(f) || !/\.(tsx?|mjs|js|css)$/.test(f)) continue; for (const i of importsOf(f)) if (!live.has(i)) { live.add(i); grew = true; } } }
  return live;
}

const appRoots = ['src/main.tsx', 'src/rehearsal-main.tsx', 'src/collection-demo-main.tsx'];
const otherRoots = tracked.filter(f => /^(server|scripts)\/.*\.(mjs|js|ts)$/.test(f) || f === 'middleware.ts' || f === '.storybook/preview.tsx' || /^vite.*\.config\.ts$/.test(f));
// Files referenced by path string: e2e harness pages and Tailwind @source.
const stringRefs = new Set();
for (const f of tracked.filter(f => /^tests\/.*\.(ts|tsx|mjs|html)$/.test(f) || /^scripts\/.*\.(mjs|js)$/.test(f) || /\.(css|html)$/.test(f))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/['"(\s]\/?((?:\.\/)?src\/[A-Za-z0-9_./-]+\.(?:tsx?|mjs|css))/g)) { const p = posix.normalize(m[1]); if (tracked.includes(p)) stringRefs.add(p); }
  for (const m of readFileSync(f, 'utf8').matchAll(/@source\s+["']([^"']+)["']/g)) { const p = norm(resolve(repo, dirname(f), m[1])); if (tracked.includes(p)) stringRefs.add(p); }
}

const nodeTests = tracked.filter(f => /^tests\/[^/]+\.(test\.(tsx?|mjs)|browser\.mjs)$/.test(f));
let roots = [...appRoots, ...otherRoots, ...stringRefs];
let live, deadTests, keptTests;
for (;;) {
  live = await reachable(roots);
  const dead = new Set(srcFiles.filter(f => !live.has(f) && !f.startsWith('src/stories/')));
  deadTests = []; keptTests = [];
  let added = false;
  for (const t of nodeTests) {
    const srcImports = [...importsOf(t)].filter(i => i.startsWith('src/'));
    const deadImports = srcImports.filter(i => dead.has(i));
    if (!deadImports.length) continue;
    if (deadImports.length === srcImports.length) deadTests.push(t);
    else { keptTests.push({ test: t, keeps: deadImports }); for (const i of deadImports) if (!roots.includes(i)) { roots.push(i); added = true; } }
  }
  if (!added) break;
}
// Stories are Storybook entry points: delete one only when it imports a deleted module.
const dead = srcFiles.filter(f => !live.has(f) && !f.startsWith('src/stories/') && !/\.stories\.tsx?$/.test(f));
const deadSet = new Set(dead);
const stories = tracked.filter(f => /\.stories\.tsx?$/.test(f)).filter(s => [...importsOf(s)].some(i => deadSet.has(i)));
// Other tests (storybook vitest, e2e) that import dead modules would break: report them.
const otherBreaks = tracked.filter(f => /^tests\/.+\.(tsx?|mjs)$/.test(f) && !nodeTests.includes(f)).filter(f => [...importsOf(f)].some(i => deadSet.has(i)));
const lines = Object.fromEntries(dead.map(f => [f, readFileSync(f, 'utf8').split('\n').length]));
const keptForTests = roots.filter(r => !appRoots.includes(r) && !otherRoots.includes(r) && !stringRefs.has(r));
writeFileSync(outJson, JSON.stringify({ dead, deadTests, keptForTests, stories, otherBreaks, lines, stringRefs: [...stringRefs] }, null, 2));
writeFileSync(outJson.replace(/\.json$/, '.paths.txt'), [...dead, ...stories, ...deadTests].join('\n') + '\n');
console.log(`dead modules: ${dead.length} (${Object.values(lines).reduce((a, b) => a + b, 0)} lines)`);
console.log(`dead-only node tests: ${deadTests.length}; mixed tests keeping dead modules: ${keptTests.length}`);
console.log(`stories of dead modules: ${stories.length}; other test files importing dead modules: ${otherBreaks.length}`);
