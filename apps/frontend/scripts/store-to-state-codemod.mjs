#!/usr/bin/env node
/**
 * see phase 114 — Codemod: rune-native `*Store` identifiers → `*State`
 *
 * After the class conversions (see phase 106 through 113) there are NO Svelte stores behind any
 * of the in-scope `*Store` symbols — they are plain classes / factory functions /
 * `$state`-backed fields. The "Store" suffix is now a misnomer. This codemod rewrites
 * the camelCase identifiers AND the PascalCase type names to `*State`, leaving file
 * renames to `git mv` (done separately) and import-path SEGMENT fixes to this same
 * allowlist (a path like `./answerStore.svelte` contains the whole-word token
 * `answerStore`, so the `\b`-anchored allowlist rewrites it too).
 *
 * Mirrors the Phase-113 codemod shape (apps/frontend/scripts/flatten-current-codemod.mjs):
 * dry-run by default, `--apply` to write, `--files <glob>` to restrict scope.
 *
 * ── ORDERED ALLOWLIST (LONGEST-TOKEN-FIRST) ─────────────────────────────────
 * Every replacement is a `\b`-anchored WHOLE-WORD swap. The list is ordered so a
 * LONGER token is rewritten before any shorter token it contains, defeating
 * substring double-rename (research Architecture Patterns + Pitfall 1). E.g.
 * `editedAnswersStore` BEFORE `answerStore` is belt-and-braces (the camelCase
 * boundary already protects them, but ordering makes the guarantee structural);
 * `nominationAndQuestionStore` BEFORE `questionStore`; PascalCase `*Impl`/`*Deps`/
 * `*Api` variants BEFORE their base type names.
 *
 * ── HARD EXCLUSIONS (research Pitfalls 1, 2, 4) ──────────────────
 *  (a) STRING-LITERAL GUARD: a candidate occurrence whose match index falls
 *      between an opening and a closing single/double quote on the same line is
 *      SKIPPED. This protects the two localStorage key literals
 *      (`'VoterContext-answerStore'`, `'CandidateContext-candidateUserDataStore-…'`)
 *      — renaming them would orphan persisted user data (a behavior change).
 *  (b) ALLOWLIST OMISSIONS: the table deliberately OMITS the singular server
 *      job registry symbol, the server `Job*` domain types, the cookie-jar test
 *      mock, and the `*Stored*Value` substring-trap symbols. Because every
 *      replacement is `\b`-anchored whole-word, the longer-token
 *      `JobStatesProvider`/`jobStates`/`JobStates` rewrites NEVER touch the
 *      singular server symbol (no whole-word entry for it exists). The `#store`
 *      field and `localStorageState(...)` are likewise untouched (`store` /
 *      `localStorageState` are not `*Store` whole-word tokens).
 *
 * ── Idempotency guarantee ───────────────────────────────────────────────────
 * After `--apply` no allowlist `*Store` token remains in code, so a second run
 * reports 0 rewrites — the codemod is safely re-runnable as a no-op.
 *
 * Default: dry-run (prints what WOULD change, writes nothing, exit 0).
 * --apply: actually writes the changes.
 * --files <glob>: restrict the scan (default: apps/frontend/src/**\/*.{ts,svelte}).
 *
 * Usage (run from apps/frontend):
 *   node scripts/store-to-state-codemod.mjs                                          # dry-run, all src
 *   node scripts/store-to-state-codemod.mjs --files 'src/lib/contexts/voter/**\/*.{ts,svelte}'
 *   node scripts/store-to-state-codemod.mjs --apply --files 'src/lib/contexts/voter/**\/*.{ts,svelte}'
 */

import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { resolve, relative } from 'node:path';

// ── Ordered allowlist — LONGEST TOKEN FIRST ──────────────────────────────
// [from, to]. Anchored `\b...\b` whole-word. Order: longer tokens before any
// shorter token they could contain; `*Impl`/`*Deps`/`*Api` before base names.
const RENAMES = [
  // -- candidate / admin cluster (plans 02/03 reuse this same allowlist) --
  ['NominationAndQuestionStoreProvider', 'NominationAndQuestionStateProvider'],
  ['NominationAndQuestionStoreImpl', 'NominationAndQuestionStateImpl'],
  ['NominationAndQuestionStoreDeps', 'NominationAndQuestionStateDeps'],
  ['nominationAndQuestionStore', 'nominationAndQuestionState'],
  ['CandidateUserDataStoreImpl', 'CandidateUserDataStateImpl'],
  ['CandidateUserDataStore', 'CandidateUserDataState'],
  ['candidateUserDataStore', 'candidateUserDataState'],
  ['editedAnswersStore', 'editedAnswersState'],
  ['JobStoresProvider', 'JobStatesProvider'],
  ['JobStores', 'JobStates'],
  ['jobStores', 'jobStates'],
  // -- voter / utils cluster (this plan) --
  ['AnswerStoreImpl', 'AnswerStateImpl'],
  ['AnswerStore', 'AnswerState'],
  ['answerStore', 'answerState'],
  ['PopupStoreApi', 'PopupStateApi'],
  ['PopupStore', 'PopupState'],
  ['popupStore', 'popupState'],
  ['MatchStoreDeps', 'MatchStateDeps'],
  ['MatchStoreImpl', 'MatchStateImpl'],
  ['matchStore', 'matchState'],
  ['FilterStoreDeps', 'FilterStateDeps'],
  ['FilterStoreImpl', 'FilterStateImpl'],
  ['filterStore', 'filterState'],
  ['ParamStoreImpl', 'ParamStateImpl'],
  ['paramStore', 'paramState'],
  ['questionBlockStore', 'questionBlockState'],
  ['questionCategoryStore', 'questionCategoryState'],
  ['questionStore', 'questionState'],
  ['pageDatumStore', 'pageDatumState']
];

// ── CLI args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const filesArgIdx = args.indexOf('--files');
const FILES_GLOB = filesArgIdx >= 0 ? args[filesArgIdx + 1] : 'src/**/*.{ts,svelte}';

const REPO_ROOT = resolve(process.cwd());

/**
 * Build a set of [start,end) character ranges on a line that are INSIDE a single-
 * or double-quoted string literal (and template literals). Any match index that
 * falls inside one of these ranges is skipped (string-literal guard).
 */
function quotedRanges(line) {
  const ranges = [];
  let quote = null;
  let start = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote && line[i - 1] !== '\\') {
        ranges.push([start, i + 1]);
        quote = null;
      }
    } else if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      start = i;
    }
  }
  // Unterminated quote (e.g. a multi-line template) — guard to end of line.
  if (quote) ranges.push([start, line.length]);
  return ranges;
}

function isInQuotes(col, ranges) {
  return ranges.some(([s, e]) => col >= s && col < e);
}

function rewriteFile(filepath) {
  const original = readFileSync(filepath, 'utf-8');
  const lines = original.split('\n');
  const hits = [];

  const out = lines.map((line, idx) => {
    const ranges = quotedRanges(line);
    let result = line;
    for (const [from, to] of RENAMES) {
      const re = new RegExp(`\\b${from}\\b`, 'g');
      result = result.replace(re, (match, offset) => {
        // Skip occurrences inside string literals (protects localStorage keys).
        if (isInQuotes(offset, ranges)) return match;
        hits.push({ line: idx + 1, from, to });
        return to;
      });
    }
    return result;
  });

  return { original, changed: out.join('\n'), hits };
}

// ── Main ────────────────────────────────────────────────────────────────
const files = globSync(FILES_GLOB, { cwd: REPO_ROOT });
if (files.length === 0) {
  console.error(`No files matched: ${FILES_GLOB}`);
  process.exit(1);
}

console.log(`store→state codemod ${APPLY ? '(APPLIED)' : '(DRY-RUN)'}\n`);

let filesChanged = 0;
let totalHits = 0;

for (const filepath of files) {
  const abs = resolve(REPO_ROOT, filepath);
  const { changed, hits } = rewriteFile(abs);
  if (hits.length === 0) continue;

  filesChanged++;
  totalHits += hits.length;

  console.log(`▸ ${relative(REPO_ROOT, abs)}  (${hits.length})`);
  for (const h of hits) {
    console.log(`    L${h.line}  ${h.from}  →  ${h.to}`);
  }

  if (APPLY) writeFileSync(abs, changed);
}

console.log('\n── Summary ──');
console.log(`  Files scanned:  ${files.length}`);
console.log(`  Files changed:  ${filesChanged}`);
console.log(`  Total rewrites: ${totalHits}`);
console.log(`\n${APPLY ? '✓ Changes written.' : 'Dry-run only. Re-run with --apply to write.'}`);
process.exit(0);
