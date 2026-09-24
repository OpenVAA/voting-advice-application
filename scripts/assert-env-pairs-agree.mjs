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
  const args = process.argv.slice(2);
  // Opt-in, not the default. A half-set pair is a real misconfiguration under this repository's
  // documented contract ("the two spellings of each MUST HOLD THE SAME VALUE"), but the SKIP
  // message below is also correct on its own terms — an unset variable genuinely cannot disagree
  // with one that is set — and some callers hand this checker a deliberately partial file. The flag
  // makes the stricter reading explicit at the call site instead of changing what existing
  // invocations mean. `yarn lint:check` passes it; the bare `check:env-pairs-agree` does not.
  const requireBoth = args.includes('--require-both');
  // TWO-FILE DEPLOYMENTS. The local edge runtime does not inherit the repo-root `.env`, so the
  // documented Option B keeps the un-prefixed members in `apps/supabase/supabase/functions/.env`
  // while the `PUBLIC_` members stay in the root file. A pair split across two files was invisible to
  // this checker -- its own summary line said so -- and that is exactly where a real drift lived: the
  // frontend minted an authorization request with one client id while the Edge Function verified a
  // different one as `aud`, which surfaced only as `ERR_JWT_CLAIM_VALIDATION_FAILED claim=aud` from
  // inside a container. With `--deno-file`, each pair's un-prefixed member is read from THAT file and
  // its `PUBLIC_` member from the primary one, so the comparison spans the deployment as configured.
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
  // THE SECOND FILE IS AN OVERLAY, NOT A REPLACEMENT, and the distinction is what keeps this honest.
  // An un-prefixed member the deno file does not declare falls back to the primary file, because
  // some twins are never written there on purpose: `SUPABASE_URL` and `SUPABASE_ANON_KEY` are
  // INJECTED by the edge runtime, so `apps/supabase/supabase/functions/.env.example` deliberately
  // omits them, and demanding them would report a misconfiguration that is actually correct.
  //
  // That means THIS script does not prove the function's file is complete — it proves that where both
  // files name a twin, the two agree. Completeness is `scripts/assert-edge-function-env.mjs`'s job:
  // it derives the required set from the function sources and checks that file for missing, empty and
  // unsubstituted-placeholder values. The two together cover the shape; neither does alone, and
  // collapsing them into one would need an allowlist of platform-injected names that this repository
  // has so far managed to avoid.
  const inDeno = (name) => Boolean(denoFile) && !name.startsWith('PUBLIC_') && denoValues.has(name);
  const fileOf = (name) => (inDeno(name) ? denoFile : target);
  const valueOf = (name) => (inDeno(name) ? denoValues.get(name) : values.get(name));
  const lineOf = (name) => (inDeno(name) ? denoLines.get(name) : lines.get(name));
  const hasOf = (name) => (inDeno(name) ? true : values.has(name));

  let compared = 0;
  let skipped = 0;
  let disagreements = 0;
  let halfConfigured = 0;

  for (const pair of pairs) {
    const members = [pair.frontend, pair.deno];
    const unconfigured = members.filter((name) => {
      const value = valueOf(name);
      return value === undefined || value === '';
    });

    if (unconfigured.length > 0) {
      const how = unconfigured.map((name) =>
        hasOf(name) ? `${name} (set but empty in ${fileOf(name)})` : `${name} (unset in ${fileOf(name)})`
      );

      // A pair with one member set and the other not is HALF-CONFIGURED, which is the shape that
      // cost a debug session: PUBLIC_IDENTITY_PROVIDER_TYPE was set and IDENTITY_PROVIDER_TYPE was
      // absent, so the frontend selected a provider the Edge Function then refused to run for —
      // and the value-agreement check above reported SKIP, exit 0. Under --require-both that is a
      // failure, because "no disagreement" is not the same property as "configured".
      if (requireBoth && unconfigured.length < members.length) {
        halfConfigured++;
        const configured = members.filter((name) => !unconfigured.includes(name));
        fail(
          `the cross-runtime pair '${pair.name}' is HALF-CONFIGURED in '${target}': ` +
            `${configured.map((name) => `'${name}' (${fileOf(name)} line ${lineOf(name)})`).join(', ')} ` +
            `${configured.length === 1 ? 'is' : 'are'} set, but ${how.join(', ')}. These are two ` +
            'spellings of ONE setting, read by two runtimes — the frontend reads the PUBLIC_ name, ' +
            'the Deno Edge Functions read the un-prefixed one — so a half-set pair configures one ' +
            'runtime and leaves the other to fail at request time. Set both members to the same ' +
            'value, or leave both unset. The values are deliberately not printed.'
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
    if (valueOf(pair.frontend) === valueOf(pair.deno)) {
      console.log(`  OK   ${pair.name}: ${pair.frontend} and ${pair.deno} agree.`);
      continue;
    }

    disagreements++;
    // Names only. No value, no prefix, no length, no hash — see NON-DISCLOSURE in the docblock.
    fail(
      `the cross-runtime pair '${pair.name}' has DRIFTED: '${pair.frontend}' (${fileOf(pair.frontend)} ` +
        `line ${lineOf(pair.frontend)}) and '${pair.deno}' (${fileOf(pair.deno)} line ` +
        `${lineOf(pair.deno)}) hold different values. They are two spellings of one setting — the frontend ` +
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
    process.exitCode = disagreements > 0 || halfConfigured > 0 ? 1 : 0;
  }

  console.log(
    `Cross-runtime env-pair value-agreement checker (phase 153, plan 10) — env file: '${target}'; ` +
      `pairs derived from source: ${pairs.length}; compared: ${compared}; skipped as unconfigured: ` +
      `${skipped}; half-configured: ${halfConfigured}; disagreements: ${disagreements}` +
      (denoFile
        ? `; un-prefixed members read from '${denoFile}', so this run DID span the two-file deployment shape. `
        : `. This checker sees only the file it was handed: `) +
      'it cannot compare a deployed function config against a separately-configured frontend host.'
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
