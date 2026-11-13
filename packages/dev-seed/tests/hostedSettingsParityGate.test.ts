/**
 * The hosted-settings parity guard's WIRING and TEETH, asserted rather than described.
 *
 * The guard compares the security-relevant API and auth settings of the local `config.toml` with the hosted settings the Terraform module sends, and fails when they disagree. It is only worth anything on the days it runs and on the days it can still fail: a guard deleted from the `lint:check` chain keeps passing when run by hand, and a guard that stopped comparing keeps reporting green on a clean tree. This spec holds both properties, wiring by reading `package.json`, teeth by running the guard on a hosted settings file that disagrees on one key and on an environments directory that holds no origin.
 *
 * The guard is run as a child process and never imported, so no copy of its classification exists here to drift from the real one.
 *
 * The invariant on the chain is MEMBERSHIP of the `&&` chain, never position, never the whole string, never the link count. Guards are appended to the chain freely, and an assertion on position or length reddens a correct append.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import type { SpawnSyncReturns } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const GUARD_PATH = 'scripts/assert-hosted-settings-parity.mjs';
const SETTINGS_PATH = 'infra/modules/supabase/hosted-settings.json';
const FIXTURE_MAX_ROWS = 'scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json';

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

/** An empty directory standing in for `infra/envs`, so that the guard finds no Supabase root and no origin. */
const EMPTY_ENVS = mkdtempSync(join(tmpdir(), 'hosted-settings-parity-'));
afterAll(() => rmSync(EMPTY_ENVS, { recursive: true, force: true }));

/**
 * Run the guard from the repository root.
 * @param args - The guard's arguments.
 * @returns The spawn result, with stdout and stderr as text.
 */
function runGuard(args: Array<string>): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [GUARD_PATH, ...args], { cwd: REPO_ROOT, encoding: 'utf8' });
}

/**
 * Every leaf of a parsed JSON value, as a path and the leaf's JSON text.
 * @param value - The parsed value.
 * @param prefix - The path of `value`.
 * @returns A map from leaf path to the leaf's JSON text.
 */
function leaves(value: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value))
      for (const entry of leaves(child, `${prefix}/${key}`)) out.set(...entry);
  } else out.set(prefix, JSON.stringify(value));
  return out;
}

describe('the hosted-settings parity guard is wired so it actually runs', () => {
  it('keeps `yarn assert:hosted-settings-parity` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:hosted-settings-parity');
  });

  it('points the registered script at the guard it claims to run', () => {
    // A chain link naming a script key that no longer exists fails with a bare "command not found", which names no invariant.
    expect(ROOT_PACKAGE_JSON.scripts['assert:hosted-settings-parity']).toBe(
      'node scripts/assert-hosted-settings-parity.mjs'
    );
  });

  it('keeps the guard file itself present and recognisable', () => {
    expect(readFileSync(resolve(REPO_ROOT, GUARD_PATH), 'utf8')).toContain('HOSTED-SETTINGS PARITY GUARD');
  });
});

describe('the hosted-settings parity guard still has teeth', () => {
  it('passes on the repository and prints its census', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/census: [1-9]\d* live key\(s\)/);
    expect(result.stderr).toMatch(/[1-9]\d* origin\(s\) checked/);
  });

  it('keeps the fixture one value away from the real hosted settings, so it cannot drift into testing nothing', () => {
    const real = leaves(JSON.parse(readFileSync(resolve(REPO_ROOT, SETTINGS_PATH), 'utf8')));
    const fixture = leaves(JSON.parse(readFileSync(resolve(REPO_ROOT, FIXTURE_MAX_ROWS), 'utf8')));
    const paths = new Set([...real.keys(), ...fixture.keys()]);
    const differing = [...paths].filter((p) => real.get(p) !== fixture.get(p));
    expect(differing).toEqual(['/api/max_rows']);
    expect(fixture.get('/api/max_rows')).toBe('49999');
  });

  it('fails on hosted settings that disagree on max_rows and names the key', () => {
    const result = runGuard(['--settings', FIXTURE_MAX_ROWS]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('api/max_rows');
  });

  it('fails when no Supabase root yields an origin, because a check that examined nothing does not pass', () => {
    const result = runGuard(['--envs-dir', EMPTY_ENVS]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('auth/site_url');
  });

  it('reproduces its embedded cases in self-test mode', () => {
    expect(runGuard(['--self-test']).status).toBe(0);
  });

  it('refuses an unknown argument with a usage error', () => {
    const result = runGuard(['--no-such-flag']);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('usage:');
  });
});
