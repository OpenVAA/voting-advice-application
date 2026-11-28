#!/usr/bin/env node

/**
 * NO-SESSION-IN-SERVER-LOADS GUARD.
 *
 * Everything a server load returns is serialised into the hydration payload in the HTML body, so a
 * load that returns `locals.safeGetSession()`'s `Session` puts the access token and the long-lived
 * refresh token into every page under its route. Nothing else in the tree objects to that: no type
 * error, no failing test, no runtime symptom. The corpus is every `+layout.server.ts` and
 * `+page.server.ts` under `apps/frontend/src/routes`, plus `EXTRA_MODULES`, the shared modules whose
 * functions route files re-export as their `load`.
 *
 *   Check 0 — the corpus is real: at least `CORPUS_FLOOR` route loads, the `ANCHOR_FILES` among
 *     them, every extra module readable, and the fixture directory outside it. If it fails, nothing
 *     else is reported, because a zero over an empty corpus is not evidence.
 *   Check 1 — a binding taken from `safeGetSession()` and returned, in the same block, as a member or
 *     spread of a load's returned object. Matched as a pair: destructuring a session for a guard, or
 *     returning an unrelated `session` member, is legitimate on its own.
 *   Check 2 — `access_token` or `refresh_token` named in code (comments are masked, since the root
 *     loader's docstring names both in prose).
 *   Check 3 — the root `lint:check` chain still contains this guard (membership, never position).
 *
 * `scripts/fixtures/assert-no-session-in-loads.input.ts` is scanned on every run with the same
 * scanner, and the run fails when its flagged lines differ from the committed
 * `.expected.ts.violations` list. A session hidden behind an indirection the scanner cannot follow
 * (a helper outside `EXTRA_MODULES`, a variable chain) is not caught;
 * `apps/frontend/src/lib/server/auth/accountLoads.test.ts` pins the shared projection's key set.
 *
 * A text read rather than an AST parse, comments masked through `scripts/lib/comment-spans.mjs`.
 * Node built-ins only, so it can gate the build.
 *
 * Usage:
 *   node scripts/assert-no-session-in-loads.mjs
 *
 * Exit codes:
 *   0 - the real corpus is clean, and the fixture was flagged exactly as committed
 *   1 - a violation, or a precondition failure (an unreadable tree or file, an empty or anchor-less
 *       corpus, or a fixture whose flagged lines no longer match)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commentMapOf, familyFor, lineNumberOf, maskComments } from './lib/comment-spans.mjs';
import { listFiles } from './lib/source-files.mjs';

const SELF = 'scripts/assert-no-session-in-loads.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** The tree whose server-load modules are the guarded corpus. */
const ROUTES_DIR_REL = 'apps/frontend/src/routes';

/** The two SvelteKit filenames that make a module a SERVER load. Universal loads (`+layout.ts`, `+page.ts`) are out of scope: they have no `event` and so cannot reach `locals.safeGetSession` at all. */
const SERVER_LOAD_FILENAMES = new Set(['+layout.server.ts', '+page.server.ts']);

/**
 * Check 0's floor. Adding loads passes; removing one below the floor fails, so lower the constant in
 * the same change that removes the load and the reduction shows in the diff.
 */
const CORPUS_FLOOR = 10;

/**
 * Modules outside `ROUTES_DIR_REL` that hold server loads route files re-export, relative to the repository root. They are scanned with the same `scanModule` as the route tree, and each is a check-0 anchor: a module that cannot be read fails the run rather than leaving the projection unscanned.
 *
 * `accountLoads.ts` holds `sessionProjectionLoad`, the session projection the outer layouts of the Admin App and the Contestant App re-export as their `load`, and the password-reset load both apps share.
 */
const EXTRA_MODULES = ['apps/frontend/src/lib/server/auth/accountLoads.ts'];

/**
 * Check 0's anchors, relative to `ROUTES_DIR_REL`: the root server loader and the Admin App's and Contestant App's outer layouts. If these are not in the corpus, this guard is scanning something other than the tree it was written for.
 *
 * The two subtree loaders are one-line re-exports of `sessionProjectionLoad`; the projection itself, the body this guard watches, is in `apps/frontend/src/lib/server/auth/accountLoads.ts`, which EXTRA_MODULES brings into the corpus and anchors.
 */
const ANCHOR_FILES = ['+layout.server.ts', 'admin/+layout.server.ts', 'contestant/+layout.server.ts'];

/** The verified-session call. Both halves of check 1's pair are anchored on this identifier. */
const SESSION_CALL = 'safeGetSession';

/** Check 2's field names — the two credentials a `Session` carries. */
const CREDENTIAL_FIELDS = ['access_token', 'refresh_token'];

/** The self-test's fixture pair, and the directory that must stay outside the real corpus. */
const FIXTURE_DIR_REL = 'scripts/fixtures';
const FIXTURE_INPUT_REL = `${FIXTURE_DIR_REL}/assert-no-session-in-loads.input.ts`;
const FIXTURE_EXPECTED_REL = `${FIXTURE_DIR_REL}/assert-no-session-in-loads.expected.ts.violations`;

/** The root manifest, read for check 3's chain-membership assertion. */
const ROOT_MANIFEST_REL = 'package.json';

/** This guard's own `&&` link, as it must appear in the `lint:check` chain, and its own entry in the root `scripts` block. */
const CHAIN_LINK = 'yarn assert:no-session-in-loads';
const SCRIPT_NAME = 'assert:no-session-in-loads';

/**
 * A named precondition failure, thrown rather than exited on.
 *
 * The immediate-exit call does not flush queued writes, and writes to a pipe are asynchronous, so exiting right after printing can drop the message. Setting the exit code and letting the event loop run out exits with the same status and the whole message.
 */
class GuardFailure extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuardFailure';
  }
}

function fail(message) {
  throw new GuardFailure(message);
}

let violations = 0;

/** Record one violation, printed immediately so the whole set is visible in a single run. */
function violate(message) {
  violations += 1;
  console.error(`[ERROR] ${SELF}: ${message}`);
}

function readSource(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    fail(
      `could not read '${relPath}' (${error.message}). A file this guard cannot read is a session ` +
        `it cannot rule out of a document body — this fails closed.`
    );
  }
}

/** Every server-load module under `ROUTES_DIR_REL`, sorted. */
function collectServerLoads() {
  try {
    return listFiles(ROUTES_DIR_REL, {
      include: (relPath) => SERVER_LOAD_FILENAMES.has(path.basename(relPath)),
      prune: ['node_modules', '.svelte-kit']
    });
  } catch (error) {
    fail(
      `${error.message}, so its server loads cannot be scanned. An unreadable tree is never reported ` +
        'as clean — this fails closed.'
    );
  }
}

/**
 * Advance from the index of an opening brace to the index one past its matching close, skipping over string and template bodies so a brace inside a literal cannot unbalance the walk. Returns -1 when the brace never closes.
 */
function matchBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/**
 * Split an object-literal body into its TOP-LEVEL parts, each with its offset inside the body.
 *
 * Depth is tracked across all three bracket families and quotes are skipped, so a comma inside a nested object, a call's argument list or a string does not split a part. Reading top-level parts is what makes check 1 a pair test: a binding mentioned deep inside a computed value is NOT the binding being returned.
 */
function splitTopLevelParts(body) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push({ text: body.slice(start, i), offset: start });
      start = i + 1;
    }
  }
  parts.push({ text: body.slice(start), offset: start });
  return parts.filter((part) => part.text.trim().length > 0);
}

/** The index of a part's top-level `:`, or -1. The FIRST top-level colon is the key separator; a ternary's colon can only come after it, so scanning left to right is correct. */
function topLevelColon(text) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    else if (ch === ':' && depth === 0) return i;
  }
  return -1;
}

/** A word-boundary-safe test for an identifier appearing in a string. JavaScript's `\b` is not identifier-aware for `$`, so the guards are spelled out. */
function mentionsIdentifier(text, identifier) {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`).test(text);
}

/**
 * The innermost `{ ... }` block enclosing `offset`, as `{ start, end }`, or `null` at module top level.
 *
 * This is what makes check 1 scope-aware: without it, a binding destructured in one function would make an unrelated `return { session }` in another function of the same module look like the pair. The fixture's `url.searchParams` negative control covers that case.
 */
function enclosingBlock(masked, offset) {
  const stack = [];
  let quote = null;
  for (let i = 0; i < offset && i < masked.length; i++) {
    const ch = masked[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') stack.push(i);
    else if (ch === '}') stack.pop();
  }
  if (stack.length === 0) return null;
  const start = stack[stack.length - 1];
  const end = matchBrace(masked, start);
  return { start, end: end === -1 ? masked.length : end };
}

/**
 * The bindings a module takes out of the verified-session call, each with the offset it was bound at and the block it is scoped to.
 *
 * Two forms, because a reintroduction can take either:
 *   destructured — `const { session, user } = await locals.safeGetSession()` → the local names,
 *     honouring a rename (`{ session: s }` binds `s`);
 *   whole-result — `const result = await locals.safeGetSession()` → the name, whose `.session`
 *     member is then the credential-bearing value.
 */
function sessionBindings(masked) {
  const destructured = [];
  const wholeResult = [];

  const destructurePattern = new RegExp(
    `(?:const|let|var)\\s*\\{([^{}]*)\\}\\s*=\\s*(?:await\\s+)?[\\w$.]*${SESSION_CALL}\\s*\\(`,
    'g'
  );
  for (let match = destructurePattern.exec(masked); match; match = destructurePattern.exec(masked)) {
    for (const entry of match[1].split(',')) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(':');
      const bound = (colon === -1 ? trimmed : trimmed.slice(colon + 1)).trim().split('=')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(bound)) {
        destructured.push({ name: bound, at: match.index, scope: enclosingBlock(masked, match.index) });
      }
    }
  }

  const wholePattern = new RegExp(
    `(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(?:await\\s+)?[\\w$.]*${SESSION_CALL}\\s*\\(`,
    'g'
  );
  for (let match = wholePattern.exec(masked); match; match = wholePattern.exec(masked)) {
    wholeResult.push({ name: match[1], at: match.index, scope: enclosingBlock(masked, match.index) });
  }

  return { destructured, wholeResult };
}

/**
 * Scan ONE module and return its violations as `{ line, message }`.
 *
 * The same function scans the real corpus and the fixture, so the self-test proves the scanner that actually runs rather than a second implementation of it.
 */
function scanModule(relPath, rawSource) {
  const family = familyFor(relPath);
  const masked = maskComments(rawSource, family);
  const { lineStarts } = commentMapOf(rawSource, family ?? {});
  const lineOf = (offset) => lineNumberOf(lineStarts, offset);
  const found = [];
  const { destructured, wholeResult } = sessionBindings(masked);

  // Check 1 — the destructure-and-return PAIR.
  /** A binding reaches a return only if it was bound BEFORE it and the return sits inside the binding's own block. */
  const inScope = (binding, offset) =>
    binding.at < offset && (binding.scope === null || (offset >= binding.scope.start && offset < binding.scope.end));

  if (destructured.length > 0 || wholeResult.length > 0) {
    const returnPattern = /(?<![\w$])return\s*\{/g;
    for (let match = returnPattern.exec(masked); match; match = returnPattern.exec(masked)) {
      const openIndex = masked.indexOf('{', match.index);
      const closeIndex = matchBrace(masked, openIndex);
      if (closeIndex === -1) continue;
      const bodyStart = openIndex + 1;
      const body = masked.slice(bodyStart, closeIndex - 1);

      for (const part of splitTopLevelParts(body)) {
        const text = part.text.trim();
        const colon = topLevelColon(part.text);
        const value = (colon === -1 ? text : part.text.slice(colon + 1)).trim();
        const key = colon === -1 ? text.replace(/^\.\.\./, '').trim() : part.text.slice(0, colon).trim();
        const line = lineOf(bodyStart + part.offset + (part.text.length - part.text.trimStart().length));

        for (const { name: binding } of destructured.filter((entry) => inScope(entry, match.index))) {
          const returnedDirectly = value === binding || value === `...${binding}`;
          // A re-wrap — `session: { ...session }` — is the same disclosure wearing an object literal, so the spread is matched inside the value as well as at the top level.
          const returnedBySpread = new RegExp(`\\.\\.\\.\\s*${binding}(?![\\w$])`).test(value);
          if (returnedDirectly || returnedBySpread) {
            found.push({
              line,
              message:
                `${relPath}:${line} returns the binding '${binding}', which this module took straight ` +
                `out of '${SESSION_CALL}()', as the '${key || '...spread'}' member of a server load's ` +
                `returned object. Everything a server load returns is serialised into ` +
                `the hydration payload in the HTML body, so this puts an access token and a long-lived ` +
                `REFRESH TOKEN into the document of every page under this route, for every signed-in ` +
                `user. Return the PROJECTION instead — '{ userId, expiresAt }', taking the identifier ` +
                `from the separately VERIFIED user '${SESSION_CALL}()' also returns — exactly as ` +
                `'sessionProjectionLoad' in 'apps/frontend/src/lib/server/auth/accountLoads.ts' does, and read ` +
                `its docstring for the reason.\n    ${text.split('\n')[0].trim()}`
            });
          }
        }

        for (const { name: binding } of wholeResult.filter((entry) => inScope(entry, match.index))) {
          const returnedMember = value === `${binding}.session` || value === `...${binding}`;
          const spreadMember = new RegExp(`\\.\\.\\.\\s*${binding}\\.session(?![\\w$])`).test(value);
          if (returnedMember || spreadMember) {
            found.push({
              line,
              message:
                `${relPath}:${line} returns '${binding}.session' — the whole result of '${SESSION_CALL}()' ` +
                `or its session member — as the '${key || '...spread'}' member of a server load's returned ` +
                `object. It is serialised into the hydration payload in the HTML body, ` +
                `credentials and all. Return the projection '{ userId, expiresAt }' instead.\n    ` +
                `${text.split('\n')[0].trim()}`
            });
          }
        }
      }
    }
  }

  // Check 2 — the spelling backstop, over MASKED source. See this file's docstring: the root server loader names both fields in prose, so an unfiltered scan flags the file that is already correct.
  for (const field of CREDENTIAL_FIELDS) {
    const lines = masked.split('\n');
    lines.forEach((line, index) => {
      if (!mentionsIdentifier(line, field)) return;
      found.push({
        line: index + 1,
        message:
          `${relPath}:${index + 1} names the credential field '${field}' in CODE inside a server load ` +
          `module. A server load's return value is serialised into the HTML body; a ` +
          `credential named here is one edit away from being in it. Naming it in a COMMENT is fine and ` +
          `is deliberately not flagged — the root server loader's docstring explains the whole class in ` +
          `prose. If a credential genuinely must be read server-side, read it somewhere that is not a ` +
          `load, and never return it.\n    ${line.trim()}`
      });
    });
  }

  return found.sort((a, b) => a.line - b.line);
}

function main() {
  // ── Check 0: the corpus is real, before any zero it produces is allowed to mean anything ──
  const routeLoads = collectServerLoads();
  const routeLoadCount = routeLoads.length;
  const corpus = [...routeLoads, ...EXTRA_MODULES];
  const corpusSize = corpus.length;

  // Printed FIRST and unconditionally, so a failing run says how much it looked at too.
  console.log(
    `No-session-in-server-loads guard — corpus: ${routeLoadCount} server-load ` +
      `module(s) under ${ROUTES_DIR_REL} (floor ${CORPUS_FLOOR}) and ${EXTRA_MODULES.length} shared ` +
      `load module(s): ${EXTRA_MODULES.join(', ')}.`
  );

  let corpusIsReal = true;

  if (routeLoadCount === 0) {
    corpusIsReal = false;
    violate(
      `'${ROUTES_DIR_REL}' contains no server-load module, so every check below would report a vacuous ` +
        `zero. Either the route tree moved, in which case update ROUTES_DIR_REL in this file, or the ` +
        `corpus is genuinely gone, in which case this guard has nothing left to guard.`
    );
  } else if (routeLoadCount < CORPUS_FLOOR) {
    corpusIsReal = false;
    violate(
      `'${ROUTES_DIR_REL}' yields ${routeLoadCount} server-load module(s), below the floor of ${CORPUS_FLOOR} ` +
        `measured when this guard was written. Loads have been removed, or the walk is missing part of ` +
        `the tree. Lower CORPUS_FLOOR in the same commit that removes a load, so the reduction is ` +
        `visible in the diff rather than absorbed silently.`
    );
  }

  const corpusRelativeToRoutes = routeLoads.map((file) => file.slice(ROUTES_DIR_REL.length + 1));
  for (const anchor of ANCHOR_FILES) {
    if (!corpusRelativeToRoutes.includes(anchor)) {
      corpusIsReal = false;
      violate(
        `the anchor '${ROUTES_DIR_REL}/${anchor}' is not in the scanned corpus. This guard is ` +
          `therefore scanning something other than the route tree it was written for, and its zero would ` +
          `be vacuous. Update ANCHOR_FILES in this file when the route tree is deliberately restructured.`
      );
    }
  }

  for (const extra of EXTRA_MODULES) {
    try {
      readFileSync(path.resolve(REPO_ROOT, extra), 'utf8');
    } catch (error) {
      corpusIsReal = false;
      violate(
        `the shared load module '${extra}' could not be read (${error.message}). Route files re-export ` +
          `its loads, so leaving it unscanned would let a session return there pass. Update EXTRA_MODULES ` +
          `in this file when the module is deliberately moved or removed.`
      );
    }
  }

  // The fixture's exclusion is ASSERTED, not left to a path convention: a corpus that swallowed the control would report the control as a production violation forever.
  const fixtureInCorpus = corpus.filter((file) => file.startsWith(`${FIXTURE_DIR_REL}/`));
  if (fixtureInCorpus.length > 0) {
    corpusIsReal = false;
    violate(
      `the fixture directory '${FIXTURE_DIR_REL}' is inside the scanned corpus (${fixtureInCorpus.join(', ')}). ` +
        `The fixture is this guard's own negative control and is written in the token-bearing shape on ` +
        `purpose, so a corpus containing it reports the control as a production violation on every run.`
    );
  }

  if (!corpusIsReal) {
    console.error(
      `\n${SELF}: CHECK 0 FAILED — the corpus is not the one this guard was written for, so no result ` +
        `below is evidence. Refusing to report a clean scan over a broken corpus.\n`
    );
    process.exitCode = 1;
    return;
  }

  // ── Checks 1 and 2, one pass over the real corpus ──
  // Counted SEPARATELY from the self-test's and check 3's violations. A summary line that folded a
  // missing chain link into "violations in the real corpus" would report a disclosure that is not
  // there, which is the kind of wrong number a reader acts on.
  let linesScanned = 0;
  let corpusViolations = 0;
  for (const relPath of corpus) {
    const source = readSource(relPath);
    linesScanned += source.split('\n').length;
    for (const finding of scanModule(relPath, source)) {
      corpusViolations += 1;
      violate(finding.message);
    }
  }

  // ── The self-test, in this same invocation ──
  const fixtureSource = readSource(FIXTURE_INPUT_REL);
  const fixtureFindings = scanModule(FIXTURE_INPUT_REL, fixtureSource);
  const observed = fixtureFindings.map((finding) => `${FIXTURE_INPUT_REL}:${finding.line}`);
  const expected = readSource(FIXTURE_EXPECTED_REL)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  let selfTestMatched = true;
  if (observed.length === 0) {
    selfTestMatched = false;
    violate(
      `the fixture '${FIXTURE_INPUT_REL}' was NOT flagged. It is written in the token-bearing shape on ` +
        `purpose, so a scanner that finds nothing in it has stopped working, and the clean result over ` +
        `the real corpus above means nothing. A guard that has never been seen red has not been shown ` +
        `to guard anything.`
    );
  } else if (observed.join('\n') !== expected.join('\n')) {
    selfTestMatched = false;
    violate(
      `the fixture's flagged lines no longer match '${FIXTURE_EXPECTED_REL}'.\n` +
        `    expected: ${expected.join(', ') || '(none)'}\n` +
        `    observed: ${observed.join(', ') || '(none)'}\n` +
        `    If the fixture was edited deliberately, update the expectation in the same commit. Note ` +
        `that 'scripts/fixtures/' is prettier-ignored precisely so a reformat cannot shift these line ` +
        `numbers under a change nobody made.`
    );
  }

  // ── Check 3: chain membership, asserted as a SET operation and never as an index ──
  const manifestSource = readSource(ROOT_MANIFEST_REL);
  let manifest = null;
  try {
    manifest = JSON.parse(manifestSource);
  } catch (error) {
    violate(`the root 'package.json' is not valid JSON (${error.message}) — this fails closed.`);
  }

  if (manifest) {
    const scripts = manifest.scripts ?? {};
    if (typeof scripts[SCRIPT_NAME] !== 'string') {
      violate(
        `the root 'package.json' no longer defines a '${SCRIPT_NAME}' script. Restore ` +
          `"${SCRIPT_NAME}": "node ${SELF}" so the chain has something to call.`
      );
    }
    const lintCheck = scripts['lint:check'];
    if (typeof lintCheck !== 'string') {
      violate(
        "the root 'package.json' no longer defines a 'lint:check' script, so this guard cannot be a member of it."
      );
    } else {
      const links = lintCheck.split('&&').map((link) => link.trim());
      if (!links.includes(CHAIN_LINK)) {
        violate(
          `'${CHAIN_LINK}' is no longer one of the '&&' links of the root 'lint:check' chain, so this ` +
            `guard runs nowhere and its green means nothing. Append it back. The assertion is on ` +
            `MEMBERSHIP of the chain, never on position within it, so the link may sit anywhere.`
        );
      }
    }
  }

  console.log(
    `No-session-in-server-loads guard — ${corpusSize} module(s), ` +
      `${linesScanned} line(s) scanned; ${corpusViolations} violation(s) in the real corpus; ` +
      `self-test flagged ${observed.length} line(s) in ${FIXTURE_INPUT_REL} ` +
      `(${selfTestMatched ? 'matching the committed expectation' : 'NOT matching the committed expectation'}); ` +
      `${violations} violation(s) in total.`
  );
  process.exitCode = violations > 0 ? 1 : 0;
}

try {
  main();
} catch (error) {
  if (!(error instanceof GuardFailure)) throw error;
  console.error(`\nNo-session-in-server-loads guard: ${error.message}\n`);
  process.exitCode = 1;
}
