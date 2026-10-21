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

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const SCHEMA_DIR = 'apps/supabase/supabase/schema';
const MIGRATIONS_DIR = 'apps/supabase/supabase/migrations';
const MANIFEST_FILE = 'apps/supabase/supabase/migrations.manifest.json';

/** Refuses: the baseline is frozen and is never regenerated. */
const WRITE = process.argv.slice(2).includes('--write');
/** Runs the frozen-mode self-test alone: the real migrations are not checked. */
const SELF_TEST_ONLY = process.argv.slice(2).includes('--self-test');

/** One directory for each rule of the frozen-mode checker, and a clean one. */
const FREEZE_FIXTURE_DIR = 'scripts/fixtures/schema-migration-freeze';
const CLEAN_FREEZE_FIXTURE = 'ok';

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

/** The lines of a fixture's `expected.violations`, or null when the file cannot be read. */
function readExpectedFindings(fixtureDir) {
  try {
    return readFileSync(path.join(fixtureDir, 'expected.violations'), 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== '');
  } catch {
    return null;
  }
}

/**
 * Runs `checkFrozenMigrations` over every fixture directory and compares what
 * it returns with the findings committed beside the fixture. It runs in every
 * verifying invocation, before the verdict, and alone under `--self-test`.
 *
 * A checker that reports nothing passes a clean tree and every broken one, so
 * its verdict means nothing until each rule has been seen to fire. The
 * self-test fails when:
 *
 *   - the fixture directory cannot be read, holds no fixture, or lacks the
 *     clean fixture;
 *   - a fixture's findings differ from its `expected.violations`, compared as
 *     sets and reported in both directions;
 *   - the clean fixture produces a finding;
 *   - a seeded fixture's `expected.violations` does not hold exactly one line;
 *   - a rule of `FROZEN_RULES` names a fixture that is not there, or whose
 *     finding does not begin with the rule's kind;
 *   - a fixture other than the clean one is not named by exactly one rule.
 *
 * So a rule added without its fixture, and a fixture deleted or emptied, each
 * turn the guard red.
 *
 * @returns {{ passed: boolean, summary: string, report: Array<string>, problems: Array<string>, fixtureCount: number }}
 *   `report` holds one line for each fixture with what the checker returned, and `fixtureCount` the
 *   number of fixtures checked
 */
function selfTestFrozenChecker() {
  const fixtureRoot = path.join(REPO_ROOT, FREEZE_FIXTURE_DIR);
  const report = [];
  const problems = [];

  let fixtures;
  try {
    fixtures = readdirSync(fixtureRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    fixtures = [];
    problems.push(`${FREEZE_FIXTURE_DIR} could not be read (${error.code ?? 'unknown error'})`);
  }
  if (fixtures.length === 0) {
    problems.push(`${FREEZE_FIXTURE_DIR} holds no fixture directory, so the checker was run over nothing`);
  } else if (!fixtures.includes(CLEAN_FREEZE_FIXTURE)) {
    problems.push(`the clean fixture '${CLEAN_FREEZE_FIXTURE}' is missing, so nothing shows the checker can pass`);
  }

  /** What the checker returned for each fixture. */
  const producedBy = new Map();
  for (const fixture of fixtures) {
    const fixtureDir = path.join(fixtureRoot, fixture);
    let produced;
    try {
      produced = checkFrozenMigrations({
        migrationsDir: path.join(fixtureDir, 'migrations'),
        manifestPath: path.join(fixtureDir, 'manifest.json')
      });
    } catch (error) {
      problems.push(`${fixture}: the checker threw (${error.message})`);
      continue;
    }
    producedBy.set(fixture, produced);
    if (produced.length === 0) report.push(`  ${fixture}: no finding`);
    for (const finding of produced) report.push(`  ${fixture}: ${finding}`);

    const expected = readExpectedFindings(fixtureDir);
    if (expected === null) {
      problems.push(`${fixture}: expected.violations could not be read`);
      continue;
    }
    if (fixture === CLEAN_FREEZE_FIXTURE) {
      if (produced.length > 0) {
        problems.push(`${fixture}: the clean fixture produced ${produced.length} finding(s) and must produce none`);
      }
    } else if (expected.length !== 1) {
      problems.push(
        `${fixture}: expected.violations holds ${expected.length} line(s), and a seeded fixture commits exactly one`
      );
    }
    for (const finding of produced) {
      if (!expected.includes(finding)) problems.push(`${fixture}: produced but not expected: ${finding}`);
    }
    for (const finding of expected) {
      if (!produced.includes(finding)) problems.push(`${fixture}: expected but not produced: ${finding}`);
    }
  }

  for (const rule of FROZEN_RULES) {
    if (!fixtures.includes(rule.fixture)) {
      problems.push(
        `rule '${rule.id}' names the fixture '${rule.fixture}', and ${FREEZE_FIXTURE_DIR} holds no such directory`
      );
      continue;
    }
    const produced = producedBy.get(rule.fixture) ?? [];
    if (produced.length === 0 || !produced.every((finding) => finding.startsWith(`${rule.kind}: `))) {
      problems.push(
        `rule '${rule.id}': its fixture '${rule.fixture}' did not produce a finding that begins '${rule.kind}: '`
      );
    }
  }

  for (const fixture of fixtures) {
    if (fixture === CLEAN_FREEZE_FIXTURE) continue;
    const owners = FROZEN_RULES.filter((rule) => rule.fixture === fixture);
    if (owners.length !== 1) {
      problems.push(`fixture '${fixture}' is named by ${owners.length} rule(s), and each fixture belongs to one`);
    }
  }

  const passed = problems.length === 0;
  const summary = passed
    ? `frozen-mode self-test: ${fixtures.length} fixture(s) checked, each produced its committed findings; ` +
      `${FROZEN_RULES.length} rule(s), each with its fixture`
    : `frozen-mode self-test: FAILED with ${problems.length} problem(s) over ${fixtures.length} fixture(s)`;
  return { passed, summary, report, problems, fixtureCount: fixtures.length };
}

/** Prints each problem of a failed self-test on its own line. A problem that quotes a finding already ends in a full stop. */
function printSelfTestProblems(problems) {
  for (const problem of problems) {
    console.error(`Schema-migration parity guard: self-test: ${problem}${problem.endsWith('.') ? '' : '.'}`);
  }
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

/** The version of a migration's file name, or null when the name is not one. */
function versionOf(name) {
  const match = typeof name === 'string' ? MIGRATION_NAME_RE.exec(name) : null;
  return match ? Number(match[1]) : null;
}

/**
 * The versions of the manifest's entries, or of the migrations directory's
 * files when the manifest cannot be read.
 *
 * @returns {{ versions: Array<number>, source: string }}
 */
function knownVersions() {
  try {
    const manifest = JSON.parse(readFileSync(path.join(REPO_ROOT, MANIFEST_FILE), 'utf8'));
    if (Array.isArray(manifest?.migrations)) {
      const versions = manifest.migrations.map((entry) => versionOf(entry?.file)).filter((v) => v !== null);
      if (versions.length > 0) return { versions, source: 'the manifest' };
    }
  } catch {
    // An unreadable manifest falls through to the directory listing.
  }
  let names;
  try {
    names = readdirSync(path.join(REPO_ROOT, MIGRATIONS_DIR));
  } catch {
    names = [];
  }
  return {
    versions: names.map(versionOf).filter((v) => v !== null),
    source: 'the migrations directory, because the manifest could not be read'
  };
}

/** Prints why `--write` no longer writes, and the steps of a schema change. Exits 1. */
function refuseWrite() {
  const { versions, source } = knownVersions();
  const next = String(Math.max(0, ...versions) + 1).padStart(5, '0');
  console.error(
    'Schema-migration parity guard: the baseline is frozen. `--write` (`yarn schema:regenerate`) no longer\n' +
      'rewrites a migration, and a listed migration is never edited.\n\n' +
      'A schema change is one commit, in three steps:\n' +
      `  1. Edit the file under ${SCHEMA_DIR}/ that holds the object.\n` +
      `  2. Write the same change as a new migration, ${MIGRATIONS_DIR}/${next}_<name>.sql,\n` +
      '     where <name> is yours to choose (lower-case letters, digits and underscores).\n' +
      `     ${next} is the next version after the highest in ${source}.\n` +
      `  3. Add its line, with its sha256 (\`shasum -a 256 <file>\`), to the end of ${MANIFEST_FILE}.\n\n` +
      `Then run \`yarn check:schema-equivalence\`: it builds one database from ${SCHEMA_DIR}/ and one from\n` +
      `${MIGRATIONS_DIR}/ and fails when they differ.`
  );
  process.exit(1);
}

/**
 * The census of the real migrations: how many the manifest lists and how long
 * the baseline is. The baseline is looked up in the directory's own listing
 * before it is read, as the checker does.
 *
 * @param {number} fixtureCount
 * @returns {string}
 */
function censusOf(fixtureCount) {
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
  return `census: ${listed}; ${baseline}; ${fixtureCount} fixture(s) checked`;
}

function main() {
  if (WRITE) refuseWrite();

  const frozen = selfTestFrozenChecker();

  if (SELF_TEST_ONLY) {
    console.log(`Schema-migration parity guard — the frozen-mode checker over ${FREEZE_FIXTURE_DIR}:`);
    for (const line of frozen.report) console.log(line);
    printSelfTestProblems(frozen.problems);
    console.log(`Schema-migration parity guard — ${frozen.summary}.`);
    process.exitCode = frozen.passed ? 0 : 1;
    return;
  }

  if (!frozen.passed) {
    printSelfTestProblems(frozen.problems);
    fail(
      `the frozen-mode self-test did not match its committed fixtures under ${FREEZE_FIXTURE_DIR} (printed ` +
        `above). A checker that has not been seen to fire has not been shown to check anything, so the verdict ` +
        `on ${MIGRATIONS_DIR} is withheld.`
    );
  }

  const unremedied = [...new Set(FROZEN_RULES.map((rule) => rule.kind))].filter((kind) => !REMEDY_BY_KIND[kind]);
  if (unremedied.length > 0) {
    fail(`no remedy is written for the finding kind(s) ${unremedied.join(', ')}; add one to REMEDY_BY_KIND.`);
  }

  const findings = checkFrozenMigrations({
    migrationsDir: path.join(REPO_ROOT, MIGRATIONS_DIR),
    manifestPath: path.join(REPO_ROOT, MANIFEST_FILE)
  });
  const census = censusOf(frozen.fixtureCount);

  if (findings.length > 0) {
    console.error(`Schema-migration parity guard — ${census}.\n`);
    for (const finding of findings) {
      const kind = finding.slice(0, finding.indexOf(':'));
      console.error(`${finding}\n  ${REMEDY_BY_KIND[kind]}\n`);
    }
    console.error(
      `${findings.length} finding(s) in ${MIGRATIONS_DIR} against ${MANIFEST_FILE}. A schema change is a new ` +
        'numbered migration; `yarn schema:regenerate` prints the steps.'
    );
    process.exit(1);
  }

  console.log(`Schema-migration parity guard — ${census}; the frozen migrations match the manifest.`);
  console.log(`Schema-migration parity guard — ${frozen.summary}.`);
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
