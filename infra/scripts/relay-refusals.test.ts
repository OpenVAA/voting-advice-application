/**
 * The relay refusal check, run through its own self-test: a loopback server that applies the relay's rules, one that
 * answers 204 to everything and a port nothing listens on. Then the three usage refusals: no base URL, a base URL
 * outside the allowlist and a probe id of the wrong form.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = join(HERE, 'relay-refusals.sh');

/** The nine cases the script sends, in the order it sends them. */
const CASES = [
  'cross_site',
  'foreign_origin',
  'declared_33k',
  'chunked_33k',
  'envelope_destination',
  'envelope_host',
  'event_url',
  'event_host',
  'control'
] as const;

function run(...args: Array<string>): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '/tmp'
    },
    timeout: 120_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('relay-refusals.sh', () => {
  it('passes every case of its self-test', () => {
    const { status, stdout } = run('--self-test');
    const cases = stdout.split('\n').filter((line) => /^self_test \S+ (PASS|FAIL)$/.test(line));
    expect(cases.filter((line) => line.endsWith(' FAIL'))).toEqual([]);
    for (const name of CASES) {
      expect(cases).toContain(`self_test rules-${name} PASS`);
    }
    for (const name of [
      'rules-exits-0',
      'rules-summary-has-no-failure',
      'rules-records-no-body',
      'always-204-cross_site-fails',
      'always-204-exits-1',
      'no-answer-records-000',
      'no-answer-exits-1'
    ]) {
      expect(cases).toContain(`self_test ${name} PASS`);
    }
    expect(stdout).toMatch(/^self_test summary cases=\d+ failed=0$/m);
    expect(status).toBe(0);
  }, 120_000);

  it('exits 2 with a usage line without --base-url', () => {
    const { status, stderr } = run('--probe', 'p1');
    expect(status).toBe(2);
    expect(stderr).toMatch(/^usage: relay-refusals\.sh /m);
  });

  it('exits 2 with a usage line for a base URL outside the allowlist', () => {
    for (const base of [
      'https://example.org',
      'http://staging.openvaa.org',
      'https://staging.openvaa.org.evil.example',
      'http://localhost',
      'http://10.0.0.1:5274'
    ]) {
      const { status, stderr } = run('--base-url', base, '--probe', 'p1');
      expect(status, base).toBe(2);
      expect(stderr).toMatch(/^usage: relay-refusals\.sh /m);
    }
  });

  it('exits 2 with a usage line for a probe id that is not 1 to 40 letters, digits, _ or -', () => {
    for (const probe of ['', 'a'.repeat(41), 'p 1', 'p.1', 'p/1']) {
      const { status, stderr } = run('--base-url', 'http://127.0.0.1:9', '--probe', probe);
      expect(status, JSON.stringify(probe)).toBe(2);
      expect(stderr).toMatch(/^usage: relay-refusals\.sh /m);
    }
  });

  it('exits 2 on an unknown flag', () => {
    expect(run('--bogus').status).toBe(2);
  });
});
