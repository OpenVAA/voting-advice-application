#!/usr/bin/env node
/**
 * SPIKE 009 — Codemod: $store.X auto-subscribe → ctx.current.X
 *
 * Targets the consumer-side migration of legacy svelte/store usages to
 * fully-rune-native readers. Two passes:
 *
 *   PASS 1 (rewrite):
 *     $appSettings.X  →  appSettings.current.X
 *     $dataRoot.X     →  dataRoot.current.X
 *     $darkMode       →  darkMode.current
 *     $locale         →  locale.current
 *
 *   PASS 1b (rewrite — Wave-3 getRoute extension, CONS-02):
 *     $getRoute(      →  getRoute.current(
 *   A dedicated open-paren-guarded pass (NOT in STORE_REWRITES — the store
 *   form's `(?!\w)` guard mis-handles the call form). Counted separately as
 *   `$getRoute:` in the summary (NOT folded into `by store:` / totalHits-by-store).
 *
 *   PASS 2 (lint / warn — does not rewrite):
 *     const { selectedElections, opinionQuestions, matches, ... } = getVoterContext();
 *     const { unsavedQuestionIds, hasUnsavedAnswers, ... } = getCandidateContext();
 *   Where any of the destructured names are in the documented reactive-accessor
 *   list (CLAUDE.md Context Destructuring Rule). Spike 007 verified this
 *   trap reproduces in the rune-native pattern; the codemod flags every such
 *   callsite for human review.
 *
 * Default: dry-run (prints what WOULD change, exit 0 if nothing).
 * --apply: actually writes the changes.
 * --files <glob>: restrict the scan (default: apps/frontend/src/**\/*.svelte).
 *
 * Usage:
 *   node apps/frontend/scripts/spike-009-store-codemod.mjs            # dry-run, all .svelte files
 *   node apps/frontend/scripts/spike-009-store-codemod.mjs --apply    # write changes
 *   node apps/frontend/scripts/spike-009-store-codemod.mjs --files 'src/lib/components/**\/*.svelte'
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { globSync } from 'node:fs';

// ── Configuration ───────────────────────────────────────────────────────

/** Stores being migrated. Each maps to its rune-context handle name. */
const STORE_REWRITES = [
  { store: 'appSettings', handle: 'appSettings', accessor: 'current' },
  { store: 'dataRoot', handle: 'dataRoot', accessor: 'current' },
  { store: 'darkMode', handle: 'darkMode', accessor: 'current' },
  { store: 'locale', handle: 'locale', accessor: 'current' }
];

/** Reactive accessors from CLAUDE.md Context Destructuring Rule.
 *  Destructure-trap candidates. */
const REACTIVE_ACCESSORS = new Set([
  // voter
  'selectedElections',
  'selectedConstituencies',
  'opinionQuestions',
  'infoQuestions',
  'infoQuestionCategories',
  'opinionQuestionCategories',
  'questionBlocks',
  'unansweredOpinionQuestions',
  'unansweredRequiredInfoQuestions',
  'requiredInfoQuestions',
  'answersLocked',
  'profileComplete',
  'electionsSelectable',
  'constituenciesSelectable',
  'matches',
  'nominationsAvailable',
  'resultsAvailable',
  // candidate
  'idTokenClaims',
  'isPreregistered',
  'isAuthenticated',
  'preregistrationElections',
  'preregistrationNominations',
  'newUserEmail'
]);

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const filesArgIdx = args.indexOf('--files');
const FILES_GLOB =
  filesArgIdx >= 0 ? args[filesArgIdx + 1] : 'apps/frontend/src/**/*.svelte';

const REPO_ROOT = resolve(process.cwd());

// ── Pass 1: $store.X rewrite ────────────────────────────────────────────

function rewriteFile(filepath) {
  const original = readFileSync(filepath, 'utf-8');
  let changed = original;
  const hits = [];

  for (const { store, handle, accessor } of STORE_REWRITES) {
    // Match `$<store>` followed by either:
    //   - `.X` (property access — `$appSettings.foo`)
    //   - end-of-identifier (bare read — `$darkMode`)
    // Negative lookbehind for `\w` to avoid matching `$$appSettings` or `obj.$appSettings`.
    // Negative lookbehind for `_` to avoid matching `_$appSettings`.
    // Negative lookahead `\w` after store name to avoid matching `$appSettingsFoo`.
    const pattern = new RegExp(
      `(?<![\\w$_])\\$${store}(?!\\w)`,
      'g'
    );

    changed = changed.replace(pattern, (match, offset) => {
      const lineStart = changed.lastIndexOf('\n', offset) + 1;
      const lineEnd = changed.indexOf('\n', offset);
      const line = changed.slice(lineStart, lineEnd === -1 ? changed.length : lineEnd);
      const lineNo = changed.slice(0, offset).split('\n').length;
      hits.push({
        line: lineNo,
        before: line.trim(),
        match,
        replacement: `${handle}.${accessor}`
      });
      return `${handle}.${accessor}`;
    });
  }

  // ── Dedicated getRoute pass — `$getRoute(` → `getRoute.current(` ──────────
  // `getRoute` is ALWAYS a call (`$getRoute(opts)`), so it needs a distinct
  // open-paren guard rather than the store form's `(?!\w)`:
  //   - `(?<![\w$_])` rejects `obj.$getRoute` / `_$getRoute` / `$$getRoute`
  //   - `(?=\()`       matches only the CALL form, so it rejects `$getRouteFoo(`
  //                    (the trailing `Foo` makes the lookahead fail at `$getRoute`)
  // Idempotent: `getRoute.current(` has no leading `$` → never re-matches.
  // Tracked in its OWN `getRouteHits` (NOT folded into STORE_REWRITES/byStore).
  const getRouteRe = /(?<![\w$_])\$getRoute(?=\()/g;
  changed = changed.replace(getRouteRe, (match, offset) => {
    const lineStart = changed.lastIndexOf('\n', offset) + 1;
    const lineEnd = changed.indexOf('\n', offset);
    const line = changed.slice(lineStart, lineEnd === -1 ? changed.length : lineEnd);
    const lineNo = changed.slice(0, offset).split('\n').length;
    const replacement = 'getRoute.current';
    hits.push({ line: lineNo, before: line.trim(), match, replacement, isGetRoute: true });
    return replacement;
  });

  return { original, changed, hits };
}

// ── Pass 2: destructure-trap detection ──────────────────────────────────

function detectDestructureTraps(filepath, content) {
  const warnings = [];

  // Pattern: `const { A, B, C } = get*Context()` where any of A/B/C is in REACTIVE_ACCESSORS.
  // Multi-line aware via [\s\S] for the destructure body.
  const pattern = /const\s*\{([\s\S]*?)\}\s*=\s*(get\w+Context)\s*\(/g;
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const names = m[1]
      .split(',')
      .map((n) => n.split(':')[0].split('=')[0].trim())
      .filter(Boolean);
    const trapped = names.filter((n) => REACTIVE_ACCESSORS.has(n));
    if (trapped.length === 0) continue;
    const lineNo = content.slice(0, m.index).split('\n').length;
    warnings.push({
      line: lineNo,
      contextCall: m[2],
      trappedNames: trapped,
      excerpt: m[0].split('\n').slice(0, 3).join(' ').slice(0, 200)
    });
  }

  return warnings;
}

// ── Main ────────────────────────────────────────────────────────────────

const files = globSync(FILES_GLOB, { cwd: REPO_ROOT });
if (files.length === 0) {
  console.error(`No files matched: ${FILES_GLOB}`);
  process.exit(1);
}

const summary = {
  filesScanned: files.length,
  filesChanged: 0,
  totalHits: 0,
  filesWithTraps: 0,
  totalTraps: 0,
  byStore: Object.fromEntries(STORE_REWRITES.map((s) => [s.store, 0])),
  // Separate counter for the dedicated `$getRoute(` pass — NOT captured by
  // `byStore` (the STORE_REWRITES.find(...) returns undefined for `$getRoute`).
  getRouteHits: 0
};

const fileResults = [];

for (const filepath of files) {
  const abs = resolve(REPO_ROOT, filepath);
  const { original, changed, hits } = rewriteFile(abs);
  const warnings = detectDestructureTraps(abs, original);

  if (hits.length === 0 && warnings.length === 0) continue;

  fileResults.push({ filepath, hits, warnings });

  if (hits.length > 0) {
    summary.filesChanged++;
    summary.totalHits += hits.length;
    for (const h of hits) {
      if (h.isGetRoute) {
        summary.getRouteHits++;
        continue;
      }
      const store = STORE_REWRITES.find((s) => h.match === `$${s.store}`)?.store;
      if (store) summary.byStore[store]++;
    }
  }
  if (warnings.length > 0) {
    summary.filesWithTraps++;
    summary.totalTraps += warnings.length;
  }

  if (APPLY && hits.length > 0) {
    writeFileSync(abs, changed);
  }
}

// ── Output ──────────────────────────────────────────────────────────────

console.log(`SPIKE 009 — store-autosubscribe codemod ${APPLY ? '(APPLIED)' : '(DRY-RUN)'}\n`);

for (const { filepath, hits, warnings } of fileResults) {
  const rel = relative(REPO_ROOT, filepath);
  console.log(`▸ ${rel}`);
  for (const h of hits) {
    console.log(`    L${h.line}  ${h.match}  →  ${h.replacement}`);
  }
  for (const w of warnings) {
    console.log(
      `    L${w.line}  ⚠ DESTRUCTURE TRAP (${w.contextCall}) — names: ${w.trappedNames.join(', ')}`
    );
  }
}

console.log('\n── Summary ──');
console.log(`  Files scanned:   ${summary.filesScanned}`);
console.log(`  Files to change: ${summary.filesChanged}`);
console.log(`  Total rewrites:  ${summary.totalHits}`);
console.log(`    by store:`);
for (const [s, c] of Object.entries(summary.byStore)) {
  if (c > 0) console.log(`      $${s}: ${c}`);
}
// Dedicated getRoute counter (NOT part of `by store:` — its own pass).
console.log(`    $getRoute: ${summary.getRouteHits}`);
console.log(`  Files with destructure traps: ${summary.filesWithTraps}`);
console.log(`  Total traps flagged:          ${summary.totalTraps}`);
console.log(`\n${APPLY ? '✓ Changes written.' : 'Dry-run only. Re-run with --apply to write.'}`);
