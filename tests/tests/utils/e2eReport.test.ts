/**
 * Unit tests for `tests/scripts/e2e-report.mjs`, the module that reads and classifies a run directory's Playwright report, and for the two scripts that judge a run with it, `e2e-evidence.mjs` and `e2e-spec-verdict.mjs`.
 *
 * The four fixture reports below have the shape Playwright's JSON reporter writes -- a top-level suite per spec file, a nested describe suite, results with `startTime` and `duration` -- and each holds one outcome: every test green, one failed, one flaky, one that did not run. Both scripts are run as processes against the same fixture, so the counts of one and the verdict of the other are seen to agree.
 *
 * Run: yarn test:unit:tests e2eReport
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPTS_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../scripts');
const REPORT_MODULE = path.join(SCRIPTS_DIR, 'e2e-report.mjs');
const EVIDENCE_SCRIPT = path.join(SCRIPTS_DIR, 'e2e-evidence.mjs');
const VERDICT_SCRIPT = path.join(SCRIPTS_DIR, 'e2e-spec-verdict.mjs');

type Kind = 'passed' | 'failed' | 'flaky' | 'skipped' | 'didNotRun';

type TestRecord = {
  project: string;
  file: string;
  title: string;
  kind: Kind;
  durationMs: number;
  errorText: string;
  results: Array<{ status: string; endMs: number }>;
};

type ReportModule = {
  classifyTests: (report: unknown) => Array<TestRecord>;
  readReport: (runDir: string) => { tests: Array<TestRecord> };
  ReportError: new (code: string, message: string) => Error & { code: string };
  repoRoot: string;
};

const reportModule = (await import(pathToFileURL(REPORT_MODULE).href)) as ReportModule;

type Result = { status: string; startTime?: string; duration?: number; error?: { message: string } };
type Test = { status: string; annotations?: Array<string>; results: Array<Result> };

const START = '2026-11-20T10:00:00.000Z';
const passedResult = (startTime = START): Result => ({ status: 'passed', startTime, duration: 1000 });
const failedResult = (startTime = START): Result => ({
  status: 'failed',
  startTime,
  duration: 2000,
  error: { message: 'expect(locator).toBeVisible() failed' }
});

/** A Playwright-shaped report: `a.spec.ts` with a describe block holding `first` and `second`, and `b.spec.ts` holding `third`. */
function fixtureReport(tests: { first: Test; second: Test; third: Test }) {
  const count = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
  const entry = (title: string, file: string, test: Test) => {
    count[test.status as keyof typeof count] += 1;
    return {
      title,
      file,
      tests: [
        {
          projectName: 'chromium',
          status: test.status,
          annotations: (test.annotations ?? []).map((type) => ({ type })),
          results: test.results
        }
      ]
    };
  };
  const suites = [
    {
      title: 'a.spec.ts',
      file: 'a.spec.ts',
      specs: [],
      suites: [
        {
          title: 'the journey',
          file: 'a.spec.ts',
          specs: [entry('first', 'a.spec.ts', tests.first), entry('second', 'a.spec.ts', tests.second)],
          suites: []
        }
      ]
    },
    { title: 'b.spec.ts', file: 'b.spec.ts', specs: [entry('third', 'b.spec.ts', tests.third)], suites: [] }
  ];
  return { suites, stats: { ...count, startTime: START, duration: 5000 }, errors: [] };
}

const green: Test = { status: 'expected', results: [passedResult()] };

const FIXTURES = {
  green: fixtureReport({ first: green, second: green, third: green }),
  failure: fixtureReport({ first: green, second: { status: 'unexpected', results: [failedResult()] }, third: green }),
  flaky: fixtureReport({
    first: green,
    second: { status: 'flaky', results: [failedResult(), passedResult('2026-11-20T10:00:05.000Z')] },
    third: green
  }),
  didNotRun: fixtureReport({ first: green, second: green, third: { status: 'skipped', results: [] } })
};

const tempDirs: Array<string> = [];

/** A fresh run directory holding `results.json`, plus any other wrapper files given. */
function runDir(report: unknown, files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-report-'));
  tempDirs.push(dir);
  if (report !== null) {
    fs.writeFileSync(path.join(dir, 'results.json'), typeof report === 'string' ? report : JSON.stringify(report));
  }
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
  return dir;
}

function run(script: string, args: Array<string>) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

function summaryOf(dir: string) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf8'));
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('classifyTests', () => {
  const kindOf = (test: Test) =>
    reportModule.classifyTests(fixtureReport({ first: green, second: green, third: test })).at(-1)?.kind;

  it('classifies a skipped test with no results and no declared skip as did-not-run', () => {
    expect(kindOf({ status: 'skipped', results: [] })).toBe('didNotRun');
  });

  it.each(['skip', 'fixme'])('classifies a skipped test with a %s annotation as a declared skip', (annotation) => {
    expect(kindOf({ status: 'skipped', annotations: [annotation], results: [] })).toBe('skipped');
  });

  it('classifies a skipped test with a recorded result as a declared skip', () => {
    expect(kindOf({ status: 'skipped', results: [{ status: 'skipped', startTime: START, duration: 0 }] })).toBe(
      'skipped'
    );
  });

  it.each([
    ['expected', 'passed'],
    ['unexpected', 'failed'],
    ['flaky', 'flaky']
  ])('classifies a test with status %s as %s', (status, kind) => {
    expect(kindOf({ status, results: [passedResult()] })).toBe(kind);
  });

  it('names a test by its describe titles and its own, and sums its durations and error text', () => {
    const [, second] = reportModule.classifyTests(FIXTURES.flaky);
    expect(second).toMatchObject({
      project: 'chromium',
      file: 'a.spec.ts',
      title: 'the journey › second',
      kind: 'flaky',
      durationMs: 3000,
      errorText: 'expect(locator).toBeVisible() failed'
    });
    expect(second.results).toEqual([
      { status: 'failed', endMs: Date.parse(START) + 2000 },
      { status: 'passed', endMs: Date.parse('2026-11-20T10:00:05.000Z') + 1000 }
    ]);
  });
});

describe('readReport', () => {
  const codeOf = (dir: string) => {
    try {
      reportModule.readReport(dir);
    } catch (error) {
      expect(error).toBeInstanceOf(reportModule.ReportError);
      return (error as { code: string }).code;
    }
    return null;
  };

  it('reads and classifies a complete report', () => {
    expect(reportModule.readReport(runDir(FIXTURES.green)).tests.map((t) => t.kind)).toEqual([
      'passed',
      'passed',
      'passed'
    ]);
  });

  it.each([
    ['missing', () => runDir(null)],
    ['unparsable', () => runDir('{"suites": [')],
    ['not-a-report', () => runDir({ suites: [] })],
    ['cut-off', () => runDir({ suites: [], stats: { expected: 3, unexpected: 0, flaky: 0, skipped: 0 } })]
  ])('throws a ReportError with code %s', (code, dir) => {
    expect(codeOf(dir())).toBe(code);
  });

  it('resolves the repository root from its own location', () => {
    expect(fs.existsSync(path.join(reportModule.repoRoot, 'tests', 'scripts', 'e2e-report.mjs'))).toBe(true);
  });
});

describe('the fixture reports, judged by both scripts', () => {
  it.each([
    ['green', { passed: 3, failed: 0, flaky: 0, didNotRun: 0 }, 0, /^VERDICT OK: 3 tests/m],
    [
      'failure',
      { passed: 2, failed: 1, flaky: 0, didNotRun: 0 },
      1,
      /^VERDICT FAIL: failed outside the red controls: .*second/m
    ],
    ['flaky', { passed: 2, failed: 0, flaky: 1, didNotRun: 0 }, 1, /^VERDICT FAIL: flaky: .*second/m],
    ['didNotRun', { passed: 2, failed: 0, flaky: 0, didNotRun: 1 }, 1, /^VERDICT FAIL: did not run: .*third/m]
  ] as const)('%s: summary.json counts %j and the verdict exits %i', (name, counts, status, line) => {
    const dir = runDir(FIXTURES[name]);
    expect(run(EVIDENCE_SCRIPT, [dir]).status).toBe(0);
    expect(summaryOf(dir).counts).toEqual({ total: 3, skipped: 0, ...counts });
    const verdict = run(VERDICT_SCRIPT, [dir, '--passed', 'b.spec.ts']);
    expect(verdict.status).toBe(status);
    expect(verdict.out).toMatch(line);
  });

  it('e2e-evidence.mjs exits 3 on a cut-off report, as e2e-spec-verdict.mjs does', () => {
    const dir = runDir({ suites: [], stats: { expected: 3, unexpected: 0, flaky: 0, skipped: 0 } });
    expect(run(EVIDENCE_SCRIPT, [dir]).status).toBe(3);
    expect(run(VERDICT_SCRIPT, [dir]).status).toBe(3);
  });
});

describe('e2e-evidence.mjs on a void run', () => {
  const marker = (lastBeat: string) =>
    `the wrapper was not scheduled for 60 s\ngap_ms=60000\nlast_beat_before_gap_utc=${lastBeat}\nfirst_beat_after_gap_utc=2026-11-20T10:02:00Z\n`;

  /** `second` fails at 10:00:02, `third` fails at 10:05:02, after the gap. */
  const report = () =>
    fixtureReport({
      first: green,
      second: { status: 'unexpected', results: [failedResult()] },
      third: { status: 'unexpected', results: [failedResult('2026-11-20T10:05:00.000Z')] }
    });

  it('lists in summary.json and provenance.txt the failures that ended before the last beat, and only those', () => {
    const dir = runDir(report(), { 'VOID-host-suspend.txt': marker('2026-11-20T10:01:00Z') });
    const r = run(EVIDENCE_SCRIPT, [dir]);
    expect(r.status).toBe(0);
    expect(r.out).toMatch(/VOID: .*1 failed before the gap/);
    expect(summaryOf(dir).failedBeforeGap).toEqual(['chromium › a.spec.ts › the journey › second']);
    const provenance = fs.readFileSync(path.join(dir, 'provenance.txt'), 'utf8');
    expect(provenance).toMatch(/^failed-before-gap: 1 -- diagnose each like any red test$/m);
    expect(provenance).toMatch(/^ {2}chromium › a\.spec\.ts › the journey › second$/m);
    expect(provenance).not.toMatch(/the journey › third|b\.spec\.ts › third/);
  });

  it('lists no failure when every failure ended after the last beat', () => {
    const dir = runDir(report(), { 'VOID-host-suspend.txt': marker('2026-11-20T09:59:00Z') });
    expect(run(EVIDENCE_SCRIPT, [dir]).status).toBe(0);
    expect(summaryOf(dir).failedBeforeGap).toEqual([]);
    expect(fs.readFileSync(path.join(dir, 'provenance.txt'), 'utf8')).toMatch(/^failed-before-gap: 0$/m);
  });

  it('writes failedBeforeGap as null, and no failed-before-gap line, for a run that is not void', () => {
    const dir = runDir(report());
    expect(run(EVIDENCE_SCRIPT, [dir]).status).toBe(0);
    expect(summaryOf(dir).failedBeforeGap).toBeNull();
    expect(fs.readFileSync(path.join(dir, 'provenance.txt'), 'utf8')).not.toMatch(/failed-before-gap/);
  });
});
