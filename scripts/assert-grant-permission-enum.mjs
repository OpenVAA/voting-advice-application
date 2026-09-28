#!/usr/bin/env node

/**
 * GRANT ENUM MEMBERSHIP GUARD (phase 162, plan 162-03, requirement PRESHIP-02).
 *
 * `public.grant_permission` is the verb of `user_can`, and from wave 4 of phase 162 its member
 * names are string literals inside every RLS policy in the estate. A wrong, missing or extra
 * member is an authorization defect that produces NO SIGNAL at the point it is introduced: nothing
 * breaks until a policy needs a member that does not exist, or — worse — until one is written that
 * grants something the capability matrix withholds. That silence is what this guard exists to end.
 *
 * WHERE THE THREE CANONICAL LISTS BELOW CAME FROM. `162-IMPLEMENTATION-BRIEF.md` section 3.2 is the
 * authority for `grant_permission`, restated one-per-line in `162-SPEC.md` section 4, and the order
 * is section 3.3's capability-matrix order, which is also the persisted enum ordinal order. Task 1
 * of plan 162-03 DERIVED both lists by machine from those two documents and proved them equal to
 * each other in order and in both directions, and equal to the matrix's first column; Task 3 then
 * proved the SQL declaration and the generated types equal to the same list. The operator ratified
 * the 23 members on 2026-09-16.
 *
 * THIS FILE IS DELIBERATELY A THIRD COPY, and the duplication is the point. The first two copies
 * live in planning documents that are filtered out of the branch a reviewer sees, so a gate wired
 * into `lint:check` that parsed them would be a gate that fails on the PR branch. This file reads
 * nothing outside the shipped tree. Task 3's derivation is the AUTHORING-time channel; this is the
 * STANDING one.
 *
 * THE THREE CHANNELS, and why the third is not redundant:
 *   1. the canonical literals in this file;
 *   2. `apps/supabase/supabase/schema/000-enums.sql`, the hand-edited source text;
 *   3. `packages/supabase-types/src/database.ts`, which `yarn db:types` GENERATES from the applied
 *      database.
 * Channel 2 says what was declared. Channel 3 says what reached PostgreSQL. A declaration that was
 * edited but never regenerated into `migrations/00001_initial_schema.sql`, or regenerated but never
 * applied, disagrees with channel 3 and agrees with channel 2 — so the pair distinguishes "the
 * declaration is wrong" from "the declaration never took effect", which one channel cannot.
 *
 * DIFFERENCES ARE REPORTED BY NAME AND IN BOTH DIRECTIONS, as separate findings. A single "the sets
 * differ" line lets a misspelling and a missing member cancel out in a count: rename one member and
 * delete another and the cardinalities still match. When the sets are equal but the ORDER is not,
 * that is reported as ONE further finding rather than as twenty-three, because the failure is one
 * fact — the persisted ordinals no longer follow the matrix.
 *
 * TWO NAMED PROHIBITIONS, each citing its decision. The exact-ordered-set comparison already
 * catches both; they exist so that the failure NAMES THE DECISION instead of printing a set
 * difference a reader has to interpret.
 *
 * NON-VACUITY, in three parts, because a comparison between two empty sets reports equality:
 *   - the CENSUS is printed for every type in every channel BEFORE any verdict, so a `0` is
 *     visible rather than silent;
 *   - a parsed population of zero in any channel, or fewer than `PERMISSION_FLOOR` members for
 *     `grant_permission`, is a parser that has stopped matching the file it reads, and the guard
 *     reports that it proved NOTHING rather than reporting success;
 *   - the SELF-TEST runs in this same invocation — in the spelling `lint:check` calls, so there is
 *     no second command to remember and none to drop — over two committed fixtures: one clean, one
 *     carrying four seeded defects. Both legs are needed: a comparator that reports nothing passes
 *     the seeded fixture's absence check and fails the clean fixture's count, and one that reports
 *     everything fails the clean fixture. When the self-test fails, the corpus result is WITHHELD
 *     rather than reported — a guard that has never been seen to fire has not been shown to guard
 *     anything.
 *
 * Usage:
 *   node scripts/assert-grant-permission-enum.mjs
 *   node scripts/assert-grant-permission-enum.mjs --self-test
 *
 * Exit codes:
 *   0 - every channel agrees with the canon, in order, and the self-test matched its fixtures
 *   1 - at least one finding, a population below the floor, an unreadable input, or a failed
 *       self-test
 */

import fs from 'node:fs';

const SELF = 'assert-grant-permission-enum';

const SCHEMA_FILE = 'apps/supabase/supabase/schema/000-enums.sql';
const GENERATED_FILE = 'packages/supabase-types/src/database.ts';

const FIXTURE_DIR = 'scripts/fixtures/grant-permission-enum';
const CLEAN_FIXTURE = `${FIXTURE_DIR}/enums.ok.sql`;
const VIOLATION_FIXTURE = `${FIXTURE_DIR}/enums.violations.sql`;
const EXPECTED_VIOLATIONS = `${FIXTURE_DIR}/expected.violations`;

/** The four grant scopes of the brief's section 3.1, widest to narrowest. */
const GRANT_SCOPE_TYPE = ['global', 'account', 'project', 'entity'];

/** Exactly two role levels, per D-02 and the brief's section 8.1(a). */
const GRANT_ROLE_TYPE = ['admin', 'editor'];

/** The 23 permission verbs of the brief's section 3.2, in section 3.3's matrix order. */
const GRANT_PERMISSION = [
  'feedback.read',
  'feedback.manage',
  'account.edit_settings',
  'account.manage_projects',
  'account.manage_admins',
  'project.manage_editors',
  'project.edit_project_settings',
  'project.edit_app_settings',
  'project.edit_structure',
  'project.edit_questions',
  'project.read_structure',
  'project.edit_entities',
  'project.edit_nominations',
  'project.read_entities',
  'entity.edit_answers',
  'entity.read_answers',
  'entity.edit_immutable',
  'entity.invite_children',
  'entity.confirm',
  'nomination.edit',
  'nomination.read',
  'nomination.confirm',
  'nomination.create_parent'
];

const CANON = {
  grant_scope_type: GRANT_SCOPE_TYPE,
  grant_role_type: GRANT_ROLE_TYPE,
  grant_permission: GRANT_PERMISSION
};

const TYPE_NAMES = Object.keys(CANON);

/**
 * The floor for `grant_permission`. It sits BELOW the canonical 23 on purpose: an exact count here
 * would duplicate the comparison and turn every deliberate addition into two edits, while a floor
 * catches the one thing the comparison cannot — a parser that has stopped matching and is
 * comparing an empty or truncated list against the canon.
 */
const PERMISSION_FLOOR = 20;

/** Any member whose text carries this is a suggestion verb, which D-01 forbids. */
const SUGGESTION_VERB_RE = /suggest/;

/** The label each channel is named by in a finding. Fixtures share one label so that the committed expected-violations file is stable. */
const SCHEMA_LABEL = SCHEMA_FILE;
const GENERATED_LABEL = GENERATED_FILE;
const FIXTURE_LABEL = 'the schema declaration';

function readOrNull(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`[ERROR] ${SELF}: could not read '${file}' (${error.message}).`);
    return null;
  }
}

/** Pulls the body between `CREATE TYPE public.<name> AS ENUM(` and its closing parenthesis, then collects the single-quoted literals in order. */
function parseSqlEnum(sql, typeName) {
  const match = sql.match(new RegExp(`CREATE TYPE public\\.${typeName} AS ENUM\\(([\\s\\S]*?)\\);`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/**
 * Pulls the union that follows the type name inside the GENERATED `Enums` block of the `public`
 * schema. The block is located first and the search is confined to it, because the same file carries
 * a second `Constants` block spelling every enum again as a runtime array — parsing that one instead
 * would still find the members and would stop saying anything about the TYPE the frontend is checked
 * against.
 *
 * ⚠ The `public:` hop is load-bearing and was MEASURED, not assumed. An earlier draft anchored on
 * the first `\n    Enums: {` in the file, which is `graphql_public`'s empty one some 1,300 lines
 * ahead of the one that matters; every lookup then returned zero members. The floor below is what
 * caught it, on the first run, against a tree whose types were correct — which is the whole reason
 * this guard prints a census and refuses to give a verdict under it.
 */
function parseGeneratedEnum(ts, typeName) {
  const schemaStart = ts.indexOf('\n  public: {');
  if (schemaStart === -1) return [];
  const start = ts.indexOf('\n    Enums: {', schemaStart);
  if (start === -1) return [];
  const end = ts.indexOf('\n    CompositeTypes', start);
  const block = end === -1 ? ts.slice(start) : ts.slice(start, end);
  const match = block.match(new RegExp(`\\n      ${typeName}:([\\s\\S]*?);`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Reports the two directions separately, and reports order as one fact rather than as one fact per member. */
function compareMembers(typeName, canon, channelLabel, members) {
  const findings = [];
  for (const member of canon) {
    if (!members.includes(member)) {
      findings.push(`${typeName}: in the canon, absent from ${channelLabel}: ${member}`);
    }
  }
  for (const member of members) {
    if (!canon.includes(member)) {
      findings.push(`${typeName}: in ${channelLabel}, absent from the canon: ${member}`);
    }
  }
  if (findings.length === 0 && JSON.stringify(members) !== JSON.stringify(canon)) {
    findings.push(
      `${typeName}: ${channelLabel} agrees with the canon as a set but not in order, and enum ordinals are persisted`
    );
  }
  return findings;
}

/** The two named prohibitions. Redundant against the comparison above by construction, and kept so that the failure names the decision rather than a set difference. */
function checkProhibitions(channelLabel, roleMembers, permissionMembers) {
  const findings = [];
  for (const member of roleMembers) {
    if (!GRANT_ROLE_TYPE.includes(member)) {
      findings.push(
        `grant_role_type: D-02 prohibition — ${channelLabel} carries a third role level '${member}'. ` +
          'The brief section 8.1(a) ruled two levels, admin and editor: the eight user types span only those, ' +
          'editor management is project.manage_editors with entity.invite_children as its entity-scope ' +
          'equivalent, so a third level is untested surface in a security enum rather than a capability ' +
          'anything grants.'
      );
    }
  }
  for (const member of permissionMembers) {
    if (SUGGESTION_VERB_RE.test(member)) {
      findings.push(
        `grant_permission: D-01 prohibition — ${channelLabel} carries a suggestion verb '${member}'. ` +
          'The operator amended PRESHIP-02 criterion 4 and no change_suggestions store is built, so a verb ' +
          'for one would be a capability nothing implements.'
      );
    }
  }
  return findings;
}

/** Runs the schema-channel parser and the comparator over one SQL source. Used by the self-test over both fixtures. */
function auditSqlSource(sql, channelLabel) {
  const parsed = {};
  for (const typeName of TYPE_NAMES) parsed[typeName] = parseSqlEnum(sql, typeName);
  const findings = [];
  for (const typeName of TYPE_NAMES) {
    findings.push(...compareMembers(typeName, CANON[typeName], channelLabel, parsed[typeName]));
  }
  findings.push(...checkProhibitions(channelLabel, parsed.grant_role_type, parsed.grant_permission));
  return findings;
}

function sortedEqual(a, b) {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((value, index) => value === y[index]);
}

/**
 * The comparator over two committed fixtures: `enums.ok.sql`, a miniature enums file whose three
 * grant declarations match the canon exactly, and `enums.violations.sql`, the same with four seeded
 * defects — `entity.confirm` misspelled as a near neighbour, `nomination.create_parent` deleted, a
 * suggestion verb added to `grant_permission`, and a third level added to `grant_role_type`.
 */
function selfTest() {
  const cleanSrc = readOrNull(CLEAN_FIXTURE);
  const violationSrc = readOrNull(VIOLATION_FIXTURE);
  const expectedRaw = readOrNull(EXPECTED_VIOLATIONS);
  if (cleanSrc === null || violationSrc === null || expectedRaw === null) {
    return { passed: false, summary: 'self-test could not read its fixtures, so it proved nothing' };
  }

  const expected = expectedRaw.split('\n').filter((line) => line.trim() !== '');
  const cleanFindings = auditSqlSource(cleanSrc, FIXTURE_LABEL);
  const violationFindings = auditSqlSource(violationSrc, FIXTURE_LABEL);

  const summary =
    `self-test: ${CLEAN_FIXTURE} -> ${cleanFindings.length} finding(s), ` +
    `${VIOLATION_FIXTURE} -> ${violationFindings.length} finding(s) against ${expected.length} expected`;

  let passed = true;
  if (cleanFindings.length !== 0) {
    passed = false;
    console.error(
      `[ERROR] ${SELF}: the clean fixture produced ${cleanFindings.length} finding(s) and must produce none:`
    );
    for (const finding of cleanFindings) console.error(`          ${finding}`);
  }
  if (expected.length === 0) {
    passed = false;
    console.error(
      `[ERROR] ${SELF}: '${EXPECTED_VIOLATIONS}' is empty, so the seeded fixture would be compared against nothing.`
    );
  }
  if (!sortedEqual(violationFindings, expected)) {
    passed = false;
    console.error(`[ERROR] ${SELF}: the seeded fixture did not produce the committed expected findings.`);
    for (const finding of violationFindings) {
      if (!expected.includes(finding)) console.error(`          produced but not expected: ${finding}`);
    }
    for (const finding of expected) {
      if (!violationFindings.includes(finding)) console.error(`          expected but not produced: ${finding}`);
    }
  }

  return { passed, summary };
}

function main() {
  const selfTestOnly = process.argv.includes('--self-test');

  if (selfTestOnly) {
    const { passed, summary } = selfTest();
    console.log(`Grant enum membership guard — ${summary}.`);
    process.exitCode = passed ? 0 : 1;
    return;
  }

  const schemaSrc = readOrNull(SCHEMA_FILE);
  const generatedSrc = readOrNull(GENERATED_FILE);
  if (schemaSrc === null || generatedSrc === null) {
    console.error(
      `[ERROR] ${SELF}: a channel could not be read, so no comparison was made and the verdict is withheld.`
    );
    process.exitCode = 1;
    return;
  }

  const schema = {};
  const generated = {};
  for (const typeName of TYPE_NAMES) {
    schema[typeName] = parseSqlEnum(schemaSrc, typeName);
    generated[typeName] = parseGeneratedEnum(generatedSrc, typeName);
  }

  // --- The census, printed before any verdict --------------------------------
  console.log(`Grant enum membership guard — census (canon / schema / generated):`);
  for (const typeName of TYPE_NAMES) {
    console.log(
      `  ${typeName}: ${CANON[typeName].length} / ${schema[typeName].length} / ${generated[typeName].length}`
    );
  }

  // --- The non-vacuity floor -------------------------------------------------
  const floorFailures = [];
  for (const typeName of TYPE_NAMES) {
    if (schema[typeName].length === 0) {
      floorFailures.push(
        `${typeName}: the parser found no members in ${SCHEMA_LABEL}, so nothing was compared on that channel`
      );
    }
    if (generated[typeName].length === 0) {
      floorFailures.push(
        `${typeName}: the parser found no members in ${GENERATED_LABEL}, so nothing was compared on that channel`
      );
    }
  }
  if (schema.grant_permission.length > 0 && schema.grant_permission.length < PERMISSION_FLOOR) {
    floorFailures.push(
      `grant_permission: ${SCHEMA_LABEL} yielded ${schema.grant_permission.length} member(s), below the floor of ` +
        `${PERMISSION_FLOOR}, which is a parser that has stopped matching rather than a shrunken enum`
    );
  }
  if (generated.grant_permission.length > 0 && generated.grant_permission.length < PERMISSION_FLOOR) {
    floorFailures.push(
      `grant_permission: ${GENERATED_LABEL} yielded ${generated.grant_permission.length} member(s), below the ` +
        `floor of ${PERMISSION_FLOOR}, which is a parser that has stopped matching rather than a shrunken enum`
    );
  }
  if (floorFailures.length > 0) {
    for (const failure of floorFailures) console.error(`[ERROR] ${SELF}: ${failure}.`);
    console.error(
      `[ERROR] ${SELF}: a population below the floor means this guard proved NOTHING; the verdict is withheld.`
    );
    process.exitCode = 1;
    return;
  }

  // --- The comparison, both channels, both directions, in order ---------------
  const findings = [];
  for (const typeName of TYPE_NAMES) {
    findings.push(...compareMembers(typeName, CANON[typeName], SCHEMA_LABEL, schema[typeName]));
    findings.push(...compareMembers(typeName, CANON[typeName], GENERATED_LABEL, generated[typeName]));
  }
  findings.push(...checkProhibitions(SCHEMA_LABEL, schema.grant_role_type, schema.grant_permission));
  findings.push(...checkProhibitions(GENERATED_LABEL, generated.grant_role_type, generated.grant_permission));

  for (const finding of findings) console.error(`[ERROR] ${SELF}: ${finding}`);

  // --- The self-test, in this same invocation ---------------------------------
  const { passed: selfTestPassed, summary: selfTestSummary } = selfTest();
  if (!selfTestPassed) {
    console.error(
      `[ERROR] ${SELF}: the self-test did not match its committed expectations (printed above). The result over ` +
        'the real channels says nothing until this passes, so the verdict is withheld.'
    );
  }

  console.log(`Grant enum membership guard — ${findings.length} finding(s); ${selfTestSummary}.`);
  process.exitCode = findings.length > 0 || !selfTestPassed ? 1 : 0;
}

main();
