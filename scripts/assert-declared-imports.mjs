#!/usr/bin/env node

/**
 * DECLARED-IMPORTS GUARD.
 *
 * Every package a workspace under `packages/` imports from its source must be
 * declared in that workspace's own `dependencies` or `peerDependencies`. Under
 * `nodeLinker: node-modules` an undeclared import still resolves, through a
 * copy some other workspace caused to be hoisted to the root `node_modules`,
 * so it builds and passes its tests here. It breaks, or silently changes
 * version, when that other workspace's manifest changes, when a consumer
 * installs the package on its own, or when a build orders packages by their
 * declared dependencies. `yarn build` is green in exactly the state the defect
 * is live in, which is why the rule is a standing check and not a review note.
 *
 * WHAT IS READ. Each `src/**` file ending in `.ts` that is not a test
 * (`*.test.ts`, `*.spec.ts`) is read as text with its comment text blanked by
 * the shared classifier in `scripts/lib/comment-spans.mjs`, so prose that
 * spells an import is not mistaken for one. Three specifier forms are
 * collected, in single or double quotes and across line breaks:
 *
 *   - `... from '<spec>'` — every static `import` and `export ... from`,
 *     type-only ones included (`import type`, `export type ... from`);
 *   - `import '<spec>'` — a side-effect import;
 *   - `import('<spec>')` — a dynamic import or an inline `import()` type.
 *
 * Each specifier is reduced to its package name (`@openvaa/core/foo` to
 * `@openvaa/core`, `lodash/fp` to `lodash`). A relative or absolute path, a
 * `#` subpath import, a `node:` specifier, a Node built-in module and the
 * workspace's own name are not package imports and are skipped. A type-only
 * import is held to the same rule as any other: the declaration files a
 * consumer's typecheck reads import it too.
 *
 * `devDependencies` do not count. Source under `src/` is what a consumer
 * builds against, and a dev-only declaration is absent from that consumer's
 * install. Test files are skipped for the same reason in reverse: they may
 * import dev-only packages such as `vitest`.
 *
 * Report order is workspace location, then file, then package name, all in
 * byte order, so two runs over an unchanged tree emit byte-identical stderr.
 *
 * Usage:
 *   node scripts/assert-declared-imports.mjs              # check every workspace under packages/
 *   node scripts/assert-declared-imports.mjs --self-test  # check the fixture, compare with its expected findings
 *
 * The self-test fixture is the workspace `scripts/fixtures/declared-imports/`
 * (a manifest and a `src/` tree), and its expected findings are
 * `scripts/fixtures/declared-imports/expected.violations`, one
 * `<file> imports <package>` line each.
 *
 * Exit codes:
 *   0 - every package import is declared; or --self-test passed
 *   1 - at least one undeclared import, a named precondition failure (a
 *       manifest that exists but could not be read or parsed), or a
 *       --self-test difference
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { familyFor, maskComments } from './lib/comment-spans.mjs';

const SELF = 'scripts/assert-declared-imports.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** The directory whose workspaces are checked. */
const SCAN_DIR = 'packages';

const FIXTURE_DIR = 'scripts/fixtures/declared-imports';
const FIXTURE_EXPECTED = `${FIXTURE_DIR}/expected.violations`;

/** The dependency blocks a consumer's install provides. */
const DECLARING_BLOCKS = ['dependencies', 'peerDependencies'];

const BUILTINS = new Set(builtinModules);

/** A quoted module specifier: group 1 (single quotes) or group 2 (double quotes). */
const QUOTED = /(?:'([^'"\s$`{}]+)'|"([^'"\s$`{}]+)")/.source;

/**
 * The three specifier forms. The first two are anchored at the start of a
 * statement, and the clause between `import`/`export` and `from` may not
 * contain a quote or a `;`, so text inside a string or template literal that
 * happens to read `from '<x>'` is not a statement and does not match.
 */
const SPECIFIER_FORMS = [
  new RegExp(/(?:^|[\n;])\s*(?:import|export)\b[^;'"`]*?\bfrom\s*/.source + QUOTED, 'g'),
  new RegExp(/(?:^|[\n;])\s*import\s*/.source + QUOTED, 'g'),
  new RegExp(/(?<![.\w$])import\s*\(\s*/.source + QUOTED, 'g')
];

let violations = 0;

/** Every violation message is a full sentence naming the problem and its consequence. */
function violate(message) {
  violations++;
  console.error(`[ERROR] ${SELF}: ${message}`);
}

/**
 * Fail-closed JSON read: a file that exists but cannot be read or parsed is
 * wiring this guard cannot verify, and the caller turns it into a violation.
 */
function readJson(filePath) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, missing: error.code === 'ENOENT', message: error.message };
  }
}

/** Workspace locations under `SCAN_DIR`, repo-root-relative, in byte order. */
function workspaceLocations() {
  const dir = path.resolve(REPO_ROOT, SCAN_DIR);
  return readdirSync(dir)
    .filter((entry) => existsSync(path.join(dir, entry, 'package.json')))
    .map((entry) => `${SCAN_DIR}/${entry}`)
    .sort();
}

/** The non-test `.ts` files under `dir`, absolute, in byte order. */
function sourceFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(entryPath);
      const name = entry.name;
      return name.endsWith('.ts') && !name.endsWith('.test.ts') && !name.endsWith('.spec.ts') ? [entryPath] : [];
    })
    .sort();
}

/** The package a specifier names, or `null` when it names a path, a subpath import or a built-in. */
function packageName(specifier) {
  if (/^[./#]/.test(specifier) || specifier.startsWith('node:')) return null;
  const segments = specifier.split('/');
  const name = specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
  if (BUILTINS.has(name) || BUILTINS.has(specifier)) return null;
  return name;
}

/**
 * The undeclared imports of the workspace at `location`, as
 * `{ file, pkg }` with `file` repo-root-relative, deduplicated per file.
 */
function checkWorkspace(location) {
  const read = readJson(path.resolve(REPO_ROOT, location, 'package.json'));
  if (!read.ok) {
    violate(
      `could not read or parse '${location}/package.json' (${read.message}). A manifest this guard ` +
        'cannot read is a set of imports it cannot verify — this fails closed.'
    );
    return { files: 0, findings: [] };
  }
  const manifest = read.value;
  const declared = new Set(DECLARING_BLOCKS.flatMap((block) => Object.keys(manifest[block] ?? {})));

  const files = sourceFiles(path.resolve(REPO_ROOT, location, 'src'));
  const findings = [];
  for (const file of files) {
    const relPath = path.relative(REPO_ROOT, file);
    const text = maskComments(readFileSync(file, 'utf8'), familyFor(relPath));
    const undeclared = new Set();
    for (const form of SPECIFIER_FORMS) {
      for (const match of text.matchAll(form)) {
        const pkg = packageName(match[1] ?? match[2]);
        if (pkg && pkg !== manifest.name && !declared.has(pkg)) undeclared.add(pkg);
      }
    }
    for (const pkg of [...undeclared].sort()) findings.push({ location, file: relPath, pkg });
  }
  return { files: files.length, findings };
}

function byteOrder(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function selfTest() {
  const { findings } = checkWorkspace(FIXTURE_DIR);
  const observed = findings.map(({ file, pkg }) => `${file} imports ${pkg}`);
  const expected = readFileSync(path.resolve(REPO_ROOT, FIXTURE_EXPECTED), 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'));
  const missing = expected.filter((line) => !observed.includes(line));
  const unexpected = observed.filter((line) => !expected.includes(line));
  for (const line of missing) console.error(`[ERROR] ${SELF}: self-test expected but did not report: ${line}`);
  for (const line of unexpected) console.error(`[ERROR] ${SELF}: self-test reported but did not expect: ${line}`);
  const ok = violations === 0 && missing.length === 0 && unexpected.length === 0;
  console.log(
    `Declared-imports guard — self-test ${ok ? 'passed' : 'FAILED'}: ${observed.length} finding(s) on the ` +
      `fixture, ${expected.length} expected.`
  );
  process.exitCode = ok ? 0 : 1;
}

function main() {
  const locations = workspaceLocations();
  let fileCount = 0;
  const findings = [];
  for (const location of locations) {
    const result = checkWorkspace(location);
    fileCount += result.files;
    findings.push(...result.findings);
  }

  findings.sort((a, b) => byteOrder(a.location, b.location) || byteOrder(a.file, b.file) || byteOrder(a.pkg, b.pkg));

  for (const { location, file, pkg } of findings) {
    violate(
      `'${file}' imports \`${pkg}\`, but '${location}/package.json' declares it in neither ` +
        '`dependencies` nor `peerDependencies`. It resolves today only through a copy another workspace ' +
        'caused to be hoisted, so it breaks when that manifest changes or when the package is installed alone.'
    );
  }

  console.log(
    `Declared-imports guard — ${locations.length} workspace(s) under ${SCAN_DIR}/ scanned, ${fileCount} ` +
      `source file(s). ${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

const argv = process.argv.slice(2);
if (argv.length === 0) main();
else if (argv.length === 1 && argv[0] === '--self-test') selfTest();
else {
  console.error(`usage: node ${SELF} [--self-test]`);
  process.exitCode = 1;
}
