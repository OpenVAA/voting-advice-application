/**
 * The cross-runtime env-pair derivation and the env-file parser, shared by
 * `scripts/assert-env-pair-registry.mjs`, `scripts/check-env-pairs-agree.mjs` and
 * `scripts/assert-edge-function-env.mjs`, so the three agree on what a pair and an assignment are.
 *
 * A pair is a variable both runtimes read. The Deno side is a `Deno.env.get('NAME')` read in code
 * under `DENO_ROOT`. The frontend side, in code under `FRONTEND_ROOT`, is either the identifier
 * `PUBLIC_NAME` anywhere (a prefixed pair) or `NAME` read as a member of the binding a file imports
 * as `env` from `$env/dynamic/private` (a same-name pair). The prefixed predicate is the bare
 * identifier rather than a read shape, so reading the variable some other way cannot evade it; the
 * conjunction with the Deno read bounds the over-breadth. Matches inside comments are discarded.
 *
 * Node built-ins only, no build step, no dependency.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeMatches, commentMapOf, familyFor } from './comment-spans.mjs';
import { listFiles } from './source-files.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..');

/** The Edge Functions source tree. */
export const DENO_ROOT = 'apps/supabase/supabase/functions';
/** The frontend source tree. */
export const FRONTEND_ROOT = 'apps/frontend/src';

export const DENO_EXTENSIONS = ['.ts'];
const FRONTEND_EXTENSIONS = ['.ts', '.js', '.svelte'];

/** The prefix Vite requires before it exposes a variable to the client bundle. */
const PUBLIC_PREFIX = 'PUBLIC_';

/** An env file has no extension the shared classifier knows; its comments are `#` to end of line. */
const ENV_FAMILY = { hash: true };

/** A Deno environment read, capturing the quoted name. */
const DENO_READ_RE = /Deno\.env\.get\(\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\s*\)/g;

/** An import of `env` from `$env/dynamic/private`, capturing the braces' contents. */
const PRIVATE_ENV_IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*['"]\$env\/dynamic\/private['"]/g;

/** The `env` specifier inside import braces, capturing the local name when it is renamed. */
const ENV_SPECIFIER_RE = /(?:^|,)\s*env(?:\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*))?\s*(?=,|$)/;

/**
 * A whole `PUBLIC_…` identifier, captured with its prefix. The lookbehind stops `MY_PUBLIC_THING`
 * from reading as a public variable; the lookahead stops `PUBLIC_FOOish` from reading as `FOO`.
 */
const PUBLIC_TOKEN_RE = /(?<![A-Za-z0-9_$])(PUBLIC_[A-Z0-9_]*[A-Z0-9])(?![A-Za-z0-9_$])/g;

/** An assignment line in an env file, applied to the code portion of the line only. */
const ASSIGNMENT_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

function defaultFail(message) {
  console.error(`[ERROR] scripts/lib/env-pairs.mjs: ${message}`);
}

function listOrNull(rootRel, extensions, fail) {
  try {
    return listFiles(rootRel, { include: (relPath) => extensions.some((ext) => relPath.endsWith(ext)) });
  } catch (error) {
    fail(`${error.message}. A tree that cannot be enumerated cannot be verified — this fails closed.`);
    return null;
  }
}

function readOrNull(relPath, fail) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    fail(
      `could not read '${relPath}' (${error.message}). A file that cannot be read cannot be verified — this fails closed.`
    );
    return null;
  }
}

/**
 * Every name `matchesOf(text, map)` captures across `files`, outside comments, with the first site
 * each was seen at, or `null` when a file could not be read or has no comment family.
 */
function collectNames(files, matchesOf, fail) {
  const names = new Map();
  let reads = 0;
  for (const rel of files) {
    const text = readOrNull(rel, fail);
    if (text === null) return null;
    const family = familyFor(rel);
    if (!family) {
      fail(
        `no comment family is registered for '${rel}', so code cannot be told from prose in it and a ` +
          'docblock would count as an environment read — this fails closed.'
      );
      return null;
    }
    const map = commentMapOf(text, family);
    for (const hit of matchesOf(text, map)) {
      reads++;
      const name = hit.match[1];
      if (!names.has(name)) names.set(name, `${rel}:${hit.line}`);
    }
  }
  return { names, reads };
}

/**
 * The assignments in an env file, in file order, outside comments.
 *
 * `value` is the raw right-hand side with one layer of matching surrounding quotes removed. It is a
 * secret in the caller's hands: no caller may print it.
 * @param {string} text - The env file's contents.
 * @returns {Array<{ name: string, value: string, line: number }>}
 */
export function parseEnvAssignments(text) {
  const map = commentMapOf(text, ENV_FAMILY);
  const entries = [];

  for (let i = 0; i < map.lines.length; i++) {
    const line = map.lines[i];
    const lineStart = map.lineStarts[i];
    // The code portion of the line is everything before the first comment span that starts on it.
    let codeEnd = line.length;
    for (const [start] of map.spans) {
      if (start >= lineStart && start - lineStart < codeEnd) codeEnd = start - lineStart;
    }
    const code = line.slice(0, codeEnd);
    const match = ASSIGNMENT_RE.exec(code);
    if (!match) continue;

    let value = code.slice(match[0].length).trim();
    if (value.length >= 2 && (value[0] === "'" || value[0] === '"') && value[value.length - 1] === value[0]) {
      value = value.slice(1, -1);
    }
    entries.push({ name: match[1], value, line: i + 1 });
  }

  return entries;
}

/** A regular expression source that matches `text` literally. */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The names a frontend file reads from `$env/dynamic/private` as a member of its local binding of
 * `env`, outside comments, in ascending index order, leaving out the `PUBLIC_` names.
 */
function privateEnvReads(text, map) {
  const bindings = new Set();
  for (const hit of codeMatches(text, PRIVATE_ENV_IMPORT_RE, map)) {
    const specifier = ENV_SPECIFIER_RE.exec(hit.match[1]);
    if (specifier) bindings.add(specifier[1] ?? 'env');
  }
  const reads = [];
  for (const binding of bindings) {
    const readRe = new RegExp(
      `(?<![A-Za-z0-9_$.])${escapeRegExp(binding)}\\s*\\.\\s*([A-Z][A-Z0-9_]*)(?![A-Za-z0-9_$])`,
      'g'
    );
    for (const read of codeMatches(text, readRe, map)) {
      if (!read.match[1].startsWith(PUBLIC_PREFIX)) reads.push(read);
    }
  }
  return reads.sort((a, b) => a.index - b.index);
}

/**
 * The cross-runtime pairs, derived from source.
 *
 * Each pair has a `kind`: `prefixed` when the frontend reads `PUBLIC_NAME`, and `same-name` when the
 * frontend server reads `NAME` itself from `$env/dynamic/private`, in which case `deno` and
 * `frontend` are the same name. A name that is both is reported once, as the prefixed pair.
 * @param {(message: string) => void} [fail] - Reports a precondition failure.
 * @returns The pairs and a census of what was scanned, or `null` when a tree or file could not be read.
 */
export function derivePairs(fail = defaultFail) {
  const denoFiles = listOrNull(DENO_ROOT, DENO_EXTENSIONS, fail);
  const frontendFiles = listOrNull(FRONTEND_ROOT, FRONTEND_EXTENSIONS, fail);
  if (denoFiles === null || frontendFiles === null) return null;

  const deno = collectNames(denoFiles, (text, map) => codeMatches(text, DENO_READ_RE, map), fail);
  const frontend = collectNames(frontendFiles, (text, map) => codeMatches(text, PUBLIC_TOKEN_RE, map), fail);
  const frontendPrivate = collectNames(frontendFiles, privateEnvReads, fail);
  if (deno === null || frontend === null || frontendPrivate === null) return null;

  const pairs = [];
  for (const name of [...deno.names.keys()].sort()) {
    if (frontend.names.has(PUBLIC_PREFIX + name)) {
      pairs.push({
        name,
        kind: 'prefixed',
        deno: name,
        frontend: PUBLIC_PREFIX + name,
        denoSite: deno.names.get(name),
        frontendSite: frontend.names.get(PUBLIC_PREFIX + name)
      });
    } else if (frontendPrivate.names.has(name)) {
      pairs.push({
        name,
        kind: 'same-name',
        deno: name,
        frontend: name,
        denoSite: deno.names.get(name),
        frontendSite: frontendPrivate.names.get(name)
      });
    }
  }

  return {
    pairs,
    census: {
      denoFiles: denoFiles.length,
      frontendFiles: frontendFiles.length,
      denoReads: deno.reads,
      frontendReads: frontend.reads,
      frontendPrivateReads: frontendPrivate.reads
    }
  };
}
