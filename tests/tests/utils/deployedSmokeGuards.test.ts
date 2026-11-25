import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Guards on the deployed smoke entry, the second Playwright configuration that drives a hosted deployment.
 *
 * The entry must hold no service-role client, load no environment file and never carry the remote-seed switch, and its configuration must stay read-mostly: one project, no setup or teardown, no retries. Each guard is a unit test, run by `yarn test:unit`, for a reason lint cannot cover:
 *
 *   - `tests/playwright.deployed.config.ts` is outside lint (the `playwright*` ignore of `tests/eslint.config.mjs`), so its text and its shape are checked here.
 *   - The `@typescript-eslint/no-restricted-imports` lock on the smoke files sees direct imports only; a shared fixture that value-imported a service-role client would pull it in unseen. The walk below follows the whole value-import closure.
 *   - The scan of `.github/` covers every workflow, including the ones added after this file, so a workflow that sets `DEV_SEED_ALLOW_REMOTE` fails the unit gate.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const TESTS_ROOT = path.join(REPO_ROOT, 'tests');
const DEPLOYED_DIR = path.join(TESTS_ROOT, 'tests', 'deployed');
const GITHUB_DIR = path.join(REPO_ROOT, '.github');
/** The shared voter-walk fixture. The voter spec imports its answer loop, and its consent-granting handler is installed by `walkUntilQuestionsIntro` alone. */
const VOTER_JOURNEY_FIXTURE = 'tests/tests/fixtures/voter/voter-journey.fixture.ts';

/** The remote-seed switch, in its environment, flag and option spellings. */
const REMOTE_SEED_SWITCH = /DEV_SEED_ALLOW_REMOTE|allow-remote|allowRemote/;
/** The environment-file loader. */
const ENV_FILE_LOADER = /dotenv/;

/** Base names of the modules that create a service-role client or point one at a database. */
const FORBIDDEN_FILE_NAMES = new Set([
  'supabaseAdminClient.ts',
  'authApi.ts',
  'accountAccessClient.ts',
  'localSupabaseUrl.ts'
]);
/** Root-relative paths of modules that re-export a service-role client. */
const FORBIDDEN_FILES = new Set(['packages/dev-seed/src/index.ts']);
/**
 * Packages that create a Supabase client or load an environment file, and every workspace package: the deploy job runs the smoke without building the workspace, so a value import of one resolves to a `dist` that is not there.
 */
const FORBIDDEN_PACKAGES = /^(@openvaa\/[^/]+|@supabase\/supabase-js|@supabase\/ssr|dotenv)(\/.*)?$/;

type TokenFinding = {
  /** One-based line number. */
  line: number;
  token: string;
};

type ImportChain = Array<string>;

type ImportWalk = {
  /** Directory the chains are reported relative to. */
  root: string;
  /** Every file reached, with the chain of absolute paths that reached it first. */
  reached: Map<string, ImportChain>;
  /** Every bare specifier met, with the chain of the file that imports it. */
  bare: Array<{ specifier: string; chain: ImportChain }>;
  /** Every relative specifier that resolves to no file, with the chain of the file that imports it. */
  unresolved: Array<{ specifier: string; chain: ImportChain }>;
};

/** Extensions of the files whose imports the walk reads; any other reached file is recorded and not parsed. */
const PARSED_EXTENSIONS = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.svelte']);

/**
 * A static `import` or `export … from` at the start of a line: an optional `type` keyword, an optional clause ending in `from`, and the quoted specifier. The clause holds no semicolon, quote, parenthesis or `=`, so it cannot run on from one statement into the next.
 */
const STATIC_IMPORT = /^[ \t]*(?:import|export)\s+(type\s+)?(?:[^;'"`()=]*?\bfrom\s*)?['"]([^'"\n]+)['"]/gm;
/** A dynamic `import('…')` that is not a `typeof import('…')` type query. */
const DYNAMIC_IMPORT = /(?<!typeof\s+)\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g;
/** Block comments that open a line, and line comments that open a line or follow whitespace. */
const COMMENTS = [/^[ \t]*\/\*[\s\S]*?\*\//gm, /(^|\s)\/\/.*$/gm];

/** Every file under `dir`, recursively, as sorted absolute paths. */
function listFiles(dir: string): Array<string> {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : [full];
    })
    .sort();
}

/** The deployed config, its global setup, the gate module and every file under `tests/tests/deployed/`. */
function smokeEntryFiles(): Array<string> {
  return [
    path.join(TESTS_ROOT, 'playwright.deployed.config.ts'),
    path.join(TESTS_ROOT, 'deployed-global-setup.ts'),
    path.join(TESTS_ROOT, 'tests', 'utils', 'deployedTarget.ts'),
    ...listFiles(DEPLOYED_DIR)
  ];
}

/** One finding per line of `text` that matches `pattern`. */
function scanForTokens(text: string, pattern: RegExp): Array<TokenFinding> {
  return text.split('\n').flatMap((content, index) => {
    const match = pattern.exec(content);
    return match ? [{ line: index + 1, token: match[0] }] : [];
  });
}

/** `text` without the comments `COMMENTS` matches. */
function withoutComments(text: string): string {
  return COMMENTS.reduce((stripped, comment) => stripped.replace(comment, '$1'), text);
}

/** The specifiers `text` imports or re-exports as values, static and dynamic; `import type` and `export type` are skipped. */
function valueImportSpecifiers(text: string): Array<string> {
  const code = withoutComments(text);
  const staticSpecifiers = [...code.matchAll(STATIC_IMPORT)]
    .filter(([, typeKeyword]) => !typeKeyword)
    .map(([, , specifier]) => specifier);
  const dynamicSpecifiers = [...code.matchAll(DYNAMIC_IMPORT)].map(([, specifier]) => specifier);
  return [...staticSpecifiers, ...dynamicSpecifiers];
}

/** The file a relative specifier names: as written, then with `.ts`, `/index.ts`, `.mjs` or `.js`. */
function resolveRelative(fromFile: string, specifier: string): string | undefined {
  const base = path.resolve(path.dirname(fromFile), specifier);
  return [base, `${base}.ts`, path.join(base, 'index.ts'), `${base}.mjs`, `${base}.js`].find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  );
}

/** A breadth-first walk over the relative value imports of `entries`; bare specifiers are recorded and not followed. */
function walkValueImports(entries: Array<string>, root: string): ImportWalk {
  const walk: ImportWalk = { root, reached: new Map(), bare: [], unresolved: [] };
  const queue = entries.map((entry) => path.resolve(entry));
  for (const entry of queue) walk.reached.set(entry, [entry]);
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    const file = next;
    const chain = walk.reached.get(file) ?? [file];
    if (!PARSED_EXTENSIONS.has(path.extname(file))) continue;
    for (const specifier of valueImportSpecifiers(fs.readFileSync(file, 'utf8'))) {
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
        walk.bare.push({ specifier, chain });
        continue;
      }
      const resolved = resolveRelative(file, specifier);
      if (resolved === undefined) {
        walk.unresolved.push({ specifier, chain });
      } else if (!walk.reached.has(resolved)) {
        walk.reached.set(resolved, [...chain, resolved]);
        queue.push(resolved);
      }
    }
  }
  return walk;
}

/** Every chain of `walk` that reaches a forbidden module or package, or a relative specifier that resolves to nothing. */
function forbiddenReach(walk: ImportWalk): Array<string> {
  const show = (chain: ImportChain): string => chain.map((file) => path.relative(walk.root, file)).join(' → ');
  const forbiddenFiles = [...walk.reached.values()]
    .filter((chain) => {
      const file = chain[chain.length - 1];
      return FORBIDDEN_FILE_NAMES.has(path.basename(file)) || FORBIDDEN_FILES.has(path.relative(walk.root, file));
    })
    .map(show);
  const forbiddenPackages = walk.bare
    .filter(({ specifier }) => FORBIDDEN_PACKAGES.test(specifier))
    .map(({ specifier, chain }) => `${show(chain)} → ${specifier}`);
  const unresolved = walk.unresolved.map(({ specifier, chain }) => `${show(chain)} → ${specifier} (unresolved)`);
  return [...forbiddenFiles, ...forbiddenPackages, ...unresolved];
}

/** Every index at which `needle` begins in `text`. */
function indicesOf(text: string, needle: string): Array<number> {
  const found: Array<number> = [];
  for (let index = text.indexOf(needle); index !== -1; index = text.indexOf(needle, index + 1)) found.push(index);
  return found;
}

/**
 * The span of the braces that open at the first `{` after `anchor` in `text`, from that brace to the one that closes it, or undefined when `text` holds no such pair.
 *
 * It counts braces only, so it serves an anchor whose own text up to the brace holds none, such as a function declared with plain parameters.
 */
function braceSpan(text: string, anchor: string): { open: number; close: number } | undefined {
  const at = text.indexOf(anchor);
  const open = at === -1 ? -1 : text.indexOf('{', at + anchor.length);
  if (open === -1) return undefined;
  let depth = 0;
  for (let index = open; index < text.length; index++) {
    if (text[index] === '{') depth++;
    else if (text[index] === '}' && --depth === 0) return { open, close: index };
  }
  return undefined;
}

function tokenFindingsIn(files: Array<string>, pattern: RegExp): Array<string> {
  return files.flatMap((file) =>
    scanForTokens(fs.readFileSync(file, 'utf8'), pattern).map(
      ({ line, token }) => `${path.relative(REPO_ROOT, file)}:${line} ${token}`
    )
  );
}

const tempDirs: Array<string> = [];

/** Writes `files` into a new temporary directory and returns it. */
function writeTree(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deployed-smoke-guards-'));
  tempDirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('the token scan', () => {
  it('finds the remote-seed switch in each of its spellings, with its line', () => {
    expect(scanForTokens('name: seed\nenv:\n  DEV_SEED_ALLOW_REMOTE=1\n', REMOTE_SEED_SWITCH)).toEqual([
      { line: 3, token: 'DEV_SEED_ALLOW_REMOTE' }
    ]);
    expect(scanForTokens('yarn db:seed --allow-remote\n', REMOTE_SEED_SWITCH)).toEqual([
      { line: 1, token: 'allow-remote' }
    ]);
    expect(scanForTokens('const options = {\n  allowRemote: true\n};\n', REMOTE_SEED_SWITCH)).toEqual([
      { line: 2, token: 'allowRemote' }
    ]);
  });

  it('finds nothing in a clean text', () => {
    expect(scanForTokens('name: smoke\nrun: yarn test:e2e:deployed\n', REMOTE_SEED_SWITCH)).toEqual([]);
  });

  it('finds no remote-seed switch under .github/ or in the smoke entry, and no env-file loader in the entry', () => {
    const entry = smokeEntryFiles();
    expect(entry.map((file) => path.basename(file))).toEqual(
      expect.arrayContaining(['voter.smoke.ts', 'contestant.smoke.ts', 'caller-limit.smoke.ts', 'smokeContent.ts'])
    );
    expect(tokenFindingsIn([...listFiles(GITHUB_DIR), ...entry], REMOTE_SEED_SWITCH)).toEqual([]);
    expect(tokenFindingsIn(entry, ENV_FILE_LOADER)).toEqual([]);
  });
});

describe('the deployed config', () => {
  it('has one project and no setup, teardown, dependency, web server or retry', async () => {
    const { default: config } = await import('../../playwright.deployed.config');
    expect(config.projects?.map((project) => project.name)).toEqual(['deployed-smoke']);
    const [project] = config.projects ?? [];
    expect(project.dependencies ?? []).toEqual([]);
    expect(project.teardown).toBeUndefined();
    expect(config.retries).toBe(0);
    expect(config.workers).toBe(1);
    expect(config.fullyParallel).toBe(false);
    expect(config.globalTeardown).toBeUndefined();
    expect(config.webServer).toBeUndefined();
    expect(String(config.globalSetup)).toMatch(/deployed-global-setup\.ts$/);
  });

  it('collects only the .smoke.ts files of tests/tests/deployed/, and no project sets its own collection', async () => {
    const { default: config } = await import('../../playwright.deployed.config');
    expect(config.testDir).toBe(DEPLOYED_DIR);
    expect(String(config.testMatch)).toBe(String(/\.smoke\.ts$/));
    for (const project of config.projects ?? []) {
      expect(project.testDir).toBeUndefined();
      expect(project.testMatch).toBeUndefined();
    }
  });

  it('writes no report that titles a fill step with its value, and takes no page snapshot when a failed test closes', async () => {
    const { default: config } = await import('../../playwright.deployed.config');
    const reporter = config.reporter ?? [];
    const names = (Array.isArray(reporter) ? reporter : [reporter]).map((entry) =>
      Array.isArray(entry) ? String(entry[0]) : String(entry)
    );
    expect(names).toContain('list');
    expect(names.filter((name) => name !== 'list' && name !== 'json')).toEqual([]);
    expect(process.env.PLAYWRIGHT_NO_COPY_PROMPT).toBe('1');
  });

  it('prints the target in global setup only through gateTargetLine', () => {
    const text = fs.readFileSync(path.join(TESTS_ROOT, 'deployed-global-setup.ts'), 'utf8');
    expect(text).toContain('console.log(gateTargetLine(baseURL));');
    expect(text).not.toMatch(/\$\{baseURL\}/);
  });

  it('turns tracing, screenshots and video off in the contestant spec', () => {
    const text = fs.readFileSync(path.join(DEPLOYED_DIR, 'contestant.smoke.ts'), 'utf8');
    expect(text).toContain("test.use({ trace: 'off', screenshot: 'off', video: 'off' });");
  });

  it('installs a locator handler in the voter spec before it navigates', () => {
    const text = fs.readFileSync(path.join(DEPLOYED_DIR, 'voter.smoke.ts'), 'utf8');
    const handler = text.indexOf('page.addLocatorHandler(');
    expect(handler).toBeGreaterThan(-1);
    expect(text.indexOf('navigateToFirstQuestion(page)')).toBeGreaterThan(handler);
  });

  it('lets no module the voter spec reaches install a locator handler on the path the spec runs', () => {
    const spec = path.join(DEPLOYED_DIR, 'voter.smoke.ts');
    const fixture = path.join(REPO_ROOT, VOTER_JOURNEY_FIXTURE);
    const code = (file: string): string => withoutComments(fs.readFileSync(file, 'utf8'));
    const reached = [...walkValueImports([spec], REPO_ROOT).reached.keys()].filter((file) => file !== spec);
    expect(reached).toContain(fixture);
    const installers = reached.filter((file) => code(file).includes('addLocatorHandler'));
    expect(installers.map((file) => path.relative(REPO_ROOT, file))).toEqual([VOTER_JOURNEY_FIXTURE]);
    const walkFixture = code(fixture);
    const grant = braceSpan(walkFixture, 'async function walkUntilQuestionsIntro(');
    const fixtures = braceSpan(walkFixture, 'base.extend<VoterJourneyFixtures>(');
    expect(grant).toBeDefined();
    expect(fixtures).toBeDefined();
    const inside = (span: { open: number; close: number } | undefined, index: number): boolean =>
      span !== undefined && index > span.open && index < span.close;
    // The fixture's one handler grants consent. It is installed only by `walkUntilQuestionsIntro`, which only the fixtures of `voterJourneyTest` call, and the spec uses neither.
    expect(indicesOf(walkFixture, 'addLocatorHandler').filter((index) => !inside(grant, index))).toEqual([]);
    const declaration = walkFixture.indexOf('async function walkUntilQuestionsIntro(') + 'async function '.length;
    const calls = indicesOf(walkFixture, 'walkUntilQuestionsIntro(').filter((index) => index !== declaration);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter((index) => !inside(fixtures, index))).toEqual([]);
    const namers = [spec, ...reached.filter((file) => file !== fixture)].filter((file) =>
      /walkUntilQuestionsIntro|voterJourneyTest/.test(code(file))
    );
    expect(namers.map((file) => path.relative(REPO_ROOT, file))).toEqual([]);
  });

  it('refuses every origin but public_origin in the contestant spec before it signs in', () => {
    const text = fs.readFileSync(path.join(DEPLOYED_DIR, 'contestant.smoke.ts'), 'utf8');
    const refusal = text.indexOf('requireCredentialOrigin(baseURL, ');
    expect(refusal).toBeGreaterThan(-1);
    expect(text.indexOf('signInFromCold(')).toBeGreaterThan(refusal);
  });

  it('collects no file under tests/tests/deployed/ that a local project would also collect', () => {
    const collidingNames = listFiles(DEPLOYED_DIR)
      .map((file) => path.basename(file))
      .filter((name) => !name.endsWith('.smoke.ts') && /\.(spec|test|setup|teardown)\./.test(name));
    expect(listFiles(DEPLOYED_DIR).length).toBeGreaterThan(0);
    expect(collidingNames).toEqual([]);
  });
});

describe('the value-import walk', () => {
  it('reports the chain that reaches a service-role client through a multi-line import', () => {
    const dir = writeTree({
      'a.ts': "import {\n  helper\n} from './b';\n\nexport const value = helper;\n",
      'b.ts':
        "import { SupabaseAdminClient } from './supabaseAdminClient';\n\nexport const helper = SupabaseAdminClient;\n",
      'supabaseAdminClient.ts': 'export class SupabaseAdminClient {}\n'
    });
    expect(forbiddenReach(walkValueImports([path.join(dir, 'a.ts')], dir))).toEqual([
      'a.ts → b.ts → supabaseAdminClient.ts'
    ]);
  });

  it('follows a re-export and a dynamic import', () => {
    const dir = writeTree({
      'a.ts': "export { c } from './c';\n\nexport async function load() {\n  return import('./d');\n}\n",
      'c.ts': 'export const c = 1;\n',
      'd.ts': 'export const d = 1;\n'
    });
    const walk = walkValueImports([path.join(dir, 'a.ts')], dir);
    expect([...walk.reached.keys()].map((file) => path.relative(dir, file)).sort()).toEqual(['a.ts', 'c.ts', 'd.ts']);
    expect(forbiddenReach(walk)).toEqual([]);
  });

  it('does not follow a type import', () => {
    const dir = writeTree({
      'a.ts':
        "import type { SupabaseAdminClient } from './supabaseAdminClient';\n\nexport type Client = SupabaseAdminClient;\n",
      'supabaseAdminClient.ts': 'export class SupabaseAdminClient {}\n'
    });
    const walk = walkValueImports([path.join(dir, 'a.ts')], dir);
    expect([...walk.reached.keys()].map((file) => path.relative(dir, file))).toEqual(['a.ts']);
    expect(forbiddenReach(walk)).toEqual([]);
  });

  it('reports a value import of the dev-seed barrel', () => {
    const dir = writeTree({
      'a.ts':
        "import { createServiceRoleClient } from '@openvaa/dev-seed';\n\nexport const factory = createServiceRoleClient;\n"
    });
    expect(forbiddenReach(walkValueImports([path.join(dir, 'a.ts')], dir))).toEqual(['a.ts → @openvaa/dev-seed']);
  });

  it('spans the braces of a function body, nested braces included', () => {
    const text =
      'const a = {};\nasync function walk(page: Page): Promise<void> {\n  if (page) {\n    run();\n  }\n}\nconst b = {};\n';
    const span = braceSpan(text, 'async function walk(');
    expect(span && text.slice(span.open, span.close + 1)).toBe('{\n  if (page) {\n    run();\n  }\n}');
    expect(braceSpan(text, 'async function missing(')).toBeUndefined();
  });

  it('reports a value import of any workspace package', () => {
    const dir = writeTree({
      'a.ts': "import { mergeSettings } from '@openvaa/app-shared';\n\nexport const merged = mergeSettings({}, {});\n"
    });
    expect(forbiddenReach(walkValueImports([path.join(dir, 'a.ts')], dir))).toEqual(['a.ts → @openvaa/app-shared']);
  });

  it('fails closed on a relative specifier it cannot resolve', () => {
    const dir = writeTree({ 'a.ts': "import { missing } from './missing';\n\nexport const value = missing;\n" });
    expect(forbiddenReach(walkValueImports([path.join(dir, 'a.ts')], dir))).toEqual(['a.ts → ./missing (unresolved)']);
  });

  it('reaches the shared fixtures and the smoke template from the smoke entry, and nothing forbidden', () => {
    const walk = walkValueImports(smokeEntryFiles(), REPO_ROOT);
    const reached = [...walk.reached.keys()].map((file) => path.relative(REPO_ROOT, file));
    expect(reached).toEqual(
      expect.arrayContaining([
        'tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts',
        'packages/dev-seed/src/templates/smoke.ts',
        'tests/tests/utils/callerLimitProbe.ts'
      ])
    );
    expect(forbiddenReach(walk)).toEqual([]);
  });
});
