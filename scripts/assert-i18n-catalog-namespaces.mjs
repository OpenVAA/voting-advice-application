#!/usr/bin/env node

/**
 * I18N CATALOG NAMESPACE-COVERAGE GUARD (phase 147, requirement CSCAN-04).
 *
 * The incident this file exists for: `tests/tests/utils/rawKeyScan.ts`'s
 * `loadCatalogKeys()` guards its own non-vacuity with a single scalar floor,
 * `MIN_EXPECTED_KEYS = 400`. That floor is APPLICATION-WIDE, not per-namespace,
 * so it cannot tell "the catalog is healthy" from "one whole namespace vanished
 * and the rest happens to cover the gap". Concretely: the verified decomposition
 * of `apps/frontend/messages/en/` is 598 keys = 161 `candidateApp.*` + 121
 * `adminApp.*` + 316 voter/shared keys. Deleting the entire `adminApp`
 * namespace leaves 477 keys — comfortably above 400 — and the scalar floor
 * passes silently while every raw `adminApp.*` key rendered on an admin surface
 * would go undetected by the very scanner CSCAN-04 claims covers it.
 *
 * This guard is deliberately a SEPARATE, standalone read of the catalog
 * directory rather than an import of `rawKeyScan.ts` (which lives under
 * `tests/`, outside every workspace `vitest.config.ts` and outside
 * `scripts/assert-unit-test-coverage.mjs`'s scan roots — see
 * 147-VALIDATION gap G1's <constraints> — so nothing wires a TS import of it
 * into any standing command without a build step). The flattening rule
 * mirrors `flattenCatalog` in `tests/tests/utils/rawKeyScan.ts` byte-for-byte
 * (object recursion, arrays are leaves) so the two cannot silently diverge in
 * what counts as a "key".
 *
 * The invariant, in both directions:
 *   1. Each of the three namespace buckets (`candidateApp.*`, `adminApp.*`,
 *      "everything else" = voter/shared) must clear a floor set FAR below its
 *      currently-observed count (161 / 121 / 316), so ordinary catalog churn
 *      (renaming a handful of keys, adding a new question type) never trips
 *      it, but the wholesale loss of a namespace — which the scalar
 *      MIN_EXPECTED_KEYS floor cannot see — does.
 *   2. Two specific keys Phase 147's own negative controls exercised must
 *      still resolve: `candidateApp.questions.editAnswer` and
 *      `common.required`. Their disappearance is the exact shape of defect
 *      the phase's `RK1-OLD`/`RK2-OLD` rows measured the scanner catching.
 *
 * Usage:
 *   node scripts/assert-i18n-catalog-namespaces.mjs
 *
 * Exit codes:
 *   0 - all floors and required keys present
 *   1 - a namespace floor was not cleared, a required key is missing, or the
 *       catalog directory could not be read
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-i18n-catalog-namespaces.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const CATALOG_DIR = path.resolve(REPO_ROOT, 'apps', 'frontend', 'messages', 'en');

/**
 * Floors set well below the verified current counts (161 / 121 / 316), per
 * this file's own docblock rationale: far enough to absorb ordinary catalog
 * churn, close enough that losing the whole namespace cannot hide under the
 * other two buckets' headroom.
 */
const NAMESPACE_FLOORS = [
  { label: 'candidateApp.*', prefix: 'candidateApp.', floor: 60 },
  { label: 'adminApp.*', prefix: 'adminApp.', floor: 50 }
];
/** Floor for every key that is NOT in one of the prefixed buckets above (voter/shared). */
const OTHER_FLOOR = 150;

/** Mirrors `flattenCatalog` in tests/tests/utils/rawKeyScan.ts. */
function flattenCatalog(node, prefix, into) {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    if (prefix) into.add(prefix);
    return;
  }
  for (const [segment, value] of Object.entries(node)) {
    flattenCatalog(value, prefix ? `${prefix}.${segment}` : segment, into);
  }
}

function loadRuntimeCatalogKeys() {
  let entries;
  try {
    entries = readdirSync(CATALOG_DIR);
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read the runtime catalog directory '${CATALOG_DIR}' (${error.message}). ` +
        'A catalog this guard cannot read is coverage it cannot verify — this fails closed.'
    );
    process.exitCode = 1;
    return null;
  }

  const keys = new Set();
  for (const filename of entries) {
    if (!filename.endsWith('.json')) continue;
    const filePath = path.join(CATALOG_DIR, filename);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error(`[ERROR] ${SELF}: '${filePath}' is not parseable JSON (${error.message}).`);
      process.exitCode = 1;
      continue;
    }
    // The runtime catalog namespaces its own top-level key (e.g.
    // candidateApp.questions.json opens with "candidateApp.questions"), so no
    // filename-derived prefixing here — matches rawKeyScan.ts's
    // `flattenCatalogDir(RUNTIME_CATALOG_DIR, false, keys)` call.
    flattenCatalog(parsed, '', keys);
  }
  return keys;
}

function main() {
  const keys = loadRuntimeCatalogKeys();
  if (keys === null) return; // already reported and exit code set

  let violations = 0;

  let otherCount = 0;
  for (const key of keys) {
    if (!NAMESPACE_FLOORS.some(({ prefix }) => key.startsWith(prefix))) otherCount++;
  }

  for (const { label, prefix, floor } of NAMESPACE_FLOORS) {
    const count = [...keys].filter((key) => key.startsWith(prefix)).length;
    if (count < floor) {
      violations++;
      console.error(
        `[ERROR] ${SELF}: namespace '${label}' has only ${count} catalog key(s), below its floor of ` +
          `${floor}. The raw-key scanner's non-vacuity floor (MIN_EXPECTED_KEYS=400 in ` +
          `tests/tests/utils/rawKeyScan.ts) is application-wide and would NOT catch this namespace ` +
          'being wholesale deleted or moved, because the other namespaces can cover the shortfall ' +
          '(CSCAN-04).'
      );
    }
  }

  if (otherCount < OTHER_FLOOR) {
    violations++;
    console.error(
      `[ERROR] ${SELF}: the voter/shared namespace bucket (every key not under candidateApp./adminApp.) ` +
        `has only ${otherCount} catalog key(s), below its floor of ${OTHER_FLOOR}.`
    );
  }

  const requiredKeys = ['candidateApp.questions.editAnswer', 'common.required'];
  for (const requiredKey of requiredKeys) {
    if (!keys.has(requiredKey)) {
      violations++;
      console.error(
        `[ERROR] ${SELF}: required catalog key '${requiredKey}' is missing. Phase 147's negative ` +
          "controls exercised the raw-key scanner against this exact key's disappearance " +
          '(147-NEGATIVE-CONTROL.md); its absence here means that control can no longer be trusted.'
      );
    }
  }

  console.log(
    `I18n catalog namespace guard (phase 147: CSCAN-04) — total keys: ${keys.size}; ` +
      NAMESPACE_FLOORS.map(
        ({ label, prefix }) => `${label}: ${[...keys].filter((k) => k.startsWith(prefix)).length}`
      ).join(', ') +
      `, other: ${otherCount}. ${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
