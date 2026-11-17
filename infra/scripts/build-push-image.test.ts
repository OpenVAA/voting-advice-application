/**
 * The build-and-push script, run through its own self-test: throwaway repositories with a bare repository as origin,
 * and the AWS CLI and docker replaced by stubs inside the script. The child gets a minimal environment, so no credential
 * of the shell that runs the suite reaches it.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = join(HERE, 'build-push-image.sh');

function run(...args: Array<string>): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '/tmp',
      AWS_CONFIG_FILE: '/dev/null',
      AWS_SHARED_CREDENTIALS_FILE: '/dev/null'
    },
    timeout: 60_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('build-push-image.sh', () => {
  it('passes every case of its self-test', () => {
    const { status, stdout } = run('--self-test');
    const cases = stdout.split('\n').filter((line) => /^self_test \S+ (PASS|FAIL)$/.test(line));
    expect(cases.filter((line) => line.endsWith(' FAIL'))).toEqual([]);
    for (const name of [
      'dirty-untracked-refused',
      'unpushed-refused',
      'planning-in-tree-refused',
      'pushed-other-account-refused',
      'pushed-other-account-stops-at-the-caller',
      'tag-exists-exits-3',
      'push-password-on-no-command-line',
      'push-build-sha-is-the-tag',
      'ignored-file-absent-from-context',
      'context-holds-the-commit',
      'context-is-not-the-working-tree',
      'context-failure-fails',
      'context-failure-builds-nothing'
    ]) {
      expect(cases).toContain(`self_test ${name} PASS`);
    }
    expect(stdout).toMatch(/^self_test summary cases=\d+ failed=0$/m);
    expect(status).toBe(0);
  }, 60_000);

  it('exits 2 on an unknown flag', () => {
    expect(run('--bogus').status).toBe(2);
  });

  it('exits 2 without a repository URL', () => {
    expect(run('--platform', 'linux/arm64').status).toBe(2);
  });
});
