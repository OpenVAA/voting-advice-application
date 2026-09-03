#!/usr/bin/env node

/**
 * SCHEMA-MIGRATION PARITY GUARD (phase 156, requirement REVIEW-DB-07).
 *
 * The incident this file exists for is stated, verbatim, by the workspace's own
 * README (`apps/supabase/README.md`): of the two hand-maintained copies of the
 * schema, **"Nothing verifies that they agree."**
 *
 *   - `apps/supabase/supabase/migrations/` is what a database contains.
 *     `supabase db reset` applies these files in numeric order and nothing
 *     else, because `supabase/config.toml` sets `[db.migrations]
 *     schema_paths = []`.
 *   - `apps/supabase/supabase/schema/` is a flattened, concern-ordered mirror
 *     of the same schema, kept for reading. The CLI never opens it.
 *
 * A change written into only one of them drifts silently, and drifts in a way
 * that looks green from either side: a `schema/`-only edit produces a review
 * diff that reaches no database, and a `migrations/`-only edit leaves the
 * readable copy lying to the next reader. Neither shows up in a test run,
 * because no test reads both.
 *
 * THE INVARIANT. `cat apps/supabase/supabase/schema/*.sql` (filename order —
 * the same order a shell glob and the Supabase CLI would use) differs from
 * `migrations/00001_initial_schema.sql` by EXACTLY the deltas that the later
 * migrations applied on top of `00001`, and by nothing else. Those deltas are
 * finite, reviewed, and checked in as a golden SIGNATURE at
 * `apps/supabase/scripts/schema-migration-parity.expected.txt`. Any other
 * difference is drift.
 *
 * WHY A SIGNATURE AND NOT A `cmp`. The two copies are not byte-equal today and
 * cannot be while `00002`/`00003` exist as separate files. Folding them into
 * `00001` would collapse this check to a one-line `cmp`, but that deletes
 * migration files — the most history-destructive act available — so the
 * non-destructive form is used instead. The signature keeps only the diff
 * PAYLOAD lines (`< `, `> `, and the `---` separator) and DROPS the hunk
 * headers, because hunk headers carry line numbers and every schema edit
 * shifts them; the payload lines do not move. Re-baselining after a legitimate
 * change to `00002`/`00003` is `--update`, which rewrites the fixture so a
 * human reviews the new signature in the diff.
 *
 * WHAT THIS CHECK CANNOT DO, stated so nobody over-reads a green run:
 *
 *   1. It cannot catch a change made IDENTICALLY WRONG in both copies. It
 *      catches one-sidedness, which is the measured hazard.
 *   2. It reads ONLY `00001`. `00002` and `00003` are never opened. So a
 *      change written correctly into BOTH `schema/` and `00001`, for an object
 *      that a LATER migration recreates, leaves this signature unchanged and
 *      this check green — while the applied database carries the later
 *      migration's stale definition. `get_nominations` lives in all three
 *      copies (`schema/503-entity-rpcs.sql`, `00001`, and `00002`, which
 *      recreates it). When you touch an object named in a `00002`/`00003`
 *      header, grep all three copies by symbol; this check will not do it for
 *      you. This is the LARGER of the two blind spots.
 *
 * THE GUARD GUARDS ITSELF. A comparison gate that parses neither input
 * correctly reports agreement, exits 0, and examines nothing. Two defences:
 *
 *   1. A CENSUS is printed on every run — how many schema files were read,
 *      how many lines each side contributed, how many hunks and signature
 *      lines resulted. A verdict over an empty or truncated input is visible
 *      in the census rather than hidden behind the exit code.
 *   2. A SELF-CHECK runs the line differ against two synthetic inputs with a
 *      known answer (one changed line, one deleted line) plus an
 *      identical-input case, on every invocation. If the differ cannot find a
 *      difference it was handed, its verdict on the real files is withheld
 *      rather than reported as parity.
 *
 * Node built-ins only, no build step, in the house style of
 * `scripts/assert-a11y-scan-wiring.mjs` and `scripts/assert-i18n-catalog-namespaces.mjs`.
 *
 * Usage:
 *   yarn assert:schema-migration-parity
 *   yarn assert:schema-migration-parity:update   (rewrites the fixture)
 *
 * Exit codes:
 *   0 - the two copies differ by exactly the reviewed signature
 *   1 - drift, a corrupt fixture, a failed self-check, or a named
 *       precondition failure (a missing directory, an empty input, a missing
 *       fixture)
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const SCHEMA_DIR = 'apps/supabase/supabase/schema';
const MIGRATION_FILE = 'apps/supabase/supabase/migrations/00001_initial_schema.sql';
const FIXTURE_FILE = 'apps/supabase/scripts/schema-migration-parity.expected.txt';

const UPDATE = process.argv.slice(2).includes('--update');

/**
 * The LCS table is O(n x m) cells. After common prefix/suffix trimming the two
 * copies leave a window of ~1.5k lines, so the real cost is a few million
 * cells. The cap exists so a pathological input (a wholesale reordering of
 * `schema/`) fails with a sentence rather than an out-of-memory kill.
 */
const MAX_CELLS = 16_000_000;

function fail(message) {
  console.error(`Schema-migration parity guard: ${message}`);
  process.exit(1);
}

function splitLines(text) {
  const lines = text.split('\n');
  // A trailing newline yields a final empty element that is not a line.
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * Line-level diff of `a` against `b`, returned as hunks in the shape a normal
 * `diff(1)` reports: runs of removed lines (present only in `a`), added lines
 * (present only in `b`), or both together as a change.
 *
 * @param {string[]} a
 * @param {string[]} b
 * @returns {{ removed: string[], added: string[] }[]}
 */
function diffHunks(a, b) {
  let lo = 0;
  while (lo < a.length && lo < b.length && a[lo] === b[lo]) lo++;
  let aHi = a.length;
  let bHi = b.length;
  while (aHi > lo && bHi > lo && a[aHi - 1] === b[bHi - 1]) {
    aHi--;
    bHi--;
  }
  const A = a.slice(lo, aHi);
  const B = b.slice(lo, bHi);
  const n = A.length;
  const m = B.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) return [{ removed: [], added: B }];
  if (m === 0) return [{ removed: A, added: [] }];

  if ((n + 1) * (m + 1) > MAX_CELLS) {
    fail(
      `the two copies differ over a window of ${n} x ${m} lines, past this check's ${MAX_CELLS}-cell ` +
        `budget. That is far beyond drift — ${SCHEMA_DIR} and ${MIGRATION_FILE} have diverged ` +
        `structurally, and the difference needs reading by hand before a signature means anything.`
    );
  }

  const width = m + 1;
  const dp = new Int32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * width + j] =
        A[i] === B[j] ? dp[(i + 1) * width + (j + 1)] + 1 : Math.max(dp[(i + 1) * width + j], dp[i * width + (j + 1)]);
    }
  }

  const hunks = [];
  let current = null;
  const flush = () => {
    if (current) hunks.push(current);
    current = null;
  };
  const open = () => {
    if (!current) current = { removed: [], added: [] };
    return current;
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      flush();
      i++;
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + (j + 1)]) {
      open().removed.push(A[i]);
      i++;
    } else {
      open().added.push(B[j]);
      j++;
    }
  }
  while (i < n) open().removed.push(A[i++]);
  while (j < m) open().added.push(B[j++]);
  flush();

  return hunks;
}

/**
 * The reviewed golden form: payload lines only, hunk headers dropped. `<` is a
 * line the reader's copy has and the migration does not; `>` is the reverse.
 *
 * @param {{ removed: string[], added: string[] }[]} hunks
 */
function signatureOf(hunks) {
  const out = [];
  for (const hunk of hunks) {
    for (const line of hunk.removed) out.push(`< ${line}`);
    if (hunk.removed.length > 0 && hunk.added.length > 0) out.push('---');
    for (const line of hunk.added) out.push(`> ${line}`);
  }
  return out;
}

/**
 * Refuses to let the differ report parity it did not earn. Runs before the
 * real comparison, every time.
 */
function selfCheck() {
  const identical = diffHunks(['a', 'b', 'c'], ['a', 'b', 'c']);
  if (identical.length !== 0) {
    fail(
      `self-check failed: the line differ reported ${identical.length} hunk(s) between two identical ` +
        `inputs. Its verdict on ${SCHEMA_DIR} is withheld.`
    );
  }

  // 'b' changed to 'x'; 'e' deleted outright.
  const observed = signatureOf(diffHunks(['a', 'b', 'c', 'd', 'e'], ['a', 'x', 'c', 'd'])).join('\n');
  const expected = ['< b', '---', '> x', '< e'].join('\n');
  if (observed !== expected) {
    fail(
      `self-check failed: on a synthetic input with one changed line and one deleted line the differ ` +
        `produced\n${observed || '(nothing)'}\nwhere it must produce\n${expected}\n` +
        `A differ that cannot find a difference it was handed would report parity over anything.`
    );
  }
}

function main() {
  selfCheck();

  const schemaDir = path.join(REPO_ROOT, SCHEMA_DIR);
  let schemaNames;
  try {
    schemaNames = readdirSync(schemaDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch (error) {
    fail(`could not read ${SCHEMA_DIR} (${error.message}).`);
  }
  if (schemaNames.length === 0) {
    fail(
      `${SCHEMA_DIR} contains no .sql file. A comparison against an empty reader's copy would report ` +
        `every line of ${MIGRATION_FILE} as drift, or — had the fixture been baselined in that state — ` +
        `report parity while comparing nothing.`
    );
  }

  // Normalise the join: a schema file added without a trailing newline would otherwise glue its last line to the next file's first line and report a spurious hunk. All 24 files end with a newline today, so this is latent rather than live - one character keeps it that way.
  let schemaText = '';
  for (const name of schemaNames) {
    const text = readFileSync(path.join(schemaDir, name), 'utf8');
    schemaText += text.endsWith('\n') ? text : `${text}\n`;
  }
  if (schemaText.trim() === '') {
    fail(`the ${schemaNames.length} file(s) under ${SCHEMA_DIR} concatenate to no content.`);
  }

  let migrationText;
  try {
    migrationText = readFileSync(path.join(REPO_ROOT, MIGRATION_FILE), 'utf8');
  } catch (error) {
    fail(`could not read ${MIGRATION_FILE} (${error.message}).`);
  }
  if (migrationText.trim() === '') fail(`${MIGRATION_FILE} is empty.`);

  const schemaLines = splitLines(schemaText);
  const migrationLines = splitLines(migrationText);
  const hunks = diffHunks(schemaLines, migrationLines);
  const signature = signatureOf(hunks);

  const census =
    `census: ${schemaNames.length} schema file(s) -> ${schemaLines.length} line(s); ` +
    `${path.basename(MIGRATION_FILE)} -> ${migrationLines.length} line(s); ` +
    `${hunks.length} hunk(s), ${signature.length} signature line(s)`;

  const body = [`# hunks: ${hunks.length}`, ...signature].join('\n') + '\n';
  const fixturePath = path.join(REPO_ROOT, FIXTURE_FILE);

  if (UPDATE) {
    writeFileSync(fixturePath, body);
    console.log(`Schema-migration parity guard — ${census}. Rewrote ${FIXTURE_FILE}.`);
    console.log('Read the fixture diff before committing it: it is the reviewed record of what differs.');
    return;
  }

  let fixture;
  try {
    fixture = readFileSync(fixturePath, 'utf8');
  } catch (error) {
    fail(
      `could not read the golden signature ${FIXTURE_FILE} (${error.message}). Regenerate it with ` +
        `\`yarn assert:schema-migration-parity:update\` and review the result.`
    );
  }

  const fixtureLines = splitLines(fixture);
  const header = fixtureLines[0] ?? '';
  const declared = /^# hunks: (\d+)$/.exec(header);
  if (!declared) {
    fail(
      `${FIXTURE_FILE} does not open with its \`# hunks: N\` header. It is not a signature this check ` +
        `wrote; regenerate it with \`yarn assert:schema-migration-parity:update\`.`
    );
  }
  if (fixture !== body) {
    const fixturePayload = fixtureLines.slice(1);
    const unexpected = signature.filter((line) => !fixturePayload.includes(line));
    const missing = fixturePayload.filter((line) => !signature.includes(line));
    console.error(
      `Schema-migration parity guard — ${census}.\n\n` +
        `DRIFT: ${SCHEMA_DIR} and ${MIGRATION_FILE} no longer differ by exactly the reviewed set of\n` +
        `changes recorded in ${FIXTURE_FILE}.\n\n` +
        `Observed ${hunks.length} hunk(s); the fixture records ${declared[1]}.\n`
    );
    if (unexpected.length > 0) {
      console.error(`Present now, not in the reviewed signature (${unexpected.length} line(s)):`);
      for (const line of unexpected.slice(0, 40)) console.error(`  ${line}`);
      if (unexpected.length > 40) console.error(`  ... and ${unexpected.length - 40} more`);
      console.error('');
    }
    if (missing.length > 0) {
      console.error(`In the reviewed signature, absent now (${missing.length} line(s)):`);
      for (const line of missing.slice(0, 40)) console.error(`  ${line}`);
      if (missing.length > 40) console.error(`  ... and ${missing.length - 40} more`);
      console.error('');
    }
    console.error(
      `Almost always this means a schema change landed in one copy and not the other. Apply it to both:\n` +
        `  ${SCHEMA_DIR}/<file>.sql   (the readable mirror — no database reads it)\n` +
        `  ${MIGRATION_FILE}          (what \`supabase db reset\` actually applies)\n` +
        `If instead a later migration legitimately changed, re-baseline with\n` +
        `  yarn assert:schema-migration-parity:update\n` +
        `and review the fixture diff.`
    );
    process.exit(1);
  }

  console.log(`Schema-migration parity guard (phase 156: REVIEW-DB-07) — ${census}; matches ${FIXTURE_FILE}.`);
}

main();
