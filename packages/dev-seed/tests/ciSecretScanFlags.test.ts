/**
 * The secret-scan gate's FLAGS, asserted rather than described.
 *
 * ## The incident this file exists for
 *
 * The `secret-scan` job runs trufflehog with exactly one argument, `--config=.github/trufflehog-openvaa.yml`, and carries a long comment saying that a result-type filter must never be added. A comment is not enough here, because the flag that would silence this gate is the tool's own most-copied documentation line: trufflehog's README GitHub Action example passes a `--results=verified,unknown` filter. That configuration sets `notifyUnverifiedResults = false` (pkg/engine/engine.go:327-341), and the repo-private `OpenVAACIEvidenceToken` detector deliberately carries no `verify:` block, so every finding it can ever produce is classified `unverified`. Pasting the README line therefore does not narrow the gate -- it turns the gate off for our own detector, and the build goes green while the scanner saw the secret. That is a silent green, the worst failure shape a gate has, and it is one search-and-paste away at all times.
 *
 * The CLI's DEFAULT result set is `verified,unverified,unknown`: the results flag defaults to the empty string (main.go:62), `parseResults` returns nil for empty input (main.go:1281-1284), and the engine then sets all three notify flags unconditionally (pkg/engine/engine.go:393-395). So the correct configuration is to pass no filter at all, and this file asserts that absence.
 *
 * ## Why it lives in packages/dev-seed
 *
 * Same reason as its sibling `ciTypecheckGate.test.ts`, whose shape this file follows: `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests. Read that file's docblock for the fuller version.
 *
 * ## Why COMMENT LINES ARE STRIPPED BEFORE THE FLAG ASSERTIONS
 *
 * This is the load-bearing subtlety of the file. The `secret-scan` job's own comment block names the forbidden flags in order to forbid them, and the detector config's header quotes the README line it warns against. A naive text grep over the workflow finds those occurrences and reddens on the PROHIBITION rather than on any usage -- and the natural "fix" for that false red is to delete the warning, which is precisely backwards. So the flag assertions below run over the job region with every `#` comment line removed. A match inside a guard's own prohibition statement is prose, not usage.
 *
 * ## Why the assertions are text-level, and where they are NOT
 *
 * No YAML parser is a dependency of this workspace, and adding one to assert a handful of lines would be a worse trade -- again per `ciTypecheckGate.test.ts`. The uniqueness guards below exist so a renamed or duplicated job cannot make the later assertions measure the wrong region, or measure nothing and pass.
 *
 * There is one property this file deliberately does NOT assert: that the job carries no `dorny/paths-filter` step and no `if:` key. That check belongs on a PARSED workflow rather than on its text, for the same comment-versus-usage reason, and comment-stripping alone does not settle it because an `if:` is a key rather than a token. The plan's acceptance criteria run that one structurally against the parsed YAML instead.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const WORKFLOW = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8');

const JOB_KEY = '\n  secret-scan:';
const NEXT_JOB_KEY = '\n  frontend-and-shared-module-validation:';
/**
 * The tool's USAGE token, deliberately not the bare `trufflesecurity/trufflehog` string. The bare name also appears in the job's comment block, which records that the git tag (`v3.97.2`) and the ghcr image tag (`3.97.2`) spell the same release differently -- a real gotcha that must stay written down. Counting the bare name makes the guard redden on that prose and invites deleting it, which is backwards. What the guard actually needs to hold is ONE STEP, not one mention.
 */
const TOOL_STEP = 'uses: trufflesecurity/trufflehog@';
const DETECTOR_CONFIG = '.github/trufflehog-openvaa.yml';

/**
 * Every spelling that drops unverified findings. The hidden one is still parsed (main.go:61), so it is still a live way to silence this gate.
 */
const RESULT_FILTER_TOKENS = ['--results', '--only-verified'];

/** The `secret-scan` job region with `#` comment lines removed. See the docblock: a match inside the job's own prohibition statement is prose, not usage. */
function secretScanCode(): string {
  const start = WORKFLOW.indexOf(JOB_KEY);
  const end = WORKFLOW.indexOf(NEXT_JOB_KEY, start);
  return WORKFLOW.slice(start, end)
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

describe('the CI secret-scan gate is wired so it can actually report our own detector', () => {
  it('declares the job key and the trufflehog step exactly once each', () => {
    // Guards every assertion below. A duplicated job would let a second, differently-flagged copy exist unnoticed; a renamed one would make the region reads return -1 and the region slice silently measure the wrong text. A second trufflehog step anywhere in the workflow is the same defect in a different place: the flag assertions below would still pass on the first one while the second ran unfiltered.
    expect(WORKFLOW.split(JOB_KEY)).toHaveLength(2);
    expect(WORKFLOW.split(TOOL_STEP)).toHaveLength(2);
  });

  it('bounds the job region correctly before anything reads it', () => {
    // The region slice is only meaningful if the next job key really follows this one. Asserted separately so a reordering of the job list fails HERE, naming the cause, instead of quietly shrinking the region the flag assertions run over.
    expect(WORKFLOW.indexOf(JOB_KEY)).toBeGreaterThan(-1);
    expect(WORKFLOW.indexOf(NEXT_JOB_KEY)).toBeGreaterThan(WORKFLOW.indexOf(JOB_KEY));
    expect(secretScanCode()).toContain(TOOL_STEP);
  });

  it('passes NO result-type filter in the job, comments excluded', () => {
    const code = secretScanCode();
    for (const token of RESULT_FILTER_TOKENS) {
      expect(code).not.toContain(token);
    }
  });

  it('passes the detector config plus only explicitly allowlisted flags as extra_args', () => {
    // Originally this asserted the detector config was the ONLY extra_args. That assertion FIRED, correctly, when `--exclude-paths` was added on 2026-09-03 after the first observed run measured a non-zero scan baseline. It is widened rather than deleted: every flag must still be named here, so an unreviewed argument -- above all a result-type filter -- still fails. Widening the allowlist is a deliberate edit with a reason; pasting a flag is not.
    const ALLOWED_FLAGS = new Set(['--config', '--exclude-paths']);
    const extraArgs = secretScanCode()
      .split('\n')
      .filter((line) => /^\s*extra_args:/.test(line));
    expect(extraArgs).toHaveLength(1);
    const flags = extraArgs[0]
      .replace(/^\s*extra_args:\s*/, '')
      .trim()
      .split(/\s+/);
    expect(flags.length).toBeGreaterThan(0);
    for (const flag of flags) {
      expect(ALLOWED_FLAGS.has(flag.split('=')[0])).toBe(true);
    }
    expect(flags).toContain(`--config=${DETECTOR_CONFIG}`);
    // The exclusion list carries only MEASURED false positives and must exist: a typo'd path silently disables no exclusions, which reddens the gate for reasons unrelated to the change under test.
    const excludeFlag = flags.find((f) => f.startsWith('--exclude-paths='));
    if (excludeFlag) {
      expect(existsSync(resolve(REPO_ROOT, excludeFlag.split('=')[1]))).toBe(true);
    }
    // The detector config is what makes the criterion-3 plant visible at all; the built-in detectors cannot see a repo-private prefix. A typo in this path yields a scan with only the built-ins, which passes while seeing nothing.
    expect(existsSync(resolve(REPO_ROOT, DETECTOR_CONFIG))).toBe(true);
  });

  it('pins the Action to a release tag rather than a moving ref', () => {
    // Every other Action in this workflow is pinned, and a recorded evidence run is only reproducible against a fixed version. A moving ref would also silently change the scanner's behaviour between the red half and the green half of a red/green proof, which is the one thing an evidence pair must not do.
    expect(secretScanCode()).toMatch(/uses: trufflesecurity\/trufflehog@v\d+\.\d+\.\d+/);
    expect(secretScanCode()).not.toContain('trufflesecurity/trufflehog@main');
  });

  it('keeps the detector config free of a verify: block', () => {
    // Wired-but-neutered is the third failure mode. Adding `verify:` would make the detector's findings verifiable, which means the plant would have to be a working credential -- forbidden by D-L4 and by CLAUDE.md -- and it would also make this job issue a live request for every match.
    const detectorConfig = readFileSync(resolve(REPO_ROOT, DETECTOR_CONFIG), 'utf8');
    expect(detectorConfig).toContain('OpenVAACIEvidenceToken');
    expect(detectorConfig).toContain('OPENVAA_CI_EVIDENCE');
    expect(detectorConfig).not.toMatch(/^\s*verify:/m);
  });

  it('keeps the evidence trigger glob on on.push.branches', () => {
    // Without this glob no push from a non-`main` branch produces a run at all, and a missing run is indistinguishable from a passing one. It is the mechanism every observed-run criterion in Phase 163 and every later one depends on, so its deletion must redden something.
    expect(WORKFLOW).toContain('- "ci-evidence/**"');
  });
});
