#!/usr/bin/env node
/**
 * ledger-skeleton.mjs -- generate 165-LEDGER.md from the comment inventory, never by transcription.
 *
 * Inputs (both in the phase directory):
 *   165-REVIEW-COMMENTS.md   the 78 review comments: `## PR #NNN — ...` headers, one
 *                            `### C-<id> — <author> — `<anchor>`` heading per comment with its
 *                            `- url:` line, and the closing "Review bodies and issue comments" list.
 *   scripts/dispositions.tsv `id<TAB>disposition<TAB>owner-plan`, one row per comment.
 *
 * It refuses to write -- exit 1, naming the ids -- when the inventory's id set and the TSV's id set
 * differ in either direction, when either carries a duplicate, when a heading has no url, when a
 * disposition is outside the five D-01 values, or when an owner plan has no 165-NN-PLAN.md.
 *
 * It also refuses to overwrite an existing ledger that differs from what it would write (exit 3),
 * because later plans fill the Evidence, Commit and Draft reply cells and a regeneration would
 * erase them. `--force` overrides that, and only that.
 *
 * Usage:
 *   node ledger-skeleton.mjs [--force]
 *
 * Exit codes:
 *   0  ledger written, or already identical
 *   1  the inputs disagree (nothing written)
 *   2  usage error or unreadable input
 *   3  an existing, different ledger was left untouched
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PHASE_DIR = dirname(SCRIPT_DIR);
const INVENTORY = join(PHASE_DIR, '165-REVIEW-COMMENTS.md');
const TSV = join(SCRIPT_DIR, 'dispositions.tsv');
const LEDGER = join(PHASE_DIR, '165-LEDGER.md');
const DISPOSITIONS = ['fix', 'split-artifact', 'already-fixed', 'deferred', 'wont-fix'];

const argv = process.argv.slice(2);
for (const a of argv) {
  if (a !== '--force') {
    console.error(`ledger-skeleton.mjs: unknown argument: ${a}`);
    process.exit(2);
  }
}
const FORCE = argv.includes('--force');

function read(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`ledger-skeleton.mjs: cannot read ${path} (${error.message})`);
    process.exit(2);
  }
}

const problems = [];

// ── Parse the inventory ───────────────────────────────────────────────────
const PR_RE = /^## PR #(\d+) — (.*) \(`([^`]+)`\)\s*$/;
const COMMENT_RE = /^### (C-\d+) — (.+?) — `(.+)`\s*$/;
const URL_RE = /^- url: (\S+)\s*$/;
const BODIES_RE = /^## Review bodies and issue comments/;
const BODY_RE = /^- PR #(\d+) (review by|issue comment by) ([^:(]+?)(?: \((\w+)\))?: (.*)$/;

/** @type {Array<{ id: string, author: string, anchor: string, pr: string, url: string | null }>} */
const comments = [];
/** @type {Array<{ pr: string, title: string, branch: string }>} */
const prs = [];
/** @type {Map<string, { copilot?: string, maintainer?: string, changeset?: string }>} */
const bodies = new Map();

let currentPr = null;
let inBodies = false;
let lastComment = null;
for (const line of read(INVENTORY).split('\n')) {
  if (BODIES_RE.test(line)) {
    inBodies = true;
    lastComment = null;
    continue;
  }
  const pr = PR_RE.exec(line);
  if (pr) {
    currentPr = pr[1];
    prs.push({ pr: pr[1], title: pr[2], branch: pr[3] });
    lastComment = null;
    continue;
  }
  if (inBodies) {
    const b = BODY_RE.exec(line);
    if (!b) continue;
    const [, n, kind, who, , text] = b;
    const entry = bodies.get(n) ?? {};
    if (kind === 'review by' && who.startsWith('copilot')) {
      const m = /Copilot review overview\s+###\s+(.+?)(?:\s{2,}|$)/.exec(text);
      entry.copilot = m ? m[1].replace(/^[^\p{L}]+/u, '').trim() : 'overview (headline not parsed)';
    } else if (kind === 'review by') {
      entry.maintainer = `${who.trim()}: "${text.trim()}"`;
    } else if (who.startsWith('changeset-bot')) {
      entry.changeset = /No Changeset found/.test(text) ? 'No Changeset found' : text.trim().slice(0, 60);
    }
    bodies.set(n, entry);
    continue;
  }
  const c = COMMENT_RE.exec(line);
  if (c) {
    if (!currentPr) problems.push(`${c[1]} appears before any "## PR #" header`);
    lastComment = { id: c[1], author: c[2], anchor: c[3], pr: currentPr, url: null };
    comments.push(lastComment);
    continue;
  }
  const u = URL_RE.exec(line);
  if (u && lastComment && lastComment.url === null) lastComment.url = u[1];
}

for (const c of comments) if (!c.url) problems.push(`${c.id} has no "- url:" line`);

// ── Parse the dispositions ────────────────────────────────────────────────
/** @type {Map<string, { disposition: string, plan: string }>} */
const disp = new Map();
const tsvIds = [];
read(TSV)
  .split('\n')
  .forEach((line, idx) => {
    if (line.trim() === '' || line.startsWith('#')) return;
    const cells = line.split('\t');
    if (cells.length !== 3) {
      problems.push(`dispositions.tsv line ${idx + 1} does not have three tab-separated fields`);
      return;
    }
    const [id, disposition, plan] = cells.map((s) => s.trim());
    tsvIds.push(id);
    if (!DISPOSITIONS.includes(disposition)) problems.push(`${id}: disposition "${disposition}" is not one of ${DISPOSITIONS.join(', ')}`);
    if (!/^165-\d{2}$/.test(plan)) problems.push(`${id}: owner plan "${plan}" is not 165-NN`);
    else if (!existsSync(join(PHASE_DIR, `${plan}-PLAN.md`))) problems.push(`${id}: owner plan ${plan} has no ${plan}-PLAN.md`);
    disp.set(id, { disposition, plan });
  });

// ── Set equality, both directions, and duplicates ─────────────────────────
function duplicates(list) {
  const seen = new Set();
  const dup = new Set();
  for (const x of list) (seen.has(x) ? dup : seen).add(x);
  return [...dup];
}
const invIds = comments.map((c) => c.id);
const invDup = duplicates(invIds);
const tsvDup = duplicates(tsvIds);
if (invDup.length) problems.push(`duplicate ids in 165-REVIEW-COMMENTS.md: ${invDup.join(', ')}`);
if (tsvDup.length) problems.push(`duplicate ids in dispositions.tsv: ${tsvDup.join(', ')}`);
const invSet = new Set(invIds);
const tsvSet = new Set(tsvIds);
const missingFromTsv = invIds.filter((id) => !tsvSet.has(id));
const extraInTsv = tsvIds.filter((id) => !invSet.has(id));
if (missingFromTsv.length) problems.push(`in the inventory but not in dispositions.tsv: ${missingFromTsv.join(', ')}`);
if (extraInTsv.length) problems.push(`in dispositions.tsv but not in the inventory: ${extraInTsv.join(', ')}`);

if (problems.length) {
  console.error('ledger-skeleton.mjs: refusing to write 165-LEDGER.md:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

// ── Render ────────────────────────────────────────────────────────────────
const cell = (s) => String(s).replaceAll('|', '\\|');
const counts = Object.fromEntries(DISPOSITIONS.map((d) => [d, 0]));
for (const c of comments) counts[disp.get(c.id).disposition]++;
const inlinePerPr = new Map(prs.map((p) => [p.pr, 0]));
for (const c of comments) inlinePerPr.set(c.pr, (inlinePerPr.get(c.pr) ?? 0) + 1);

const out = [];
out.push('# Phase 165 — Review-comment disposition ledger');
out.push('');
out.push(
  'This ledger records one disposition for every inline review comment on the v2.15 review stack (PRs #876-#887), as `165-REVIEW-COMMENTS.md` inventories them, plus an appendix for the PR review bodies. It is generated by `scripts/ledger-skeleton.mjs` from that inventory and `scripts/dispositions.tsv`, so the id set is derived, never transcribed.'
);
out.push('');
out.push('**Dispositions (D-01).** Each comment carries exactly one:');
out.push('');
out.push('- `fix` — the defect is real at the stack tip and is fixed on `ship/v2.15-13-review-fixes`.');
out.push('- `split-artifact` — the defect exists only in an intermediate slice; the tip is correct, proven at the tip.');
out.push('- `already-fixed` — a later commit already resolved it; the evidence cites the commit or the tip state.');
out.push('- `deferred` — deferred by the maintainer (D-03) and recorded as a follow-up.');
out.push('- `wont-fix` — declined with a concrete technical reason (D-07).');
out.push('');
out.push(
  '**Commit links.** The Commit cell of a `fix` row is derived by plan 165-36 from the `Review-Comment: C-<id>` trailers of the commits on this branch. Evidence and Draft reply cells start as `pending` and are filled by the owner plan.'
);
out.push('');
out.push(
  '**Replies.** This phase posts no reply on any GitHub thread (D-05, D-12). The Draft reply column holds the proposed text; the maintainer posts it or explicitly authorises posting.'
);
out.push('');
out.push('**Checks.** From the repository root:');
out.push('');
out.push('```sh');
out.push('bash .planning/phases/165-review-stack-comment-remediation/scripts/ledger-check.sh          # completeness and vocabulary');
out.push('bash .planning/phases/165-review-stack-comment-remediation/scripts/ledger-check.sh --final  # also: no pending cell, fix commits reachable, tip proofs');
out.push('```');
out.push('');
out.push(
  `Counts: ${DISPOSITIONS.map((d) => `${counts[d]} ${d}`).join(', ')} — ${comments.length} in total.`
);
out.push('');
out.push(`## Inline review comments (${comments.length})`);
out.push('');
out.push('| Comment | PR | Author | Anchor | Disposition | Plan | Evidence | Commit | Draft reply |');
out.push('|---|---|---|---|---|---|---|---|---|');
for (const c of comments) {
  const d = disp.get(c.id);
  out.push(
    `| [${c.id}](${c.url}) | #${c.pr} | ${cell(c.author)} | \`${cell(c.anchor)}\` | ${d.disposition} | ${d.plan} | pending | pending | pending |`
  );
}
out.push('');
out.push(`## Review bodies (appendix, no action)`);
out.push('');
out.push(
  'Each PR also carries a Copilot overview review, a maintainer review body and a changeset-bot note. They summarise the inline comments above and ask for nothing further (D-11).'
);
out.push('');
out.push('| PR | Branch | Inline comments | Copilot overview | Maintainer review body | changeset-bot | Disposition |');
out.push('|---|---|---|---|---|---|---|');
for (const p of prs) {
  const b = bodies.get(p.pr) ?? {};
  const n = inlinePerPr.get(p.pr) ?? 0;
  out.push(
    `| #${p.pr} | \`${cell(p.branch)}\` | ${n === 0 ? 'none (this PR has no inline comments)' : n} | ${cell(b.copilot ?? 'none recorded')} | ${cell(b.maintainer ?? 'none recorded')} | ${cell(b.changeset ?? 'none recorded')} | no-action (summary of inline comments) |`
  );
}
out.push('');
const text = out.join('\n');

if (existsSync(LEDGER)) {
  const current = readFileSync(LEDGER, 'utf-8');
  if (current === text) {
    console.log(`ledger-skeleton.mjs: 165-LEDGER.md already up to date (${comments.length} rows, ${prs.length} appendix rows)`);
    process.exit(0);
  }
  if (!FORCE) {
    console.error('ledger-skeleton.mjs: 165-LEDGER.md exists and differs from a fresh skeleton; leaving it untouched.');
    console.error('  Later plans fill its Evidence, Commit and Draft reply cells. Re-run with --force only to discard them.');
    process.exit(3);
  }
}
writeFileSync(LEDGER, text, 'utf-8');
console.log(
  `ledger-skeleton.mjs: wrote 165-LEDGER.md — ${comments.length} inline rows (${DISPOSITIONS.map((d) => `${counts[d]} ${d}`).join(', ')}), ${prs.length} appendix rows`
);
