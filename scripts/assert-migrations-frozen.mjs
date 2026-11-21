#!/usr/bin/env node

/**
 * MIGRATION FREEZE GUARD: the migrations are frozen.
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
 * migration's manifest line. `apps/supabase/README.md` gives the steps.
 *
 * WHAT THIS CHECK CANNOT DO, stated so nobody over-reads a green run:
 *
 *   1. It does not compare `schema/` with the migrations. A `schema/` edit
 *      without its migration, or a migration without its `schema/` edit,
 *      passes here. `yarn check:schema-equivalence`, which CI runs in the
 *      `sql-lint` job, builds one database from each and fails when they
 *      differ.
 *   2. It does not prove that a migration is correct, or that any database has
 *      applied it.
 *   3. An edit to a migration made together with its manifest line, in one
 *      commit, passes. It shows in review as a changed hash on a listed line.
 *
 * THE GUARD GUARDS ITSELF. A checker that reports nothing passes every tree, so
 * three defences run on every invocation:
 *
 *   1. The mode is fixed in this file. A missing or unreadable manifest is the
 *      finding `MALFORMED MANIFEST` and fails the run; there is no other mode
 *      for its absence to bring back.
 *   2. A CENSUS is printed on every run: the number of migrations in the
 *      manifest and the baseline's line count. A verdict over a truncated
 *      input is visible in it.
 *   3. A baseline of zero bytes, or one with no line beginning
 *      `CREATE TABLE public.`, is a finding.
 *
 * The checker's fixtures are proved by vitest, not here: the guard runs no
 * self-test of its own. `scripts/tests/schemaMigrationFreezeGate.test.ts`, which
 * `yarn test:unit` runs, checks every fixture under
 * `scripts/fixtures/schema-migration-freeze` against its committed findings,
 * and fails when a rule has no fixture or a fixture has no rule.
 *
 * Node built-ins only, no build step, in the house style of
 * `scripts/assert-a11y-scan-wiring.mjs` and `scripts/assert-i18n-catalog-namespaces.mjs`.
 *
 * Usage:
 *   yarn assert:migrations-frozen
 *
 * Exit codes:
 *   0 - the migrations directory matches the manifest
 *   1 - a finding
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const MIGRATIONS_DIR = 'apps/supabase/supabase/migrations';
const MANIFEST_FILE = 'apps/supabase/supabase/migrations.manifest.json';

function fail(message) {
  console.error(`Migration freeze guard: ${message}`);
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
export const FROZEN_RULES = Object.freeze(
  [
    { id: 'manifest-exists', kind: 'MALFORMED MANIFEST', fixture: 'missing-manifest' },
    { id: 'manifest-json', kind: 'MALFORMED MANIFEST', fixture: 'malformed-manifest' },
    { id: 'baseline-members', kind: 'MALFORMED MANIFEST', fixture: 'missing-baseline-member' },
    { id: 'baseline-commit-shape', kind: 'MALFORMED MANIFEST', fixture: 'bad-baseline-commit' },
    { id: 'migrations-array', kind: 'MALFORMED MANIFEST', fixture: 'empty-migrations' },
    { id: 'baseline-first', kind: 'BASELINE NOT FIRST', fixture: 'baseline-not-first' },
    { id: 'name-pattern', kind: 'BAD NAME', fixture: 'bad-name' },
    { id: 'version-unique', kind: 'DUPLICATE VERSION', fixture: 'duplicate-version' },
    { id: 'version-order', kind: 'NON-INCREASING VERSION', fixture: 'non-increasing-version' },
    { id: 'version-contiguous', kind: 'VERSION GAP', fixture: 'version-gap' },
    { id: 'file-exists', kind: 'MISSING MIGRATION', fixture: 'missing-file' },
    { id: 'file-hash', kind: 'EDITED FROZEN MIGRATION', fixture: 'edited-file' },
    { id: 'file-listed', kind: 'UNLISTED MIGRATION', fixture: 'unlisted-file' },
    { id: 'baseline-not-empty', kind: 'EMPTY BASELINE', fixture: 'empty-baseline' },
    { id: 'baseline-has-table', kind: 'EMPTY BASELINE', fixture: 'baseline-without-table' }
  ].map((rule) => Object.freeze(rule))
);

/** A migration's file name. The five digits are its version. */
const MIGRATION_NAME_RE = /^([0-9]{5})_[a-z0-9_]+\.sql$/;

/** A full commit id, as `git rev-parse` prints it. */
const COMMIT_RE = /^[0-9a-f]{40}$/;

const BASELINE_MEMBERS = ['name', 'file', 'commit'];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
function frozenFinding(ruleId, fileName, detail) {
  const rule = FROZEN_RULES.find((candidate) => candidate.id === ruleId);
  if (!rule) throw new Error(`No frozen-mode rule has the id '${ruleId}'.`);
  return `${rule.kind}: ${fileName} ${detail}`;
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
export function checkFrozenMigrations({ migrationsDir, manifestPath }) {
  const manifestName = path.basename(manifestPath);

  let manifestText;
  try {
    manifestText = readFileSync(manifestPath, 'utf8');
  } catch (error) {
    return [frozenFinding('manifest-exists', manifestName, `cannot be read (${error.code ?? 'unknown error'}).`)];
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    return [frozenFinding('manifest-json', manifestName, 'is not valid JSON.')];
  }

  const baseline = isRecord(manifest) && isRecord(manifest.baseline) ? manifest.baseline : {};
  const absentMembers = BASELINE_MEMBERS.filter((member) => typeof baseline[member] !== 'string');
  if (absentMembers.length > 0) {
    return [
      frozenFinding(
        'baseline-members',
        manifestName,
        `has no string value for ${absentMembers.map((member) => `baseline.${member}`).join(', ')}.`
      )
    ];
  }

  if (!COMMIT_RE.test(baseline.commit)) {
    return [
      frozenFinding(
        'baseline-commit-shape',
        manifestName,
        `gives baseline.commit as ${JSON.stringify(baseline.commit)}, which is not 40 lower-case hex characters.`
      )
    ];
  }

  const entries = manifest.migrations;
  const entriesAreWellFormed =
    Array.isArray(entries) &&
    entries.length > 0 &&
    entries.every((entry) => isRecord(entry) && typeof entry.file === 'string' && typeof entry.sha256 === 'string');
  if (!entriesAreWellFormed) {
    return [
      frozenFinding(
        'migrations-array',
        manifestName,
        'does not give migrations as a non-empty array of objects with a string file and a string sha256.'
      )
    ];
  }

  if (entries[0].file !== baseline.file) {
    return [
      frozenFinding(
        'baseline-first',
        entries[0].file,
        `is the first entry of the manifest, and baseline.file is ${baseline.file}.`
      )
    ];
  }

  const findings = [];

  /** The entries with a valid name, in manifest order. */
  const versioned = [];
  const badNames = [];
  for (const entry of entries) {
    const match = MIGRATION_NAME_RE.exec(entry.file);
    if (match) versioned.push({ file: entry.file, version: match[1] });
    else badNames.push(entry.file);
  }
  const highestVersion = versioned.reduce(
    (highest, item) => (item.version > highest ? item.version : highest),
    '00000'
  );
  const nextVersion = String(Number(highestVersion) + 1).padStart(5, '0');
  for (const file of badNames) {
    findings.push(
      frozenFinding(
        'name-pattern',
        file,
        'is not five digits, an underscore, a name of lower-case letters, digits and underscores, and .sql; ' +
          `rename it to the next number, ${nextVersion}_<name>.sql.`
      )
    );
  }

  /** The first file of each distinct version. */
  const firstFileOf = new Map();
  const duplicateIndexes = new Set();
  versioned.forEach((item, index) => {
    if (firstFileOf.has(item.version)) {
      duplicateIndexes.add(index);
      findings.push(
        frozenFinding(
          'version-unique',
          item.file,
          `has version ${item.version}, which ${firstFileOf.get(item.version)} already has.`
        )
      );
    } else {
      firstFileOf.set(item.version, item.file);
    }
  });

  // Fixed width makes the comparison of two version strings a numeric one.
  for (let index = 1; index < versioned.length; index++) {
    if (duplicateIndexes.has(index)) continue;
    const item = versioned[index];
    const before = versioned[index - 1];
    if (item.version < before.version) {
      findings.push(
        frozenFinding('version-order', item.file, `has version ${item.version}, lower than ${before.file} before it.`)
      );
    }
  }

  const distinctVersions = [...firstFileOf.keys()].sort();
  const baselineVersion = MIGRATION_NAME_RE.exec(baseline.file)?.[1] ?? distinctVersions[0];
  for (const version of distinctVersions) {
    if (version <= baselineVersion) continue;
    const predecessor = String(Number(version) - 1).padStart(5, '0');
    if (!firstFileOf.has(predecessor)) {
      findings.push(
        frozenFinding(
          'version-contiguous',
          firstFileOf.get(version),
          `has version ${version}, and no entry has version ${predecessor}.`
        )
      );
    }
  }

  // An unreadable directory is an empty one: every listed file is then reported as missing.
  let onDisk;
  try {
    onDisk = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();
  } catch {
    onDisk = [];
  }

  /** The bytes of each listed file that could be read. */
  const bytesOf = new Map();
  const missing = new Set();
  for (const entry of entries) {
    if (bytesOf.has(entry.file) || missing.has(entry.file)) continue;
    let bytes = null;
    if (onDisk.includes(entry.file)) {
      try {
        bytes = readFileSync(path.join(migrationsDir, entry.file));
      } catch {
        bytes = null;
      }
    }
    if (bytes === null) {
      missing.add(entry.file);
      findings.push(
        frozenFinding(
          'file-exists',
          entry.file,
          'is listed in the manifest and is not a readable file in the migrations directory.'
        )
      );
    } else {
      bytesOf.set(entry.file, bytes);
    }
  }

  for (const entry of entries) {
    const bytes = bytesOf.get(entry.file);
    if (bytes === undefined) continue;
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== entry.sha256) {
      findings.push(
        frozenFinding('file-hash', entry.file, `has sha256 ${actual}, and the manifest records ${entry.sha256}.`)
      );
    }
  }

  const listed = new Set(entries.map((entry) => entry.file));
  for (const name of onDisk) {
    if (!listed.has(name)) {
      findings.push(
        frozenFinding(
          'file-listed',
          name,
          'is in the migrations directory and has no entry in the manifest; a new migration needs its line there.'
        )
      );
    }
  }

  const baselineBytes = bytesOf.get(baseline.file);
  if (baselineBytes !== undefined) {
    if (baselineBytes.length === 0) {
      findings.push(frozenFinding('baseline-not-empty', baseline.file, 'is zero bytes long.'));
    } else if (!/^CREATE TABLE public\./m.test(baselineBytes.toString('utf8'))) {
      findings.push(
        frozenFinding('baseline-has-table', baseline.file, 'holds no line beginning `CREATE TABLE public.`.')
      );
    }
  }

  return findings;
}

/** What to do about a finding, for each kind of `FROZEN_RULES`. */
const REMEDY_BY_KIND = Object.freeze({
  'MALFORMED MANIFEST':
    `Restore ${MANIFEST_FILE} from git. The guard checks the frozen migrations whether or not the manifest ` +
    'is there, and without it every run fails.',
  'BASELINE NOT FIRST': "Put the baseline's entry first in `migrations`; every later migration follows it.",
  'BAD NAME': 'Rename the file as the finding says, and its manifest entry with it.',
  'DUPLICATE VERSION': 'Give the later migration the next version after the highest one in the manifest.',
  'NON-INCREASING VERSION': 'List the migrations in the manifest in version order.',
  'VERSION GAP': 'Number the migrations one after another, leaving no version out.',
  'MISSING MIGRATION':
    'Restore the file from git. A listed migration is never deleted; a change to the schema is a new migration.',
  'EDITED FROZEN MIGRATION':
    'Restore the file from git and write the change as a new numbered migration. `supabase db push` skips a ' +
    'version a database has recorded, so an edit to an applied migration never reaches that database.',
  'UNLISTED MIGRATION':
    'Add its entry, with its sha256 (`shasum -a 256 <file>`), to the end of the manifest in the same commit as the file.',
  'EMPTY BASELINE': 'Restore the baseline from git.'
});

/**
 * The census of the real migrations: how many the manifest lists and how long
 * the baseline is. The baseline is looked up in the directory's own listing
 * before it is read, as the checker does.
 *
 * @returns {string}
 */
function censusOf() {
  let listed = 'no readable manifest';
  let baseline = 'baseline unread';
  try {
    const manifest = JSON.parse(readFileSync(path.join(REPO_ROOT, MANIFEST_FILE), 'utf8'));
    if (Array.isArray(manifest?.migrations)) listed = `${manifest.migrations.length} migration(s) in the manifest`;
    const file = manifest?.baseline?.file;
    const migrationsDir = path.join(REPO_ROOT, MIGRATIONS_DIR);
    if (typeof file === 'string' && readdirSync(migrationsDir).includes(file)) {
      baseline = `baseline ${file} -> ${countLines(readFileSync(path.join(migrationsDir, file), 'utf8'))} line(s)`;
    }
  } catch {
    // The checker reports the cause as a finding; the census says what it could not read.
  }
  return `census: ${listed}; ${baseline}`;
}

function main() {
  const unremedied = [...new Set(FROZEN_RULES.map((rule) => rule.kind))].filter((kind) => !REMEDY_BY_KIND[kind]);
  if (unremedied.length > 0) {
    fail(`no remedy is written for the finding kind(s) ${unremedied.join(', ')}; add one to REMEDY_BY_KIND.`);
  }

  const findings = checkFrozenMigrations({
    migrationsDir: path.join(REPO_ROOT, MIGRATIONS_DIR),
    manifestPath: path.join(REPO_ROOT, MANIFEST_FILE)
  });
  const census = censusOf();

  if (findings.length > 0) {
    console.error(`Migration freeze guard — ${census}.\n`);
    for (const finding of findings) {
      const kind = finding.slice(0, finding.indexOf(':'));
      console.error(`${finding}\n  ${REMEDY_BY_KIND[kind]}\n`);
    }
    console.error(
      `${findings.length} finding(s) in ${MIGRATIONS_DIR} against ${MANIFEST_FILE}. A schema change is a new ` +
        'numbered migration; see apps/supabase/README.md for the steps of a schema change.'
    );
    process.exit(1);
  }

  console.log(`Migration freeze guard — ${census}; the frozen migrations match the manifest.`);
}

/**
 * True when this file is the script Node was started with, and false when it is
 * imported. Both sides are resolved through symbolic links: Node resolves them
 * for the module's own URL and not for `process.argv[1]`, and a plain string
 * comparison would then skip `main()` and exit 0 without checking anything.
 */
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) main();
