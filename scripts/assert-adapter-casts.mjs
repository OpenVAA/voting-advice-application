#!/usr/bin/env node

/**
 * ADAPTER-BOUNDARY CAST GUARD.
 *
 * The Supabase adapter reads typed JSONB columns through zod `safeParse`, deriving the application
 * value from the validated result. Asserting the generated `Json` type straight into an application
 * shape instead lets a malformed row reach the domain constructors with the compiler silent, because
 * a triple cast through `unknown` is the one assertion TypeScript cannot object to. Over every `.ts`
 * file under `apps/frontend/src/lib/api/adapters/supabase`:
 *
 *   Check 0 — the corpus is real: the directory yields at least one file and contains the three
 *     `ANCHOR_FILES`, so a zero cannot come from scanning nothing.
 *   Check 1 — no line matches `as Json as unknown as`.
 *   Check 2 — none of the literal casts in `REMOVED_CASTS` appears; each was replaced by a parse.
 *   Check 3 — the root `lint:check` chain still contains this guard (membership, never position).
 *
 * Not an ESLint rule, because a `TSAsExpression` selector cannot tell these casts from the
 * legitimate `as const` narrowings and argument widenings in the same files. A regex read, Node
 * built-ins only, so it can gate the build.
 *
 * Usage:
 *   node scripts/assert-adapter-casts.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - a violation, or a precondition failure (the scan directory or a file missing or
 *       unreadable, or the corpus missing an anchor)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listFiles } from './lib/source-files.mjs';

const SELF = 'scripts/assert-adapter-casts.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** The directory whose every `.ts` file is the guarded corpus. */
const ADAPTER_DIR_REL = 'apps/frontend/src/lib/api/adapters/supabase';

/** The root manifest, read for check 3's chain-membership assertion. */
const ROOT_MANIFEST = 'package.json';

/** This guard's own `&&` link, as it must appear in the `lint:check` chain. */
const CHAIN_LINK = 'yarn assert:adapter-casts';

/** This guard's own entry in the root `scripts` block. */
const SCRIPT_NAME = 'assert:adapter-casts';

/**
 * Check 0's anchors. If the corpus does not contain these three files, the directory has been
 * renamed or restructured and this guard is scanning something other than the adapter. Failing
 * loudly is the only honest outcome; reporting zero violations over the wrong corpus is the
 * failure mode check 0 exists to prevent.
 */
const ANCHOR_FILES = [
  'dataProvider/supabaseDataProvider.ts',
  'dataWriter/supabaseDataWriter.ts',
  'adminWriter/supabaseAdminWriter.ts'
];

/**
 * Check 1's pattern. The triple cast through `unknown`, which is the one assertion form
 * TypeScript cannot object to and therefore the one that silently defeats the type system.
 */
const TRIPLE_CAST = /as\s+Json\s+as\s+unknown\s+as/;

/** Check 2's literal cast strings, each of which the adapter now replaces with a parse of the column. */
const REMOVED_CASTS = ['as Partial<DynamicSettings>', 'as AppCustomization', 'as LocalizedAnswers', 'as StoredImage'];

let violations = 0;

/** Record one violation, printed immediately so the whole set is visible in a single run. */
function violate(message) {
  violations += 1;
  console.error(`[VIOLATION] ${message}`);
}

/**
 * Read one file, failing closed. A file this guard cannot read is a file it cannot verify, so an
 * unreadable path is a violation rather than a skip.
 */
function readSource(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    violate(
      `${SELF}: could not read '${relPath}' (${error.message}). ` +
        'A file this guard cannot read is a boundary cast it cannot rule out — this fails closed.'
    );
    return null;
  }
}

/**
 * Every `.ts` file under the adapter directory, repo-relative and sorted, or `null` when the walk
 * fails, which check 0 then reports as a precondition failure.
 */
function collectTypeScriptFiles() {
  try {
    return listFiles(ADAPTER_DIR_REL, { include: (relPath) => relPath.endsWith('.ts') });
  } catch (error) {
    violate(
      `${SELF}: ${error.message}. A directory this guard cannot walk is a corpus it cannot scan — ` +
        'this fails closed.'
    );
    return null;
  }
}

function main() {
  // Check 0: the corpus is real before any zero it produces is allowed to mean anything.
  const files = collectTypeScriptFiles();
  if (files === null) {
    console.log(`Adapter-boundary cast guard — ${violations} violation(s).`);
    process.exitCode = 1;
    return;
  }

  if (files.length === 0) {
    violate(
      `${SELF}: '${ADAPTER_DIR_REL}' contains no '.ts' files, so every check below would report a ` +
        'vacuous zero. Either the adapter moved, in which case update ADAPTER_DIR_REL in this file, ' +
        'or the corpus is genuinely gone, in which case this guard has nothing left to guard.'
    );
  }

  const relativeFiles = files.map((file) => file.slice(ADAPTER_DIR_REL.length + 1));
  for (const anchor of ANCHOR_FILES) {
    if (!relativeFiles.includes(anchor)) {
      violate(
        `${SELF}: the anchor file '${ADAPTER_DIR_REL}/${anchor}' is not in the scanned ` +
          'corpus. This guard is therefore scanning something other than the adapter it was written ' +
          'for, and its zero would be vacuous. Update ANCHOR_FILES in this file when the adapter is ' +
          'deliberately restructured.'
      );
    }
  }

  // Checks 1 and 2 share one pass over the corpus, so every file is read exactly once.
  let linesScanned = 0;
  let filesRead = 0;
  for (const file of files) {
    const source = readSource(file);
    if (source === null) continue;
    filesRead += 1;

    const lines = source.split('\n');
    linesScanned += lines.length;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      if (TRIPLE_CAST.test(line)) {
        violate(
          `${file}:${lineNumber} — a triple cast through 'unknown' asserts an unvalidated JSONB ` +
            `value into an application shape. Parse the stored shape with its zod ` +
            "schema and derive the value from the parse result instead; see 'parseJsonbColumn.ts'.\n" +
            `    ${line.trim()}`
        );
      }

      for (const literal of REMOVED_CASTS) {
        if (line.includes(literal)) {
          violate(
            `${file}:${lineNumber} — the cast '${literal}' asserts a column the adapter validates ` +
              'at the boundary instead. Parse, then derive — do not assert.\n' +
              `    ${line.trim()}`
          );
        }
      }
    });
  }

  // Check 3: chain membership, asserted as a token-set test and never as an index.
  const manifestSource = readSource(ROOT_MANIFEST);
  if (manifestSource !== null) {
    let manifest;
    try {
      manifest = JSON.parse(manifestSource);
    } catch (error) {
      violate(`${SELF}: the root 'package.json' is not valid JSON (${error.message}) — this fails closed.`);
      manifest = null;
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
            `'${CHAIN_LINK}' is no longer one of the '&&' links of the root 'lint:check' chain, so ` +
              'this guard runs nowhere and its green means nothing. Append it back. The assertion is ' +
              'on MEMBERSHIP of the chain, never on position within it, so the link may sit anywhere.'
          );
        }
      }
    }
  }

  console.log(
    `Adapter-boundary cast guard — ${filesRead} file(s), ` +
      `${linesScanned} line(s) scanned under ${ADAPTER_DIR_REL}; ${violations} violation(s).`
  );
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
