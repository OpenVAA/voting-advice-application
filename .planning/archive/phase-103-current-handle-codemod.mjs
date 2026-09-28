#!/usr/bin/env node
/**
 * PHASE 103 — Codemod: named context-handle `.current` → flat idiom
 *
 * Extends the proven Phase-97 `spike-009-store-codemod.mjs` (pure-Node,
 * dependency-free, idempotent regex passes) into a four-pass named-handle
 * codemod. Scope = the named-handle ALLOWLIST from the Phase-102 decision
 * record (§A read-only, §B read-write) — NEVER a blanket `.current` regex.
 * The E1–E4 retained exceptions (popupQueue, candidateUserData,
 * reactiveDataRoot.instance, topBarSettings) are NOT in the allowlist and are
 * left untouched; the false-positive `.current` properties (Tween, this,
 * password, event, row, updated) are likewise out of scope by construction
 * (their names are not in the allowlist).
 *
 *   PASS 1 — read rewrite (every allowlisted handle H, read-only + read-side):
 *     <H>.current        →  <H>
 *   Regex per handle: /\b(<H>)\.current\b/g → '$1'
 *   Idempotent: bare `<H>` does not re-match `<H>.current`.
 *   A11 SAFETY: `reactiveDataRoot.current` → `reactiveDataRoot`, but
 *   `reactiveDataRoot.instance` (E3) is NEVER touched — the `\.current\b`
 *   suffix guard self-excludes `.instance`.
 *
 *   PASS 1b — getRoute call-form pass (A6):
 *     ctx.getRoute.current(   →  ctx.getRoute(
 *     <X>.getRoute.current(   →  <X>.getRoute(
 *   A dedicated open-paren-guarded pass (mirrors spike-009 lines 126-143):
 *   `getRoute` is ALWAYS a call, so it needs `(?=\()` lookahead rather than
 *   the bare `\b` suffix form. Counted separately as `getRoute (call form)`.
 *
 *   PASS 2 — write rewrite (5 consumer write sites only — B15/B17/B18):
 *     <H>.set(v)             →  <H> = v
 *   Regex: /\b(<H>)\.set\(([^)]*)\)/g → '$1 = $2' for appType/sendTrackingEvent/
 *   openFeedbackModal ONLY. LM-7: appContext.svelte.ts is EXCLUDED from the
 *   write pass (its 3 `userPreferences.update` sites are producer-internal on
 *   the local PersistedState handle; there are ZERO external userPreferences
 *   writes). Idempotent: output `<H> = v` has no `.set(` to re-match.
 *
 *   PASS 3 — destructure rewrite (NEW — not in spike-009, which only WARNED):
 *     const { darkMode, ...rest } = getAppContext();   →
 *       const ctx = getAppContext();
 *       const darkMode = $derived(ctx.darkMode);
 *       const { ...rest } = ctx;
 *   Keyed on m[2] (the context-call name). ONLY rewrites when
 *   m[2] ∈ {getAppContext, getVoterContext, getCandidateContext, getAdminContext}.
 *   LM-2: getComponentContext is EXCLUDED — its darkMode/locale/locales are
 *   already plain getters; rewriting them is the regression. Only the FOLDED
 *   reactive handles move to $derived(ctx.X); stable members (getRoute, t,
 *   stable stores) STAY destructured (CLAUDE.md Context Destructuring Rule).
 *   Idempotency caution: the rewrite never re-introduces a `const ctx` when one
 *   already exists for the same call (guarded below).
 *
 *   PASS 4 — destructure-trap AUDIT (warn-only; reuses spike-009 detector):
 *     flag any `const { <reactive-accessor> } = getXxxContext()` left in the
 *     tree, using the EXTENDED REACTIVE_ACCESSORS set (spike-009 set + the 15
 *     newly-folded reactive handles; getRoute/t stay OFF).
 *
 * Default: dry-run (prints what WOULD change, exit 0). --apply writes.
 *
 * Usage:
 *   node .planning/archive/phase-103-current-handle-codemod.mjs              # dry-run
 *   node .planning/archive/phase-103-current-handle-codemod.mjs --apply      # write
 *   node .planning/archive/phase-103-current-handle-codemod.mjs --files '<glob>'
 *
 * Idempotency success criterion: `--apply` && `git diff --quiet`.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { globSync } from 'node:fs';

// ── Configuration ───────────────────────────────────────────────────────

/**
 * Phase-103 named-handle ALLOWLIST (from 102-DECISION-RECORD §A/§B).
 * NOT a `.current` regex. The E1–E4 retained exceptions
 * (popupQueue, candidateUserData, reactiveDataRoot.instance, topBarSettings)
 * are intentionally ABSENT.
 */
const READ_ONLY = [
  'locale',
  'locales',
  'darkMode',
  'reactiveAppSettings',
  'reactiveLocale',
  'surveyLink',
  'sessionId',
  'shouldTrack',
  'dataRoot',
  'reactiveDataRoot', // .current folds (A11); .instance (E3) is self-excluded by the \.current\b guard
  'routeTitle'
];

const READ_WRITE = [
  'appSettings',
  'appCustomization',
  'appType',
  'userPreferences',
  'sendTrackingEvent',
  'openFeedbackModal'
]; // getRoute handled by the dedicated PASS 1b call-form pass (A6)

/** All handles whose `.current` read folds (PASS 1). getRoute is separate. */
const READ_HANDLES = [...READ_ONLY, ...READ_WRITE];

/** Consumer write sites that fold `<H>.set(v)` → `<H> = v` (PASS 2). 5 total. */
const WRITE_HANDLES = ['appType', 'sendTrackingEvent', 'openFeedbackModal'];

/** Files EXCLUDED from the PASS 2 write rewrite (LM-7: producer-internal). */
const WRITE_PASS_EXCLUDE = /appContext\.svelte\.ts$/;

/** Context-call names the PASS 3 destructure rewrite is allowed to touch.
 *  LM-2: getComponentContext is deliberately EXCLUDED. */
const REWRITABLE_CONTEXT_CALLS = new Set([
  'getAppContext',
  'getVoterContext',
  'getCandidateContext',
  'getAdminContext'
]);

/** The folded reactive handles whose destructures move to `$derived(ctx.X)`.
 *  getRoute / t / stable stores STAY destructured (NOT in this set). */
const FOLDED_REACTIVE = new Set([
  'darkMode',
  'appSettings',
  'appCustomization',
  'appType',
  'dataRoot',
  'reactiveDataRoot',
  'locale',
  'locales',
  'reactiveAppSettings',
  'reactiveLocale',
  'userPreferences',
  'surveyLink',
  'routeTitle',
  'sessionId',
  'shouldTrack'
]);

/**
 * Reactive accessors for the PASS 4 destructure-trap audit (CLAUDE.md Context
 * Destructuring Rule). spike-009's voter/candidate set EXTENDED with the 15
 * newly-folded reactive handles. `getRoute` and `t` are intentionally ABSENT
 * (stable references — safe to destructure).
 */
const REACTIVE_ACCESSORS = new Set([
  // voter (spike-009 base set)
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
  // candidate (spike-009 base set)
  'idTokenClaims',
  'isPreregistered',
  'isAuthenticated',
  'preregistrationElections',
  'preregistrationNominations',
  'newUserEmail',
  // Phase-103 newly-folded reactive handles (15)
  'darkMode',
  'appSettings',
  'appCustomization',
  'appType',
  'dataRoot',
  'reactiveDataRoot',
  'locale',
  'locales',
  'reactiveAppSettings',
  'reactiveLocale',
  'userPreferences',
  'surveyLink',
  'routeTitle',
  'sessionId',
  'shouldTrack'
]);

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const filesArgIdx = args.indexOf('--files');
// LM-1: scope MUST include lib/contexts/**/*.svelte.ts (cross-context producer
// reads), not just `.svelte`. We glob both, then filter out tests/poc below.
const DEFAULT_GLOBS = [
  'apps/frontend/src/**/*.svelte',
  'apps/frontend/src/lib/contexts/**/*.svelte.ts'
];
const FILES_GLOB = filesArgIdx >= 0 ? [args[filesArgIdx + 1]] : DEFAULT_GLOBS;

const REPO_ROOT = resolve(process.cwd());

/** Exclude test + PoC files from the change set (hand-edited per D-02). */
function isExcludedFile(rel) {
  return /\.test\.ts$/.test(rel) || /\.poc\./.test(rel);
}

// ── Pass 1 + 1b + 2: per-file regex rewrites ─────────────────────────────

function rewriteFile(filepath, rel) {
  const original = readFileSync(filepath, 'utf-8');
  let changed = original;
  const hits = [];

  const recordHit = (offset, match, replacement, kind) => {
    const lineStart = changed.lastIndexOf('\n', offset) + 1;
    const lineEnd = changed.indexOf('\n', offset);
    const line = changed.slice(lineStart, lineEnd === -1 ? changed.length : lineEnd);
    const lineNo = changed.slice(0, offset).split('\n').length;
    hits.push({ line: lineNo, before: line.trim(), match, replacement, kind });
  };

  // ── PASS 1: read rewrite — `<H>.current` → `<H>` ──────────────────────
  // The `\.current\b` suffix guard self-excludes `reactiveDataRoot.instance`
  // (A11/E3 split): `.instance` never matches `.current`.
  for (const H of READ_HANDLES) {
    const re = new RegExp(`\\b(${H})\\.current\\b`, 'g');
    changed = changed.replace(re, (match, h, offset) => {
      recordHit(offset, match, h, `read:${H}`);
      return h;
    });
  }

  // ── PASS 1b: getRoute call-form — `getRoute.current(` → `getRoute(` ────
  // Open-paren lookahead so only the CALL form folds (mirrors spike-009).
  // Idempotent: `getRoute(` has no `.current` → never re-matches.
  const getRouteRe = /\bgetRoute\.current(?=\()/g;
  changed = changed.replace(getRouteRe, (match, offset) => {
    recordHit(offset, match, 'getRoute', 'getRoute');
    return 'getRoute';
  });

  // ── PASS 2: write rewrite — `<H>.set(v)` → `<H> = v` (5 sites) ─────────
  // LM-7: skip appContext.svelte.ts entirely (producer-internal handle writes).
  if (!WRITE_PASS_EXCLUDE.test(rel)) {
    for (const H of WRITE_HANDLES) {
      const re = new RegExp(`\\b(${H})\\.set\\(([^)]*)\\)`, 'g');
      changed = changed.replace(re, (match, h, val, offset) => {
        recordHit(offset, match, `${h} = ${val}`, `write:${H}`);
        return `${h} = ${val}`;
      });
    }
  }

  return { original, changed, hits };
}

// ── Pass 3: destructure rewrite (folded reactive handles → $derived) ──────
//
// const { darkMode, x, getRoute } = getAppContext();
//   →
// const ctx = getAppContext();
// const darkMode = $derived(ctx.darkMode);
// const x = $derived(ctx.x);
// const { getRoute } = ctx;
//
// Keyed on m[2] (context-call name); only rewrites REWRITABLE_CONTEXT_CALLS
// (LM-2 excludes getComponentContext). Stable members stay destructured.

function rewriteDestructures(content) {
  const pattern = /const\s*\{([\s\S]*?)\}\s*=\s*(get\w+Context)\s*\(\s*\)\s*;/g;
  const rewrites = [];
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const contextCall = m[2];
    if (!REWRITABLE_CONTEXT_CALLS.has(contextCall)) continue; // LM-2

    // Parse the destructured names (strip aliases/defaults/rest).
    const rawEntries = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const names = rawEntries.map((e) => ({
      raw: e,
      name: e.replace(/^\.\.\./, '').split(':')[0].split('=')[0].trim(),
      isRest: e.startsWith('...')
    }));

    const folded = names.filter((n) => !n.isRest && FOLDED_REACTIVE.has(n.name));
    if (folded.length === 0) continue; // nothing reactive to lift — leave as-is

    const stable = names.filter((n) => n.isRest || !FOLDED_REACTIVE.has(n.name));

    // Idempotency guard: if a `const ctx = <contextCall>();` already precedes
    // this block in the file we still emit a fresh block keyed to this match —
    // but because the matched `const { ... } = getXxxContext();` form is fully
    // consumed by the rewrite, a re-run finds no `const { reactive } = ...` to
    // match (the reactive names are gone), so no double-introduction occurs.
    const indentMatch = content.slice(0, m.index).match(/[^\n]*$/);
    const indent = indentMatch ? indentMatch[0].match(/^\s*/)[0] : '';

    const lines = [`const ctx = ${contextCall}();`];
    for (const f of folded) {
      lines.push(`${indent}const ${f.name} = $derived(ctx.${f.name});`);
    }
    if (stable.length > 0) {
      const stableBody = stable.map((s) => s.raw).join(', ');
      lines.push(`${indent}const { ${stableBody} } = ctx;`);
    }
    const replacement = lines.join('\n');

    const lineNo = content.slice(0, m.index).split('\n').length;
    rewrites.push({
      index: m.index,
      length: m[0].length,
      replacement,
      lineNo,
      contextCall,
      foldedNames: folded.map((f) => f.name),
      stableNames: stable.map((s) => s.raw)
    });
  }

  // Apply right-to-left so earlier offsets stay valid.
  let out = content;
  const applied = [];
  for (const r of [...rewrites].sort((a, b) => b.index - a.index)) {
    out = out.slice(0, r.index) + r.replacement + out.slice(r.index + r.length);
    applied.push(r);
  }
  return { content: out, rewrites: applied.reverse() };
}

// ── Pass 4: destructure-trap detection (warn-only) ───────────────────────

function detectDestructureTraps(content) {
  const warnings = [];
  const pattern = /const\s*\{([\s\S]*?)\}\s*=\s*(get\w+Context)\s*\(/g;
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const names = m[1]
      .split(',')
      .map((n) => n.replace(/^\.\.\./, '').split(':')[0].split('=')[0].trim())
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

// ── Main ──────────────────────────────────────────────────────────────────

const matched = new Set();
for (const g of FILES_GLOB) {
  for (const f of globSync(g, { cwd: REPO_ROOT })) matched.add(f);
}
const files = [...matched].filter((f) => !isExcludedFile(f)).sort();

if (files.length === 0) {
  console.error(`No files matched: ${FILES_GLOB.join(', ')}`);
  process.exit(1);
}

const summary = {
  filesScanned: files.length,
  filesChanged: 0,
  totalReadHits: 0,
  totalWriteHits: 0,
  getRouteHits: 0,
  destructuresRewritten: 0,
  filesWithTraps: 0,
  totalTraps: 0,
  byHandle: Object.fromEntries(READ_HANDLES.map((h) => [h, 0])),
  writeByHandle: Object.fromEntries(WRITE_HANDLES.map((h) => [h, 0]))
};

const fileResults = [];

for (const rel of files) {
  const abs = resolve(REPO_ROOT, rel);

  // Passes 1/1b/2 (regex rewrites).
  const { changed: afterReadWrite, hits } = rewriteFile(abs, rel);

  // Pass 3 (destructure rewrite) runs on the post-read-write text.
  const { content: finalContent, rewrites } = rewriteDestructures(afterReadWrite);

  // Pass 4 (audit) inspects the ORIGINAL so it reports pre-rewrite traps.
  const original = readFileSync(abs, 'utf-8');
  const warnings = detectDestructureTraps(original);

  const fileChanged = finalContent !== original;
  if (!fileChanged && warnings.length === 0) continue;

  fileResults.push({ rel, hits, rewrites, warnings });

  if (fileChanged) {
    summary.filesChanged++;
    for (const h of hits) {
      if (h.kind === 'getRoute') {
        summary.getRouteHits++;
      } else if (h.kind.startsWith('read:')) {
        summary.totalReadHits++;
        summary.byHandle[h.kind.slice('read:'.length)]++;
      } else if (h.kind.startsWith('write:')) {
        summary.totalWriteHits++;
        summary.writeByHandle[h.kind.slice('write:'.length)]++;
      }
    }
    summary.destructuresRewritten += rewrites.length;
  }
  if (warnings.length > 0) {
    summary.filesWithTraps++;
    summary.totalTraps += warnings.length;
  }

  if (APPLY && fileChanged) {
    writeFileSync(abs, finalContent);
  }
}

// ── Output ──────────────────────────────────────────────────────────────

console.log(`PHASE 103 — named-handle codemod ${APPLY ? '(APPLIED)' : '(DRY-RUN)'}\n`);

for (const { rel, hits, rewrites, warnings } of fileResults) {
  console.log(`▸ ${rel}`);
  for (const h of hits) {
    console.log(`    L${h.line}  ${h.match}  →  ${h.replacement}`);
  }
  for (const r of rewrites) {
    console.log(
      `    L${r.lineNo}  ⟳ DESTRUCTURE (${r.contextCall}) → $derived: ${r.foldedNames.join(', ')}` +
        (r.stableNames.length ? `  | stable: ${r.stableNames.join(', ')}` : '')
    );
  }
  for (const w of warnings) {
    console.log(
      `    L${w.line}  ⚠ DESTRUCTURE TRAP (${w.contextCall}) — names: ${w.trappedNames.join(', ')}`
    );
  }
}

console.log('\n── Summary ──');
console.log(`  Files scanned:        ${summary.filesScanned}`);
console.log(`  Files to change:      ${summary.filesChanged}`);
console.log(`  Read rewrites:        ${summary.totalReadHits}`);
console.log(`    by handle:`);
for (const [h, c] of Object.entries(summary.byHandle)) {
  if (c > 0) console.log(`      ${h}.current: ${c}`);
}
console.log(`  getRoute (call form): ${summary.getRouteHits}`);
console.log(`  Write rewrites:       ${summary.totalWriteHits}`);
for (const [h, c] of Object.entries(summary.writeByHandle)) {
  if (c > 0) console.log(`      ${h}.set(): ${c}`);
}
console.log(`  Destructures rewritten: ${summary.destructuresRewritten}`);
console.log(`  Files with destructure traps: ${summary.filesWithTraps}`);
console.log(`  Total traps flagged:          ${summary.totalTraps}`);
console.log(`\n${APPLY ? '✓ Changes written.' : 'Dry-run only. Re-run with --apply to write.'}`);
