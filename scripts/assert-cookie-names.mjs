#!/usr/bin/env node

/**
 * COOKIE-NAME GUARD (phase 158, requirement REVIEW-RT-02).
 *
 * The incident this file exists for: the four cookie names this application chooses were
 * spelled out as literals at eighteen read and write sites across six files, and they
 * agreed only by coincidence. Nothing in the tree could tell agreement from luck. Two
 * failure modes follow, and both are silent at compile time and at runtime alike. A
 * seventh file inventing a near-miss spelling writes a cookie nobody reads, so the flow it
 * belongs to fails for one browser on one path with no error anywhere. And two DIFFERENT
 * cookies given the same name are one cookie: the second write overwrites the first, and
 * the reader of the first silently gets the second value. Phase 158 moved every name into
 * `apps/frontend/src/lib/cookies/index.ts`. That move is only worth as much as what stops
 * the next literal from appearing, which is this file, wired into `yarn lint:check`.
 *
 * The collision half of the requirement is NOT here. It is a value assertion over the
 * imported map, not a source shape, and it lives beside the map in
 * `apps/frontend/src/lib/cookies/cookies.test.ts` where it runs under `yarn test:unit`.
 * Nothing requires the two halves to share a mechanism, and forcing them together would
 * mean either importing application source into a guard script or re-implementing the map
 * here, which is the drift the map exists to prevent.
 *
 * TWO clauses, one per syntactic form a cookie name can be written in:
 *
 *   Clause A (REVIEW-RT-02) — a call to `get`, `set` or `delete` on a `cookies` member
 *     expression whose FIRST argument is a string literal, or a template literal with no
 *     interpolation in it. The pattern deliberately tolerates whitespace and newlines
 *     between the opening parenthesis and the name, because the multi-line call form puts
 *     the name on its own line and a single-line pattern would walk straight past it.
 *   Clause B (REVIEW-RT-02) — an assignment to the browser cookie property whose
 *     right-hand side begins with a literal rather than with an interpolation. This is the
 *     client-side write form, and it is invisible to a pattern keyed on the SvelteKit
 *     cookie API alone. In this application it is the ONLY producer of one of the four
 *     cookies, so a guard that misses it misses the site that matters most.
 *
 * THE RULE THAT MAKES BOTH CLAUSES SAFE, and the reason there is no allowlisted path
 * anywhere below: a site is flagged ONLY when the name position holds a literal. An
 * operation whose first argument is an identifier or a member expression is not a
 * declaration of a name and is out of scope by construction. That is what keeps the
 * Supabase SSR bridge in `apps/frontend/src/lib/supabase/server.ts` silent — its set call
 * takes the name the Supabase package hands it, as a value, and this application does not
 * choose those names and so cannot declare them. The exemption is SYNTACTIC, not
 * positional, which matters: a real cookie-name literal planted in that same bridge file
 * is still caught, whereas a path-based exemption would give any literal a place to hide.
 *
 * WHAT THIS GUARD IS DELIBERATELY NOT: it is not keyed on the four names. Three of the
 * four appear in this repository as OIDC and JSON field names in places that have nothing
 * to do with cookies, in the frontend and throughout an Edge Function, so a search for the
 * names themselves reports a crowd of sites that are all correct. The question this guard
 * asks is about the OPERATION, never about the string.
 *
 * It is a plain text read of the source, matching the house style of
 * `scripts/assert-a11y-scan-wiring.mjs` and `scripts/assert-unit-test-coverage.mjs` (Node
 * built-ins only, no build step, no dependency, exit 1 naming the specific problem). It is
 * deliberately NOT an AST parse: half the sites it must reach live in `.svelte` files,
 * which no TypeScript parser reads without a preprocessor, and the shapes it looks for are
 * small and local. Comment text is masked before the scan, through the same shared
 * classifier the comment-hygiene guard uses, so prose that quotes a cookie call is not
 * mistaken for one.
 *
 * Usage:
 *   node scripts/assert-cookie-names.mjs
 *
 * Exit codes:
 *   0 - no cookie name is written as a literal at any operation site
 *   1 - at least one violation, or a named precondition failure (a directory or file this
 *       guard cannot read)
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commentSpans, familyFor } from './lib/comment-spans.mjs';

const SELF = 'scripts/assert-cookie-names.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** The tree that holds every cookie operation this application performs. */
const SCAN_ROOT = 'apps/frontend/src';

/** Extensions worth reading. Both are needed: one of the write forms only ever appears in a component. */
const SCANNED_EXTENSIONS = new Set(['.ts', '.svelte']);

/**
 * Directory names the walk never descends into: a dependency tree, the SvelteKit build output and the generated message catalog. All three are either not this repository's source or a copy of source already scanned, and skipping them is also what keeps the walk cheap enough to sit in front of every `yarn lint:check`.
 */
const PRUNED_DIRS = new Set(['node_modules', '.svelte-kit', 'paraglide']);

/**
 * Clause A. A cookie operation whose first argument is a literal name.
 *
 * The three quote arms are not interchangeable. The single- and double-quoted arms accept any body; the backtick arm accepts a body with no interpolation in it, by refusing a dollar sign that opens one, so a template that computes its name is left alone exactly like an identifier is. The `\s*` after the opening parenthesis is what makes the multi-line call form reachable, since the scan runs over the whole file rather than line by line.
 */
const COOKIE_OP_LITERAL =
  /(?<![\w$])cookies\s*\.\s*(get|set|delete)\s*\(\s*(?:'([^'\\]*)'|"([^"\\]*)"|`((?:[^`\\$]|\$(?!\{))*)`)/g;

/**
 * Clause B. An assignment to the browser cookie property whose right-hand side starts with a literal name.
 *
 * A backtick followed immediately by an interpolation is the fixed form and is the one shape this clause must NOT flag; every other opening is a name written by hand. Compound assignment is included because it is the same write.
 */
const DOCUMENT_COOKIE_LITERAL = /(?<![\w$])document\s*\.\s*cookie\s*\+?=\s*(?:'|"|`(?!\$\{))/g;

/**
 * A named precondition failure, thrown rather than exited on.
 *
 * The immediate-exit call terminates without flushing queued writes, and writes to the standard streams are ASYNCHRONOUS when the target is a pipe, which is every real invocation of this guard. Exiting the moment a message is printed can therefore truncate or drop the guard's error text, which is its entire product, exactly on the runs where there was most to say. Setting the exit code and letting the event loop run out exits with the same status and the whole message. A thrown sentinel also preserves the other property the immediate exit was carrying: this must not RETURN into a caller that would then read an undefined result.
 */
class GuardFailure extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuardFailure';
  }
}

/** Abort with a named failure. Never a raw stack trace: this family fails BY NAME. */
function fail(message) {
  throw new GuardFailure(message);
}

/** `readdirSync` with its filesystem errors routed through `fail()`, so an unreadable tree is never read as a clean one. */
function readDirEntries(relDir) {
  try {
    return readdirSync(path.resolve(REPO_ROOT, relDir), { withFileTypes: true });
  } catch (error) {
    fail(
      `could not read directory '${relDir}' (${error.message}), so it cannot be scanned for cookie ` +
        `name literals. A directory this guard cannot read is source it cannot verify, and an ` +
        `unreadable tree is never reported as clean — this fails closed. Check the path's permissions, ` +
        `and that nothing is deleting or rewriting it while the guard runs.`
    );
  }
}

/** `readFileSync` with the same fail-closed treatment. */
function readSource(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    fail(
      `could not read '${relPath}' (${error.message}). A file this guard cannot read is a cookie ` +
        `operation it cannot see — this fails closed.`
    );
  }
}

/**
 * Every scannable file under `relDir`, in a deterministic order.
 *
 * Entries are sorted before the recursion so that two runs over the same tree report their violations in the same order. Without the sort the order is whatever the filesystem returns, which differs between platforms and can differ between runs on the same platform, and a guard whose output reorders is a guard whose diff is unreadable. Symlinked directories are not followed: `readdirSync` uses lstat semantics, so a link never reports as a directory and the walk never descends into it.
 */
function collectFiles(relDir) {
  const found = [];
  const entries = readDirEntries(relDir).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (PRUNED_DIRS.has(entry.name)) continue;
      found.push(...collectFiles(path.join(relDir, entry.name)));
      continue;
    }
    if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) found.push(path.join(relDir, entry.name));
  }
  return found;
}

/**
 * Blank out comment text, preserving every character position and every line break.
 *
 * The scan then runs over a string whose offsets still map onto the original file, so a violation's line number is the line the reader will open. Masking rather than deleting is what buys that. A comment quoting a cookie call — and this tree contains several, explaining the very failure modes this guard covers — must not be reported as one.
 */
function maskComments(source, relPath) {
  const family = familyFor(relPath);
  if (!family) return source;
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false, lineIndex: 0 };
  const lines = source.split('\n');
  return lines
    .map((line, index) => {
      state.lineIndex = index;
      const spans = commentSpans(line, family, state);
      if (spans.length === 0) return line;
      const chars = [...line];
      for (const [start, end] of spans) {
        for (let i = start; i < end && i < chars.length; i++) chars[i] = ' ';
      }
      return chars.join('');
    })
    .join('\n');
}

/** The 1-based line number of a character offset. */
function lineOf(source, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

function main() {
  const files = collectFiles(SCAN_ROOT);

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  for (const relPath of files) {
    const source = maskComments(readSource(relPath), relPath);

    COOKIE_OP_LITERAL.lastIndex = 0;
    for (let match = COOKIE_OP_LITERAL.exec(source); match; match = COOKIE_OP_LITERAL.exec(source)) {
      const operation = match[1];
      const name = match[2] ?? match[3] ?? match[4];
      violate(
        `${relPath}:${lineOf(source, match.index)} names a cookie with the literal "${name}" as the ` +
          `first argument of a cookies.${operation} call. Every cookie name this application chooses is ` +
          `declared once in apps/frontend/src/lib/cookies/index.ts, and read from there at every ` +
          `operation site, so that two files cannot disagree about a spelling and two cookies cannot ` +
          `silently share a name. Import COOKIE from $lib/cookies and pass the member for this cookie, ` +
          `adding a member if the cookie is new. If the name is not one this application chooses — if it ` +
          `arrives as a value from a library, the way the Supabase SSR bridge's does — then pass the ` +
          `value rather than a literal, and this guard will not see it (REVIEW-RT-02).`
      );
    }

    DOCUMENT_COOKIE_LITERAL.lastIndex = 0;
    for (let match = DOCUMENT_COOKIE_LITERAL.exec(source); match; match = DOCUMENT_COOKIE_LITERAL.exec(source)) {
      violate(
        `${relPath}:${lineOf(source, match.index)} writes a cookie from the browser with a hand-written ` +
          `name: the assignment's right-hand side opens with a literal instead of with an interpolation ` +
          `of a declared name. This is the client-side write form, and in this application it is the sole ` +
          `producer of one of the cookies its two server-side readers consume, so a name written here by ` +
          `hand breaks the exchange in one direction only and reports nothing. Import COOKIE from ` +
          `$lib/cookies and open the template with the member for this cookie, leaving the attributes ` +
          `after it untouched (REVIEW-RT-02).`
      );
    }
  }

  console.log(
    `Cookie-name guard (phase 158: REVIEW-RT-02) — scanned ${files.length} file(s) under ${SCAN_ROOT}; ` +
      `${violations} violation(s).`
  );

  // One severity, no warning tier. `process.exitCode` rather than the immediate-exit call, for the reason recorded on `GuardFailure` above.
  process.exitCode = violations > 0 ? 1 : 0;
}

try {
  main();
} catch (error) {
  // Named precondition failures print here, once, and set the same status a violation does. Anything else is a genuine defect in this guard and is allowed to surface as it is, rather than be dressed up as an invariant violation.
  if (!(error instanceof GuardFailure)) throw error;
  console.error(`\nCookie-name guard: ${error.message}\n`);
  process.exitCode = 1;
}
