#!/usr/bin/env node

/**
 * I18N CATALOG NAMESPACE-COVERAGE GUARD.
 *
 * The E2E raw-key scanner (`tests/tests/utils/rawKeyScan.ts`) guards its own non-vacuity with one
 * application-wide floor, `MIN_EXPECTED_KEYS`, which cannot see a whole namespace vanishing while
 * the others cover the gap. This guard reads `apps/frontend/messages/en/` and asserts:
 *
 *   1. each of the three buckets, `contestantApp.*`, `adminApp.*` and the voter/shared rest, clears
 *      a floor set far below its printed count, so ordinary churn passes and losing a namespace
 *      fails;
 *   2. the keys `contestantApp.questions.editAnswer` and `common.required`, which the scanner's
 *      negative controls use, still exist.
 *
 * It reads the catalog itself rather than importing `rawKeyScan.ts`, which lives under `tests/` and
 * would need a build step; `flattenCatalog` mirrors that file's rule (objects recurse, arrays are
 * leaves), so the two agree on what a key is.
 *
 * Usage:
 *   node scripts/assert-i18n-catalog-namespaces.mjs
 *
 * Exit codes:
 *   0 - all floors and required keys present
 *   1 - a namespace floor was not cleared, a required key is missing, or the catalog directory
 *       could not be read
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-i18n-catalog-namespaces.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const CATALOG_DIR = path.resolve(REPO_ROOT, 'apps', 'frontend', 'messages', 'en');

/**
 * Floors set well below the counts a run prints for the three buckets, per
 * this file's own docblock rationale: far enough to absorb ordinary catalog
 * churn, close enough that losing the whole namespace cannot hide under the
 * other two buckets' headroom.
 */
const NAMESPACE_FLOORS = [
  { label: 'contestantApp.*', prefix: 'contestantApp.', floor: 60 },
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
    // contestantApp.questions.json opens with "contestantApp.questions"), so no
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
          'being wholesale deleted or moved, because the other namespaces can cover the shortfall.'
      );
    }
  }

  if (otherCount < OTHER_FLOOR) {
    violations++;
    console.error(
      `[ERROR] ${SELF}: the voter/shared namespace bucket (every key not under contestantApp./adminApp.) ` +
        `has only ${otherCount} catalog key(s), below its floor of ${OTHER_FLOOR}.`
    );
  }

  const requiredKeys = ['contestantApp.questions.editAnswer', 'common.required'];
  for (const requiredKey of requiredKeys) {
    if (!keys.has(requiredKey)) {
      violations++;
      console.error(
        `[ERROR] ${SELF}: required catalog key '${requiredKey}' is missing. The raw-key scanner's ` +
          'negative controls use this key, so they can no longer be trusted until it is restored or ' +
          'the controls move to another key.'
      );
    }
  }

  console.log(
    `I18n catalog namespace guard — total keys: ${keys.size}; ` +
      NAMESPACE_FLOORS.map(
        ({ label, prefix }) => `${label}: ${[...keys].filter((k) => k.startsWith(prefix)).length}`
      ).join(', ') +
      `, other: ${otherCount}. ${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
