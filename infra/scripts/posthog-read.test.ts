/**
 * The PostHog read, run through its own self-test: a loopback stand-in for the EU project and query endpoints, which
 * the script reaches as a HogQLQuery POST with a Bearer personal key. Then the usage refusals: a missing key, a project
 * that is not digits, an unknown mode, a host other than the EU app host and a missing window.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = join(HERE, 'posthog-read.sh');

/** A value of the key's form, used only to see that it never reaches an output stream. */
const FAKE_KEY = 'phx_fake0000000000000000000000000000000000000000';

const WINDOW = ['--since', '2026-11-18T12:00:00Z', '--until', '2026-11-18T12:30:00Z'];

function run(
  args: Array<string>,
  extraEnv: Record<string, string> = {}
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '/tmp',
      ...extraEnv
    },
    timeout: 120_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('posthog-read.sh', () => {
  it('passes every case of its self-test', () => {
    const { status, stdout, stderr } = run(['--self-test']);
    const cases = stdout.split('\n').filter((line) => /^self_test \S+ (PASS|FAIL)$/.test(line));
    expect(cases.filter((line) => line.endsWith(' FAIL'))).toEqual([]);
    for (const name of [
      'settings-prints-anonymize-ips',
      'probe-count-prints-count',
      'window-count-prints-count',
      'privacy-prints-every-line',
      'every-mode-prints-named-lines-only',
      'every-query-is-a-hogql-post-with-the-bearer-key',
      'status-401-prints-the-status',
      'status-401-exits-1',
      'unexpected-shape-exits-1',
      'unexpected-shape-prints-no-count',
      'key-in-neither-stream',
      'no-body-printed'
    ]) {
      expect(cases).toContain(`self_test ${name} PASS`);
    }
    expect(stdout).toMatch(/^self_test summary cases=\d+ failed=0$/m);
    expect(`${stdout}${stderr}`).not.toContain(FAKE_KEY);
    expect(status).toBe(0);
  }, 120_000);

  it('exits 2 without POSTHOG_PERSONAL_API_KEY, naming the variable', () => {
    const { status, stderr } = run(['--project', '1', '--mode', 'settings']);
    expect(status).toBe(2);
    expect(stderr).toContain('POSTHOG_PERSONAL_API_KEY');
  });

  it('exits 2 for a project that is not digits, an unknown mode or a missing window, never printing the key', () => {
    const env = { POSTHOG_PERSONAL_API_KEY: FAKE_KEY };
    for (const args of [
      ['--mode', 'settings'],
      ['--project', '12a', '--mode', 'settings'],
      ['--project', '1', '--mode', 'everything'],
      ['--project', '1'],
      ['--project', '1', '--mode', 'window-count'],
      ['--project', '1', '--mode', 'privacy', '--since', '2026-11-18T12:00:00Z'],
      ['--project', '1', '--mode', 'window-count', '--since', '2026-11-18 12:00:00', '--until', '2026-11-18T12:30:00Z'],
      [
        '--project',
        '1',
        '--mode',
        'window-count',
        '--since',
        '2026-11-18T12:30:00Z',
        '--until',
        '2026-11-18T12:00:00Z'
      ],
      ['--project', '1', '--mode', 'probe-count', ...WINDOW],
      ['--project', '1', '--mode', 'probe-count', '--probe', "x' OR 1=1", ...WINDOW]
    ]) {
      const { status, stdout, stderr } = run(args, env);
      expect(status, args.join(' ')).toBe(2);
      expect(`${stdout}${stderr}`).not.toContain(FAKE_KEY);
    }
  });

  it('exits 2 for a host other than the EU app host outside the self-test', () => {
    const env = { POSTHOG_PERSONAL_API_KEY: FAKE_KEY };
    for (const host of [
      'https://us.posthog.com',
      'https://app.posthog.com',
      'http://127.0.0.1:9',
      'http://localhost:9'
    ]) {
      const { status, stdout, stderr } = run(['--host', host, '--project', '1', '--mode', 'settings'], env);
      expect(status, host).toBe(2);
      expect(`${stdout}${stderr}`).not.toContain(FAKE_KEY);
    }
  });

  it('exits 2 on an unknown flag', () => {
    expect(run(['--bogus']).status).toBe(2);
  });
});
