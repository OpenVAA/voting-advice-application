/**
 * The RPC return-nullability gate's WIRING, asserted rather than described.
 *
 * ## What the gate is
 *
 * PostgreSQL carries no nullability metadata on a function's OUT parameters, so the Supabase type generator declares every output column of a `RETURNS TABLE` function non-null. The nullability it throws away is restored in ONE place, `packages/supabase-types/src/database.overrides.ts`, merged in `src/database.merged.ts`, and the enumeration behind it is derived from the schema tree by `scripts/assert-rpc-return-nullability.mjs`. Two things keep that honest: the `supabase-types-drift` job in `.github/workflows/main.yaml`, which regenerates the types against a live Supabase and fails on a diff; and the `assert:rpc-nullability` link in the root `lint:check` chain.
 *
 * ## Why a comment is not enough here
 *
 * Both halves are silently deletable. Remove the CI job and nothing goes red — the tree still contains the override file, the merge, the script and the enumeration, and every local command still passes. Unhook `assert:rpc-nullability` from `lint:check` and the script survives on disk, runnable, running nowhere. A guard reports its own absence as a pass, which is the worst failure shape available to a gate: the enforcement, not the artefact, is what makes the mechanism durable, and the artefacts all outlive the enforcement.
 *
 * The `paths-filter` assertion below is the same argument one level down. The job carries no filter ON PURPOSE: `supabase/setup-cli@v1` is pinned to `version: latest`, so a CLI update can change the generator's output with NO repo path changing at all, and a path filter would skip the job in exactly that case. That absence is a mitigation, and an unasserted absence is one PR away from being narrowed back.
 *
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests: `ciTypecheckGate.test.ts` parses `.github/workflows/main.yaml` and the root `package.json` from `REPO_ROOT`, and `assertKnownRowProps.test.ts` parses `apps/supabase/supabase/schema/501-bulk-operations.sql`. This spec sits beside them rather than in a home of its own.
 *
 * ⚠ It is a text-level spec, deliberately: no YAML parser is a dependency of this workspace, and adding one to assert a handful of lines would be a worse trade. The job name and the step contents are matched verbatim, so renaming either reddens this file and sends the reader here.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const WORKFLOW = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8');
const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

const DRIFT_JOB = 'supabase-types-drift';
const GENERATED_TYPES = 'packages/supabase-types/src/database.ts';

/** A top-level job key in this workflow: exactly two spaces, a name, a colon, nothing else. */
const JOB_KEY_RE = /^ {2}[a-z0-9-]+:$/;

/**
 * The lines of one job's block, from just after its key to just before the next top-level job key.
 *
 * Throws rather than returning an empty block when the job is absent, because a helper that answers "no violations" for a job that does not exist is the vacuity this file exists to rule out.
 */
function jobBlock(jobName: string): string {
  const lines = WORKFLOW.split('\n');
  const start = lines.indexOf(`  ${jobName}:`);
  if (start === -1) throw new Error(`no job named '${jobName}' in .github/workflows/main.yaml`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (JOB_KEY_RE.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

/** Comment lines removed, so an assertion about the job's BEHAVIOUR is never satisfied or broken by the prose explaining it. */
const withoutComments = (block: string): string =>
  block
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');

const links = (script: string): Array<string> => script.split('&&').map((link) => link.trim());

describe('the supabase-types regeneration-drift gate is wired so it can actually catch a reversion', () => {
  it(`declares the ${DRIFT_JOB} job exactly once`, () => {
    // Guards every extraction below: a duplicated key would make `indexOf` read the first of two blocks and silently assert against the wrong one, and a renamed key would make it throw.
    expect(WORKFLOW.split(`\n  ${DRIFT_JOB}:\n`)).toHaveLength(2);
  });

  it('carries NO path filter, so a generator change with no repo path changing still reddens', () => {
    // The mitigation, asserted as an absence. `supabase/setup-cli@v1` is pinned to `version: latest`; a CLI update changes the generated file with no path in this repo changing at all, and a filter would skip the job precisely then. Compare `supabase-tests`, every step of which is filtered.
    expect(withoutComments(jobBlock(DRIFT_JOB))).not.toContain('paths-filter');
  });

  it('writes down WHY there is no filter, in the job itself', () => {
    // The absence above is only durable if the next reader can tell it from an oversight. Asserted on the raw block, where the header comment lives, and deliberately the mirror image of the assertion above rather than a duplicate of it.
    expect(jobBlock(DRIFT_JOB)).toContain('paths-filter');
  });

  it('regenerates the types and diffs them PATH-SCOPED', () => {
    const block = withoutComments(jobBlock(DRIFT_JOB));
    expect(block).toContain('run: yarn db:types');
    // The scoping is load-bearing, not tidiness: it is what keeps the only possible cause of a red step "the generated types drifted", and it names the one file the reader has to commit. An unscoped diff also reddens on any unrelated working-tree change the runner leaves behind, and a gate that cries wolf gets muted. (Measured 2026-09-03, correcting the reason earlier phase notes gave: `packages/supabase-types/tsconfig.tsbuildinfo` is NOT tracked and IS ignored by the `*.tsbuildinfo` rule in the root `.gitignore`, so `git diff` never reports it. The scoping is right; that justification for it was not.)
    expect(block).toContain(`git diff --exit-code -- ${GENERATED_TYPES}`);
    expect(block).not.toMatch(/git diff --exit-code[ \t]*$/m);
  });

  it('starts Supabase itself and stops it unconditionally', () => {
    const block = withoutComments(jobBlock(DRIFT_JOB));
    // `yarn db:types` runs `supabase gen types typescript --local` and does NOT start the stack, unlike `db:reset` which prefixes `yarn db:start`. Without this step the job fails for the wrong reason.
    expect(block).toContain('run: supabase start');
    expect(block).toContain('run: supabase stop');
    expect(block).toContain('if: always()');
  });

  it('prints no Supabase credential and enables no shell tracing', () => {
    // The convention this file's neighbour `dev-seed-integration` records: values go to $GITHUB_ENV and never to stdout. This job needs no credential at all, so the assertion is that it acquires none.
    const block = withoutComments(jobBlock(DRIFT_JOB));
    expect(block).not.toContain('set -x');
    expect(block).not.toMatch(/echo .*(ANON_KEY|SERVICE_ROLE|SUPABASE_[A-Z_]*KEY)/);
  });

  it('keeps `yarn assert:rpc-nullability` a blocking link of lint:check', () => {
    // The local-DX half, and the half a CI-only gate cannot supply: this is what makes the enumeration guard blocking for a developer running `yarn lint:check`.
    //
    // The invariant is MEMBERSHIP of the `&&` chain, never terminal position: every link after it is equally aborted by a failure, so guards may be appended freely. An assertion that this link comes LAST breaks the moment anything new is appended to the chain, which is a correct change that an over-specified assertion has no business rejecting. The sibling spec `ciTypecheckGate.test.ts` records the same lesson from the phase that lived it.
    expect(links(ROOT_PACKAGE_JSON.scripts['lint:check'])).toContain('yarn assert:rpc-nullability');
    expect(ROOT_PACKAGE_JSON.scripts['assert:rpc-nullability']).toBe('node scripts/assert-rpc-return-nullability.mjs');
    // Wired-but-deleted is the third failure mode: a missing script file makes the chain die with a bare `node: cannot find module`, which names no invariant and sends the reader nowhere.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-rpc-return-nullability.mjs'), 'utf8')).toContain(
      'RPC RETURN-NULLABILITY GUARD'
    );
  });
});
