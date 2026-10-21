import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Standing assertion that the analytics source never reads a client address or a user agent, and never computes a hash.
 *
 * Usage events must not be joinable to a person. The relay reads a fixed set of request headers and builds every event from scratch; nothing derives an identifier from who sent the request. A hash of address and user agent is the usual way such an identifier creeps back in, so the guard forbids the means of building one as well as the inputs: the client address accessor, the user-agent and forwarded-address headers, and the hashing functions.
 *
 * ## Correctness invariants, each one a distinct way this file could hand back a false pass
 *
 * 1. **The scan must reach real source.** Each of the four roots must yield at least one scanned file, asserted first in its own block. A mis-rooted walk would pass every zero-count check while measuring nothing.
 * 2. **The scan must be able to fail.** The control hands the same scanning function a text that holds a forbidden token and expects it reported.
 * 3. **The exclusion must not widen.** Test files plant these tokens on purpose, and the shared event fixtures are test data. Both are excluded by a rule that is itself asserted, so it cannot silently grow to cover application source.
 *
 * A file under the scanned roots that fails this guard is a defect in that file; the fix is never a wider exclusion.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The frontend source root, resolved from this file's own location so a run from any working directory measures the same set. */
const SOURCE_ROOT = path.resolve(HERE, '..', '..', '..');

/** The directories that hold analytics code, relative to the source root, with forward slashes. */
const SCANNED_ROOTS: ReadonlyArray<string> = [
  'lib/server/analytics',
  'lib/analytics',
  'lib/contexts/app/tracking',
  'routes/api/usage'
];

/** Directory names that never hold hand-written source. */
const PRUNED_DIRECTORIES = new Set(['node_modules', '.svelte-kit', 'paraglide']);

/** The extensions source code can live in. */
const SOURCE_EXTENSIONS = new Set(['.ts', '.svelte', '.js', '.mjs', '.cjs']);

/** The suffix of a test file. */
const TEST_FILE_SUFFIX = '.test.ts';

/** The one non-test module excluded, by its path relative to the source root: the shared event fixtures. */
const EXCLUDED_MODULES: ReadonlyArray<string> = ['lib/analytics/events.fixtures.ts'];

/** The forbidden tokens, by name. Each is matched without regard to case. */
const FORBIDDEN_TOKENS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'the client address accessor', pattern: /getClientAddress/i },
  { name: 'the user-agent header', pattern: /user-agent/i },
  { name: 'the user agent property', pattern: /userAgent/i },
  { name: 'the X-Forwarded-For header', pattern: /x-forwarded-for/i },
  { name: 'the X-Real-IP header', pattern: /x-real-ip/i },
  { name: 'the CF-Connecting-IP header', pattern: /cf-connecting-ip/i },
  { name: 'the True-Client-IP header', pattern: /true-client-ip/i },
  { name: 'a Node hash', pattern: /createHash/i },
  { name: 'a Node HMAC', pattern: /createHmac/i },
  { name: 'a Web Crypto digest', pattern: /subtle\.digest/i }
];

/**
 * Every source file under `absoluteDirectory`, depth first, with pruned names skipped.
 *
 * @param absoluteDirectory - An absolute path to walk.
 * @returns Absolute file paths, each directory's children sorted by name so a run is reproducible.
 */
function walk(absoluteDirectory: string): Array<string> {
  const files: Array<string> = [];
  const entries = fs
    .readdirSync(absoluteDirectory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const child = path.join(absoluteDirectory, entry.name);
    if (entry.isDirectory()) {
      if (!PRUNED_DIRECTORIES.has(entry.name)) files.push(...walk(child));
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(child);
    }
  }
  return files;
}

/**
 * The path a message should print, relative to the source root.
 *
 * @param absolutePath - An absolute path inside the source tree.
 * @returns The path relative to the source root, with forward slashes.
 */
function toSourcePath(absolutePath: string): string {
  return path.relative(SOURCE_ROOT, absolutePath).split(path.sep).join('/');
}

/**
 * Whether a file is left out of the scan: a test file, or one of the listed modules.
 *
 * @param sourcePath - The path relative to the source root, with forward slashes.
 * @returns `true` when the scan skips the file.
 */
function isExcluded(sourcePath: string): boolean {
  return sourcePath.endsWith(TEST_FILE_SUFFIX) || EXCLUDED_MODULES.includes(sourcePath);
}

/**
 * Report every line of a text that holds a forbidden token.
 *
 * @param text - The text to scan.
 * @param label - What the text is, printed at the start of each finding.
 * @returns One finding per line and token, as `label:line: token name`.
 */
function findForbidden(text: string, label: string): Array<string> {
  return text
    .split('\n')
    .flatMap((line, index) =>
      FORBIDDEN_TOKENS.filter(({ pattern }) => pattern.test(line)).map(({ name }) => `${label}:${index + 1}: ${name}`)
    );
}

const WALKED = SCANNED_ROOTS.map((root) => ({ root, files: walk(path.join(SOURCE_ROOT, root)).map(toSourcePath) }));

const SCANNED = WALKED.map(({ root, files }) => ({ root, files: files.filter((file) => !isExcluded(file)) }));

const EXCLUDED = WALKED.flatMap(({ files }) => files.filter(isExcluded));

const FINDINGS = SCANNED.flatMap(({ files }) => files).flatMap((file) =>
  findForbidden(fs.readFileSync(path.join(SOURCE_ROOT, file), 'utf8'), file)
);

describe('the scan is not vacuous', () => {
  it.each(SCANNED_ROOTS)('scans at least one source file under %s', (root) => {
    const scanned = SCANNED.find((entry) => entry.root === root)?.files ?? [];
    expect(
      scanned.length,
      `No source file was scanned under ${root}. Either the walk is mis-rooted or the directory has moved, and this guard has stopped guarding it.`
    ).toBeGreaterThan(0);
  });

  it('excludes only test files and the listed fixture module', () => {
    const unexpected = EXCLUDED.filter((file) => !file.endsWith(TEST_FILE_SUFFIX) && !EXCLUDED_MODULES.includes(file));
    expect(unexpected, 'The exclusion rule covers a file that is neither a test nor a listed fixture.').toEqual([]);
    expect(EXCLUDED_MODULES).toEqual(['lib/analytics/events.fixtures.ts']);
    expect(EXCLUDED).toContain('lib/analytics/events.fixtures.ts');
  });

  it('the exclusion rule keeps application source in the scan', () => {
    expect(isExcluded('lib/server/analytics/relay.ts')).toBe(false);
    expect(isExcluded('lib/analytics/other.fixtures.ts')).toBe(false);
    expect(isExcluded('lib/server/analytics/events.fixtures.ts')).toBe(false);
    expect(isExcluded('routes/api/usage/+server.ts')).toBe(false);
    expect(isExcluded('lib/contexts/app/tracking/trackingService.svelte.ts')).toBe(false);
    expect(isExcluded('lib/server/analytics/relay.test.ts')).toBe(true);
  });
});

describe('the analytics source reads no address and no user agent, and computes no hash', () => {
  it('no scanned file holds a forbidden token', () => {
    expect(
      FINDINGS,
      `These lines read a client address or a user agent, or compute a hash:\n${FINDINGS.join('\n')}\nUsage events must not be joinable to a person; remove the read from the file instead of widening the exclusion.`
    ).toEqual([]);
  });
});

describe('control: the scan can fail', () => {
  it.each(FORBIDDEN_TOKENS.map(({ name }) => name))('reports a fixture that holds %s', (name) => {
    const fixtures: Record<string, string> = {
      'the client address accessor': 'const address = event.getClientAddress();',
      'the user-agent header': "const agent = request.headers.get('User-Agent');",
      'the user agent property': 'const agent = navigator.userAgent;',
      'the X-Forwarded-For header': "request.headers.get('X-Forwarded-For')",
      'the X-Real-IP header': "request.headers.get('X-Real-IP')",
      'the CF-Connecting-IP header': "request.headers.get('CF-Connecting-IP')",
      'the True-Client-IP header': "request.headers.get('True-Client-IP')",
      'a Node hash': "import { createHash } from 'node:crypto';",
      'a Node HMAC': "const mac = createHmac('sha256', salt);",
      'a Web Crypto digest': "await crypto.subtle.digest('SHA-256', bytes);"
    };
    const findings = findForbidden(`const kept = 1;\n${fixtures[name]}\n`, 'fixture.ts');
    expect(findings).toContain(`fixture.ts:2: ${name}`);
  });

  it('reports nothing for a text without a forbidden token', () => {
    expect(findForbidden("const status = request.headers.get('Sec-Fetch-Site');", 'fixture.ts')).toEqual([]);
  });
});
