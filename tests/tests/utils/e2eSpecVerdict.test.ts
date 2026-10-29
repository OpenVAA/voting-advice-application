/**
 * Unit tests for `tests/scripts/e2e-spec-verdict.mjs`, the script that turns a run directory's Playwright report into one exit status.
 *
 * The script is run as a caller runs it: as a process, with the running Node binary, against a `results.json` written into a fresh temporary directory. Every case asserts the exact exit status, and every case that expects a failure also asserts the line that says why, so a failure for the wrong reason is not taken for the right one.
 *
 * Run: yarn test:unit:tests e2eSpecVerdict
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPTS_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../scripts');
const SCRIPT = path.join(SCRIPTS_DIR, 'e2e-spec-verdict.mjs');
const EVIDENCE_SCRIPT = path.join(SCRIPTS_DIR, 'e2e-evidence.mjs');

/** The line both scripts classify a skipped test with. The two must never disagree on a report. */
const DID_NOT_RUN_RULE = "const declarativeSkip = annotations.includes('skip') || annotations.includes('fixme');";

/** An escape character, built at run time so that no control character sits in this file. */
const ESC = String.fromCharCode(27);

type Status = 'expected' | 'unexpected' | 'flaky' | 'skipped';

type ResultFixture = {
  status?: string;
  error?: { message: string };
  errors?: Array<{ message: string }>;
};

type TestFixture = {
  title: string;
  status: Status;
  project?: string;
  annotations?: Array<string>;
  results?: Array<ResultFixture>;
};

type Stats = { expected: number; unexpected: number; flaky: number; skipped: number };

/** The results a test of each status carries when a case does not give its own. A skipped test carries none, which is what a test that did not run looks like. */
function defaultResults(status: Status): Array<ResultFixture> {
  if (status === 'skipped') return [];
  if (status === 'unexpected') return [{ status: 'failed', error: { message: 'boom' }, errors: [{ message: 'boom' }] }];
  if (status === 'flaky') return [{ status: 'failed', error: { message: 'boom' } }, { status: 'passed' }];
  return [{ status: 'passed' }];
}

/** A report in the shape of Playwright's JSON reporter: one top-level suite per spec file, one spec per test, and `stats` counted from the tests unless a case overrides them. */
function buildReport(files: Record<string, Array<TestFixture>>, stats?: Partial<Stats>): Record<string, unknown> {
  const counted: Stats = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
  const suites = Object.entries(files).map(([file, tests]) => ({
    title: file,
    file,
    specs: tests.map((t) => {
      counted[t.status] += 1;
      return {
        title: t.title,
        file,
        tests: [
          {
            projectName: t.project ?? 'chromium',
            status: t.status,
            annotations: (t.annotations ?? []).map((type) => ({ type })),
            results: t.results ?? defaultResults(t.status)
          }
        ]
      };
    }),
    suites: []
  }));
  return { suites, stats: { ...counted, ...stats }, errors: [] };
}

const tempDirs: Array<string> = [];

/** A fresh run directory holding `results.json` with the given content, raw text written as is. */
function runDir(report: Record<string, unknown> | string | null): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-spec-verdict-'));
  tempDirs.push(dir);
  if (report !== null) {
    fs.writeFileSync(path.join(dir, 'results.json'), typeof report === 'string' ? report : JSON.stringify(report));
  }
  return dir;
}

/** A file holding the given lines, for `--skipped-baseline`. */
function baselineFile(lines: Array<string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-spec-verdict-baseline-'));
  tempDirs.push(dir);
  const file = path.join(dir, 'skipped-baseline.txt');
  fs.writeFileSync(file, lines.length === 0 ? '' : `${lines.join('\n')}\n`);
  return file;
}

type Outcome = { status: number | null; stdout: string; stderr: string; out: string };

function verdict(args: Array<string>): Outcome {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, out: `${r.stdout}${r.stderr}` };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const TWO_PASSED = {
  'a.spec.ts': [
    { title: 'first', status: 'expected' as const },
    { title: 'second', status: 'expected' as const }
  ]
};

describe('--passed', () => {
  it('exits 0 and prints VERDICT OK when every test of the named spec file passed', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED)), '--passed', 'a.spec.ts']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^VERDICT OK/m);
  });

  it('exits 1 naming the file and the test when a test of the named spec file is flaky', () => {
    const report = buildReport({
      'a.spec.ts': [
        { title: 'first', status: 'expected' },
        { title: 'wobbly', status: 'flaky' }
      ]
    });
    const r = verdict([runDir(report), '--passed', 'a.spec.ts']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL:.*a\.spec\.ts.*wobbly/m);
  });

  it('exits 1 when no test of the named spec file is in the report', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED)), '--passed', 'missing.spec.ts']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: no test of missing\.spec\.ts is in the report/m);
  });

  it('exits 1 when the value is only the ending of another file name', () => {
    const report = buildReport({ 'tests/x/extra-a.spec.ts': [{ title: 'first', status: 'expected' }] });
    const r = verdict([runDir(report), '--passed', 'a.spec.ts']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: no test of a\.spec\.ts is in the report/m);
  });

  it('exits 1 when the value matches two spec files of the report', () => {
    const report = buildReport({
      'tests/x/a.spec.ts': [{ title: 'first', status: 'expected' }],
      'tests/y/a.spec.ts': [{ title: 'second', status: 'expected' }]
    });
    const r = verdict([runDir(report), '--passed', 'a.spec.ts']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: a\.spec\.ts matches more than one spec file/m);
  });

  it('exits 2 when the value holds a path separator', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED)), '--passed', 'tests/a.spec.ts']);
    expect(r.status).toBe(2);
  });

  it('exits 1 naming the test as skipped when a declared skip sits inside a spec named with --passed', () => {
    const report = buildReport({
      'a.spec.ts': [
        { title: 'first', status: 'expected' },
        { title: 'parked', status: 'skipped', annotations: ['skip'] }
      ]
    });
    const r = verdict([runDir(report), '--passed', 'a.spec.ts']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL:.*a\.spec\.ts.*parked.*skipped/m);
  });

  it('exits 0 for the same declared skip when its spec is not named with --passed and a baseline lists it', () => {
    const report = buildReport({
      'a.spec.ts': [
        { title: 'first', status: 'expected' },
        { title: 'parked', status: 'skipped', annotations: ['skip'] }
      ]
    });
    const r = verdict([runDir(report), '--skipped-baseline', baselineFile(['chromium › a.spec.ts › parked'])]);
    expect(r.status).toBe(0);
  });
});

describe('a test that did not run', () => {
  const report = () =>
    buildReport({
      'a.spec.ts': [
        { title: 'first', status: 'expected' },
        { title: 'never started', status: 'skipped' }
      ]
    });

  it('fails a run with no condition flag at all', () => {
    const r = verdict([runDir(report())]);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: did not run: .*never started/m);
  });

  it('fails a run whatever condition flags are given', () => {
    const r = verdict([runDir(report()), '--no-flaky', '--passed-test', 'first']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: did not run: .*never started/m);
  });

  it('no longer fails the run alone under --allow-did-not-run', () => {
    const r = verdict([runDir(report()), '--allow-did-not-run']);
    expect(r.status).toBe(0);
  });

  it('is a declared skip, not a test that did not run, when it carries a fixme annotation', () => {
    const fixme = buildReport({ 'a.spec.ts': [{ title: 'parked', status: 'skipped', annotations: ['fixme'] }] });
    const r = verdict([runDir(fixme)]);
    expect(r.status).toBe(0);
  });

  it('is the rule tests/scripts/e2e-evidence.mjs uses, written the same way in both scripts', () => {
    expect(fs.readFileSync(EVIDENCE_SCRIPT, 'utf8')).toContain(DID_NOT_RUN_RULE);
    expect(fs.readFileSync(SCRIPT, 'utf8')).toContain(DID_NOT_RUN_RULE);
  });
});

describe('--skipped-baseline', () => {
  const report = () =>
    buildReport({
      'b.spec.ts': [
        { title: 'zeta', status: 'skipped', annotations: ['skip'] },
        { title: 'alpha', status: 'skipped', annotations: ['fixme'], project: 'firefox' },
        { title: 'runs', status: 'expected' }
      ]
    });

  it('exits 0 when the declared skips equal the baseline lines', () => {
    const baseline = baselineFile(['chromium › b.spec.ts › zeta', 'firefox › b.spec.ts › alpha']);
    const r = verdict([runDir(report()), '--skipped-baseline', baseline]);
    expect(r.status).toBe(0);
  });

  it('exits 1 printing the lines only in the report and only in the baseline when they differ', () => {
    const baseline = baselineFile(['chromium › b.spec.ts › zeta', 'chromium › b.spec.ts › gone']);
    const r = verdict([runDir(report()), '--skipped-baseline', baseline]);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: skipped only in the report: firefox › b\.spec\.ts › alpha$/m);
    expect(r.out).toMatch(/^VERDICT FAIL: skipped only in the baseline: chromium › b\.spec\.ts › gone$/m);
  });

  it('takes an empty baseline file and a report with no declared skip as equal', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED)), '--skipped-baseline', baselineFile([])]);
    expect(r.status).toBe(0);
  });

  it('exits 2 when the baseline file does not exist', () => {
    const r = verdict([
      runDir(buildReport(TWO_PASSED)),
      '--skipped-baseline',
      path.join(os.tmpdir(), 'no-such-baseline-file.txt')
    ]);
    expect(r.status).toBe(2);
  });
});

describe('--failed-test', () => {
  const report = (status: Status) =>
    buildReport({
      'p.spec.ts': [
        { title: 'stores no session id', status },
        { title: 'other', status: 'expected' }
      ]
    });

  it('exits 0 when a test whose title contains the text failed', () => {
    const r = verdict([runDir(report('unexpected')), '--failed-test', 'stores no session id']);
    expect(r.status).toBe(0);
  });

  it('exits 1 when that test passed', () => {
    const r = verdict([runDir(report('expected')), '--failed-test', 'stores no session id']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: .*stores no session id.*did not fail/m);
  });

  it('exits 1 when no title contains the text', () => {
    const r = verdict([runDir(report('unexpected')), '--failed-test', 'holds no cookie']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: no test title contains "holds no cookie"/m);
  });
});

describe('--failure-contains', () => {
  const CONTROL = 'holds only allow-listed state';
  const NEEDLE = 'appContext-sessionId';
  const report = (results: Array<ResultFixture>) =>
    buildReport({
      'p.spec.ts': [
        { title: CONTROL, status: 'unexpected', results },
        { title: 'other', status: 'expected' }
      ]
    });

  it('exits 0 when the failed test carries the text in error.message', () => {
    const r = verdict([
      runDir(report([{ error: { message: `found ${NEEDLE} in storage` } }])),
      '--failed-test',
      CONTROL,
      '--failure-contains',
      NEEDLE
    ]);
    expect(r.status).toBe(0);
  });

  it('exits 0 when the failed test carries the text in an errors entry', () => {
    const r = verdict([
      runDir(report([{ errors: [{ message: 'first' }, { message: `found ${NEEDLE}` }] }])),
      '--failed-test',
      CONTROL,
      '--failure-contains',
      NEEDLE
    ]);
    expect(r.status).toBe(0);
  });

  it('finds the text through colour sequences', () => {
    const coloured = `${ESC}[31mfound appContext-${ESC}[2msessionId${ESC}[22m in storage${ESC}[39m`;
    const r = verdict([
      runDir(report([{ error: { message: coloured } }])),
      '--failed-test',
      CONTROL,
      '--failure-contains',
      NEEDLE
    ]);
    expect(r.status).toBe(0);
  });

  it('exits 1 naming the test and the missing text when the test failed with another message', () => {
    const r = verdict([
      runDir(report([{ error: { message: 'Test timeout of 30000ms exceeded.' } }])),
      '--failed-test',
      CONTROL,
      '--failure-contains',
      NEEDLE
    ]);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(new RegExp(`^VERDICT FAIL: .*${CONTROL}.*"${NEEDLE}"`, 'm'));
  });

  it('requires every text given after one --failed-test', () => {
    const results = [{ error: { message: `found ${NEEDLE} in localStorage` } }];
    const both = verdict([
      runDir(report(results)),
      '--failed-test',
      CONTROL,
      '--failure-contains',
      NEEDLE,
      '--failure-contains',
      'localStorage'
    ]);
    expect(both.status).toBe(0);
    const oneMissing = verdict([
      runDir(report(results)),
      '--failed-test',
      CONTROL,
      '--failure-contains',
      NEEDLE,
      '--failure-contains',
      'sessionStorage'
    ]);
    expect(oneMissing.status).toBe(1);
    expect(oneMissing.out).toMatch(/^VERDICT FAIL: .*"sessionStorage"/m);
  });

  it('exits 2 when no --failed-test comes before it', () => {
    const r = verdict([runDir(report([{ error: { message: NEEDLE } }])), '--failure-contains', NEEDLE]);
    expect(r.status).toBe(2);
  });
});

describe('--passed-test', () => {
  it('exits 0 when a title contains the text and every such test passed', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED)), '--passed-test', 'irs']);
    expect(r.status).toBe(0);
  });

  it('exits 1 when one test whose title contains the text did not pass', () => {
    const report = buildReport({
      'a.spec.ts': [
        { title: 'first', status: 'expected' },
        { title: 'first again', status: 'unexpected' }
      ]
    });
    const r = verdict([runDir(report), '--passed-test', 'first']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: .*first again/m);
  });

  it('exits 1 when no title contains the text', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED)), '--passed-test', 'third']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: no test title contains "third"/m);
  });
});

describe('--no-other-failures', () => {
  const report = () =>
    buildReport({
      'p.spec.ts': [
        { title: 'the red control', status: 'unexpected' },
        { title: 'an unrelated test', status: 'unexpected' }
      ]
    });

  it('exits 1 when a test that matches no --failed-test value failed', () => {
    const r = verdict([runDir(report()), '--failed-test', 'the red control', '--no-other-failures']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: failed outside the red controls: .*an unrelated test/m);
  });

  it('exits 1 with no --failed-test value at all when any test failed', () => {
    const one = buildReport({ 'p.spec.ts': [{ title: 'only', status: 'unexpected' }] });
    const r = verdict([runDir(one), '--no-other-failures']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: failed outside the red controls: .*only/m);
  });

  it('exits 0 when the only failures are the red controls', () => {
    const r = verdict([
      runDir(report()),
      '--failed-test',
      'the red control',
      '--failed-test',
      'an unrelated test',
      '--no-other-failures'
    ]);
    expect(r.status).toBe(0);
  });
});

describe('--no-flaky', () => {
  it('exits 1 naming the flaky test', () => {
    const report = buildReport({
      'a.spec.ts': [{ title: 'steady', status: 'expected' }],
      'c.spec.ts': [{ title: 'wobbly', status: 'flaky' }]
    });
    const r = verdict([runDir(report), '--no-flaky']);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: flaky: .*c\.spec\.ts.*wobbly/m);
  });
});

describe('--print-skipped', () => {
  it('writes the sorted declared-skip lines, and nothing else, to standard output', () => {
    const report = buildReport({
      'b.spec.ts': [
        { title: 'zeta', status: 'skipped', annotations: ['skip'] },
        { title: 'alpha', status: 'skipped', annotations: ['fixme'] },
        { title: 'runs', status: 'expected' }
      ]
    });
    const r = verdict([runDir(report), '--print-skipped']);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('chromium › b.spec.ts › alpha\nchromium › b.spec.ts › zeta\n');
    expect(r.stderr).toMatch(/^VERDICT OK/m);
  });
});

describe('a report that holds no test', () => {
  const empty = () => buildReport({});

  it.each([
    ['no flag', () => []],
    [
      '--no-other-failures --no-flaky --skipped-baseline <an empty file>',
      () => ['--no-other-failures', '--no-flaky', '--skipped-baseline', baselineFile([])]
    ],
    ['--allow-did-not-run --no-other-failures', () => ['--allow-did-not-run', '--no-other-failures']],
    ['--print-skipped', () => ['--print-skipped']]
  ])('exits 1 under %s', (_name, flags) => {
    const r = verdict([runDir(empty()), ...flags()]);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/^VERDICT FAIL: the report holds no test/m);
  });
});

describe('a cut-off report', () => {
  it('exits 3 when stats count tests and the suites array is empty', () => {
    const r = verdict([runDir({ suites: [], stats: { expected: 4, unexpected: 0, flaky: 0, skipped: 0 } })]);
    expect(r.status).toBe(3);
  });

  it('exits 3 when stats count tests and the suites array is absent', () => {
    const r = verdict([runDir({ stats: { expected: 4, unexpected: 0, flaky: 0, skipped: 0 } })]);
    expect(r.status).toBe(3);
  });

  it('exits 3 when the suites tree holds fewer tests than stats count', () => {
    const r = verdict([
      runDir(buildReport(TWO_PASSED, { expected: 3, unexpected: 1, flaky: 0, skipped: 1 })),
      '--passed',
      'a.spec.ts'
    ]);
    expect(r.status).toBe(3);
  });

  it('judges by the flags as usual when the tree holds as many tests as stats count', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED, { expected: 2 })), '--passed', 'a.spec.ts']);
    expect(r.status).toBe(0);
  });

  it('judges by the flags as usual when the tree holds more tests than stats count', () => {
    const r = verdict([runDir(buildReport(TWO_PASSED, { expected: 1 })), '--passed', 'a.spec.ts']);
    expect(r.status).toBe(0);
  });
});

describe('a missing or unusable report, and unusable arguments', () => {
  it('exits 3 when the run directory holds no results.json', () => {
    expect(verdict([runDir(null)]).status).toBe(3);
  });

  it('exits 3 when results.json is not valid JSON', () => {
    expect(verdict([runDir('{"suites": [')]).status).toBe(3);
  });

  it('exits 2 with no run directory argument', () => {
    expect(verdict([]).status).toBe(2);
  });

  it('exits 2 on an unknown flag', () => {
    expect(verdict([runDir(buildReport(TWO_PASSED)), '--everything-passed']).status).toBe(2);
  });

  it('exits 2 on a flag without its value', () => {
    expect(verdict([runDir(buildReport(TWO_PASSED)), '--passed']).status).toBe(2);
  });
});

describe('what the script may do', () => {
  it('imports nothing but node:fs and node:path, and starts no process and writes no file', () => {
    const source = fs.readFileSync(SCRIPT, 'utf8');
    const imports = [...source.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]).sort();
    expect(imports).toEqual(['node:fs', 'node:path']);
    expect(source).not.toMatch(
      /child_process|\bspawn|\bexec(Sync|File)?\(|\bfork\(|writeFile|appendFile|createWriteStream|mkdirSync|rmSync|unlinkSync|renameSync|copyFile/
    );
  });
});
