/**
 * The request loop, run through its own self-test: loopback servers started with node, one answering 200 and one
 * answering 503 to every third request, a stop file, SIGTERM and a port nothing listens on.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = join(HERE, 'request-loop.sh');

function run(...args: Array<string>): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '/tmp'
    },
    timeout: 60_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('request-loop.sh', () => {
  it('passes every case of its self-test', () => {
    const { status, stdout } = run('--self-test');
    const cases = stdout.split('\n').filter((line) => /^self_test \S+ (PASS|FAIL)$/.test(line));
    expect(cases.filter((line) => line.endsWith(' FAIL'))).toEqual([]);
    for (const name of [
      'all-2xx-exits-0',
      'all-2xx-counts-no-failure',
      'every-third-503-exits-1',
      'every-third-503-counts-failures',
      'stop-file-ends-the-run',
      'sigterm-prints-the-summary',
      'no-answer-records-000'
    ]) {
      expect(cases).toContain(`self_test ${name} PASS`);
    }
    expect(stdout).toMatch(/^self_test summary cases=\d+ failed=0$/m);
    expect(status).toBe(0);
  }, 60_000);

  it('exits 2 on an unknown flag', () => {
    expect(run('--bogus').status).toBe(2);
  });

  it('exits 2 without an end condition', () => {
    expect(run('--url', 'http://127.0.0.1:9/', '--out', '/dev/null').status).toBe(2);
  });
});
