#!/usr/bin/env node

/**
 * CROSS-RUNTIME ENV-PAIR VALUE-AGREEMENT CHECKER.
 *
 * Handed an env file, compares the two members of every cross-runtime pair and fails when they hold
 * different values. The pairs come from `scripts/lib/env-pairs.mjs`, the same derivation
 * `scripts/assert-env-pair-registry.mjs` uses; that guard proves from source that every pair is
 * documented, but cannot see a value. This one needs an operator's real env file, so it is a
 * `check:*` script and never runs in CI.
 *
 * - Non-disclosure: no path prints a value, a prefix, suffix, hash or length of one. Messages name
 *   the pair and the two variable names only.
 * - A missing or empty member is reported as unconfigured, naming which member, not as drift.
 *   `--require-both` makes a half-set pair a failure.
 * - A same-name pair is one name read by both runtimes from two files, so it is compared only when
 *   `--deno-file` names the functions' env file, and skipped otherwise.
 * - A run that compared nothing fails.
 * - It never reads the process environment and has no default file.
 *
 * Usage:
 *   node scripts/check-env-pairs-agree.mjs <path-to-env-file> [--deno-file <path>] [--require-both]
 *
 * Exit codes:
 *   0 - every comparable pair agrees, and at least one pair was comparable
 *   1 - a pair disagrees or is half-configured under `--require-both`, no pair was comparable, or a
 *       precondition failure (no argument, an unreadable env file or scan root)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { derivePairs, parseEnvAssignments } from './lib/env-pairs.mjs';

const SELF = 'scripts/check-env-pairs-agree.mjs';

function fail(message) {
  console.error(`[ERROR] ${SELF}: ${message}`);
}

function main() {
  const args = process.argv.slice(2);
  // Opt-in: an unset variable cannot disagree with a set one, and some callers pass a deliberately
  // partial file. `yarn check:env-local` passes it; the bare `check:env-pairs-agree` does not.
  const requireBoth = args.includes('--require-both');
  // The local edge runtime does not inherit the repo-root `.env`; the un-prefixed members live in
  // `apps/supabase/supabase/functions/.env`. With `--deno-file`, each pair's un-prefixed member is
  // read from that file and its `PUBLIC_` member from the primary one, so the comparison spans both.
  const denoFileFlag = args.indexOf('--deno-file');
  const denoFile = denoFileFlag === -1 ? null : args[denoFileFlag + 1];
  if (denoFileFlag !== -1 && (!denoFile || denoFile.startsWith('--'))) {
    fail('`--deno-file` was given without a path. Usage: `--deno-file <path-to-env-file>`.');
    process.exitCode = 1;
    return;
  }
  // The `!== -1` guard is load-bearing: with no flag, `denoFileFlag + 1` is 0, which would exclude
  // argument index 0 — the primary env file itself — and silently break every existing invocation.
  const target = args.find((arg, i) => !arg.startsWith('--') && !(denoFileFlag !== -1 && i === denoFileFlag + 1));
  if (!target) {
    fail(
      'no env file was given. Usage: `node scripts/check-env-pairs-agree.mjs <path-to-env-file>`. ' +
        'There is deliberately no default: defaulting to the operator’s real `.env` would make ' +
        'an accidental invocation open secrets nobody asked it to read.'
    );
    process.exitCode = 1;
    return;
  }

  const derived = derivePairs(fail);
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

  // The un-prefixed members' source: the second file when one was given, the primary otherwise.
  let denoValues = values;
  let denoLines = lines;
  if (denoFile) {
    let denoText;
    try {
      denoText = readFileSync(path.resolve(process.cwd(), denoFile), 'utf8');
    } catch (error) {
      fail(
        `could not read the --deno-file '${denoFile}' (${error.message}). A file this checker cannot ` +
          'read is a set of values it cannot compare — this fails closed rather than reporting agreement.'
      );
      process.exitCode = 1;
      return;
    }
    denoValues = new Map();
    denoLines = new Map();
    for (const entry of parseEnvAssignments(denoText)) {
      denoValues.set(entry.name, entry.value);
      denoLines.set(entry.name, entry.line);
    }
  }
  // The second file is an overlay, not a replacement: an un-prefixed member it does not declare falls
  // back to the primary file, because the edge runtime injects `SUPABASE_URL` and `SUPABASE_ANON_KEY`
  // and the functions' template omits them. So this proves agreement where both files name a twin,
  // not that the functions' file is complete; `scripts/assert-edge-function-env.mjs` checks that.
  // A same-name pair's Deno member is read from the second file alone, since a fallback would
  // compare one assignment with itself.
  const inDeno = ({ name, side, kind }) =>
    Boolean(denoFile) &&
    side === 'deno' &&
    (kind === 'same-name' || (!name.startsWith('PUBLIC_') && denoValues.has(name)));
  const fileOf = (member) => (inDeno(member) ? denoFile : target);
  const valueOf = (member) => (inDeno(member) ? denoValues.get(member.name) : values.get(member.name));
  const lineOf = (member) => (inDeno(member) ? denoLines.get(member.name) : lines.get(member.name));
  const hasOf = (member) => (inDeno(member) ? denoValues.has(member.name) : values.has(member.name));

  let compared = 0;
  let skipped = 0;
  let disagreements = 0;
  let halfConfigured = 0;

  for (const pair of pairs) {
    if (pair.kind === 'same-name' && !denoFile) {
      skipped++;
      console.log(
        `  SKIP ${pair.name}: the frontend server and the Edge Functions read this one name, and ` +
          `'${target}' holds one assignment of it, so there is nothing to compare. Pass ` +
          "--deno-file <functions env file> to compare it with the functions' own value."
      );
      continue;
    }
    const frontendMember = { name: pair.frontend, side: 'frontend', kind: pair.kind };
    const denoMember = { name: pair.deno, side: 'deno', kind: pair.kind };
    const members = [frontendMember, denoMember];
    const unconfigured = members.filter((member) => {
      const value = valueOf(member);
      return value === undefined || value === '';
    });

    if (unconfigured.length > 0) {
      const how = unconfigured.map((member) =>
        hasOf(member)
          ? `${member.name} (set but empty in ${fileOf(member)})`
          : `${member.name} (unset in ${fileOf(member)})`
      );

      // A half-configured pair configures one runtime and leaves the other to fail at request time,
      // so under --require-both it is a failure: "no disagreement" is not "configured".
      if (requireBoth && unconfigured.length < members.length) {
        halfConfigured++;
        const configured = members.filter((member) => !unconfigured.includes(member));
        fail(
          `the cross-runtime pair '${pair.name}' is HALF-CONFIGURED in '${target}': ` +
            `${configured.map((member) => `'${member.name}' (${fileOf(member)} line ${lineOf(member)})`).join(', ')} ` +
            `${configured.length === 1 ? 'is' : 'are'} set, but ${how.join(', ')}. These are two ` +
            'copies of ONE setting, read by two runtimes — the frontend and the Deno Edge Functions — ' +
            'so a half-set pair configures one runtime and leaves the other to fail at request time. ' +
            'Set both members to the same value, or leave both unset. The values are deliberately not printed.'
        );
        continue;
      }

      skipped++;
      console.log(
        `  SKIP ${pair.name}: unconfigured — ${how.join(', ')}. This is NOT drift: a variable that ` +
          'is not set cannot disagree with one that is. Set both members to the same value, or ' +
          'leave both unset, before this pair can be compared.' +
          (requireBoth ? '' : ' Pass --require-both to treat a HALF-set pair as a failure.')
      );
      continue;
    }

    compared++;
    if (valueOf(frontendMember) === valueOf(denoMember)) {
      console.log(`  OK   ${pair.name}: ${pair.frontend} and ${pair.deno} agree.`);
      continue;
    }

    disagreements++;
    // Names only. No value, no prefix, no length, no hash.
    fail(
      `the cross-runtime pair '${pair.name}' has DRIFTED: '${pair.frontend}' (${fileOf(frontendMember)} ` +
        `line ${lineOf(frontendMember)}) and '${pair.deno}' (${fileOf(denoMember)} line ` +
        `${lineOf(denoMember)}) hold different values. They are two copies of one setting, one read by ` +
        'the frontend and one by the Deno Edge Functions, so the two runtimes are now configured ' +
        'differently. The values are deliberately not printed here; open the files and compare the ' +
        'two lines named above.'
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
    process.exitCode = disagreements > 0 || halfConfigured > 0 ? 1 : 0;
  }

  console.log(
    `Cross-runtime env-pair value-agreement checker — env file: '${target}'; ` +
      `pairs derived from source: ${pairs.length}; compared: ${compared}; skipped: ` +
      `${skipped}; half-configured: ${halfConfigured}; disagreements: ${disagreements}` +
      (denoFile
        ? `; un-prefixed members read from '${denoFile}', so this run DID span the two-file deployment shape. `
        : `. This checker sees only the file it was handed: `) +
      'it cannot compare a deployed function config against a separately-configured frontend host.'
  );
}

main();
