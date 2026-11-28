#!/usr/bin/env node

/**
 * DECLARED-BINARIES GUARD.
 *
 * A workspace that runs a binary it does not declare builds only because `nodeLinker:
 * node-modules` hoists another workspace's copy onto PATH. A change of install topology, or moving
 * the package to its own repository, then breaks its build with an error that names PATH rather
 * than the missing declaration. This guard asserts, for every workspace including the root, that
 * every binary invoked from a script in `SCRIPT_SCOPE` is provided by the `bin` field of a package
 * that workspace itself declares in `dependencies`, `devDependencies`, `peerDependencies` or
 * `optionalDependencies`.
 *
 * Each binary is resolved against the `bin` field a declared dependency publishes, not matched by
 * name (`tsc` comes from `typescript`, `svelte-kit` from `@sveltejs/kit`), so a declared invocation
 * is never reported. Not treated as declarable: a token containing `/` (an explicit path), a token
 * in the `AMBIENT` list (package managers, interpreters, POSIX utilities and builtins), and a token
 * naming one of the workspace's own scripts. `SCRIPT_SCOPE` is `['build']`; widening it to every
 * script surfaces `eslint` invocations that reach the binary through `@openvaa/shared-config`.
 *
 * Reports are ordered by workspace location, binary and script, so two runs over an unchanged tree
 * print the same output. Node built-ins only.
 *
 * Usage:
 *   node scripts/assert-declared-binaries.mjs
 *
 * Exit codes:
 *   0 - every in-scope binary invocation is backed by a declaration
 *   1 - at least one undeclared invocation, or a manifest that exists but could not be read or parsed
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-declared-binaries.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/**
 * The scripts whose invocations are checked. Widening this to
 * `Object.keys(scripts)` surfaces the `eslint` invocations described in the docblock.
 */
const SCRIPT_SCOPE = ['build'];

/**
 * Tokens that name something every developer machine and CI image already
 * provides, so no workspace can meaningfully "declare" them: package managers
 * and interpreters first, then POSIX coreutils and shell builtins.
 */
const AMBIENT = new Set([
  'yarn',
  'npm',
  'npx',
  'pnpm',
  'node',
  'sh',
  'bash',
  'zsh',
  'env',
  'exec',
  'echo',
  'printf',
  'cat',
  'cd',
  'cp',
  'mv',
  'rm',
  'mkdir',
  'rmdir',
  'touch',
  'ln',
  'chmod',
  'ls',
  'find',
  'xargs',
  'test',
  '[',
  'true',
  'false',
  'set',
  'export',
  'pwd',
  'sleep',
  'sed',
  'awk',
  'grep',
  'egrep',
  'tr',
  'cut',
  'sort',
  'uniq',
  'wc',
  'head',
  'tail',
  'tee',
  'which',
  'dirname',
  'basename'
]);

const DEPENDENCY_BLOCKS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

let violations = 0;

/** Every violation message is a full sentence naming the problem and its consequence. */
function violate(message) {
  violations++;
  console.error(`[ERROR] ${SELF}: ${message}`);
}

/**
 * Fail-closed JSON read. A file that is absent is a fact the caller may
 * legitimately act on (an uninstalled optional dependency is not a defect); a
 * file that exists but cannot be read or parsed is wiring this guard cannot
 * verify, and the caller turns that into a named violation.
 */
function readJson(filePath) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, missing: error.code === 'ENOENT', message: error.message };
  }
}

/**
 * Workspace locations, repo-root-relative, derived from the root manifest's
 * own `workspaces` entries rather than a hard-coded `apps`/`packages` pair, plus
 * `.` for the root itself. A `<dir>/*` glob expands to each child carrying a
 * `package.json`; a bare single-segment entry such as `scripts` is one
 * workspace. Reports are keyed on LOCATION and never on `name`:
 * the root manifest declares no `name` and would print `undefined`.
 */
function workspaceLocations(rootManifest) {
  const locations = ['.'];
  for (const glob of rootManifest.workspaces ?? []) {
    const segments = glob.split('/');
    if (segments.length === 1 && !glob.includes('*')) {
      if (existsSync(path.resolve(REPO_ROOT, glob, 'package.json'))) locations.push(glob);
      continue;
    }
    if (segments.length !== 2 || segments[1] !== '*') {
      violate(
        `the root manifest's workspaces glob '${glob}' is not of the '<dir>/*' form this guard knows how ` +
          'to expand, nor a bare single-directory entry. A workspace this guard cannot enumerate is a workspace it cannot check — this fails closed.'
      );
      continue;
    }
    const dir = path.resolve(REPO_ROOT, segments[0]);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir).sort()) {
      if (existsSync(path.join(dir, entry, 'package.json'))) locations.push(`${segments[0]}/${entry}`);
    }
  }
  return locations.sort();
}

/**
 * The binaries a script value invokes by PATH lookup. Segments are split on
 * the shell control operators and newlines; parentheses are stripped; leading
 * `VAR=value` assignments and leading `-`-prefixed flags are skipped; the
 * first surviving token of each segment is the invoked binary. Tokens
 * containing `/`, ambient tokens, and the workspace's own script names are
 * discarded. A missing, empty or whitespace-only value yields nothing rather
 * than throwing.
 */
function invokedBinaries(scriptValue, ownScriptNames) {
  if (typeof scriptValue !== 'string' || scriptValue.trim() === '') return [];
  const found = new Set();
  for (const segment of scriptValue.replace(/[()]/g, ' ').split(/&&|\|\||[|;&\n]/)) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    let index = 0;
    while (index < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[index]) || tokens[index].startsWith('-'))) {
      index++;
    }
    const binary = tokens[index];
    if (!binary) continue;
    if (binary.includes('/')) continue;
    if (AMBIENT.has(binary)) continue;
    if (ownScriptNames.has(binary)) continue;
    found.add(binary);
  }
  return [...found];
}

/**
 * The `bin` names one declared dependency provides to one workspace. The
 * workspace's own `node_modules` is consulted first, then the hoisted root
 * copy. `bin` in string form publishes the package's unscoped name; in object
 * form it publishes its keys.
 */
function binNamesProvidedBy(location, depName) {
  const candidates = [
    path.resolve(REPO_ROOT, location, 'node_modules', depName, 'package.json'),
    path.resolve(REPO_ROOT, 'node_modules', depName, 'package.json')
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const read = readJson(candidate);
    if (!read.ok) {
      if (read.missing) continue;
      violate(
        `'${path.relative(REPO_ROOT, candidate)}' exists but could not be read or parsed (${read.message}). ` +
          'A dependency manifest this guard cannot read is a `bin` field it cannot credit — this fails closed.'
      );
      return [];
    }
    const bin = read.value.bin;
    if (typeof bin === 'string') return [depName.startsWith('@') ? depName.split('/')[1] : depName];
    if (bin && typeof bin === 'object') return Object.keys(bin);
    return [];
  }
  return [];
}

function main() {
  const rootRead = readJson(path.resolve(REPO_ROOT, 'package.json'));
  if (!rootRead.ok) {
    console.error(
      `[ERROR] ${SELF}: could not read the root 'package.json' (${rootRead.message}). Without it there is ` +
        'no workspace list to walk — this fails closed.'
    );
    process.exitCode = 1;
    return;
  }

  const locations = workspaceLocations(rootRead.value);
  let invocations = 0;
  const findings = [];

  for (const location of locations) {
    const manifestPath = path.resolve(REPO_ROOT, location, 'package.json');
    const read = readJson(manifestPath);
    if (!read.ok) {
      violate(
        `could not read or parse '${location}/package.json' (${read.message}). A manifest this guard ` +
          'cannot read is a set of invocations it cannot verify — this fails closed.'
      );
      continue;
    }
    const manifest = read.value;
    const scripts = manifest.scripts ?? {};
    const ownScriptNames = new Set(Object.keys(scripts));

    const provided = new Set();
    for (const block of DEPENDENCY_BLOCKS) {
      for (const depName of Object.keys(manifest[block] ?? {})) {
        for (const binName of binNamesProvidedBy(location, depName)) provided.add(binName);
      }
    }

    for (const scriptName of SCRIPT_SCOPE) {
      for (const binary of invokedBinaries(scripts[scriptName], ownScriptNames)) {
        invocations++;
        if (!provided.has(binary)) findings.push({ location, scriptName, binary });
      }
    }
  }

  findings.sort(
    (a, b) =>
      (a.location < b.location ? -1 : a.location > b.location ? 1 : 0) ||
      (a.binary < b.binary ? -1 : a.binary > b.binary ? 1 : 0) ||
      (a.scriptName < b.scriptName ? -1 : a.scriptName > b.scriptName ? 1 : 0)
  );

  for (const { location, scriptName, binary } of findings) {
    violate(
      `'${location}' invokes \`${binary}\` in its \`${scriptName}\` script, but no dependency that ` +
        `workspace declares provides a \`bin\` named \`${binary}\`. It resolves today only because the ` +
        'root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs ' +
        'is one install-topology change from a broken build.'
    );
  }

  console.log(
    `Declared-binaries guard — ${locations.length} workspace(s) scanned, ` +
      `${invocations} ${SCRIPT_SCOPE.join('/')}-script binary invocation(s). ${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
