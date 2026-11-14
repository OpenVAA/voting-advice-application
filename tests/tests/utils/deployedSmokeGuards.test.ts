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
/** Packages that create a Supabase client or load an environment file. */
const FORBIDDEN_PACKAGES = /^(@openvaa\/dev-seed|@supabase\/supabase-js|@supabase\/ssr|dotenv)(\/.*)?$/;

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

/** Every file under `dir`, recursively, as sorted absolute paths. */
function listFiles(_dir: string): Array<string> {
  return [];
}

/** The deployed config, its global setup, the gate module and every file under `tests/tests/deployed/`. */
function smokeEntryFiles(): Array<string> {
  return [];
}

/** One finding per line of `text` that matches `pattern`. */
function scanForTokens(_text: string, _pattern: RegExp): Array<TokenFinding> {
  return [];
}

/** The specifiers `text` imports or re-exports as values, static and dynamic; `import type` and `export type` are skipped. */
function valueImportSpecifiers(_text: string): Array<string> {
  return [];
}

/** The file a relative specifier names: as written, then with `.ts`, `/index.ts`, `.mjs` or `.js`. */
function resolveRelative(_fromFile: string, _specifier: string): string | undefined {
  return undefined;
}

/** A breadth-first walk over the relative value imports of `entries`; bare specifiers are recorded and not followed. */
function walkValueImports(_entries: Array<string>, root: string): ImportWalk {
  return { root, reached: new Map(), bare: [], unresolved: [] };
}

/** Every chain of `walk` that reaches a forbidden module or package, or a relative specifier that resolves to nothing. */
function forbiddenReach(_walk: ImportWalk): Array<string> {
  return [];
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
      expect.arrayContaining(['voter.smoke.ts', 'contestant.smoke.ts', 'smokeContent.ts'])
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
        'packages/dev-seed/src/templates/smoke.ts'
      ])
    );
    expect(forbiddenReach(walk)).toEqual([]);
  });
});
