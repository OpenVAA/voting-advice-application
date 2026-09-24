#!/usr/bin/env node
/**
 * Assert that every environment variable the Edge Functions REQUIRE is declared in the functions'
 * own committed template — and, optionally, in an env file the operator hands it.
 *
 * WHY THIS EXISTS. The local edge runtime does not inherit the repo-root `.env`. Until
 * `apps/supabase/supabase/functions/.env.example` was added beside this check, nothing in the
 * repository listed what that separate file has to contain: the seven-plus required variables were
 * documented only in prose (`tests/IDURA-TEST-RUNBOOK.md` § Step 3) and enforced only at runtime,
 * inside a function whose 500 response is a fixed literal that deliberately names nothing. The
 * observed cost was a full debug session ending in `ERR_ENV_UNCONFIGURED: IDENTITY_PROVIDER_TYPE`
 * read out of a container log — the last of four faults in
 * `.planning/debug/idura-bank-auth-empty-client.md`.
 *
 * WHAT IT ASSERTS, AND WHY IT IS DERIVED RATHER THAN TRANSCRIBED. The required set is read from the
 * function sources at run time, anchored on the two primitives that actually do the enforcing:
 *
 *   - `requireEnv('NAME', …)`            — `functions/identity-callback/envConfig.ts`
 *   - `requireVerifyClaimBinding(a, b)`  — `functions/identity-callback/verifyConfig.ts`, whose two
 *                                          arguments are the audience and issuer reads
 *
 * A transcribed list would be a second source of truth, and this repository has paid for that kind
 * twice over (the JWKS path documented in three places, all wrong). Anchoring on the enforcement
 * call means a newly-required variable is picked up the moment someone wraps it, and a variable that
 * stops being required drops out on its own. It also excludes what must be excluded without an
 * allowlist: `Deno.env.get('SUPABASE_URL')` and `…('SUPABASE_SERVICE_ROLE_KEY')` are injected by the
 * platform and are not wrapped, and the `Deno.env.get('X')` inside `envConfig.ts`'s own docblock is
 * a comment, which the shared comment classifier removes before matching.
 *
 * NON-DISCLOSURE. This checker reports variable NAMES and line numbers only. It never prints a
 * value, a prefix, a length or a hash, from the template or from an operator env file — the same
 * rule `assert-env-pairs-agree.mjs` holds, and for the same reason: the files it reads hold private
 * signing and decryption keys.
 *
 * USAGE
 *   node scripts/assert-edge-function-env.mjs
 *       Assert the committed template declares every required name. This is the `lint:check` form:
 *       it reads only committed files, so it runs anywhere, including CI with no `.env` present.
 *
 *   node scripts/assert-edge-function-env.mjs <path-to-env-file>
 *       Additionally assert that env file declares every required name with a non-empty value.
 *       For the operator's real `apps/supabase/supabase/functions/.env`, run this locally. There is
 *       deliberately no default path: defaulting to a real env file would make an accidental
 *       invocation open secrets nobody asked it to read.
 *
 * EXIT
 *   0 - every required name is declared in the template (and in the env file, when one was given).
 *   1 - a required name is missing, the derivation found nothing to check (an empty instrument must
 *       not report success), or a named precondition failed (unreadable source root, unreadable
 *       template, unreadable env file). Anything this checker cannot read is a property it cannot
 *       verify — it fails closed.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DENO_EXTENSIONS,
  DENO_ROOT,
  commentMapOf,
  enumerateFiles,
  parseEnvAssignments
} from './assert-env-pair-registry.mjs';

const SELF = 'scripts/assert-edge-function-env.mjs';

/** The functions' own committed template — the file this check exists to keep honest. */
const TEMPLATE = path.join('apps', 'supabase', 'supabase', 'functions', '.env.example');

/** `.env.example` has no extension the shared classifier knows; its comments are `#` to EOL. */
const ENV_FAMILY = { hash: true };

/** TypeScript sources: `//` to EOL, `/* … *​/` blocks, and template literals the classifier tracks. */
const TS_FAMILY = { slash: true, blockC: true, template: true };

/**
 * `requireEnv('NAME', …)`. The name is the FIRST argument and is what the throw reports, so it is
 * the authoritative spelling — not the `Deno.env.get(…)` read that usually sits in the second.
 */
const REQUIRE_ENV_RE = /requireEnv\(\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]/g;

/**
 * `requireVerifyClaimBinding(a, b)` — the audience/issuer binding. Its two arguments are environment
 * reads rather than literal names, so the names are captured from the reads INSIDE the call. The
 * `[^)]*` body stops at the first `)`, which is the read's own closing paren, so the pattern is
 * applied iteratively over the call's argument text rather than trying to match the whole call.
 */
const CLAIM_BINDING_CALL_RE = /requireVerifyClaimBinding\(([\s\S]*?)\)\s*;/g;
const DENO_READ_RE = /Deno\.env\.get\(\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\s*\)/g;

/**
 * A value that is still the template's own placeholder rather than a configured one.
 *
 * Both this repository's env templates mark an unfilled value with angle brackets --
 * `<provider-client-id>`, `<your-subdomain>.idura.broker`, `urn:my:application:identifier:<NNN>` --
 * so an unsubstituted copy is detectable without knowing what any real value looks like. This
 * matters because a placeholder is NON-EMPTY: without this predicate an operator who copied the
 * template and filled in nine of ten variables passed the check and then failed at runtime with
 * `ERR_JWT_CLAIM_VALIDATION_FAILED claim=aud`, which names the claim but not the file or the
 * variable. Observed 2026-09-21, one step after this guard was written.
 *
 * Deliberately narrow: only angle-bracketed segments count. A real secret containing `<` is
 * conceivable but would have to be reported as a false positive rather than guessed at here, and the
 * message below says which variable to look at without printing what it holds.
 */
function looksLikePlaceholder(value) {
  return /<[^>]*>/.test(value);
}

function fail(message) {
  console.error(`[ERROR] ${SELF}: ${message}`);
}

/** Replace every comment span with spaces, preserving offsets so line numbers stay true. */
function blankComments(text, family) {
  const map = commentMapOf(text, family);
  if (map.spans.length === 0) return text;
  const chars = [...text];
  for (const [start, end] of map.spans) {
    for (let i = start; i < end && i < chars.length; i++) {
      if (chars[i] !== '\n') chars[i] = ' ';
    }
  }
  return chars.join('');
}

/**
 * Derive the required variable names from the function sources.
 *
 * Returns `{ required: Map<name, sites[]>, filesScanned }`, or `null` on an unreadable root.
 */
function deriveRequired() {
  const files = enumerateFiles(DENO_ROOT, DENO_EXTENSIONS);
  if (files === null) return null;

  // Test files are excluded: a test legitimately wraps a name it is asserting ABOUT (for example
  // `requireEnv('X', undefined)` to observe the throw), and such a name is not a deployment
  // requirement. Including them would make the required set grow with the test suite.
  const sources = files.filter((file) => !/\.test\.ts$/.test(file));

  const required = new Map();
  const note = (name, site) => {
    if (!required.has(name)) required.set(name, []);
    required.get(name).push(site);
  };

  for (const file of sources) {
    let text;
    try {
      text = readFileSync(path.resolve(process.cwd(), file), 'utf8');
    } catch (error) {
      fail(`could not read the function source '${file}' (${error.message}).`);
      return null;
    }
    const code = blankComments(text, TS_FAMILY);
    const rel = file.split(path.sep).join('/');

    for (const match of code.matchAll(REQUIRE_ENV_RE)) {
      note(match[1], `${rel} (requireEnv)`);
    }
    for (const call of code.matchAll(CLAIM_BINDING_CALL_RE)) {
      for (const read of call[1].matchAll(DENO_READ_RE)) {
        note(read[1], `${rel} (requireVerifyClaimBinding)`);
      }
    }
  }

  return { required, filesScanned: sources.length };
}

function readDeclared(target, label) {
  let text;
  try {
    text = readFileSync(path.resolve(process.cwd(), target), 'utf8');
  } catch (error) {
    // `error.message` names the PATH and the errno, never contents — the file was not read.
    fail(
      `could not read the ${label} '${target.split(path.sep).join('/')}' (${error.message}). A file ` +
        'this checker cannot read is a declaration set it cannot verify — this fails closed rather ' +
        'than reporting success.'
    );
    return null;
  }

  const declared = new Map();
  for (const entry of parseEnvAssignments(text)) {
    // A name assigned an EMPTY value is not declared for this purpose: the functions treat `''` as
    // unset (every `requireEnv` read `.trim()`s, and `requireVerifyClaimBinding` tests falsiness),
    // so a bare `NAME=` in a template teaches the reader nothing and in an env file fails at runtime.
    declared.set(entry.name, { value: entry.value, line: entry.line });
  }
  return declared;
}

function main() {
  const envFile = process.argv[2];

  const derived = deriveRequired();
  if (derived === null) {
    process.exitCode = 1;
    return;
  }
  const { required, filesScanned } = derived;

  // EMPTY-INSTRUMENT FLOOR. A refactor that renames or removes the enforcement primitives would
  // leave this check deriving nothing and reporting a clean pass over an empty set. The floor is
  // the repository's standing convention for a derived population, and it is why a green run here
  // means something.
  if (required.size === 0) {
    fail(
      `derived ZERO required variables from ${filesScanned} function source file(s) under ` +
        `${DENO_ROOT.split(path.sep).join('/')}. That is not a pass: this check anchors on ` +
        '`requireEnv(` and `requireVerifyClaimBinding(`, so an empty result means those primitives ' +
        'were renamed, removed, or moved out of the scanned root — and the check is now blind. ' +
        'Re-anchor it on whatever replaced them.'
    );
    process.exitCode = 1;
    return;
  }

  const names = [...required.keys()].sort();

  const template = readDeclared(TEMPLATE, 'functions env template');
  if (template === null) {
    process.exitCode = 1;
    return;
  }

  let violations = 0;

  for (const name of names) {
    const entry = template.get(name);
    if (entry === undefined) {
      violations++;
      fail(
        `'${name}' is REQUIRED by the Edge Functions but is not declared in ` +
          `${TEMPLATE.split(path.sep).join('/')}. It is enforced at ${required.get(name).join(', ')}, ` +
          'which throws ERR_ENV_UNCONFIGURED at request time — and the function returns a fixed ' +
          '"Internal server error" literal that names nothing, so an operator missing this variable ' +
          'gets a 500 with no way to tell which one it was. Add it to the template with a ' +
          'placeholder value and a comment saying where the value comes from.'
      );
      continue;
    }
    if (entry.value === '') {
      violations++;
      fail(
        `'${name}' is declared in ${TEMPLATE.split(path.sep).join('/')} (line ${entry.line}) but ` +
          'assigned an EMPTY value. The functions treat empty as unset, so this declaration does not ' +
          'document anything — give it a placeholder that shows the expected shape.'
      );
    }
  }

  let envChecked = 0;
  let envMissing = 0;
  if (envFile) {
    const actual = readDeclared(envFile, 'env file');
    if (actual === null) {
      process.exitCode = 1;
      return;
    }
    for (const name of names) {
      envChecked++;
      const entry = actual.get(name);
      if (entry === undefined || entry.value === '' || looksLikePlaceholder(entry.value)) {
        envMissing++;
        violations++;
        const how =
          entry === undefined
            ? 'not set'
            : entry.value === ''
              ? 'set but empty'
              : "still the template's unsubstituted placeholder";
        fail(
          `'${name}' is ${how} in '${envFile}', and the Edge Functions require it ` +
            `(${required.get(name).join(', ')}). The local edge runtime does NOT inherit the ` +
            'repo-root `.env`: this file is read only if `supabase start` finds it at ' +
            `${TEMPLATE.replace('.example', '').split(path.sep).join('/')}, or if you pass ` +
            '`--env-file` to `supabase functions serve`. Unset, the request fails with a 500 whose ' +
            'body names nothing.'
        );
      }
    }
  }

  process.exitCode = violations > 0 ? 1 : 0;

  console.log(
    `Edge Function required-env guard — sources scanned: ${filesScanned} file(s) under ` +
      `${DENO_ROOT.split(path.sep).join('/')}; required names derived: ${required.size} ` +
      `(${names.join(', ')}); template: ${TEMPLATE.split(path.sep).join('/')}` +
      (envFile ? `; env file '${envFile}': ${envChecked} checked, ${envMissing} missing` : '') +
      `; violations: ${violations}. Names only — no value, prefix, length or hash is ever printed. ` +
      'Platform-injected reads (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are deliberately outside ' +
      'this set: they are not wrapped in an enforcement call because the runtime supplies them.'
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
