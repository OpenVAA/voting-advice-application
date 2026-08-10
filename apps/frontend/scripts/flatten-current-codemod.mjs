#!/usr/bin/env node
/**
 * PHASE 113 (FLATTEN-02) — Codemod: <handle>.current → <handle> (bare reactive field)
 *
 * The INVERSE of spike-009-store-codemod.mjs. Phases 106–112 left context handles
 * as back-compat `{ current }` objects; Phase 113 flattens the three canonical
 * handles to bare reactive class fields, so consumer reads drop the `.current`
 * accessor. Two passes:
 *
 *   PASS 1 (rewrite):
 *     appSettings.current  →  appSettings
 *     dataRoot.current     →  dataRoot
 *     locale.current       →  locale
 *
 *   PASS 2 (destructure-trap audit, warn-only — does NOT rewrite):
 *     const { appSettings, ... } = getAppContext();
 *   After the flatten these three names become REACTIVE ACCESSORS (no longer
 *   stable `{ current }` handle objects), so destructuring them is a live
 *   destructure-trap (CLAUDE.md "Context Destructuring Rule"). This pass flags
 *   every such callsite for human repair (read via `ctx.X` instead).
 *
 * ── 3-handle HARD ALLOWLIST (and WHY) ───────────────────────────────────────
 * Only `appSettings`, `dataRoot`, `locale` are flattened — EXACTLY these three.
 * The frontend has 606 `.current` reads across many OUT-OF-SCOPE handles. The
 * single largest is `getRoute.current` (~147 sites) which is explicitly NOT in
 * the FLATTEN-01 enumeration and MUST stay `{ current }`. Other out-of-scope
 * handles (`userData`, `topBarSettings`, `overlay`, `store`, `userPreferences`,
 * `appCustomization`, `appType`, `darkMode`, `openFeedbackModal`, …) likewise
 * stay untouched. A broad `\w+\.current` regex is FORBIDDEN (research Pitfall 1)
 * — it would corrupt those reads into bare names that do not exist as fields.
 * The negative lookbehind on `[\w$.#]` additionally rejects member-of-something
 * reads (`foo.appSettings.current`, `reactiveAppSettings.current`,
 * `myAppSettings.current`) AND private-field reads (`this.#appSettings.current`).
 * The `#` exclusion is load-bearing for FLATTEN-02: the trackingService / surveyLink
 * producers hold their input as a PRIVATE `#appSettings: ReactiveHandle<AppSettings>`
 * field and read `this.#appSettings.current`. That `ReactiveHandle` input contract is
 * KEPT (only the consumer-facing `ctx.appSettings` surface goes bare; the appContext
 * call site wraps the bare field back into a `{ current }` handle for the producers).
 * Without `#` in the lookbehind the codemod would corrupt those producer-internal
 * reads and would NOT be idempotent on the `.ts` glob (it would re-flatten them on
 * every run).
 *
 * ── Idempotency guarantee ───────────────────────────────────────────────────
 * Structural: after PASS 1 there is no `<handle>.current` left to match, so a
 * second run rewrites nothing and reports `Total rewrites: 0`. The flatten is
 * therefore safely re-runnable as a no-op.
 *
 * Default: dry-run (prints what WOULD change, writes nothing, exit 0).
 * --apply: actually writes the changes.
 * --files <glob>: restrict the scan (default: apps/frontend/src/**\/*.svelte).
 *   Also accepts a `.ts` glob (e.g. 'apps/frontend/src/**\/*.ts') for the
 *   handful of orchestrator-internal `.ts` files that read these handles.
 *
 * Usage:
 *   node apps/frontend/scripts/flatten-current-codemod.mjs                                  # dry-run, .svelte
 *   node apps/frontend/scripts/flatten-current-codemod.mjs --apply                          # write changes
 *   node apps/frontend/scripts/flatten-current-codemod.mjs --files 'apps/frontend/src/**\/*.ts'
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { globSync } from 'node:fs';

// ── Configuration ───────────────────────────────────────────────────────

/** The EXACT three in-scope handles to flatten. Hard allowlist — do NOT add
 *  `getRoute` or any out-of-scope handle here (see docblock). */
const HANDLE_FLATTENS = ['appSettings', 'dataRoot', 'locale'];

/** Destructure-trap candidates for THIS codemod's audit pass. The three
 *  flattened names are reactive accessors post-flatten and MUST NOT be
 *  destructured from a get*Context() call. (The spike-009 source's own
 *  REACTIVE_ACCESSORS set gains the same names in Phase 113 Task 2; this
 *  local set keeps the codemod self-contained for its own audit output.) */
const FLATTENED_ACCESSORS = new Set(['appSettings', 'dataRoot', 'locale']);

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const filesArgIdx = args.indexOf('--files');
const FILES_GLOB = filesArgIdx >= 0 ? args[filesArgIdx + 1] : 'apps/frontend/src/**/*.svelte';

const REPO_ROOT = resolve(process.cwd());

// ── Pass 1: <handle>.current → <handle> rewrite ─────────────────────────

// Negative lookbehind on `[\w$.#]` rejects member-of-something-else reads
// (`foo.appSettings.current`, `reactiveAppSettings.current`, `myAppSettings.current`)
// AND private-field reads (`this.#appSettings.current` — the producers'
// `ReactiveHandle<AppSettings>` input contract, which is KEPT). `\b...\b` bounds the
// handle + `current` tokens.
const FLATTEN_RE = new RegExp(`(?<![\\w$.#])\\b(${HANDLE_FLATTENS.join('|')})\\.current\\b`, 'g');

function rewriteFile(filepath) {
  const original = readFileSync(filepath, 'utf-8');
  const hits = [];

  const changed = original.replace(FLATTEN_RE, (match, handle, offset) => {
    const lineStart = original.lastIndexOf('\n', offset) + 1;
    const lineEnd = original.indexOf('\n', offset);
    const line = original.slice(lineStart, lineEnd === -1 ? original.length : lineEnd);
    const lineNo = original.slice(0, offset).split('\n').length;
    hits.push({
      line: lineNo,
      before: line.trim(),
      match,
      handle,
      replacement: handle
    });
    return handle;
  });

  return { original, changed, hits };
}

// ── Pass 2: destructure-trap detection (warn-only) ──────────────────────

function detectDestructureTraps(content) {
  const warnings = [];

  // Pattern: `const { A, B, C } = get*Context()` where any of A/B/C is a
  // flattened reactive accessor. Multi-line aware via [\s\S].
  const pattern = /const\s*\{([\s\S]*?)\}\s*=\s*(get\w+Context)\s*\(/g;
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const names = m[1]
      .split(',')
      .map((n) => n.split(':')[0].split('=')[0].trim())
      .filter(Boolean);
    const trapped = names.filter((n) => FLATTENED_ACCESSORS.has(n));
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

// Frozen spike-design fixtures (`_spikes-*`) document the ORIGINAL proposed
// handle shapes (`ReactiveHandle<AppSettings>.current`, `.instance`, `reactive*`)
// and are git-tracked design artifacts, NOT production consumers (research
// Assumption A3). They must NEVER be rewritten — their `appSettings.current` reads
// are producer-input `ReactiveHandle` reads, not the consumer-facing bare accessor.
// Skipping them keeps the codemod idempotent on the `.ts` glob (Total rewrites: 0).
const SKIP_PATH_RE = /(^|\/)_spikes[\w-]*\//;

const files = globSync(FILES_GLOB, { cwd: REPO_ROOT }).filter((f) => !SKIP_PATH_RE.test(f));
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
  byHandle: Object.fromEntries(HANDLE_FLATTENS.map((h) => [h, 0]))
};

const fileResults = [];

for (const filepath of files) {
  const abs = resolve(REPO_ROOT, filepath);
  const { original, changed, hits } = rewriteFile(abs);
  const warnings = detectDestructureTraps(original);

  if (hits.length === 0 && warnings.length === 0) continue;

  fileResults.push({ filepath, hits, warnings });

  if (hits.length > 0) {
    summary.filesChanged++;
    summary.totalHits += hits.length;
    for (const h of hits) {
      summary.byHandle[h.handle]++;
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

console.log(`PHASE 113 — flatten .current codemod ${APPLY ? '(APPLIED)' : '(DRY-RUN)'}\n`);

for (const { filepath, hits, warnings } of fileResults) {
  const rel = relative(REPO_ROOT, filepath);
  console.log(`▸ ${rel}`);
  for (const h of hits) {
    console.log(`    L${h.line}  ${h.match}  →  ${h.replacement}`);
  }
  for (const w of warnings) {
    console.log(`    L${w.line}  ⚠ DESTRUCTURE TRAP (${w.contextCall}) — names: ${w.trappedNames.join(', ')}`);
  }
}

console.log('\n── Summary ──');
console.log(`  Files scanned:   ${summary.filesScanned}`);
console.log(`  Files to change: ${summary.filesChanged}`);
console.log(`  Total rewrites:  ${summary.totalHits}`);
console.log(`    by handle:`);
for (const [h, c] of Object.entries(summary.byHandle)) {
  if (c > 0) console.log(`      ${h}.current: ${c}`);
}
console.log(`  Files with destructure traps: ${summary.filesWithTraps}`);
console.log(`  Total traps flagged:          ${summary.totalTraps}`);
console.log(`\n${APPLY ? '✓ Changes written.' : 'Dry-run only. Re-run with --apply to write.'}`);
