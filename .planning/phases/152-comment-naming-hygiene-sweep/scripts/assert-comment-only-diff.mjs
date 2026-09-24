#!/usr/bin/env node

/**
 * COMMENT-ONLY DIFF PROVER (phase 152, requirement REVIEW-HYG-02, criterion 5).
 *
 * The incident this file exists for: a comment codemod holds write access to 1,465 files, and
 * the only thing separating a comment edit from a CODE edit is a regex staying inside a
 * classified span. `.claude/skills/ship-review-stack/SKILL.md:314` records what happens when
 * one does not: 38 broken comments in the test tree, 28 in the routing surface, 6 in the
 * components. And the codemod's own `hits + residue == total` balance was GREEN throughout —
 * `SKILL.md:265` records six Phase-151 artifacts that were self-consistent and wrong. An
 * arithmetic identity proves that every occurrence was classified; it cannot prove that any
 * classification was right, and it says nothing at all about the bytes outside a comment span.
 *
 * So: this script takes a git range and proves, per file, that the NON-COMMENT byte stream is
 * unchanged. If it passes, the sweep changed no program bytes. That is a mechanical claim,
 * checkable by a stranger, and it is the half of criterion 5 that does not need a human.
 *
 * ⚠ THIS IS ONE HALF OF CRITERION 5, AND THE HALVES DO NOT SUBSTITUTE FOR EACH OTHER. The
 * other half is the HAND REVIEW of the codemod's `not-a-comment-span` residue rows — the 98
 * occurrences that live in a `console.warn` string, a Playwright test title or an ESLint rule
 * `message:`, which this script deliberately cannot judge because it is precisely those bytes
 * it is asserting nobody touched. A green run here says "no program byte changed". It does not
 * say "the comment that changed still says something true". Only reading the diff does that.
 *
 * ── HOW THE COMPARISON WORKS ────────────────────────────────────────────────
 * For each file changed in the range, both blobs are read, each is passed through the SHARED
 * comment-span classifier (imported from `hygiene-codemod.mjs` — one classifier in this phase,
 * not a fourth copy), every comment span is removed, and the remaining characters are
 * concatenated into a CODE STREAM: per line, the non-comment residue with trailing whitespace
 * trimmed, and lines whose residue is empty dropped entirely. Dropping empties is what makes
 * the comparison "identical modulo line count": deleting a whole comment line, or rewrapping
 * three comment lines into one, changes the file's line count without changing a single
 * program byte, and must pass.
 *
 * A file whose extension has no comment family (`.json`, `.md`, a lockfile) has NO comment
 * spans, so its entire content is code and ANY change to it is a violation. That is deliberate
 * and fails closed: a sweep has no business editing those files, and if it did, the reviewer
 * should be told.
 *
 * ── `--allow`, AND WHY IT IS A NAMED LIST AND NOT SILENCE ───────────────────
 * Some commits in this phase legitimately change non-comment bytes: the file renames and the
 * three identifier renames. Those are excluded BY NAME, one `--allow <path>` each, so the
 * exclusion appears in the command line a reviewer reads. An unlisted non-comment change is
 * ALWAYS a violation. There is no wildcard, no ignore file and no warn-only tier — excusing a
 * file means writing its path into the invocation, which is then reviewed as the decision it
 * is. The phase's own bar, from the line-break ruling: over the comment-sweep range this must
 * report zero non-comment byte changes with ZERO allow entries.
 *
 * ⚠ NO DASH RULE, and no rule of any other kind. This script rewrites nothing and writes no
 * file. It reads two git blobs and compares them.
 *
 * Usage (run from anywhere inside the repository):
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs \
 *     --range <rev>..<rev> [--allow <path>]...
 *
 * Exit codes — the caller must be able to branch on the status alone:
 *   0  every changed file's non-comment byte stream is identical (or is explicitly allowed)
 *   1  at least one unallowed non-comment change, or a named precondition failure (an
 *      unreadable blob, an unparseable range, a binary file). A blob this script cannot read
 *      is behaviour it cannot vouch for, and is never read as unchanged — this fails closed.
 */

import { execFileSync } from 'node:child_process';

import { commentSpans, FAMILY_BY_EXT } from './hygiene-codemod.mjs';

// The NUL byte: git's -z separator, and the binary-file sentinel. Written as an escape
// rather than a literal so it survives every editor, diff viewer and copy-paste on its way
// to a reviewer.
const NUL = '\u0000';

const SELF = '.planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs';

const argv = process.argv.slice(2);
const KNOWN_FLAGS = new Set(['--range', '--allow', '-h', '--help']);

function valueOf(flag) {
  const i = argv.indexOf(flag);
  if (i < 0) return null;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : null;
}

function valuesOf(flag) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== flag) continue;
    const v = argv[i + 1];
    if (v && !v.startsWith('--')) out.push(v);
  }
  return out;
}

function git(args, options = {}) {
  return execFileSync('git', args, { maxBuffer: 256 * 1024 * 1024, ...options });
}

function repoRoot() {
  return git(['rev-parse', '--show-toplevel']).toString('utf-8').trim();
}

function familyFor(path) {
  return FAMILY_BY_EXT[(path.split('.').pop() || '').toLowerCase()] || {};
}

/**
 * The file's non-comment characters, as one stream. Comment spans removed; each line's residue
 * right-trimmed; empty residues dropped. Line count is therefore not part of the comparison,
 * which is what lets a comment line be deleted or three be joined into one.
 */
function codeStream(path, text) {
  const fam = familyFor(path);
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false };
  const out = [];
  for (const line of text.split('\n')) {
    const spans = commentSpans(line, fam, state);
    let residue = line;
    for (let k = spans.length - 1; k >= 0; k--) residue = residue.slice(0, spans[k][0]) + residue.slice(spans[k][1]);
    residue = residue.replace(/[ \t]+$/, '');
    if (residue.length > 0) out.push(residue);
  }
  return out.join('\n');
}

/** `git show <rev>:<path>`, or `null` for a path that does not exist at that revision. */
function blobAt(rev, path, cwd) {
  if (rev === null || path === null) return '';
  try {
    return git(['show', `${rev}:${path}`], { cwd }).toString('utf-8');
  } catch {
    return null;
  }
}

function firstDifference(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

function quoteAround(stream, offset) {
  const from = Math.max(0, offset - 40);
  return JSON.stringify(stream.slice(from, offset + 40));
}

function printUsage() {
  console.log(
    [
      'COMMENT-ONLY DIFF PROVER (phase 152, requirement REVIEW-HYG-02, criterion 5)',
      '',
      'Usage:',
      '  node …/assert-comment-only-diff.mjs --range <rev>..<rev> [--allow <path>]...',
      '',
      'Proves that no NON-COMMENT byte changed across the range. This is criterion 5’s',
      'mechanical half; the hand review of the not-a-comment-span residue is the other.'
    ].join('\n')
  );
}

function main() {
  const unknown = argv.filter((a, i) => a.startsWith('-') && !KNOWN_FLAGS.has(a) && argv[i - 1] !== '--range');
  if (unknown.length > 0) {
    console.error(`[ERROR] ${SELF}: unknown flag '${unknown[0]}'.`);
    process.exitCode = 1;
    return;
  }
  if (argv.includes('-h') || argv.includes('--help')) {
    printUsage();
    process.exitCode = 0;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  const range = valueOf('--range');
  if (!range) {
    violate('--range <rev>..<rev> is required. Without a range there is nothing to prove.');
    process.exitCode = 1;
    return;
  }
  const allow = new Set(valuesOf('--allow'));

  let root;
  let entries;
  try {
    root = repoRoot();
    entries = git(['diff', '--name-status', '--find-renames', '-z', range], { cwd: root })
      .toString('utf-8')
      .split(NUL)
      .filter(Boolean);
  } catch (error) {
    violate(
      `could not read the range '${range}' (${error.message}). A range this script cannot parse ` +
        'is behaviour it cannot vouch for — this fails closed.'
    );
    process.exitCode = 1;
    return;
  }

  // `-z` output is a flat NUL-separated stream: STATUS, PATH [, PATH for R/C].
  const changes = [];
  for (let i = 0; i < entries.length; i++) {
    const status = entries[i];
    if (status.startsWith('R') || status.startsWith('C')) {
      changes.push({ status: status[0], oldPath: entries[i + 1], newPath: entries[i + 2] });
      i += 2;
    } else {
      const p = entries[i + 1];
      changes.push({
        status: status[0],
        oldPath: status[0] === 'A' ? null : p,
        newPath: status[0] === 'D' ? null : p
      });
      i += 1;
    }
  }

  const [base, head] = range.includes('...') ? range.split('...') : range.split('..');
  let checked = 0;
  let allowed = 0;

  for (const change of changes) {
    const label = change.oldPath && change.newPath && change.oldPath !== change.newPath
      ? `${change.oldPath} -> ${change.newPath}`
      : (change.newPath ?? change.oldPath);

    if (allow.has(change.newPath) || allow.has(change.oldPath)) {
      allowed++;
      console.log(`  ~ ALLOWED   ${label}  (${change.status}) — named on the command line`);
      continue;
    }

    const before = blobAt(base, change.oldPath, root);
    const after = blobAt(head, change.newPath, root);
    if (before === null || after === null) {
      violate(`could not read a blob for '${label}' at ${range}. This fails closed.`);
      continue;
    }
    if (before.includes(NUL) || after.includes(NUL)) {
      violate(`'${label}' is binary; a comment sweep has no business changing it.`);
      continue;
    }

    checked++;
    const beforeCode = codeStream(change.oldPath ?? change.newPath, before);
    const afterCode = codeStream(change.newPath ?? change.oldPath, after);
    const at = firstDifference(beforeCode, afterCode);
    if (at < 0) {
      console.log(`  ✓ COMMENT-ONLY  ${label}`);
      continue;
    }
    violate(
      `'${label}': a NON-COMMENT byte changed at code-stream offset ${at}.\n` +
        `           before: ${quoteAround(beforeCode, at)}\n` +
        `           after : ${quoteAround(afterCode, at)}\n` +
        '           If this change is intended (a rename, an identifier rename), name the file ' +
        'with --allow so the exclusion is visible in the command a reviewer reads.'
    );
  }

  console.log(
    `\nComment-only diff prover (phase 152: REVIEW-HYG-02 criterion 5) — range ${range}; ` +
      `files changed: ${changes.length}; compared: ${checked}; allowed by name: ${allowed}; ` +
      `${violations} violation(s).`
  );
  if (violations === 0 && allowed === 0 && checked > 0) {
    console.log('Zero non-comment byte changes, with ZERO allow entries. This is the bar the sweep must clear.');
  }

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
