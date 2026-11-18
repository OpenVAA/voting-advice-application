/**
 * The load check, without Docker and without traffic: the wrapper's refusals through its own self-test, the figure on
 * synthetic summaries of the shape k6 2.4.0 writes, and the k6 script read as text.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WRAPPER = join(HERE, 'load-check.sh');
const FIGURE = join(HERE, 'load-check', 'figure.mjs');
const K6_SCRIPT = join(HERE, 'load-check', 'voter-journey.js');

const STRIPPED_ENV = {
  PATH: process.env.PATH ?? '',
  HOME: process.env.HOME ?? '',
  TMPDIR: process.env.TMPDIR ?? '/tmp'
};

type Run = { status: number | null; stdout: string; stderr: string };

function run(command: string, args: Array<string>, input?: string): Run {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: STRIPPED_ENV,
    input,
    timeout: 60_000
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const scratch = mkdtempSync(join(tmpdir(), 'openvaa-load-check-vitest-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** A trend sub-metric as k6 2.4.0 writes it in the summary. */
function trend(p95: number): Record<string, unknown> {
  return { type: 'trend', contains: 'time', values: { avg: p95 / 2, min: 1, med: p95 / 2, max: p95, 'p(95)': p95 } };
}

/** A rate sub-metric as k6 2.4.0 writes it: `passes` counts the failed requests. */
function rate(failed: number, total: number): Record<string, unknown> {
  return { type: 'rate', contains: 'default', values: { passes: failed, fails: total - failed, rate: failed / total } };
}

function summary(steps: Array<{ rate: number; page: number; relay: number; failed: number }>): string {
  const metrics: Record<string, unknown> = {};
  steps.forEach((step, index) => {
    const i = index + 1;
    metrics[`http_req_duration{kind:page,step:${i}}`] = trend(step.page);
    metrics[`http_req_duration{kind:relay,step:${i}}`] = trend(step.relay);
    metrics[`http_req_failed{step:${i}}`] = rate(step.failed, 1000);
  });
  return JSON.stringify({
    options: {},
    state: {},
    root_group: {},
    metrics,
    load_check: { steps: steps.map((step) => step.rate), step_seconds: 300 }
  });
}

function figure(name: string, content: string): Run {
  const file = join(scratch, `${name}.json`);
  writeFileSync(file, content);
  return run('node', [FIGURE, file]);
}

describe('load-check.sh', () => {
  it('refuses every unsafe target, step, journey and output with exit 2, before Docker', () => {
    const { status, stdout } = run('bash', [WRAPPER, '--self-test']);
    const cases = stdout.split('\n').filter((line) => /^self_test \S+ (PASS|FAIL)$/.test(line));
    expect(cases.filter((line) => line.endsWith(' FAIL'))).toEqual([]);
    for (const name of [
      'staging-without-confirm-target-is-refused',
      'confirm-target-that-differs-is-refused',
      'step-above-max-rate-is-refused',
      'foreign-host-in-journey-is-refused',
      'existing-out-is-refused',
      'base-url-outside-allowlist-is-refused',
      'auth-path-in-journey-is-refused',
      'function-path-in-journey-is-refused',
      'valid-run-uses-pinned-image',
      'valid-run-keeps-key-off-command-line-and-output'
    ]) {
      expect(cases).toContain(`self_test ${name} PASS`);
    }
    expect(stdout).toMatch(/^self_test summary cases=\d+ failed=0$/m);
    expect(status).toBe(0);
  }, 60_000);

  it('exits 2 on an unknown flag', () => {
    expect(run('bash', [WRAPPER, '--bogus']).status).toBe(2);
  });

  it('exits 2 on a staging run without --confirm-target', () => {
    const result = run('bash', [
      WRAPPER,
      '--base-url',
      'https://staging.openvaa.org',
      '--journey',
      join(HERE, 'load-check', 'local-journey.json'),
      '--steps',
      '1',
      '--max-rate',
      '5',
      '--out',
      join(scratch, 'never-created')
    ]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('--confirm-target');
  });
});

describe('figure.mjs', () => {
  it('gives the rate of the highest step that met every threshold', () => {
    const { status, stdout } = figure(
      'three-steps',
      summary([
        { rate: 5, page: 220, relay: 40, failed: 0 },
        { rate: 10, page: 610, relay: 90, failed: 3 },
        { rate: 20, page: 1450, relay: 120, failed: 4 }
      ])
    );
    expect(status).toBe(0);
    expect(stdout.trim().split('\n')).toEqual([
      'step=1 rate_per_min=5 page_p95_ms=220.0 relay_p95_ms=40.0 error_rate=0.0000 met=yes',
      'step=2 rate_per_min=10 page_p95_ms=610.0 relay_p95_ms=90.0 error_rate=0.0030 met=yes',
      'step=3 rate_per_min=20 page_p95_ms=1450.0 relay_p95_ms=120.0 error_rate=0.0040 met=no',
      'figure_journeys_per_minute=10',
      'figure_step=2'
    ]);
  });

  it('fails a step on the relay threshold and on the error threshold', () => {
    const { stdout } = figure(
      'relay-and-errors',
      summary([
        { rate: 5, page: 200, relay: 300, failed: 0 },
        { rate: 10, page: 200, relay: 50, failed: 10 }
      ])
    );
    expect(stdout).toContain('step=1 rate_per_min=5 page_p95_ms=200.0 relay_p95_ms=300.0 error_rate=0.0000 met=no');
    expect(stdout).toContain('step=2 rate_per_min=10 page_p95_ms=200.0 relay_p95_ms=50.0 error_rate=0.0100 met=no');
  });

  it('gives 0 when no step met', () => {
    const { status, stdout } = figure('none-met', summary([{ rate: 5, page: 2000, relay: 40, failed: 0 }]));
    expect(status).toBe(0);
    expect(stdout).toMatch(/^figure_journeys_per_minute=0$/m);
    expect(stdout).toMatch(/^figure_step=none$/m);
  });

  it('does not meet a step the summary holds no values for', () => {
    const content = JSON.parse(summary([{ rate: 5, page: 200, relay: 40, failed: 0 }]));
    content.load_check.steps.push(10);
    const { stdout } = figure('aborted', JSON.stringify(content));
    expect(stdout).toContain('step=2 rate_per_min=10 page_p95_ms=none relay_p95_ms=none error_rate=none met=no');
    expect(stdout).toMatch(/^figure_journeys_per_minute=5$/m);
  });

  it('exits 1 on a summary without load_check', () => {
    expect(figure('no-steps', JSON.stringify({ metrics: {} })).status).toBe(1);
  });
});

describe('voter-journey.js', () => {
  const text = readFileSync(K6_SCRIPT, 'utf8');

  it('defines the three per-step thresholds', () => {
    expect(text).toContain('http_req_duration{kind:page,step:${step}}');
    expect(text).toContain('http_req_duration{kind:relay,step:${step}}');
    expect(text).toContain('http_req_failed{step:${step}}');
    expect(text).toMatch(/const PAGE_P95_MS = 1000;/);
    expect(text).toMatch(/const RELAY_P95_MS = 300;/);
    expect(text).toMatch(/const STEP_ERROR_RATE = 0\.01;/);
  });

  it('aborts the run on the global error rate after a minute', () => {
    expect(text).toMatch(/const ABORT_ERROR_RATE = 0\.05;/);
    expect(text).toContain('abortOnFail: true');
    expect(text).toMatch(/const ABORT_DELAY = '1m';/);
    expect(text).toContain("executor: 'constant-arrival-rate'");
  });

  it('writes its summary with handleSummary', () => {
    expect(text).toMatch(/export function handleSummary\(/);
    expect(text).toContain("'/out/summary.json'");
  });

  it('holds no literal key', () => {
    expect(text).toContain('__ENV.SUPABASE_ANON_KEY');
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(text).not.toMatch(/sb_(publishable|secret)_[A-Za-z0-9_-]+/);
  });

  it('refuses Supabase Auth and Edge Function paths', () => {
    expect(text).toContain("'/auth/v1/'");
    expect(text).toContain("'/functions/v1/'");
  });
});
