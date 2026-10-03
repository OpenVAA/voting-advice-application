/**
 * Call-site census: `createServiceRoleClient` is the only supabase-js client construction in `packages/dev-seed/src` and `tests/`.
 *
 * ## Why
 *
 * The locality guard (`src/localSupabaseUrl.ts`) keeps the service-role key away from a non-local Supabase, but only for clients built through `createServiceRoleClient` in `src/supabaseAdminClient.ts`. A spec or helper that calls supabase-js `createClient` itself gets a client the guard never sees, and nothing else goes red when it does. This census fails on that second construction and names the file.
 *
 * ## How the population is derived
 *
 * The files are listed with `git ls-files` at run time, so a new file is counted the moment it is tracked, and nothing here is a hand-maintained list. Comments are stripped before matching, so prose that names `createClient(` neither satisfies nor breaks the census.
 *
 * A construction is a call to `createClient(`, a `new SupabaseClient(`, or an import that renames `createClient`, which would hide a later call from the first pattern. The census runs in this package for the reason its sibling `rpcNullabilityGate.test.ts` gives.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const FACTORY_FILE = 'packages/dev-seed/src/supabaseAdminClient.ts';
const FACTORY_SIGNATURE = 'export function createServiceRoleClient(';
const SCANNED_TREES = ['packages/dev-seed/src', 'tests'];

const CONSTRUCTION_PATTERNS: Array<RegExp> = [
  /\bcreateClient\s*(<[^>]*>)?\s*\(/g,
  /\bnew\s+SupabaseClient\s*(<[^>]*>)?\s*\(/g,
  /\bcreateClient\s+as\s+\w+/g
];

/**
 * Remove `//` and `/* *\/` comments, keeping string and template literals intact so a URL such as `'http://…'` is not cut. Newlines inside removed comments are kept so offsets stay meaningful per line.
 */
function stripComments(source: string): string {
  let out = '';
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        if (source[index] === '\n') out += '\n';
        index += 1;
      }
      index += 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      out += char;
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') {
          out += source[index];
          index += 1;
        }
        out += source[index] ?? '';
        index += 1;
      }
      out += source[index] ?? '';
      index += 1;
      continue;
    }
    out += char;
    index += 1;
  }
  return out;
}

/** The `[start, end)` offsets of the factory's body in the comment-stripped source, by brace matching from its signature. */
function factoryBodyRange(stripped: string): [number, number] {
  const signatureAt = stripped.indexOf(FACTORY_SIGNATURE);
  if (signatureAt === -1) throw new Error(`${FACTORY_FILE} no longer declares '${FACTORY_SIGNATURE}'`);
  // The first `{` after the parameter list's closing `)` and the return-type annotation opens the body.
  const paramsClose = stripped.indexOf(')', signatureAt);
  const open = stripped.indexOf('{', paramsClose);
  let depth = 0;
  for (let index = open; index < stripped.length; index += 1) {
    if (stripped[index] === '{') depth += 1;
    if (stripped[index] === '}') {
      depth -= 1;
      if (depth === 0) return [open, index + 1];
    }
  }
  throw new Error(`could not find the end of createServiceRoleClient's body in ${FACTORY_FILE}`);
}

interface Construction {
  file: string;
  offset: number;
  text: string;
}

function census(): { files: Array<string>; constructions: Array<Construction>; strippedFactoryFile: string } {
  const files = execFileSync('git', ['ls-files', '--', ...SCANNED_TREES.map((tree) => `${tree}/*.ts`)], {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  })
    .split('\n')
    .filter((file) => file.endsWith('.ts'));
  const constructions: Array<Construction> = [];
  let strippedFactoryFile = '';
  for (const file of files) {
    const stripped = stripComments(readFileSync(resolve(REPO_ROOT, file), 'utf8'));
    if (file === FACTORY_FILE) strippedFactoryFile = stripped;
    for (const pattern of CONSTRUCTION_PATTERNS) {
      for (const match of stripped.matchAll(pattern)) {
        constructions.push({ file, offset: match.index ?? -1, text: match[0] });
      }
    }
  }
  return { files, constructions, strippedFactoryFile };
}

describe('service-role client call sites', () => {
  const { files, constructions, strippedFactoryFile } = census();

  it('scans a non-empty population that includes the factory file', () => {
    // Guards against vacuity: a `git ls-files` that matched nothing would make every assertion below pass.
    expect(files.length).toBeGreaterThan(10);
    expect(files).toContain(FACTORY_FILE);
    expect(files.some((file) => file.startsWith('tests/'))).toBe(true);
  });

  it('finds exactly one supabase-js client construction, inside createServiceRoleClient', () => {
    const [start, end] = factoryBodyRange(strippedFactoryFile);
    const outside = constructions.filter(
      (entry) => !(entry.file === FACTORY_FILE && entry.offset >= start && entry.offset < end)
    );
    const offenders = [...new Set(outside.map((entry) => `${entry.file} (${entry.text.trim()})`))];
    expect(
      offenders,
      `build the service-role client with createServiceRoleClient from @openvaa/dev-seed instead: ${offenders.join(', ')}`
    ).toEqual([]);
    expect(constructions).toHaveLength(1);
  });
});
