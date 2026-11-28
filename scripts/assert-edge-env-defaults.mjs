#!/usr/bin/env node

/**
 * EDGE-FUNCTION ENVIRONMENT-DEFAULT GUARD.
 *
 * An Edge Function that substitutes a default for a missing environment variable turns
 * misconfiguration into a wrong result instead of a loud failure: a fallback from `SITE_URL` to the
 * API host mails links nobody can open, and a fallback to a seed project id writes rows into the
 * wrong tenant. Two checks over every `.ts` file under `apps/supabase/supabase/functions`:
 *
 *   Check 1 — no `Deno.env.get('X')` read is followed by `??` or `||`, directly or after member
 *     accesses (`.x`, `?.x`, `!.x`, each optionally called with no arguments, as in `?.trim()`).
 *     A default reached through an intermediate variable (`const x = Deno.env.get('X'); x ?? 'y'`)
 *     is out of scope. A missing variable must throw naming it: see `requireEnv` in
 *     `_shared/envConfig.ts`.
 *   Check 2 — a module with a `.test.ts` beside it has no remote import (`http(s)://`, `npm:`,
 *     `jsr:`) and no reference to the `Deno` global, because either makes it unimportable by vitest
 *     and its test stops running.
 *
 * The supabase workspace has no ESLint surface, so this is a text guard. Matches inside comments
 * are ignored through `scripts/lib/comment-spans.mjs`. Check 1's pattern is also run on every
 * invocation against `scripts/fixtures/assert-edge-env-defaults.input.ts`, and the run fails when
 * the flagged lines differ from `assert-edge-env-defaults.expected.violations`. There is no opt-out;
 * excusing a case means editing this file. Node built-ins only.
 *
 * Usage:
 *   node scripts/assert-edge-env-defaults.mjs
 *
 * Exit codes:
 *   0 - both checks clean and the fixture flagged as expected
 *   1 - a violation, a fixture mismatch, or a file or directory this guard could not read
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { codeMatches, commentMapOf } from './lib/comment-spans.mjs';
import { listFiles } from './lib/source-files.mjs';

const SELF = 'scripts/assert-edge-env-defaults.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const FUNCTIONS_DIR = 'apps/supabase/supabase/functions';

const FIXTURE_INPUT = 'scripts/fixtures/assert-edge-env-defaults.input.ts';
const FIXTURE_EXPECTED = 'scripts/fixtures/assert-edge-env-defaults.expected.violations';

/** The comment family for every file this guard reads. They are all TypeScript. */
const TS_FAMILY = { c: true };

// ── Check 1: the environment-default class ────────────────────────────────
// Anchored on the environment read rather than on the start of the assignment, so a fallback chain
// that begins with another operand (`body.id || Deno.env.get('X') || SEED`) is still caught, while
// a default on an ordinary value (`payload.grants || []`) is not.
const ENV_DEFAULT_RE =
  /Deno\.env\.get\(\s*['"`][^'"`]+['"`]\s*\)(?:\s*[?!]?\.\s*[A-Za-z_$][\w$]*(?:\s*\(\s*\))?)*\s*(\?\?|\|\|)/g;

// ── Check 2: the testability contract ─────────────────────────────────────
/** A remote-origin module specifier. `npm:` and `jsr:` are Deno-only resolvers vitest cannot follow either. */
const REMOTE_IMPORT_RE = /from\s*['"`](https?:\/\/|npm:|jsr:)/g;

/** Any reference to the Deno runtime global. A module holding one cannot be imported by vitest. */
const DENO_GLOBAL_RE = /\bDeno\s*\./g;

function fail(message) {
  console.error(`[ERROR] ${SELF}: ${message}`);
}

/** Read a file, or fail closed. */
function readSource(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    fail(
      `could not read '${relPath}' (${error.message}). A file this guard cannot read is a property ` +
        'it cannot verify — this fails closed.'
    );
    return null;
  }
}

/** The non-comment matches of check 1's pattern in `text`. */
function envDefaults(text) {
  return codeMatches(text, ENV_DEFAULT_RE, commentMapOf(text, TS_FAMILY));
}

function main() {
  let files;
  try {
    files = listFiles(FUNCTIONS_DIR, { include: (relPath) => relPath.endsWith('.ts') });
  } catch (error) {
    fail(`${error.message}. A tree this guard cannot enumerate is a tree it cannot verify — this fails closed.`);
    process.exitCode = 1;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    fail(message);
  };

  const sources = new Map();
  for (const rel of files) {
    const text = readSource(rel);
    if (text === null) {
      process.exitCode = 1;
      return;
    }
    sources.set(rel, text);
  }

  // --- Check 1: no environment read followed by a defaulting operator ---
  for (const rel of files) {
    for (const hit of envDefaults(sources.get(rel))) {
      violate(
        `${rel}:${hit.line}: an environment read is followed by '${hit.match[1]}', which silently ` +
          'substitutes a value for missing configuration. A missing variable must fail loudly ' +
          'naming the variable: a default sends links to the wrong host or rows to the wrong tenant ' +
          'and reports no error. Replace the default with a throw naming the variable — see ' +
          '`requireEnv` in `_shared/envConfig.ts`.'
      );
    }
  }

  // --- Check 2: modules with a test beside them stay reachable from vitest ---
  const present = new Set(files);
  for (const rel of files) {
    if (rel.endsWith('.test.ts')) continue;
    if (!present.has(`${rel.slice(0, -'.ts'.length)}.test.ts`)) continue;

    const text = sources.get(rel);
    const map = commentMapOf(text, TS_FAMILY);

    for (const hit of codeMatches(text, REMOTE_IMPORT_RE, map)) {
      violate(
        `${rel}:${hit.line}: this module has a test beside it and now imports from a remote ` +
          'origin. vitest cannot resolve a URL, `npm:` or `jsr:` specifier, so the test file next ' +
          'to it stops being an assertion and becomes an unresolvable import. Keep the module free ' +
          'of remote imports and let the Edge Function entry point hold them.'
      );
    }

    for (const hit of codeMatches(text, DENO_GLOBAL_RE, map)) {
      violate(
        `${rel}:${hit.line}: this module has a test beside it and now references the Deno runtime ` +
          'global. That global does not exist under vitest, so the test beside it stops running. ' +
          'Pass the value in as a parameter instead and let the caller read the environment — the ' +
          'shape `requireEnv(name, value)` exists for exactly this reason.'
      );
    }
  }

  // --- Fixture: check 1's pattern flags exactly the expected lines ---
  const fixture = readSource(FIXTURE_INPUT);
  const expectedText = readSource(FIXTURE_EXPECTED);
  if (fixture === null || expectedText === null) {
    process.exitCode = 1;
    return;
  }
  const observed = envDefaults(fixture).map((hit) => `${FIXTURE_INPUT}:${hit.line}`);
  const expected = expectedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
  const fixtureMatched = observed.join('\n') === expected.join('\n');
  if (!fixtureMatched) {
    violate(
      `check 1 no longer flags '${FIXTURE_INPUT}' as '${FIXTURE_EXPECTED}' records, so its result over ` +
        'the functions tree is not evidence.\n' +
        `    expected: ${expected.join(', ') || '(none)'}\n` +
        `    observed: ${observed.join(', ') || '(none)'}\n` +
        '    If the fixture was edited deliberately, update the expectation in the same change.'
    );
  }

  console.log(
    `Edge-function environment-default guard — files scanned: ${files.length}; checks live: 2 of 2 ` +
      `(env-default; vitest-reachability); fixture flagged ${observed.length} line(s) ` +
      `(${fixtureMatched ? 'matching the committed expectation' : 'NOT matching the committed expectation'}). ` +
      `${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
