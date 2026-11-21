/**
 * The declared-imports guard's WIRING and TEETH, asserted rather than described.
 *
 * The guard reads every workspace under `packages/` and fails when a non-test source file imports a package its manifest does not declare. It is only worth anything on the days it runs and on the days it can still fail: a guard dropped from the `lint:check` chain keeps passing when run by hand, and a scanner whose patterns stopped matching keeps reporting green on a clean tree. This spec holds both properties, wiring by reading `package.json`, teeth by running the guard's self-test against its fixture workspace.
 *
 * The guard is run as a child process and never imported, so no copy of its patterns exists here to drift from the real ones.
 *
 * The invariant on the chain is MEMBERSHIP of the `&&` chain, never position, never the whole string, never the link count.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SpawnSyncReturns } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const GUARD_PATH = 'scripts/assert-declared-imports.mjs';

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

/**
 * Run the guard from the repository root.
 * @param args - The guard's arguments.
 * @returns The spawn result, with stdout and stderr as text.
 */
function runGuard(args: Array<string>): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [GUARD_PATH, ...args], { cwd: REPO_ROOT, encoding: 'utf8' });
}

describe('the declared-imports guard is wired so it actually runs', () => {
  it('keeps `yarn assert:declared-imports` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:declared-imports');
  });

  it('points the registered script at the guard it claims to run', () => {
    expect(ROOT_PACKAGE_JSON.scripts['assert:declared-imports']).toBe(`node ${GUARD_PATH}`);
  });

  it('keeps the guard file itself present and recognisable', () => {
    expect(readFileSync(resolve(REPO_ROOT, GUARD_PATH), 'utf8')).toContain('DECLARED-IMPORTS GUARD');
  });
});

describe('the declared-imports guard still has teeth', () => {
  it('passes on the repository tree', () => {
    expect(runGuard([]).status).toBe(0);
  });

  it('reproduces its expected findings in self-test mode', () => {
    expect(runGuard(['--self-test']).status).toBe(0);
  });

  it('refuses an unknown argument with a usage error', () => {
    const result = runGuard(['--no-such-flag']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('usage:');
  });
});
