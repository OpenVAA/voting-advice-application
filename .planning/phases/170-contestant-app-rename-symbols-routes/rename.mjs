#!/usr/bin/env node
// rename.mjs — the Phase 170 text codemod (D-15). Driven by rename.map.mjs. Node built-ins only.
//
// Usage (run from anywhere; paths resolve against the repository root):
//   node rename.mjs --plan N                    dry run: rewrites per rule and per file, a total; exit 0
//   node rename.mjs --plan N --apply            write the content rewrites
//   node rename.mjs --plan N --moves            print old<TAB>new for every tracked path the rules change; writes nothing
//   node rename.mjs --plan N --moves --apply    git mv each pair, then remove directories left empty
//   node rename.mjs --plan N --check            exit 1 when a dry run would rewrite any byte or move any path
//   node rename.mjs --plan N --rule <id>        print every match of one rule (file:line: text), for review
//   ... --paths <prefix>...                     restrict the input set to paths starting with a prefix
//
// --plan N (required, 1..4) applies every rule whose plan is at most N, in table order.
//
// Input set: `git ls-files -z` minus EXCLUDE of rename.map.mjs. Untracked files are never touched. A
// file in the BINARY class (the listed extensions, a NUL byte, or bytes that are not valid UTF-8) is
// never opened for rewriting, but its path is still offered to --moves.
//
// A pair whose destination already exists is NOT a move: --moves prints it on stderr as
// `# collision`, --moves --apply skips it and exits 1, and --check counts it as pending.
//
// Exit codes:
//   0  done; for --check: nothing left to rewrite or move
//   1  --check found pending work; or --moves --apply met a collision or left an old directory holding a file
//   2  usage error

import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BINARY_EXTENSIONS, EXCLUDE, RULES } from './rename.map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
process.chdir(REPO_ROOT);

function usage(message) {
  if (message) console.error(`rename.mjs: ${message}`);
  console.error(
    'usage: node rename.mjs --plan <1..4> [--apply] [--moves] [--check] [--rule <id>] [--paths <prefix>...]'
  );
  process.exit(2);
}

// ── Arguments ────────────────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
let plan = 0;
let apply = false;
let moves = false;
let check = false;
let ruleId = '';
const prefixes = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--plan') {
    plan = Number(argv[(i += 1)]);
  } else if (a === '--apply') {
    apply = true;
  } else if (a === '--moves') {
    moves = true;
  } else if (a === '--check') {
    check = true;
  } else if (a === '--rule') {
    ruleId = argv[(i += 1)] ?? '';
    if (!ruleId) usage('--rule requires an id');
  } else if (a === '--paths') {
    while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) prefixes.push(argv[(i += 1)]);
    if (prefixes.length === 0) usage('--paths requires at least one prefix');
  } else {
    usage(`unexpected argument '${a}'`);
  }
}
if (!Number.isInteger(plan) || plan < 1 || plan > 4) usage('--plan <1..4> is required');
if (check && (apply || moves)) usage('--check cannot be combined with --apply or --moves');
if (ruleId && (apply || moves || check)) usage('--rule is a review mode and takes no other mode flag');

const rules = RULES.filter((r) => r.plan <= plan);
for (const r of rules) {
  if (!(r.from instanceof RegExp) || !r.from.global || typeof r.to !== 'string' || !r.id) {
    console.error(`rename.mjs: malformed rule ${JSON.stringify(r.id)} (need id, a global RegExp 'from', a string 'to')`);
    process.exit(2);
  }
}
if (ruleId && !rules.some((r) => r.id === ruleId)) usage(`no rule '${ruleId}' among the rules of plan <= ${plan}`);

// ── Input set ────────────────────────────────────────────────────────────────────────────────────
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
  .split('\0')
  .filter(Boolean);
const files = tracked
  .filter((f) => !EXCLUDE.some((re) => re.test(f)))
  .filter((f) => prefixes.length === 0 || prefixes.some((p) => f.startsWith(p)));

/** Apply every selected rule to a repo-relative path. The `only` predicate sees the path as it is today. */
function mapPath(file) {
  let out = file;
  for (const r of rules) {
    if (r.only && !r.only(file)) continue;
    out = out.replace(r.from, r.to);
  }
  return out;
}

/** The file's text, or null when it is in the BINARY class, a symlink, or absent from the working tree. */
function readText(file) {
  if (BINARY_EXTENSIONS.test(file)) return null;
  let stat;
  try {
    stat = lstatSync(file);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;
  const buf = readFileSync(file);
  if (buf.includes(0)) return null;
  const text = buf.toString('utf8');
  // Bytes that do not survive a UTF-8 round trip would be damaged by a rewrite.
  if (!Buffer.from(text, 'utf8').equals(buf)) return null;
  return text;
}

const countMatches = (text, re) => {
  const m = text.match(re);
  return m ? m.length : 0;
};

// ── --rule: review one rule ──────────────────────────────────────────────────────────────────────
if (ruleId) {
  const target = rules.find((r) => r.id === ruleId);
  const earlier = rules.slice(0, rules.indexOf(target));
  let total = 0;
  for (const file of files) {
    if (target.only && !target.only(file)) continue;
    let p = file;
    for (const r of earlier) if (!r.only || r.only(file)) p = p.replace(r.from, r.to);
    const pathHits = countMatches(p, target.from);
    if (pathHits) {
      total += pathHits;
      console.log(`${file}: path`);
    }
    let text = readText(file);
    if (text === null) continue;
    for (const r of earlier) if (!r.only || r.only(file)) text = text.replace(r.from, r.to);
    if (!countMatches(text, target.from)) continue;
    text.split('\n').forEach((line, i) => {
      const n = countMatches(line, target.from);
      if (n) {
        total += n;
        console.log(`${file}:${i + 1}: ${line.trim().slice(0, 220)}`);
      }
    });
  }
  console.log(`# ${ruleId}: ${total} match(es)`);
  process.exit(0);
}

// ── Moves ────────────────────────────────────────────────────────────────────────────────────────
const pairs = [];
const collisions = [];
const trackedSet = new Set(tracked);
for (const file of files) {
  const next = mapPath(file);
  if (next === file) continue;
  if (trackedSet.has(next) || existsSync(next)) collisions.push([file, next]);
  else pairs.push([file, next]);
}

if (moves) {
  for (const [from, to] of pairs) console.log(`${from}\t${to}`);
  for (const [from, to] of collisions) console.error(`# collision: ${from}\t${to} (the destination exists; not a move)`);
  if (!apply) process.exit(0);

  for (const [from, to] of pairs) {
    mkdirSync(path.dirname(to), { recursive: true });
    execFileSync('git', ['mv', '--', from, to], { stdio: ['ignore', 'ignore', 'inherit'] });
  }
  // Remove directories the moves left empty, deepest first, and find the old ones that survive.
  const oldDirs = new Set();
  for (const [from] of pairs) {
    for (let d = path.dirname(from); d && d !== '.'; d = path.dirname(d)) {
      // An "old directory" is one whose own path the rules change.
      if (mapPath(`${d}/`) !== `${d}/`) oldDirs.add(d);
    }
  }
  const survivors = [];
  for (const d of [...oldDirs].sort((a, b) => b.length - a.length)) {
    if (!existsSync(d)) continue;
    if (readdirSync(d).length === 0) rmdirSync(d);
    else survivors.push(d);
  }
  console.error(`# moved ${pairs.length} path(s)`);
  for (const d of survivors) console.error(`# old directory still holds a file: ${d}: ${readdirSync(d).join(', ')}`);
  process.exit(survivors.length || collisions.length ? 1 : 0);
}

// ── Content: dry run, --apply, --check ───────────────────────────────────────────────────────────
const perRule = new Map(rules.map((r) => [r.id, { rewrites: 0, files: 0 }]));
const perFile = [];
let total = 0;
for (const file of files) {
  const original = readText(file);
  if (original === null) continue;
  let text = original;
  let inFile = 0;
  const detail = [];
  for (const r of rules) {
    if (r.only && !r.only(file)) continue;
    const n = countMatches(text, r.from);
    if (!n) continue;
    text = text.replace(r.from, r.to);
    const tally = perRule.get(r.id);
    tally.rewrites += n;
    tally.files += 1;
    inFile += n;
    detail.push(`${r.id}×${n}`);
  }
  if (!inFile) continue;
  total += inFile;
  perFile.push(`${String(inFile).padStart(5)}  ${file}  [${detail.join(' ')}]`);
  if (apply) writeFileSync(file, text);
}

if (check) {
  const pending = total + pairs.length + collisions.length;
  if (pending) {
    for (const line of perFile) console.log(`rewrite ${line}`);
    for (const [from, to] of pairs) console.log(`move    ${from}\t${to}`);
    for (const [from, to] of collisions) console.log(`collide ${from}\t${to}`);
  }
  console.log(
    `rename.mjs --check --plan ${plan}: ${total} rewrite(s) in ${perFile.length} file(s), ${pairs.length} move(s), ${collisions.length} collision(s) pending`
  );
  process.exit(pending ? 1 : 0);
}

console.log(`# rename.mjs --plan ${plan}${apply ? ' --apply' : ' (dry run)'} over ${files.length} tracked file(s)`);
console.log('# per rule: id, rewrites, files');
for (const r of rules) {
  const t = perRule.get(r.id);
  console.log(`${r.id.padEnd(7)} ${String(t.rewrites).padStart(6)} ${String(t.files).padStart(5)}  ${r.from}`);
}
console.log('# per file: rewrites, path, [rule×count]');
for (const line of perFile) console.log(line);
console.log(
  `# total: ${total} rewrite(s) in ${perFile.length} file(s)${apply ? ' WRITTEN' : ''}; ${pairs.length} path(s) would move (see --moves)`
);
process.exit(0);
