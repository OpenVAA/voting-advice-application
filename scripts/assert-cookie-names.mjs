#!/usr/bin/env node

/**
 * COOKIE-NAME GUARD.
 *
 * Every cookie name this application chooses is declared once, in
 * `apps/frontend/src/lib/cookies/index.ts`. A literal name at an operation site can drift from the
 * declared one (a write nobody reads) or collide with another cookie (one silently overwrites the
 * other), and neither fails at compile time or at runtime. This guard flags, in every `.ts` and
 * `.svelte` file under `apps/frontend/src`:
 *
 *   Clause A — a `cookies.get`, `cookies.set` or `cookies.delete` call whose first argument is a
 *     string literal or an interpolation-free template literal, across line breaks.
 *   Clause B — an assignment to `document.cookie` whose right-hand side opens with a literal
 *     rather than an interpolation (the client-side write form).
 *
 * A name passed as an identifier or member expression is not flagged, which is what keeps the
 * Supabase SSR bridge (`apps/frontend/src/lib/supabase/server.ts`) silent: it passes names the
 * library hands it. The guard is keyed on the operation, not on the names, because the names also
 * appear as unrelated OIDC and JSON fields. The collision check is a unit test beside the map,
 * `apps/frontend/src/lib/cookies/cookies.test.ts`.
 *
 * A text read rather than an AST parse, because half the sites are in `.svelte` files. Comments are
 * masked through `scripts/lib/comment-spans.mjs` first. Node built-ins only.
 *
 * Usage:
 *   node scripts/assert-cookie-names.mjs
 *
 * Exit codes:
 *   0 - no cookie name is written as a literal at any operation site
 *   1 - at least one violation, or a directory or file this guard cannot read
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commentMapOf, familyFor, lineNumberOf, maskComments } from './lib/comment-spans.mjs';
import { listFiles } from './lib/source-files.mjs';

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

/** `readFileSync` with its errors routed through `fail()`, so an unreadable file is never read as clean. */
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

/** Every scannable file under `SCAN_ROOT`, sorted. */
function collectFiles() {
  try {
    return listFiles(SCAN_ROOT, {
      include: (relPath) => SCANNED_EXTENSIONS.has(path.extname(relPath)),
      prune: [...PRUNED_DIRS]
    });
  } catch (error) {
    fail(
      `${error.message}, so it cannot be scanned for cookie name literals. A directory this guard ` +
        'cannot read is source it cannot verify, and an unreadable tree is never reported as clean — ' +
        'this fails closed.'
    );
  }
}

function main() {
  const files = collectFiles();

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  for (const relPath of files) {
    const raw = readSource(relPath);
    const family = familyFor(relPath);
    const source = maskComments(raw, family);
    const { lineStarts } = commentMapOf(raw, family ?? {});
    const lineOf = (offset) => lineNumberOf(lineStarts, offset);

    COOKIE_OP_LITERAL.lastIndex = 0;
    for (let match = COOKIE_OP_LITERAL.exec(source); match; match = COOKIE_OP_LITERAL.exec(source)) {
      const operation = match[1];
      const name = match[2] ?? match[3] ?? match[4];
      violate(
        `${relPath}:${lineOf(match.index)} names a cookie with the literal "${name}" as the ` +
          `first argument of a cookies.${operation} call. Every cookie name this application chooses is ` +
          `declared once in apps/frontend/src/lib/cookies/index.ts, and read from there at every ` +
          `operation site, so that two files cannot disagree about a spelling and two cookies cannot ` +
          `silently share a name. Import COOKIE from $lib/cookies and pass the member for this cookie, ` +
          `adding a member if the cookie is new. If the name is not one this application chooses — if it ` +
          `arrives as a value from a library, the way the Supabase SSR bridge's does — then pass the ` +
          `value rather than a literal, and this guard will not see it.`
      );
    }

    DOCUMENT_COOKIE_LITERAL.lastIndex = 0;
    for (let match = DOCUMENT_COOKIE_LITERAL.exec(source); match; match = DOCUMENT_COOKIE_LITERAL.exec(source)) {
      violate(
        `${relPath}:${lineOf(match.index)} writes a cookie from the browser with a hand-written ` +
          `name: the assignment's right-hand side opens with a literal instead of with an interpolation ` +
          `of a declared name. This is the client-side write form, and in this application it is the sole ` +
          `producer of one of the cookies its two server-side readers consume, so a name written here by ` +
          `hand breaks the exchange in one direction only and reports nothing. Import COOKIE from ` +
          `$lib/cookies and open the template with the member for this cookie, leaving the attributes ` +
          `after it untouched.`
      );
    }
  }

  console.log(
    `Cookie-name guard — scanned ${files.length} file(s) under ${SCAN_ROOT}; ` + `${violations} violation(s).`
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
