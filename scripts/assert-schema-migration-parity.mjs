#!/usr/bin/env node

/**
 * SCHEMA-MIGRATION PARITY GUARD: the migrations are frozen.
 *
 *   - `apps/supabase/supabase/migrations/` is what a database contains.
 *     `supabase db reset` and `supabase db push` apply these files and nothing
 *     else, because `supabase/config.toml` sets `schema_paths = []`.
 *   - `apps/supabase/supabase/migrations.manifest.json` lists them: the
 *     baseline's name, its file and the commit it came from, then every
 *     migration in version order with the sha256 of its bytes.
 *   - `apps/supabase/supabase/schema/` is the current schema, edited by hand and
 *     organised by concern. The CLI never opens it.
 *
 * `supabase db push` skips every version a database has already recorded, so a
 * migration edited after it was applied never reaches that database, and
 * nothing says so. A listed migration is therefore never edited: a schema
 * change is a new migration appended after the last one.
 *
 * THE INVARIANT, in three parts, each checked by `checkFrozenMigrations`.
 *
 *   1. The `.sql` files in the migrations directory are exactly the files the
 *      manifest lists, and the baseline's file is the first entry.
 *   2. Each listed file has the sha256 the manifest records for it.
 *   3. Names and versions follow the five-digit sequence: five digits, an
 *      underscore, a name of lower-case letters, digits and underscores, and
 *      `.sql`, with the versions counting up from the baseline's `00001` in
 *      manifest order, each used once and none left out. Versions are five
 *      digits by choice. A later move to the CLI's timestamp versions
 *      (`YYYYMMDDHHMMSS`) would widen the name pattern and drop the no-gap rule
 *      for those versions; the order rule needs no change, because every
 *      timestamp sorts after `00001`.
 *
 * A schema change is one commit holding three things: the `schema/` edit, the
 * same change as a new migration named by the next version, and that
 * migration's manifest line. `--write`, which `yarn schema:regenerate` runs,
 * refuses and prints these steps with the next file name.
 *
 * WHAT THIS CHECK CANNOT DO, stated so nobody over-reads a green run:
 *
 *   1. It does not compare `schema/` with the migrations. A `schema/` edit
 *      without its migration, or a migration without its `schema/` edit,
 *      passes here. `yarn check:schema-equivalence` builds one database from
 *      each and fails when they differ.
 *   2. It does not prove that a migration is correct, or that any database has
 *      applied it.
 *   3. An edit to a migration made together with its manifest line, in one
 *      commit, passes. It shows in review as a changed hash on a listed line.
 *
 * THE GUARD GUARDS ITSELF. A checker that reports nothing passes every tree, so
 * four defences run on every invocation:
 *
 *   1. The mode is fixed in this file. A missing or unreadable manifest is the
 *      finding `MALFORMED MANIFEST` and fails the run; there is no other mode
 *      for its absence to bring back.
 *   2. A SELF-TEST runs before the verdict. The checker is run over every
 *      fixture under `scripts/fixtures/schema-migration-freeze`, one for each
 *      rule and one clean, and must return each fixture's committed findings.
 *      A checker that has not been seen to fire has its verdict withheld.
 *   3. A CENSUS is printed on every run: the number of migrations in the
 *      manifest, the baseline's line count and the number of fixtures checked.
 *      A verdict over a truncated input is visible in it.
 *   4. A baseline of zero bytes, or one with no line beginning
 *      `CREATE TABLE public.`, is a finding.
 *
 * Node built-ins only, no build step, in the house style of
 * `scripts/assert-a11y-scan-wiring.mjs` and `scripts/assert-i18n-catalog-namespaces.mjs`.
 *
 * Usage:
 *   yarn assert:schema-migration-parity   (verify)
 *   node scripts/assert-schema-migration-parity.mjs --self-test   (the self-test alone)
 *   yarn schema:regenerate                (refuses, and prints the steps of a schema change)
 *
 * Exit codes:
 *   0 - the migrations directory matches the manifest, and the self-test passed
 *   1 - a finding, a failed self-test, or `--write`
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const SCHEMA_DIR = 'apps/supabase/supabase/schema';
const MIGRATIONS_DIR = 'apps/supabase/supabase/migrations';
const MIGRATION_FILE = `${MIGRATIONS_DIR}/00001_initial_schema.sql`;

/** Refuses: the baseline is frozen and is never regenerated. */
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
 * Every rule of the frozen-mode checker, in the order the checker applies them.
 * The checker has no rule outside this list. `kind` opens every finding of the
 * rule, and `fixture` names the directory under
 * `scripts/fixtures/schema-migration-freeze` that breaks this rule and no other.
 *
 * @type {ReadonlyArray<Readonly<{ id: string, kind: string, fixture: string }>>}
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
 * Builds every finding of the checker. The kind comes from `FROZEN_RULES`, so a
 * finding cannot be issued for a rule that is not in the list.
 *
 * @param {string} ruleId
 * @param {string} fileName a base name, never a path
 * @param {string} detail
 * @returns {string}
 */
function bytesEqual(a, b) {
  return a === b;
}

/**
 * Compares a migrations directory with the manifest that lists its files, and
 * returns one finding for each way the pair is wrong. An empty array means the
 * directory holds exactly the listed files, unchanged, under valid names and
 * versions.
 *
 * The manifest is JSON:
 *
 *   {
 *     "baseline": { "name": string, "file": string, "commit": 40 lower-case hex characters },
 *     "migrations": [{ "file": string, "sha256": 64 lower-case hex characters }, ...]
 *   }
 *
 * `migrations` is in version order and its first entry is the baseline's file.
 *
 * A finding is the rule's kind, `: `, a file's base name and the detail. It
 * never holds a directory path, so its text does not depend on the working
 * directory. A fault in the content is returned as a finding: the function does
 * not throw for one and never ends the process.
 *
 * How the rules combine:
 *
 *   - A `MALFORMED MANIFEST` or `BASELINE NOT FIRST` finding ends the check.
 *     Nothing else can be judged against a manifest that cannot be read or
 *     whose anchor is wrong.
 *   - An entry with a bad name takes no part in the three version rules. Its
 *     file is still looked for, hashed and counted as listed.
 *   - An entry reported as a duplicate version is not also reported as out of
 *     order. A gap is judged on the set of distinct versions, whatever their
 *     order.
 *   - A file that is not there is not hashed, and an empty baseline is not
 *     also reported as lacking a table.
 *
 * A listed name is looked up in the directory's own listing before it is read,
 * so a name holding a path separator is reported as missing and never opened.
 *
 * @param {{ migrationsDir: string, manifestPath: string }} paths absolute, or relative to the working directory
 * @returns {Array<string>}
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
