#!/usr/bin/env node
/**
 * 169-version-probe.mjs -- the Phase 169 version/age table (D-33), evaluated under the D-03 age rule.
 *
 * Usage:
 *   node 169-version-probe.mjs [--out <path>] [--only <pkg,pkg,...>] [--node <version>] [--as-of <ISO>]
 *
 * Inputs (all read from the repository root, two levels above this file's phase directory):
 *   - every dependency block (dependencies, devDependencies, optionalDependencies, peerDependencies) of the
 *     root manifest and every apps/* and packages/* manifest;
 *   - the `catalog:` block of .yarnrc.yml (a `catalog:` value resolves through it);
 *   - yarn.lock (descriptor -> `version:`), which gives the RESOLVED version of each declared range.
 *
 * For each distinct registry package (`workspace:` and `@openvaa/*` skipped) it runs
 * `npm view <pkg> time dist-tags engines versions --json` (execFileSync, no shell) and computes:
 *   - target  = the newest non-prerelease version at least 7 days old whose major is either a resolved major or a
 *               newer major whose x.0.0 is at least 30 days old (a 0.x minor counts as a major);
 *   - the target's publish date and age, the target major's x.0.0 date, the target's engines.node and whether it
 *     admits --node;
 *   - a verdict: current | in-major | major | HOLD-30d (a newer major exists, x.0.0 under 30 days, nothing else
 *     to take) | HOLD-7d (the newest in-line release is under 7 days, nothing older to take); the "held back"
 *     column lists every hold that applies even when the verdict is in-major or major;
 *   - the owning D-25 group from a static map. A `major` verdict on a G0 package is flagged UNASSIGNED-MAJOR.
 *
 * Also prints a "youngest releases" list (non-prerelease versions under 7 days old) used by the age-gate binding
 * proof. Any registry error exits 1 before anything is written: a partial table is never produced.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_AGE_DAYS = 7;
const MIN_MAJOR_AGE_DAYS = 30;

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
const opts = { out: '', only: null, node: '', asOf: new Date() };
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  const next = () => {
    if (i + 1 >= argv.length) fail(`${a} requires a value`, 2);
    i += 1;
    return argv[i];
  };
  if (a === '--out') opts.out = resolve(process.cwd(), next());
  else if (a === '--only') opts.only = new Set(next().split(',').map((s) => s.trim()).filter(Boolean));
  else if (a === '--node') opts.node = next().replace(/^v/, '');
  else if (a === '--as-of') {
    const d = new Date(next());
    if (Number.isNaN(d.getTime())) fail(`--as-of is not a date`, 2);
    opts.asOf = d;
  } else fail(`unknown argument '${a}'`, 2);
}

function fail(message, code = 1) {
  console.error(`169-version-probe: ${message}`);
  process.exit(code);
}

// ---------------------------------------------------------------- semver helpers (built-ins only)

function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(String(v).trim());
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ? m[4].split('.') : [] };
}

function cmpPre(a, b) {
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    const an = /^\d+$/.test(a[i]);
    const bn = /^\d+$/.test(b[i]);
    if (an && bn) {
      if (+a[i] !== +b[i]) return +a[i] < +b[i] ? -1 : 1;
    } else if (an !== bn) return an ? -1 : 1;
    else if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

function cmp(a, b) {
  const x = typeof a === 'string' ? parseVersion(a) : a;
  const y = typeof b === 'string' ? parseVersion(b) : b;
  for (const k of ['major', 'minor', 'patch']) if (x[k] !== y[k]) return x[k] < y[k] ? -1 : 1;
  return cmpPre(x.pre, y.pre);
}

/** The major LINE: `N` for N >= 1, `0.M` for a 0.x version (a 0.x minor counts as a major). */
function lineOf(v) {
  const p = typeof v === 'string' ? parseVersion(v) : v;
  return p.major > 0 ? `${p.major}` : `0.${p.minor}`;
}

/** The first release of a line: `N.0.0`, or `0.M.0`. */
function lineStart(line) {
  return line.startsWith('0.') ? `${line}.0` : `${line}.0.0`;
}

function lineRank(line) {
  const [a, b = '0'] = line.split('.');
  return +a * 100000 + (line.startsWith('0.') ? +b : 0);
}

/** A partial version (`1`, `1.2`, `1.x`, `*`) -> lower bound and the missing parts. */
function partial(s) {
  const t = s.trim().replace(/^v/, '');
  if (t === '' || t === '*' || t === 'x' || t === 'X') return { major: null };
  const m = /^(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?$/.exec(t);
  if (!m) return undefined;
  const n = (g) => (g === undefined || /[xX*]/.test(g) ? null : +g);
  return { major: n(m[1]), minor: n(m[2]), patch: n(m[3]), pre: m[4] ? m[4].split('.') : [] };
}

/** Comparator set -> list of [op, versionObject] tests. Supports >, >=, <, <=, =, ^, ~, x-ranges and hyphen ranges. */
function comparators(set) {
  const out = [];
  const hy = /^\s*(\S+)\s+-\s+(\S+)\s*$/.exec(set);
  if (hy) {
    const lo = partial(hy[1]);
    const hi = partial(hy[2]);
    if (!lo || !hi) return undefined;
    out.push(['>=', { major: lo.major ?? 0, minor: lo.minor ?? 0, patch: lo.patch ?? 0, pre: lo.pre ?? [] }]);
    if (hi.major === null) return out;
    if (hi.minor === null) out.push(['<', { major: hi.major + 1, minor: 0, patch: 0, pre: [] }]);
    else if (hi.patch === null) out.push(['<', { major: hi.major, minor: hi.minor + 1, patch: 0, pre: [] }]);
    else out.push(['<=', { ...hi }]);
    return out;
  }
  const tokens = set.replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1').split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const m = /^(>=|<=|>|<|=|\^|~)?(.*)$/.exec(tok);
    const op = m[1] || '';
    const p = partial(m[2]);
    if (p === undefined) return undefined;
    if (p.major === null) continue; // `*` matches everything
    const base = { major: p.major, minor: p.minor ?? 0, patch: p.patch ?? 0, pre: p.pre ?? [] };
    if (op === '^') {
      out.push(['>=', base]);
      if (p.major > 0 || p.minor === null) out.push(['<', { major: p.major + 1, minor: 0, patch: 0, pre: [] }]);
      else if (p.minor > 0 || p.patch === null) out.push(['<', { major: 0, minor: p.minor + 1, patch: 0, pre: [] }]);
      else out.push(['<', { major: 0, minor: 0, patch: p.patch + 1, pre: [] }]);
    } else if (op === '~') {
      out.push(['>=', base]);
      if (p.minor === null) out.push(['<', { major: p.major + 1, minor: 0, patch: 0, pre: [] }]);
      else out.push(['<', { major: p.major, minor: p.minor + 1, patch: 0, pre: [] }]);
    } else if (op === '' || op === '=') {
      if (p.minor === null) {
        out.push(['>=', base], ['<', { major: p.major + 1, minor: 0, patch: 0, pre: [] }]);
      } else if (p.patch === null) {
        out.push(['>=', base], ['<', { major: p.major, minor: p.minor + 1, patch: 0, pre: [] }]);
      } else out.push(['=', base]);
    } else if (op === '>' && (p.minor === null || p.patch === null)) {
      out.push(['>=', p.minor === null ? { major: p.major + 1, minor: 0, patch: 0, pre: [] } : { major: p.major, minor: p.minor + 1, patch: 0, pre: [] }]);
    } else if (op === '<=' && (p.minor === null || p.patch === null)) {
      out.push(['<', p.minor === null ? { major: p.major + 1, minor: 0, patch: 0, pre: [] } : { major: p.major, minor: p.minor + 1, patch: 0, pre: [] }]);
    } else out.push([op, base]);
  }
  return out;
}

/** Does `version` satisfy `range`? Returns null when the range is outside this grammar. */
function satisfies(version, range) {
  const v = parseVersion(version);
  if (!v) return null;
  for (const set of String(range).split('||')) {
    const cs = comparators(set);
    if (cs === undefined) return null;
    const ok = cs.every(([op, c]) => {
      const r = cmp(v, c);
      return op === '>=' ? r >= 0 : op === '>' ? r > 0 : op === '<' ? r < 0 : op === '<=' ? r <= 0 : r === 0;
    });
    if (ok) return true;
  }
  return false;
}

// ---------------------------------------------------------------- repository inputs

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function manifests() {
  const list = [join(REPO_ROOT, 'package.json')];
  for (const dir of ['apps', 'packages']) {
    for (const name of readdirSync(join(REPO_ROOT, dir)).sort()) {
      const p = join(REPO_ROOT, dir, name, 'package.json');
      if (existsSync(p)) list.push(p);
    }
  }
  return list;
}

/** The `catalog:` block of .yarnrc.yml, by indentation (built-ins only, no YAML library). */
function readCatalog() {
  const lines = readFileSync(join(REPO_ROOT, '.yarnrc.yml'), 'utf8').split('\n');
  const catalog = new Map();
  let inside = false;
  for (const line of lines) {
    if (/^catalog:\s*$/.test(line)) {
      inside = true;
      continue;
    }
    if (!inside) continue;
    if (/^\S/.test(line)) break;
    const m = /^\s+(?:'([^']+)'|"([^"]+)"|([^\s:#'"][^:#]*?)):\s*(\S.*?)\s*$/.exec(line);
    if (!m || /^\s*#/.test(line)) continue;
    catalog.set(m[1] ?? m[2] ?? m[3], m[4].replace(/^['"]|['"]$/g, ''));
  }
  return catalog;
}

/** yarn.lock: `name@npm:<range>` descriptor -> resolved version. */
function readLock() {
  const text = readFileSync(join(REPO_ROOT, 'yarn.lock'), 'utf8');
  const map = new Map();
  for (const block of text.split(/\n(?=\S)/)) {
    const head = /^"?(.+?)"?:\s*$/m.exec(block.split('\n')[0]);
    const ver = /^\s+version:\s*(\S+)\s*$/m.exec(block);
    if (!head || !ver) continue;
    for (const d of head[1].split(/,\s*/)) map.set(d.replace(/^"|"$/g, ''), ver[1]);
  }
  return map;
}

const DEP_BLOCKS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const catalog = readCatalog();
const lock = readLock();

/** name -> { ranges:Set, workspaces:Set, resolved:Set } */
const declared = new Map();
const manifestPaths = manifests();
for (const path of manifestPaths) {
  const m = readJson(path);
  const ws = relative(REPO_ROOT, dirname(path)) || '(root)';
  for (const block of DEP_BLOCKS) {
    for (const [rawName, rawRange] of Object.entries(m[block] ?? {})) {
      let name = rawName;
      let range = rawRange;
      if (range.startsWith('workspace:') || name.startsWith('@openvaa/')) continue;
      if (range === 'catalog:' || range.startsWith('catalog:')) {
        const c = catalog.get(name);
        if (!c) fail(`${ws}: ${name} is catalog: but the catalog has no entry`);
        range = c;
      }
      if (range.startsWith('npm:')) {
        const alias = /^npm:(@?[^@]+)@(.+)$/.exec(range);
        if (!alias) fail(`${ws}: cannot parse alias ${rawName}: ${rawRange}`);
        name = alias[1];
        range = alias[2];
      }
      if (/^(file|link|portal|patch|git|https?):/.test(range)) continue;
      if (opts.only && !opts.only.has(name)) continue;
      const entry = declared.get(name) ?? { ranges: new Set(), workspaces: new Set(), resolved: new Set() };
      entry.ranges.add(range);
      entry.workspaces.add(ws);
      const resolvedVersion = lock.get(`${name}@npm:${range}`);
      if (resolvedVersion) entry.resolved.add(resolvedVersion);
      declared.set(name, entry);
    }
  }
}

if (opts.only) {
  const missing = [...opts.only].filter((n) => !declared.has(n));
  if (missing.length > 0) fail(`--only names not declared in any manifest: ${missing.join(', ')}`, 2);
}

// ---------------------------------------------------------------- owning group (D-25)

const GROUPS = [
  ['G1', ['typescript', '@types/node']],
  [
    'G2',
    [
      'eslint',
      '@eslint/js',
      'eslint-plugin-*',
      '@eslint/eslintrc',
      'eslint-config-prettier',
      'prettier-plugin-svelte',
      'prettier-plugin-tailwindcss',
      'svelte-eslint-parser',
      'typescript-eslint',
      '@typescript-eslint/*'
    ]
  ],
  [
    'G3',
    [
      'vite',
      '@sveltejs/vite-plugin-svelte',
      'vite-plugin-restart',
      '@sveltejs/kit',
      '@sveltejs/adapter-*',
      'svelte',
      'vite-plugin-devtools-json'
    ]
  ],
  [
    'G4',
    [
      'vitest',
      '@vitest/*',
      'jsdom',
      'isomorphic-dompurify',
      '@playwright/test',
      'playwright',
      'daisyui',
      'tailwindcss',
      '@tailwindcss/*'
    ]
  ],
  ['G5', ['supabase', '@supabase/supabase-js', '@supabase/ssr']],
  ['G6', ['@faker-js/faker']],
  ['G7', ['ai', '@ai-sdk/*', 'openai', 'jsonrepair']],
  [
    'G8',
    [
      'concurrently',
      'lint-staged',
      '@changesets/*',
      'glob',
      'dotenv',
      'js-yaml',
      '@types/js-yaml',
      'intl-messageformat',
      'globals',
      '@types/cheerio'
    ]
  ]
];

function groupOf(name) {
  for (const [group, patterns] of GROUPS) {
    for (const p of patterns) {
      if (p.endsWith('*') ? name.startsWith(p.slice(0, -1)) : name === p) return group;
    }
  }
  return 'G0';
}

// ---------------------------------------------------------------- registry

function npmView(spec, fields) {
  try {
    const out = execFileSync('npm', ['view', spec, ...fields, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return out.trim() === '' ? {} : JSON.parse(out);
  } catch (error) {
    fail(`npm view ${spec} failed (status ${error.status ?? 'none'}): ${String(error.stderr ?? error.message).trim().split('\n')[0]}`);
  }
}

const asOf = opts.asOf.getTime();
const ageDays = (iso) => (asOf - new Date(iso).getTime()) / DAY_MS;
const day = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '—');
const fmtAge = (iso) => (iso ? ageDays(iso).toFixed(1) : '—');

const rows = [];
const youngest = [];
const names = [...declared.keys()].sort();
for (const name of names) {
  const entry = declared.get(name);
  const view = npmView(name, ['time', 'dist-tags', 'engines', 'versions']);
  const time = view.time ?? {};
  const versions = (Array.isArray(view.versions) ? view.versions : [view.versions])
    .filter(Boolean)
    .filter((v) => parseVersion(v) && time[v]);
  const stable = versions.filter((v) => parseVersion(v).pre.length === 0).sort(cmp);
  if (stable.length === 0) fail(`${name}: the registry lists no stable version`);
  const latest = view['dist-tags']?.latest ?? stable[stable.length - 1];

  for (const v of stable) if (ageDays(time[v]) < MIN_AGE_DAYS && ageDays(time[v]) >= 0) youngest.push({ name, v, published: time[v] });

  const resolved = [...entry.resolved].sort(cmp);
  if (resolved.length === 0) fail(`${name}: no yarn.lock entry for ${[...entry.ranges].map((r) => `${name}@npm:${r}`).join(', ')}`);
  const resolvedLines = new Set(resolved.map(lineOf));
  const lowest = resolved[0];
  const lowestRank = lineRank(lineOf(lowest));

  // Line starts and their ages.
  const lines = new Map();
  for (const v of stable) {
    const line = lineOf(v);
    if (!lines.has(line)) lines.set(line, { start: lineStart(line), startDate: time[lineStart(line)] ?? null, versions: [] });
    lines.get(line).versions.push(v);
  }
  const lineAllowed = (line) => {
    if (resolvedLines.has(line)) return true;
    if (lineRank(line) < lowestRank) return false;
    const info = lines.get(line);
    // A line whose x.0.0 was never published (e.g. a 6.0.1 first release) is dated by its first stable release.
    const first = info.startDate ?? time[info.versions[0]];
    return ageDays(first) >= MIN_MAJOR_AGE_DAYS;
  };
  const eligible = stable.filter(
    (v) => ageDays(time[v]) >= MIN_AGE_DAYS && lineRank(lineOf(v)) >= lowestRank && lineAllowed(lineOf(v))
  );
  const target = eligible.length > 0 ? eligible[eligible.length - 1] : lowest;

  const held = [];
  for (const [line, info] of [...lines.entries()].sort((a, b) => lineRank(a[0]) - lineRank(b[0]))) {
    if (lineRank(line) <= lineRank(lineOf(target))) continue;
    const first = info.startDate ?? time[info.versions[0]];
    if (ageDays(first) < MIN_MAJOR_AGE_DAYS) {
      const clears = new Date(new Date(first).getTime() + MIN_MAJOR_AGE_DAYS * DAY_MS).toISOString().slice(0, 16);
      held.push(`HOLD-30d ${line}.x (${info.start} ${day(first)}, clears ${clears}Z)`);
    }
  }
  const targetLine = lines.get(lineOf(target));
  const newestInLine = targetLine.versions[targetLine.versions.length - 1];
  if (cmp(newestInLine, target) > 0) {
    const young = targetLine.versions.filter((v) => cmp(v, target) > 0);
    held.push(`HOLD-7d ${young.join(', ')} (newest ${day(time[newestInLine])})`);
  }

  let verdict;
  const upToDate = cmp(target, resolved[resolved.length - 1]) <= 0 && resolved.length === 1;
  if (upToDate) {
    verdict = held.some((h) => h.startsWith('HOLD-30d')) ? 'HOLD-30d' : held.length > 0 ? 'HOLD-7d' : 'current';
  } else if (resolvedLines.has(lineOf(target)) && lineRank(lineOf(target)) === lineRank(lineOf(resolved[resolved.length - 1]))) {
    verdict = resolvedLines.size > 1 && lineRank(lineOf(lowest)) < lineRank(lineOf(target)) ? 'major' : 'in-major';
  } else verdict = 'major';

  let engines = view.engines?.node ?? '';
  if (target !== latest) {
    const tv = npmView(`${name}@${target}`, ['engines']);
    engines = tv?.node ?? (typeof tv === 'object' && tv.engines?.node) ?? '';
    if (typeof engines !== 'string') engines = '';
  }
  let admits = '—';
  if (opts.node) {
    if (!engines) admits = 'yes (no engines)';
    else {
      const s = satisfies(opts.node, engines);
      admits = s === null ? 'unparsed' : s ? 'yes' : 'NO';
    }
  }

  const group = groupOf(name);
  const flag = verdict === 'major' && group === 'G0' ? 'UNASSIGNED-MAJOR' : '';
  if (flag) console.log(`UNASSIGNED-MAJOR: ${name} ${resolved.join('/')} -> ${target}`);
  rows.push({
    name,
    group: flag ? `G0 ${flag}` : group,
    ranges: [...entry.ranges].join(' / '),
    workspaces: [...entry.workspaces].join(', '),
    resolved: resolved.join(', '),
    latest,
    latestDate: day(time[latest]),
    target,
    targetDate: day(time[target]),
    targetAge: fmtAge(time[target]),
    lineStart: `${targetLine.start} ${day(targetLine.startDate ?? time[targetLine.versions[0]])}`,
    engines: engines || '—',
    admits,
    verdict,
    held: held.join('; ') || '—'
  });
}

// ---------------------------------------------------------------- output

const counts = rows.reduce((acc, r) => ((acc[r.verdict] = (acc[r.verdict] ?? 0) + 1), acc), {});
const esc = (s) => String(s).replace(/\|/g, '\\|');
const header = [
  '# Phase 169 — Version / Age Table',
  '',
  `Generated by \`169-version-probe.mjs\` as of **${opts.asOf.toISOString()}**${opts.only ? ` (--only ${[...opts.only].join(',')})` : ''}.`,
  `Rule (D-03): a version is taken only at ≥ ${MIN_AGE_DAYS} days old; a newer major also needs its x.0.0 ≥ ${MIN_MAJOR_AGE_DAYS} days old (a 0.x minor counts as a major).`,
  `Node checked against each target's \`engines.node\`: ${opts.node || '(not given)'}.`,
  '',
  `**${rows.length} distinct registry packages** declared across ${manifestPaths.length} manifests (root, apps/*, packages/*; \`workspace:\` and \`@openvaa/*\` skipped; \`catalog:\` resolved through .yarnrc.yml).`,
  '',
  `Verdicts: ${Object.entries(counts)
    .sort()
    .map(([k, v]) => `${k} ${v}`)
    .join(' · ')}`,
  '',
  '| Package | Group | Declared | Workspaces | Resolved | Latest (date) | Target | Target date | Age (d) | Target line x.0.0 | engines.node | Admits node | Verdict | Held back |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'
];
const body = rows.map(
  (r) =>
    `| \`${r.name}\` | ${r.group} | ${esc(r.ranges)} | ${esc(r.workspaces)} | ${r.resolved} | ${r.latest} (${r.latestDate}) | ${r.target} | ${r.targetDate} | ${r.targetAge} | ${r.lineStart} | ${esc(r.engines)} | ${r.admits} | ${r.verdict} | ${esc(r.held)} |`
);
youngest.sort((a, b) => (a.published < b.published ? 1 : -1));
const young = [
  '',
  `## Youngest releases (stable versions under ${MIN_AGE_DAYS} days old)`,
  '',
  ...(youngest.length === 0
    ? ['None.']
    : youngest.map((y) => `- \`${y.name}@${y.v}\` — ${y.published} (${ageDays(y.published).toFixed(2)} d)`))
];
const text = `${[...header, ...body, ...young].join('\n')}\n`;

if (opts.out) {
  writeFileSync(opts.out, text);
  console.log(`169-version-probe: wrote ${relative(process.cwd(), opts.out)} — ${rows.length} packages`);
} else process.stdout.write(text);
console.log(`Verdicts: ${JSON.stringify(counts)}`);
console.log('Youngest releases:');
for (const y of youngest) console.log(`  ${y.name}@${y.v} ${y.published}`);
