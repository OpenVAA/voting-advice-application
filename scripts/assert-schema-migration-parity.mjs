#!/usr/bin/env node

/**
 * SCHEMA-MIGRATION PARITY GUARD (phase 156, requirement REVIEW-DB-07; collapsed
 * to a byte comparison in phase 162, plan 162-02b).
 *
 *   - `apps/supabase/supabase/migrations/` is what a database contains.
 *     `supabase db reset` applies these files and nothing else, because
 *     `supabase/config.toml` sets `[db.migrations] schema_paths = []`.
 *   - `apps/supabase/supabase/schema/` is a flattened, concern-ordered view of
 *     the same schema, edited by hand and organised by concern. The CLI never
 *     opens it.
 *
 * THE INVARIANT, in two conjuncts.
 *
 *   1. `cat apps/supabase/supabase/schema/*.sql` (filename order — the same
 *      order a shell glob uses), with each file normalised to end in a newline,
 *      is BYTE-IDENTICAL to `migrations/00001_initial_schema.sql`. The
 *      migration is generated from the schema directory by `--write`; it is not
 *      a second hand-maintained copy.
 *   2. `apps/supabase/supabase/migrations/` contains EXACTLY ONE `.sql` file.
 *
 * The second conjunct is not bookkeeping. Without it a later plan adds a
 * numbered migration, the byte comparison stays green, and the applied database
 * diverges from the readable copy again — reinstating precisely the blind spot
 * the fold removed. It is the mechanical enforcement of decision D-14's "no
 * plan creates a `000NN` file".
 *
 * THE INCIDENT, AND WHY THE SHAPE CHANGED. This guard used to compare the two
 * copies through an LCS differ against a checked-in golden signature, because
 * the copies could not be byte-equal while `00002`–`00008` existed as separate
 * files. Its own docblock named the fold as the fix it would not choose:
 *
 *   "Folding them into `00001` would collapse this check to a one-line `cmp`,
 *    but that deletes migration files — the most history-destructive act
 *    available — so the non-destructive form is used instead."
 *
 * and named the cost of not folding as its LARGER blind spot: it read only
 * `00001`, so a change written correctly into both `schema/` and `00001`, for
 * an object that a LATER migration recreated, left the signature unchanged and
 * this check green while the applied database carried the stale definition.
 *
 * The author declined because the choice was not theirs. It was the operator's,
 * and on 2026-09-15 the operator made it: no Supabase database has been
 * published, so there is no deployed applied-history to protect. That ruling is
 * what made the trade acceptable; `00002`–`00008` were folded into the
 * regenerated `00001` and deleted, and this check became the `cmp` its
 * predecessor described. A reader who finds a `00002` reference in an old
 * commit should look no further than this paragraph for why it is gone.
 *
 * D-17 — THE REVIEW OBLIGATION, WHICH NOW LIVES HERE AND NOWHERE ELSE. The
 * regenerated `00001_initial_schema.sql` MUST be reviewed as a diff in the SAME
 * COMMIT as the `schema/` edit that caused it. That obligation used to be
 * carried by a golden fixture a human had to re-baseline and read. The fixture
 * is gone, nothing else enforces the obligation, and `--write` makes skipping
 * it a single keystroke — so it is written here, in the file a reader reaches
 * when the gate goes red.
 *
 * WHAT THIS CHECK CANNOT DO, stated so nobody over-reads a green run:
 *
 *   1. It proves the two files are textually EQUAL. It does not prove either is
 *      CORRECT. A wrong policy written into `schema/` and generated faithfully
 *      into the migration passes.
 *   2. It does not prove the APPLIED database matches. A database not reset
 *      since the edit still carries the old schema; only `yarn db:reset` makes
 *      the file true of Postgres.
 *   3. It cannot catch a change made identically wrong in both copies — now
 *      near-tautological, since one copy is generated from the other. The
 *      one-sidedness this guard was built for is no longer expressible; what it
 *      now catches is a STALE generated file and a SECOND migration file.
 *
 * THE GUARD GUARDS ITSELF. A byte comparator is easier to make vacuous than a
 * differ was: two empty strings are equal, exit 0, and examine nothing. Three
 * defences, all running on every invocation:
 *
 *   1. A CENSUS is printed on every run — how many schema files were read, the
 *      line count of each side, how many `.sql` files the migrations directory
 *      holds, and the verdict. A verdict over a truncated input is visible in
 *      the census rather than hidden behind the exit code.
 *   2. A SELF-CHECK runs before the real comparison and proves the comparator
 *      can report INEQUALITY: two synthetic strings differing by one character
 *      must compare unequal, and two identical strings must compare equal. A
 *      comparator that cannot find a difference it was handed has its verdict on
 *      the real files withheld.
 *   3. A NON-VACUITY FLOOR fails with a named precondition if the schema
 *      directory yields fewer than `MIN_SCHEMA_FILES` `.sql` files, if the
 *      concatenation is under `MIN_SCHEMA_LINES` lines, or if the migration
 *      file contains no line beginning `CREATE TABLE public.`. These are
 *      absolute thresholds and will need raising as the schema grows.
 *
 * Node built-ins only, no build step, in the house style of
 * `scripts/assert-a11y-scan-wiring.mjs` and `scripts/assert-i18n-catalog-namespaces.mjs`.
 *
 * Usage:
 *   yarn assert:schema-migration-parity   (verify)
 *   yarn schema:regenerate                (rewrite 00001 from schema/)
 *
 * Exit codes:
 *   0 - the generated migration is current and it is the only one
 *   1 - a byte difference, a second migration file, a failed self-check, or a
 *       named precondition failure (a missing directory, an empty input, a
 *       floor breach)
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const SCHEMA_DIR = 'apps/supabase/supabase/schema';
const MIGRATIONS_DIR = 'apps/supabase/supabase/migrations';
const MIGRATION_FILE = `${MIGRATIONS_DIR}/00001_initial_schema.sql`;

const WRITE = process.argv.slice(2).includes('--write');

/** Non-vacuity floor. Absolute thresholds; raise them as the schema grows. */
const MIN_SCHEMA_FILES = 20;
const MIN_SCHEMA_LINES = 3000;

function fail(message) {
  console.error(`Schema-migration parity guard: ${message}`);
  process.exit(1);
}

function countLines(text) {
  const lines = text.split('\n');
  // A trailing newline yields a final empty element that is not a line.
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.length;
}

/**
 * The ONE concatenation routine, used by both the verifier and `--write`. A
 * generator and a checker that computed this differently would disagree, and
 * the disagreement would surface as a gate no edit could satisfy.
 *
 * @param {string} schemaDir absolute path
 * @param {string[]} names sorted .sql filenames
 * @returns {string}
 */
function concatenateSchema(schemaDir, names) {
  // Normalise the join: a schema file added without a trailing newline would otherwise glue its last line to the next file's first line. All files end with a newline today, so this is latent rather than live - one character keeps it that way.
  let out = '';
  for (const name of names) {
    const text = readFileSync(path.join(schemaDir, name), 'utf8');
    out += text.endsWith('\n') ? text : `${text}\n`;
  }
  return out;
}

/**
 * The comparison itself, named so the self-check can exercise the SAME routine
 * the real verdict goes through rather than a lookalike written beside it.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function bytesEqual(a, b) {
  return a === b;
}

/**
 * Refuses to let the comparator report parity it did not earn. Runs before the
 * real comparison, every time.
 */
function selfCheck() {
  const base = 'CREATE TABLE public.a (id uuid);\n';
  const oneCharDifferent = 'CREATE TABLE public.b (id uuid);\n';
  const copy = `CREATE TABLE public.a (id uuid);${'\n'}`;

  if (!bytesEqual(base, copy)) {
    fail(
      `self-check failed: the comparator reported two identical strings as unequal, so every run would ` +
        `be red regardless of the files. Its verdict on ${SCHEMA_DIR} is withheld.`
    );
  }

  if (bytesEqual(base, oneCharDifferent)) {
    fail(
      `self-check failed: on two synthetic strings differing by one character the comparator reported ` +
        `equality. A comparator that cannot find a difference it was handed would report parity over ` +
        `anything, including two empty files. Its verdict on ${SCHEMA_DIR} is withheld.`
    );
  }

  if (bytesEqual('', '') !== true || countLines('') !== 0) {
    fail('self-check failed: the line counter or the comparator disagrees with itself on empty input.');
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

  if (schemaNames.length < MIN_SCHEMA_FILES) {
    fail(
      `precondition failed: ${SCHEMA_DIR} yielded ${schemaNames.length} .sql file(s), below this check's ` +
        `non-vacuity floor of ${MIN_SCHEMA_FILES}. A comparison over a truncated or empty schema directory ` +
        `is equality between two nearly-empty strings: it exits 0 and examines nothing.`
    );
  }

  const schemaText = concatenateSchema(schemaDir, schemaNames);
  const schemaLineCount = countLines(schemaText);
  if (schemaLineCount < MIN_SCHEMA_LINES) {
    fail(
      `precondition failed: the ${schemaNames.length} file(s) under ${SCHEMA_DIR} concatenate to ` +
        `${schemaLineCount} line(s), below this check's non-vacuity floor of ${MIN_SCHEMA_LINES}.`
    );
  }

  const migrationsDir = path.join(REPO_ROOT, MIGRATIONS_DIR);
  let migrationNames;
  try {
    migrationNames = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch (error) {
    fail(`could not read ${MIGRATIONS_DIR} (${error.message}).`);
  }

  const migrationPath = path.join(REPO_ROOT, MIGRATION_FILE);

  if (WRITE) {
    writeFileSync(migrationPath, schemaText);
    console.log(
      `Schema-migration parity guard — census: ${schemaNames.length} schema file(s) -> ${schemaLineCount} ` +
        `line(s); wrote ${MIGRATION_FILE} -> ${schemaLineCount} line(s); ${MIGRATIONS_DIR} holds ` +
        `${readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).length} .sql file(s).`
    );
    console.log(
      'D-17: review the regenerated migration as a diff, in the same commit as the schema/ edit that caused it. ' +
        'Nothing else enforces this now that the golden fixture is gone.'
    );
    return;
  }

  let migrationText;
  try {
    migrationText = readFileSync(migrationPath, 'utf8');
  } catch (error) {
    fail(`could not read ${MIGRATION_FILE} (${error.message}). Regenerate it with \`yarn schema:regenerate\`.`);
  }
  const migrationLineCount = countLines(migrationText);

  if (!/^CREATE TABLE public\./m.test(migrationText)) {
    fail(
      `precondition failed: ${MIGRATION_FILE} contains no line beginning \`CREATE TABLE public.\`. It is ` +
        `empty, truncated, or not the initial schema — comparing against it proves nothing.`
    );
  }

  const census =
    `census: ${schemaNames.length} schema file(s) -> ${schemaLineCount} line(s); ` +
    `${path.basename(MIGRATION_FILE)} -> ${migrationLineCount} line(s); ` +
    `${MIGRATIONS_DIR} holds ${migrationNames.length} .sql file(s)`;

  if (migrationNames.length !== 1) {
    console.error(
      `Schema-migration parity guard — ${census}.\n\n` +
        `SECOND MIGRATION FILE: ${MIGRATIONS_DIR} holds ${migrationNames.length} .sql file(s) where the\n` +
        `invariant allows exactly one:\n` +
        migrationNames.map((n) => `  ${n}`).join('\n') +
        `\n\nThe schema is declarative (decision D-14): a change goes into ${SCHEMA_DIR}/<file>.sql and\n` +
        `\`yarn schema:regenerate\` folds it into ${path.basename(MIGRATION_FILE)}. A numbered migration\n` +
        `beside it reinstates the two-source divergence this guard was collapsed to remove — the applied\n` +
        `database would carry the extra file's definitions while the readable copy said otherwise.`
    );
    process.exit(1);
  }

  if (!bytesEqual(schemaText, migrationText)) {
    const schemaLines = schemaText.split('\n');
    const migrationLines = migrationText.split('\n');
    let firstDiff = 0;
    while (
      firstDiff < schemaLines.length &&
      firstDiff < migrationLines.length &&
      schemaLines[firstDiff] === migrationLines[firstDiff]
    )
      firstDiff++;

    console.error(
      `Schema-migration parity guard — ${census}.\n\n` +
        `STALE GENERATED MIGRATION: ${MIGRATION_FILE} is not the current concatenation of\n` +
        `${SCHEMA_DIR}/*.sql. They first differ at line ${firstDiff + 1}:\n\n` +
        `  schema/    ${JSON.stringify(schemaLines[firstDiff] ?? '(end of file)')}\n` +
        `  migration  ${JSON.stringify(migrationLines[firstDiff] ?? '(end of file)')}\n\n` +
        `Almost always this means a ${SCHEMA_DIR} edit landed without regenerating. Run\n` +
        `  yarn schema:regenerate\n` +
        `and, per D-17, read the regenerated diff and commit it together with the schema edit that\n` +
        `caused it. Never hand-edit ${path.basename(MIGRATION_FILE)}: it is generated, and the next\n` +
        `regeneration discards anything written into it directly.`
    );
    process.exit(1);
  }

  console.log(`Schema-migration parity guard (phase 156: REVIEW-DB-07) — ${census}; generated copy is current.`);
}

main();
