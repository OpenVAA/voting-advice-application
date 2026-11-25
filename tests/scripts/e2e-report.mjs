/**
 * e2e-report.mjs -- read a run directory's Playwright JSON report and classify every test in it once, for `e2e-evidence.mjs` and `e2e-spec-verdict.mjs`.
 *
 * Both scripts judge the same `results.json`, so the reading and the classification live here and nowhere else: the two cannot disagree about one report.
 *
 * DID-NOT-RUN IS NOT A SKIP. Playwright reports both as `status: "skipped"`. A test the runner never executed -- because a project it depends on failed, or the run was cut short -- carries an EMPTY `results` list and neither a `skip` nor a `fixme` annotation; any other skipped test is a declared skip. Under this project's cardinal E2E rule a did-not-run test counts as a failure, so the ambiguous case is classified as `didNotRun`, never as `skipped`.
 *
 * The module only reads. It starts no process and writes no file.
 */

import fs from 'node:fs';
import path from 'node:path';

/** The repository root, read from this file's own location. Decoded, so that a checkout path holding a space or another escaped character resolves. */
export const repoRoot = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..', '..');

/** A path as given, or read against the repository root when it is relative. */
export function resolveFromRepo(p) {
  return path.isAbsolute(p) ? p : path.join(repoRoot, p);
}

/** The separator a test's describe titles and its own title are joined with. */
export const TITLE_SEPARATOR = ' › ';

/** Colour sequences, removed from error text so that a caller can search it as plain text. */
const COLOUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, 'g');

/** The kind of one test entry: `passed`, `failed`, `flaky`, `skipped` (declared) or `didNotRun`. */
function kindOf(test) {
  const results = test.results ?? [];
  const annotations = (test.annotations ?? []).map((a) => a.type);
  const declaredSkip = annotations.includes('skip') || annotations.includes('fixme');
  if (test.status === 'skipped') return results.length === 0 && !declaredSkip ? 'didNotRun' : 'skipped';
  if (test.status === 'expected') return 'passed';
  if (test.status === 'flaky') return 'flaky';
  return 'failed';
}

/** When a result ended, in epoch milliseconds: its `startTime` plus its `duration`, or `NaN` when either is missing. */
function endOf(result) {
  const start = Date.parse(result.startTime ?? '');
  return Number.isFinite(result.duration) ? start + result.duration : Number.NaN;
}

/**
 * Every test entry of a Playwright JSON report, one record each, in report order.
 *
 * A record holds `project`, `file`, `title` (the describe titles and the test's own, joined by `TITLE_SEPARATOR`), `kind`, `durationMs` (the sum of its results' durations), `errorText` (every error message of every result, colour sequences removed) and `results` (each result's `status` and `endMs`).
 */
export function classifyTests(report) {
  const tests = [];
  function walk(suites, titles) {
    for (const suite of suites ?? []) {
      const own = suite.title && suite.title !== suite.file ? [...titles, suite.title] : titles;
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          const results = test.results ?? [];
          const messages = results.flatMap((r) => [r.error?.message, ...(r.errors ?? []).map((e) => e?.message)]);
          tests.push({
            project: test.projectName || '(no project)',
            file: spec.file ?? suite.file ?? '(no file)',
            title: [...own, spec.title ?? '(no title)'].join(TITLE_SEPARATOR),
            kind: kindOf(test),
            durationMs: results.reduce((sum, r) => sum + (r.duration ?? 0), 0),
            errorText: messages
              .filter((m) => typeof m === 'string')
              .join('\n')
              .replace(COLOUR, ''),
            results: results.map((r) => ({ status: r.status ?? '', endMs: endOf(r) }))
          });
        }
      }
      walk(suite.suites, own);
    }
  }
  walk(Array.isArray(report?.suites) ? report.suites : [], []);
  return tests;
}

/** A `results.json` that cannot be judged. `code` is `missing`, `unparsable`, `not-a-report` or `cut-off`. */
export class ReportError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Read `<runDir>/results.json` (a relative `runDir` is read against the repository root) and classify its tests.
 *
 * Throws a `ReportError` when the file is missing, is not JSON, has no `stats` object, or is cut off: its `stats` count more tests than its `suites` tree holds, so that no reader can take a truncated report for a complete one.
 */
export function readReport(runDir) {
  const resultsPath = path.join(resolveFromRepo(runDir), 'results.json');
  if (!fs.existsSync(resultsPath)) throw new ReportError('missing', `${resultsPath} is missing`);
  let report;
  try {
    report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  } catch (error) {
    throw new ReportError('unparsable', `${resultsPath} cannot be parsed: ${error.message}`);
  }
  if (report === null || typeof report !== 'object' || report.stats === null || typeof report.stats !== 'object') {
    throw new ReportError('not-a-report', `${resultsPath} is not a Playwright JSON report: it has no stats object`);
  }
  const tests = classifyTests(report);
  const statsTotal = ['expected', 'unexpected', 'flaky', 'skipped'].reduce(
    (sum, key) => sum + (Number.isFinite(report.stats[key]) ? report.stats[key] : 0),
    0
  );
  if (tests.length < statsTotal) {
    throw new ReportError(
      'cut-off',
      `${resultsPath} is cut off: its stats count ${statsTotal} tests and its suites hold ${tests.length}`
    );
  }
  return { resultsPath, report, tests };
}
