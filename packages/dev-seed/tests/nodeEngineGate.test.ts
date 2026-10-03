/**
 * The node-engine guard's WIRING, asserted rather than described.
 *
 * The constraint this protects had to be built by hand, and the reason is worth stating once so nobody removes it as redundant with the package manager. The pinned Yarn release enforces `engines` in no mode at all: the bundle carries zero occurrences of any engine-check setting, its own bundled string says engine checking "isn't a core feature anymore", the 101-entry settings registry has no engine-related key, and a scratch project declaring an impossible range installs cleanly with neither error nor warning. There is nothing upstream to defer to.
 *
 * Nor does CI cover it by reading the field. The action that can read a version out of a manifest returns `null` when `engines.node` is absent, and its caller answers `null` with a warning and an empty version — installing no Node at all and continuing on whatever the runner image had. A warning annotation is not a failure, so under that mechanism a re-misspelled field yields a yellow mark in a green run. That measured fact is what makes a repository-owned check the only thing that actually rejects an out-of-range Node.
 *
 * Which makes the load-bearing property WIRING, exactly as for the sibling guards: a check sitting unreferenced on disk still exists, still passes when run by hand, and reports nothing whatsoever once the link that invoked it is gone. So the three wirings are asserted here, and they are three rather than one because each closes a hole the others leave open.
 *
 * `preinstall` is the install-time half — the only one that rejects before a dependency is linked, locally and in CI alike. Measured against this Yarn release: a root `preinstall` does run, and a non-zero exit from it does fail the install. Its limit, also measured, is that Yarn treats root lifecycle scripts as a build and caches the result, so a repeat install over an unchanged tree skips them; it fires on a fresh clone, in CI, and after any previous failure.
 *
 * `lint:check` is the every-run half that closes that cache gap: uncached, and run by every CI job. Deleting either wiring leaves the tree green while the constraint has stopped being enforced, which is why neither is left to a comment.
 *
 * The CI negative-control job is the third wiring, and it covers a hole neither of the other two can reach. Both of those exercise the guard's ACCEPTING half only, because they run on whatever Node the developer or the runner already has, and that Node is always in range. The REJECTING half — the half the whole constraint is FOR — is exercised by nobody, because nobody develops on an unsupported Node. A half that nothing exercises can rot in silence: break the comparator, or make the guard return early, and every green run stays green. The job runs the guard under a deliberately out-of-range toolchain and requires it to reject, so that rot is loud.
 *
 * The second describe block below asserts the shape of that job rather than its result, for the same reason the first asserts wiring rather than behaviour. A job that has been softened into an exit-code-only assertion still runs, still passes, and still reports green while the guard has stopped comparing versions at all — the guard exits non-zero for four reasons that have nothing to do with the running Node's version, so only an assertion on the failure MESSAGE distinguishes a binding constraint from a broken one.
 *
 * ⚠ The invariant asserted for the chain is MEMBERSHIP, never terminal position, never the whole string, never the link count. Every link after a failing one is equally aborted, so guards may be appended freely, and an assertion on position or length reddens a correct append.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const GUARD = 'node scripts/assert-node-engine.mjs';

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
  engines: { node: string };
};

const JOB_KEY = 'node-engine-range-negative-control';
const JOB_HEADER = `  ${JOB_KEY}:`;

/**
 * The workflow with whole-line `#` comments dropped. Two of the assertions below forbid a literal that the job's own explanatory comment is entitled to name, and a guard whose prose invalidates it is worse than no guard: it reddens against a tree nobody has touched, which teaches the next reader to route around it rather than to fix anything. Reading the file through this filter is what keeps the comment and the assertion independent.
 */
const WORKFLOW_LINES = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8')
  .split('\n')
  .filter((line) => !/^\s*#/.test(line));

/**
 * The negative-control job's own block: from its key down to the next top-level job key, or to the end of the file. Sliced between markers rather than taken as "everything after the key", because this job is last only until the next job is appended after it, and a spec that assumes it stays last would start silently asserting over a stranger's YAML.
 */
const JOB_BLOCK = (() => {
  const start = WORKFLOW_LINES.indexOf(JOB_HEADER);
  if (start === -1) return '';
  const after = WORKFLOW_LINES.slice(start + 1);
  const next = after.findIndex((line) => /^ {2}\S/.test(line));
  return (next === -1 ? after : after.slice(0, next)).join('\n');
})();

describe('the node-engine guard is wired so it actually runs', () => {
  it('keeps `yarn assert:node-engine` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:node-engine');
  });

  it('keeps the guard on `preinstall`, so an out-of-range Node is rejected at install time', () => {
    // The half that gives the constraint its teeth. Losing it demotes the guard to something that only runs when somebody lints, which is not what "an out-of-range Node is rejected" means.
    expect(ROOT_PACKAGE_JSON.scripts.preinstall).toBe(GUARD);
  });

  it('points the registered script at the guard it claims to run', () => {
    // Wired-to-nothing is the second failure mode: a chain link naming a script key that no longer exists fails with a bare "command not found", which names no invariant and sends the reader nowhere.
    expect(ROOT_PACKAGE_JSON.scripts['assert:node-engine']).toBe(GUARD);
  });

  it('keeps the guard file itself present and recognisable', () => {
    // Wired-but-deleted is the third failure mode, and it belongs here rather than at install or lint time, where it would surface only as `node: cannot find module`.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-node-engine.mjs'), 'utf8')).toContain('NODE-ENGINE GUARD');
  });
});

describe('the CI negative control keeps exercising the guard it claims to exercise', () => {
  it('declares the negative-control job exactly once', () => {
    // Guards the region slice every assertion below reads from: a renamed or duplicated job key would make them measure the wrong block, or the empty string, and an assertion over an empty string passes every `not.toContain` it is given.
    expect(WORKFLOW_LINES.filter((line) => line === JOB_HEADER)).toHaveLength(1);
  });

  it('invokes the repository guard by path rather than reimplementing its comparison', () => {
    // The property that makes deleting the guard a red job instead of a quiet loss. A job that inlined the version comparison would keep passing after the guard file was removed, and would then be asserting something about itself.
    expect(JOB_BLOCK).toContain(GUARD);
  });

  it('asserts the guard rejected for the VERSION reason, not merely with a non-zero exit', () => {
    // The guard exits non-zero for four reasons that have nothing to do with the running Node: an unreadable manifest, a missing `engines` key, an empty `engines.node`, and a range outside its accepted grammar. An exit-code-only assertion is satisfied by all four, so it would report green while the guard had stopped comparing versions at all. The discriminator is the guard's own message prefix, which no other failure path emits.
    expect(JOB_BLOCK).toContain('assert-node-engine: this Node is ');
  });

  it('uses explicit negation rather than `continue-on-error` for its expected failure', () => {
    // `continue-on-error` un-blocks a step without asserting anything about why it failed, which is the opposite of what a negative control is for: the step would go green whether the guard rejected, crashed, or was never found. This file's idiom is an explicit `::error::` negation inside the step body.
    expect(JOB_BLOCK).not.toContain('continue-on-error');
  });

  it('keeps the out-of-range toolchain genuinely out of the declared range', () => {
    // The control is only a control while the Node it selects is one the declared range REFUSES. Widen `engines.node` to admit that major and the job would start asserting that an in-range Node is rejected, which is false, so it would go red — but red for a confusing reason, at a distance from the edit that caused it. This says so here instead. It fails closed: if either number stops being readable the test fails by name rather than quietly skipping the comparison.
    const selected = /node-version:\s*"?(\d+)\.x"?/.exec(JOB_BLOCK);
    const declared = /^>=\s*(\d+)/.exec(ROOT_PACKAGE_JSON.engines.node);
    expect(selected, 'the negative-control job no longer selects an `<major>.x` toolchain').not.toBeNull();
    expect(declared, 'the declared `engines.node` is no longer a bare `>=<major>` lower bound').not.toBeNull();
    expect(Number(selected?.[1])).toBeLessThan(Number(declared?.[1]));
  });

  it('never selects a CI toolchain from the manifest', () => {
    // `engines.node` is a RANGE, and the action that can read a version out of a manifest resolves a range to the newest release matching it. Adopting that input would therefore replace every fixed pin in this workflow with floating-latest, silently, while looking like a tidy-up that removed a duplicated literal. Asserted over the whole file so the trap cannot be walked into in any job.
    expect(WORKFLOW_LINES.join('\n')).not.toContain('node-version-file');
  });
});
