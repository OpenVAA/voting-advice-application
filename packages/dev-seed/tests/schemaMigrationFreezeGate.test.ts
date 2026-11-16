/**
 * The schema-migration guard is wired into `lint:check`, and its frozen-migration checker reports each way a frozen set of migrations can be wrong.
 *
 * A frozen migration set is a migrations directory beside a manifest that lists every file with its sha256. `checkFrozenMigrations` compares the two and returns one finding for each fault. Each rule of the checker has one fixture directory under `scripts/fixtures/schema-migration-freeze` that breaks that rule and no other, and `ok` breaks none. A fixture holds `migrations/`, `manifest.json` and `expected.violations`, the findings the checker must return for it.
 *
 * Both lists are read at run time: the fixtures from the directory, the rules from the guard's `FROZEN_RULES`. A rule added without a fixture, or a fixture left without a rule, fails here.
 *
 * The real migrations are frozen: `apps/supabase/supabase/migrations.manifest.json` lists them, the checker finds nothing wrong with them, and `--write`, which `yarn schema:regenerate` runs, refuses instead of rewriting the baseline.
 *
 * It lives in this package because `yarn test:unit` runs per workspace and this package already reads repository-root files from its tests.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

interface FrozenRule {
  id: string;
  kind: string;
  fixture: string;
}

interface FreezeGuard {
  FROZEN_RULES: ReadonlyArray<FrozenRule>;
  checkFrozenMigrations: (paths: { migrationsDir: string; manifestPath: string }) => Array<string>;
}

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');
const GUARD_FILE = 'scripts/assert-schema-migration-parity.mjs';
const FIXTURE_DIR = 'scripts/fixtures/schema-migration-freeze';
const FIXTURE_ROOT = resolve(REPO_ROOT, FIXTURE_DIR);
/** The one fixture that breaks no rule. */
const CLEAN_FIXTURE = 'ok';
const MIGRATIONS_DIR = resolve(REPO_ROOT, 'apps/supabase/supabase/migrations');
const MANIFEST_PATH = resolve(REPO_ROOT, 'apps/supabase/supabase/migrations.manifest.json');
const BASELINE_FILE = '00001_initial_schema.sql';

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

interface MigrationManifest {
  baseline: { name: string; file: string; commit: string };
  migrations: Array<{ file: string; sha256: string }>;
}

const FIXTURES: Array<string> = readdirSync(FIXTURE_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const SEEDED_FIXTURES: Array<string> = FIXTURES.filter((name) => name !== CLEAN_FIXTURE);

function loadGuard(): Promise<FreezeGuard> {
  return import(pathToFileURL(resolve(REPO_ROOT, GUARD_FILE)).href) as Promise<FreezeGuard>;
}

/** The two paths of a fixture, absolute. */
function pathsOf(fixture: string): { migrationsDir: string; manifestPath: string } {
  return {
    migrationsDir: resolve(FIXTURE_ROOT, fixture, 'migrations'),
    manifestPath: resolve(FIXTURE_ROOT, fixture, 'manifest.json')
  };
}

/** The committed findings of a fixture, one per non-empty line. */
function expectedOf(fixture: string): Array<string> {
  return readFileSync(resolve(FIXTURE_ROOT, fixture, 'expected.violations'), 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '');
}

describe('the schema-migration guard is wired so it actually runs', () => {
  it('keeps `yarn assert:schema-migration-parity` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:schema-migration-parity');
  });

  it('points the registered script at the guard, with no argument that could aim it at a fixture', () => {
    expect(ROOT_PACKAGE_JSON.scripts['assert:schema-migration-parity']).toBe(`node ${GUARD_FILE}`);
  });

  it('keeps the guard file itself present and recognisable', () => {
    expect(readFileSync(resolve(REPO_ROOT, GUARD_FILE), 'utf8')).toContain('SCHEMA-MIGRATION PARITY GUARD');
  });
});

describe('the frozen-migration checker over its fixtures', () => {
  it('has a clean fixture and at least one seeded fixture', () => {
    expect(FIXTURES).toContain(CLEAN_FIXTURE);
    expect(SEEDED_FIXTURES.length).toBeGreaterThan(0);
  });

  it('returns no finding for the clean fixture', async () => {
    const { checkFrozenMigrations } = await loadGuard();
    expect(expectedOf(CLEAN_FIXTURE)).toEqual([]);
    expect(checkFrozenMigrations(pathsOf(CLEAN_FIXTURE))).toEqual([]);
  });

  it.each(SEEDED_FIXTURES)('returns exactly the one committed finding for %s', async (fixture) => {
    const { checkFrozenMigrations } = await loadGuard();
    const expected = expectedOf(fixture);
    expect(expected).toHaveLength(1);
    expect(checkFrozenMigrations(pathsOf(fixture))).toEqual(expected);
  });

  it('returns the same findings for a relative and for an absolute path, and never a directory path', async () => {
    const { checkFrozenMigrations } = await loadGuard();
    for (const fixture of FIXTURES) {
      const absolute = pathsOf(fixture);
      const fromHere = {
        migrationsDir: relative(process.cwd(), absolute.migrationsDir),
        manifestPath: relative(process.cwd(), absolute.manifestPath)
      };
      const findings = checkFrozenMigrations(absolute);
      expect(checkFrozenMigrations(fromHere), fixture).toEqual(findings);
      for (const finding of findings) {
        expect(finding, fixture).not.toContain(REPO_ROOT);
        expect(finding, fixture).not.toContain(FIXTURE_DIR);
      }
    }
  });
});

describe('every rule of the checker has its fixture, and every fixture its rule', () => {
  it('names an existing fixture in every rule, whose one finding begins with the kind of the rule', async () => {
    const { FROZEN_RULES, checkFrozenMigrations } = await loadGuard();
    expect(FROZEN_RULES.length).toBeGreaterThan(0);
    for (const rule of FROZEN_RULES) {
      expect(SEEDED_FIXTURES, rule.id).toContain(rule.fixture);
      const expected = expectedOf(rule.fixture);
      expect(expected, rule.id).toHaveLength(1);
      expect(expected[0].startsWith(`${rule.kind}: `), `${rule.id}: ${expected[0]}`).toBe(true);
      const findings = checkFrozenMigrations(pathsOf(rule.fixture));
      expect(findings, rule.id).toHaveLength(1);
      expect(findings[0].startsWith(`${rule.kind}: `), `${rule.id}: ${findings[0]}`).toBe(true);
    }
  });

  it('names every fixture other than the clean one in exactly one rule', async () => {
    const { FROZEN_RULES } = await loadGuard();
    for (const fixture of SEEDED_FIXTURES) {
      const owners = FROZEN_RULES.filter((rule) => rule.fixture === fixture).map((rule) => rule.id);
      expect(owners, fixture).toHaveLength(1);
    }
  });

  it('gives every rule its own id', async () => {
    const { FROZEN_RULES } = await loadGuard();
    const ids = FROZEN_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the real migrations are frozen', () => {
  it('finds nothing wrong with the real migrations directory against the real manifest', async () => {
    const { checkFrozenMigrations } = await loadGuard();
    expect(checkFrozenMigrations({ migrationsDir: MIGRATIONS_DIR, manifestPath: MANIFEST_PATH })).toEqual([]);
  });

  it('lists the baseline first, and names the commit it came from as a full commit id', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as MigrationManifest;
    expect(manifest.migrations[0].file).toBe(BASELINE_FILE);
    expect(manifest.baseline.file).toBe(BASELINE_FILE);
    expect(manifest.baseline.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  it('refuses `--write`: it exits non-zero and says the baseline is frozen', () => {
    const result = spawnSync(process.execPath, [resolve(REPO_ROOT, GUARD_FILE), '--write'], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('frozen');
  });

  it('keeps the `schema:regenerate` key, pointed at the refusing `--write`', () => {
    expect(ROOT_PACKAGE_JSON.scripts['schema:regenerate']).toBe(`node ${GUARD_FILE} --write`);
  });
});
