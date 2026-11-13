/**
 * The no-inline-IAM-policies guard's WIRING and TEETH, asserted rather than described.
 *
 * The guard reads the Terraform under `infra/` and fails when an AWS identity would get a permission through an inline policy. It is only worth anything on the days it runs and on the days it can still fail: a guard deleted from the `lint:check` chain keeps passing when run by hand, and a guard whose patterns stopped matching keeps reporting green on a clean tree. This spec holds both properties, wiring by reading `package.json`, teeth by running the guard against its violating fixture root.
 *
 * The guard is run as a child process and never imported, so no copy of its patterns exists here to drift from the real ones.
 *
 * The invariant on the chain is MEMBERSHIP of the `&&` chain, never position, never the whole string, never the link count. Guards are appended to the chain freely, and an assertion on position or length reddens a correct append.
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

const GUARD_PATH = 'scripts/assert-no-inline-iam-policies.mjs';
const FIXTURE_VIOLATIONS = 'scripts/fixtures/no-inline-iam-policies/violations';
const FIXTURE_OK = 'scripts/fixtures/no-inline-iam-policies/ok';

/** The finding names the guard prints on the violating fixture root, one per banned form. */
const FINDING_NAMES = [
  'aws_iam_user_policy',
  'aws_iam_role_policy',
  'aws_iam_group_policy',
  'inline_policy',
  'aws_ssoadmin_permission_set_inline_policy',
  'aws_iam_policy_attachment',
  'aws_iam_*_policies_exclusive not empty',
  'path matches .tf.json file'
];

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

describe('the no-inline-IAM-policies guard is wired so it actually runs', () => {
  it('keeps `yarn assert:no-inline-iam-policies` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:no-inline-iam-policies');
  });

  it('points the registered script at the guard it claims to run', () => {
    // A chain link naming a script key that no longer exists fails with a bare "command not found", which names no invariant.
    expect(ROOT_PACKAGE_JSON.scripts['assert:no-inline-iam-policies']).toBe(
      'node scripts/assert-no-inline-iam-policies.mjs'
    );
  });

  it('keeps the guard file itself present and recognisable', () => {
    expect(readFileSync(resolve(REPO_ROOT, GUARD_PATH), 'utf8')).toContain('NO-INLINE-IAM-POLICIES GUARD');
  });
});

describe('the no-inline-IAM-policies guard still has teeth', () => {
  it('passes on the repository tree and says how many files it read', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/[1-9]\d* \.tf file\(s\) read under 'infra'/);
  });

  it('fails on the violating fixture root and names every banned form', () => {
    const result = runGuard(['--root', FIXTURE_VIOLATIONS]);
    expect(result.status).toBe(1);
    for (const name of FINDING_NAMES) expect(result.stdout).toContain(name);
  });

  it('passes on the clean fixture root', () => {
    const result = runGuard(['--root', FIXTURE_OK]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('reproduces its committed findings in self-test mode', () => {
    expect(runGuard(['--self-test']).status).toBe(0);
  });

  it('refuses an unknown argument with a usage error', () => {
    const result = runGuard(['--no-such-flag']);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('usage:');
  });
});
