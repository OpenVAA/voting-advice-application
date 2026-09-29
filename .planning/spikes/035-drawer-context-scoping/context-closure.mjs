// Static transitive-import walk: which get*Context() calls can the drawer-hosted subtrees reach?
// Usage: node context-closure.mjs <entry.svelte> [...]
import fs from 'node:fs';
import path from 'node:path';
const FE = path.resolve('apps/frontend');
const ALIAS = { $lib: 'src/lib', $types: 'src/lib/types', $candidate: 'src/lib/candidate', $layouts: 'src/lib/layouts' };
function resolve(spec, from) {
  let base;
  if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else { const k = Object.keys(ALIAS).find((a) => spec === a || spec.startsWith(a + '/')); if (!k) return null; base = path.join(FE, ALIAS[k], spec.slice(k.length)); }
  for (const c of [base, base + '.ts', base + '.svelte.ts', base + '.svelte', path.join(base, 'index.ts')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}
const seen = new Set(); const hits = new Map();
function walk(file) {
  if (seen.has(file)) return; seen.add(file);
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\b(get[A-Z]\w*Context)\s*\(/g)) { if (/export function/.test(src.slice(Math.max(0, m.index - 20), m.index))) continue; const s = hits.get(m[1]) ?? new Set(); s.add(path.relative(FE, file)); hits.set(m[1], s); }
  for (const m of src.matchAll(/\bgetContext\s*[<(]/g)) { const s = hits.get('getContext(raw)') ?? new Set(); s.add(path.relative(FE, file)); hits.set('getContext(raw)', s); }
  if (file.includes('/lib/contexts/')) return; // a context module's own imports are not consumers
  for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]/g)) { const r = resolve(m[1], file); if (r) walk(r); }
}
for (const e of process.argv.slice(2)) walk(path.resolve(e));
console.log(`files reached: ${seen.size}`);
for (const [k, v] of [...hits].sort()) console.log(`${k.padEnd(24)} ${v.size} file(s): ${[...v].slice(0, 6).join(', ')}${v.size > 6 ? ' …' : ''}`);
