#!/usr/bin/env node

/**
 * CROSS-RUNTIME ENV-PAIR VALUE-AGREEMENT CHECKER (phase 153, plan 10 — operator-requested).
 *
 * WHICH OF THE TWO SCRIPTS THIS IS, STATED FIRST BECAUSE CONFUSING THEM WOULD BE THE WHOLE
 * FAILURE. This file is the RUNTIME one. It proves the VALUES: handed one env file, it compares the
 * two members of every derived pair and fails when they disagree. It therefore needs values, which
 * means it CANNOT run in `lint:check` — CI has no secrets, and nothing guarantees both members are
 * set at build time. Its sibling `scripts/assert-env-pair-registry.mjs` is the STATIC one: it reads
 * source and the checked-in template, runs inside `lint:check` with no secrets, and proves the
 * PAIRING CONTRACT — that every twin discoverable in source is documented — but IT CANNOT SEE A
 * VALUE AND SO CANNOT DETECT DRIFT. Shipping only the static one while calling it a drift guard
 * would be a gate that examines nothing and reports green. Neither script is the other, and
 * `153-ENV-PAIRS.md` records what NEITHER can see.
 *
 * THE PAIR SET IS NOT REDEFINED HERE. It is imported from the registry guard, which derives it from
 * source. Two derivations would eventually disagree about what a pair is, and the pair of scripts
 * would then disagree about the tree they both describe — which is the same class of defect as the
 * two configurations that drifted apart twice undetected.
 *
 * NON-DISCLOSURE IS ABSOLUTE, AND IT IS THE REASON THIS FILE IS SHORT. No path — not the success
 * path, not the disagreement path, not the unconfigured path, not an error path — prints an
 * environment value, a prefix or suffix of one, a hash of one, or its LENGTH. A length is a
 * disclosure: it separates a 43-character anon key from a 4-character provider name, and over
 * repeated runs it narrows a secret. Messages name the PAIR and the two VARIABLE NAMES and stop
 * there, because that is everything the operator needs in order to go and look. Phase 155 found two
 * of three Edge Functions returning `err.message` verbatim while their own threat models claimed
 * otherwise, so this property is FLIP-TESTED with two distinguishable secrets rather than asserted.
 *
 * AN ABSENT MEMBER IS UNCONFIGURED, NOT DISAGREEMENT, and the difference matters. The operator's own
 * root env file recently lacked four variables that phase 155 made required; a checker that reported
 * that as "drift" would send someone hunting for a mismatch that does not exist. So a missing or
 * empty member is reported as unconfigured, NAMING WHICH member is missing, and does not count as a
 * disagreement. An empty value counts as unconfigured for the same reason: two variables that are
 * both unset are not two variables that agree, and counting them as an agreement is how a file with
 * nothing in it would report four clean comparisons.
 *
 * A RUN THAT COMPARED NOTHING FAILS. If not one pair had both members set, this exits 1 rather than
 * 0. It was asked to compare and it compared nothing; reporting that as success is the shape this
 * milestone kept finding. The summary line states the census — pairs derived, compared, skipped,
 * disagreeing — so a zero is always distinguishable from an empty scan.
 *
 * IT NEVER READS THE PROCESS ENVIRONMENT AND HAS NO DEFAULT FILE. The env file is a required
 * argument. Defaulting to the operator's real `.env` would make an accidental invocation read
 * secrets nobody asked it to open, and inheriting `process.env` would make the verdict depend on
 * the shell it was launched from rather than on the file named on the command line.
 *
 * Usage:
 *   node scripts/assert-env-pairs-agree.mjs <path-to-env-file>
 *   node scripts/assert-env-pairs-agree.mjs .env.example
 *
 * Exit codes:
 *   0 - every comparable pair agrees, and at least one pair was comparable
 *   1 - a pair disagrees, no pair was comparable, or a named precondition failure (no argument, an
 *       unreadable env file, an unreadable scan root). An input this checker cannot read is a
 *       property it cannot verify — this fails closed.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { derivePairs, parseEnvAssignments } from './assert-env-pair-registry.mjs';

const SELF = 'scripts/assert-env-pairs-agree.mjs';

function fail(message) {
  console.error(`[ERROR] ${SELF}: ${message}`);
}

function main() {
  const target = process.argv[2];
  if (!target) {
    fail(
      'no env file was given. Usage: `node scripts/assert-env-pairs-agree.mjs <path-to-env-file>`. ' +
        'There is deliberately no default: defaulting to the operator’s real `.env` would make ' +
        'an accidental invocation open secrets nobody asked it to read.'
    );
    process.exitCode = 1;
    return;
  }

  const derived = derivePairs();
  if (derived === null) {
    process.exitCode = 1;
    return;
  }
  const { pairs } = derived;

  let text;
  try {
    text = readFileSync(path.resolve(process.cwd(), target), 'utf8');
  } catch (error) {
    // `error.message` here names the PATH and the errno, never file contents — the file was not
    // read. That is the one error string this script forwards, and it is forwarded deliberately.
    fail(
      `could not read the env file '${target}' (${error.message}). A file this checker cannot read ` +
        'is a set of values it cannot compare — this fails closed rather than reporting agreement.'
    );
    process.exitCode = 1;
    return;
  }

  // The SAME parser the registry guard uses on the template, imported rather than rewritten.
  // `values` holds secrets from here on: nothing below prints one, and nothing below may.
  const values = new Map();
  const lines = new Map();
  for (const entry of parseEnvAssignments(text)) {
    values.set(entry.name, entry.value);
    lines.set(entry.name, entry.line);
  }

  let compared = 0;
  let skipped = 0;
  let disagreements = 0;

  for (const pair of pairs) {
    const members = [pair.frontend, pair.deno];
    const unconfigured = members.filter((name) => {
      const value = values.get(name);
      return value === undefined || value === '';
    });

    if (unconfigured.length > 0) {
      skipped++;
      const how = unconfigured.map((name) => (values.has(name) ? `${name} (set but empty)` : `${name} (unset)`));
      console.log(
        `  SKIP ${pair.name}: unconfigured — ${how.join(', ')}. This is NOT drift: a variable that ` +
          'is not set cannot disagree with one that is. Set both members to the same value, or ' +
          'leave both unset, before this pair can be compared.'
      );
      continue;
    }

    compared++;
    if (values.get(pair.frontend) === values.get(pair.deno)) {
      console.log(`  OK   ${pair.name}: ${pair.frontend} and ${pair.deno} agree.`);
      continue;
    }

    disagreements++;
    // Names only. No value, no prefix, no length, no hash — see NON-DISCLOSURE in the docblock.
    fail(
      `the cross-runtime pair '${pair.name}' has DRIFTED: '${pair.frontend}' (line ` +
        `${lines.get(pair.frontend)}) and '${pair.deno}' (line ${lines.get(pair.deno)}) hold ` +
        `different values in '${target}'. They are two spellings of one setting — the frontend ` +
        'reads the PUBLIC_ name because Vite exposes only prefixed variables to the client bundle, ' +
        'and the Deno Edge Functions read the un-prefixed name — so the two runtimes are now ' +
        'configured differently. This has happened twice before, both times undetected. The values ' +
        'are deliberately not printed here; open the file and compare the two lines named above.'
    );
  }

  if (compared === 0 && pairs.length > 0) {
    fail(
      `not one of the ${pairs.length} derived pair(s) had both members set in '${target}', so ` +
        'nothing was compared. A check that examined nothing must not report success — set both ' +
        'members of at least one pair, or point this at a fully-configured env file.'
    );
    process.exitCode = 1;
  } else {
    process.exitCode = disagreements > 0 ? 1 : 0;
  }

  console.log(
    `Cross-runtime env-pair value-agreement checker (phase 153, plan 10) — env file: '${target}'; ` +
      `pairs derived from source: ${pairs.length}; compared: ${compared}; skipped as unconfigured: ` +
      `${skipped}; disagreements: ${disagreements}. This checker sees only the file it was handed: ` +
      'it cannot compare a deployed function config against a separately-configured frontend host.'
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
