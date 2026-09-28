#!/usr/bin/env node
/**
 * code-identity.mjs -- prove that an edit changed comments and nothing else (165-RESEARCH Pitfall 5).
 *
 * Each side is read, every character inside a comment span is blanked (newlines kept), whitespace
 * runs are collapsed, empty lines are dropped, and the two remaining "code skeletons" are compared.
 * The comment classifier is the repo's own: `commentMapOf` from scripts/assert-env-pair-registry.mjs
 * over the family `familyFor` (scripts/lib/comment-spans.mjs) returns for the path's extension, so
 * this proof and the repo's comment-hygiene guard agree on what a comment is.
 *
 * Usage (from anywhere inside the repository):
 *   node code-identity.mjs <rev-a> <rev-b> <path>...
 *   node code-identity.mjs --files-pair <file-a> <file-b>
 *
 *   <rev-a> <rev-b>        Any git revisions. `<rev-b>` may be the literal `WORKTREE`, meaning the
 *                          working-tree file. Each side is read with `git show <rev>:<path>`.
 *   --files-pair A B       Compare two files on disk; the family comes from A's extension.
 *   --report               On a mismatch, print the full diff of the blanked code with context.
 *                          Without it, the differing lines are still printed, capped at 40.
 *   --blank-sql-literals   For `.sql` paths only, also blank the contents of single-quoted
 *                          literals, so a pgTAP description rewrite proves "only comments and
 *                          literals changed".
 *
 * A path whose extension has no comment family (`.md`, `.env.example`, `.json`) prints
 * `prose file — review by eye` and does not count as a mismatch.
 *
 * Exit codes -- the caller must be able to branch on the status alone:
 *   0  every compared path is code-identical
 *   1  at least one path changed code (the differing blanked lines are printed)
 *   2  usage error, or a revision/path git cannot read
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

function usageError(message) {
  console.error(`code-identity.mjs: ${message}`);
  console.error('usage: node code-identity.mjs [--report] [--blank-sql-literals] <rev-a> <rev-b|WORKTREE> <path>...');
  console.error('       node code-identity.mjs [--report] [--blank-sql-literals] --files-pair <file-a> <file-b>');
  process.exit(2);
}

let ROOT;
try {
  ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: SCRIPT_DIR }).toString().trim();
} catch (error) {
  console.error(`code-identity.mjs: cannot locate the repository root (${error.message})`);
  process.exit(2);
}

const { commentMapOf } = await import(pathToFileURL(join(ROOT, 'scripts/assert-env-pair-registry.mjs')).href);
const { familyFor } = await import(pathToFileURL(join(ROOT, 'scripts/lib/comment-spans.mjs')).href);

// ── CLI ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const REPORT = argv.includes('--report');
const BLANK_SQL_LITERALS = argv.includes('--blank-sql-literals');
const FILES_PAIR = argv.includes('--files-pair');
const positional = argv.filter((a) => !['--report', '--blank-sql-literals', '--files-pair'].includes(a));
for (const a of positional) if (a.startsWith('--')) usageError(`unknown flag: ${a}`);

/** @type {Array<{ label: string, family: string, a: () => string, b: () => string }>} */
const jobs = [];

function readDisk(p) {
  const abs = isAbsolute(p) ? p : resolve(process.cwd(), p);
  try {
    return readFileSync(abs, 'utf-8');
  } catch (error) {
    console.error(`code-identity.mjs: cannot read ${p} (${error.message})`);
    process.exit(2);
  }
}

function readRev(rev, p) {
  if (rev === 'WORKTREE') return readDisk(join(ROOT, p));
  try {
    return execFileSync('git', ['show', `${rev}:${p}`], { cwd: ROOT, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf-8');
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString().trim() : error.message;
    console.error(`code-identity.mjs: git show ${rev}:${p} failed (${stderr})`);
    process.exit(2);
  }
}

if (FILES_PAIR) {
  if (positional.length !== 2) usageError('--files-pair takes exactly two files');
  const [fa, fb] = positional;
  jobs.push({ label: `${fa} vs ${fb}`, family: fa, a: () => readDisk(fa), b: () => readDisk(fb) });
} else {
  if (positional.length < 3) usageError('need <rev-a> <rev-b> and at least one path');
  const [ra, rb, ...paths] = positional;
  for (const rev of [ra, rb]) {
    if (rev === 'WORKTREE') continue;
    try {
      execFileSync('git', ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`], { cwd: ROOT, stdio: 'ignore' });
    } catch {
      console.error(`code-identity.mjs: revision does not resolve: ${rev}`);
      process.exit(2);
    }
  }
  if (ra === 'WORKTREE') usageError('WORKTREE is allowed only as <rev-b>');
  for (const p of paths) {
    const rel = p.replace(/^\.\//, '');
    jobs.push({ label: rel, family: rel, a: () => readRev(ra, rel), b: () => readRev(rb, rel) });
  }
}

// ── Blanking ──────────────────────────────────────────────────────────────
/**
 * Blank every comment character (newlines kept). Spans are UTF-16 code-unit offsets into `text`,
 * so the text is split into code units, not code points, or an astral character before a comment
 * would shift every later span by one.
 */
function blankComments(text, family) {
  const units = text.split('');
  for (const [s, e] of commentMapOf(text, family).spans) {
    for (let i = s; i < e; i++) if (units[i] !== '\n') units[i] = ' ';
  }
  return units.join('');
}

/** Blank the contents of single-quoted SQL literals, honouring the doubled-quote escape. */
function blankSqlLiterals(text) {
  const units = text.split('');
  let i = 0;
  while (i < units.length) {
    if (units[i] !== "'") {
      i++;
      continue;
    }
    let j = i + 1;
    for (;;) {
      if (j >= units.length) break;
      if (units[j] === "'") {
        if (units[j + 1] === "'") {
          j += 2;
          continue;
        }
        break;
      }
      j++;
    }
    for (let k = i + 1; k < j && k < units.length; k++) if (units[k] !== '\n') units[k] = ' ';
    i = j + 1;
  }
  return units.join('');
}

function skeleton(text, pathForFamily, family) {
  let code = blankComments(text, family);
  if (BLANK_SQL_LITERALS && extname(pathForFamily).toLowerCase() === '.sql') code = blankSqlLiterals(code);
  return code
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// ── Diff (common prefix/suffix trimmed, LCS over the middle) ──────────────
function diffLines(a, b) {
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const am = a.slice(pre, a.length - suf);
  const bm = b.slice(pre, b.length - suf);
  const out = [];
  if (am.length * bm.length > 25_000_000) {
    for (const l of am) out.push(`- ${l}`);
    for (const l of bm) out.push(`+ ${l}`);
    return { pre, ops: out };
  }
  const n = am.length;
  const m = bm.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = am[i] === bm[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && am[i] === bm[j]) {
      out.push(`  ${am[i]}`);
      i++;
      j++;
    } else if (i < n && (j === m || dp[i + 1][j] >= dp[i][j + 1])) {
      out.push(`- ${am[i]}`);
      i++;
    } else {
      out.push(`+ ${bm[j]}`);
      j++;
    }
  }
  return { pre, ops: out };
}

function printDiff(a, b) {
  const { pre, ops } = diffLines(a, b);
  if (REPORT) {
    console.log(`  @@ blanked code, first difference after skeleton line ${pre} @@`);
    const keep = new Set();
    ops.forEach((op, idx) => {
      if (!op.startsWith('  ')) for (let k = idx - 2; k <= idx + 2; k++) keep.add(k);
    });
    let last = -1;
    ops.forEach((op, idx) => {
      if (!keep.has(idx)) return;
      if (last >= 0 && idx !== last + 1) console.log('  ...');
      console.log(`  ${op}`);
      last = idx;
    });
    return;
  }
  const changed = ops.filter((op) => !op.startsWith('  '));
  for (const op of changed.slice(0, 40)) console.log(`  ${op}`);
  if (changed.length > 40) console.log(`  ... ${changed.length - 40} more differing line(s); re-run with --report`);
}

// ── Main ──────────────────────────────────────────────────────────────────
let mismatches = 0;
let compared = 0;
for (const job of jobs) {
  const family = familyFor(job.family);
  if (!family) {
    // Read both sides anyway, so an unreadable prose file is still an error rather than a pass.
    job.a();
    job.b();
    console.log(`prose file — review by eye: ${job.label}`);
    continue;
  }
  compared++;
  const sa = skeleton(job.a(), job.family, family);
  const sb = skeleton(job.b(), job.family, family);
  if (sa.length === sb.length && sa.every((l, idx) => l === sb[idx])) {
    console.log(`code-identical: ${job.label}`);
    continue;
  }
  mismatches++;
  console.log(`CODE CHANGED: ${job.label}`);
  printDiff(sa, sb);
}

console.log(`\n${compared} compared, ${mismatches} changed code${BLANK_SQL_LITERALS ? ' (SQL literals blanked)' : ''}`);
process.exit(mismatches > 0 ? 1 : 0);
