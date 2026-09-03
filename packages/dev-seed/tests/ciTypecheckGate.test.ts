/**
 * The type-check gate's WIRING, asserted rather than described.
 *
 * ## Why a comment is not enough here
 *
 * The CI static job carries a named `Type-check all packages (turbo run typecheck)` step, with a block comment stating it exists so a type failure does not "surface as 'ESlint check' instead". `lint:check` ALSO chains `&& yarn typecheck`. GitHub Actions aborts a job at the first non-zero step, so put the named step BELOW `Run ESlint check on frontend` and a type error always fails inside `yarn lint:check` first — the named step never executes, and can only ever run once typecheck has already passed. The step is then unreachable as a diagnostic signal: the exact outcome its own comment claims to prevent.
 *
 * A one-off `node -e` verification cannot hold that property. It checks the script CONTENTS and not the step ORDER, and leaves nothing behind. This file is the standing version, and it checks the property that actually breaks.
 *
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests — `assertKnownRowProps.test.ts` and `permittedKeys.test.ts` both parse `apps/supabase/supabase/schema/501-bulk-operations.sql` from `REPO_ROOT`. The workflow edit and the `lint:check` edit belong together, so the spec sits beside the other repo-root readers rather than in a new home of its own.
 *
 * ⚠ It is a text-level spec, deliberately: no YAML parser is a dependency of this workspace, and adding one to assert six lines would be a worse trade. The step names are matched verbatim, so renaming a step reddens this file and the reader is sent here.
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

const TYPECHECK_STEP = '- name: "Type-check all packages (turbo run typecheck)"';
const ESLINT_STEP = '- name: "Run ESlint check on frontend"';

describe('the CI type-check gate is wired so it can actually report a type failure', () => {
  it('declares both steps exactly once', () => {
    // Guards the two `indexOf` reads below: a duplicated or renamed step would make the ordering assertion measure the wrong pair, or -1.
    expect(WORKFLOW.split(TYPECHECK_STEP)).toHaveLength(2);
    expect(WORKFLOW.split(ESLINT_STEP)).toHaveLength(2);
  });

  it('runs the named type-check step BEFORE the ESLint step', () => {
    // The property that broke. `yarn lint:check` chains `yarn typecheck`, and a job aborts at the first failing step, so the named step can only be the one that reports a type failure if it runs first.
    expect(WORKFLOW.indexOf(TYPECHECK_STEP)).toBeLessThan(WORKFLOW.indexOf(ESLINT_STEP));
  });

  it('runs `yarn typecheck` in that step, unforced', () => {
    const step = WORKFLOW.slice(WORKFLOW.indexOf(TYPECHECK_STEP), WORKFLOW.indexOf(ESLINT_STEP));
    expect(step).toContain('run: yarn typecheck');
    // TURBO_FORCE belongs to evidence runs, not to the shipped gate.
    expect(step).not.toContain('TURBO_FORCE');
  });

  it('keeps `yarn typecheck` a blocking link of lint:check — the local-DX half', () => {
    // Deliberately redundant with the CI step above and load-bearing locally: it is what makes `turbo run typecheck` blocking for a developer running `yarn lint:check`. Asserted so a future reader deleting the "redundant" link has to come here and read why it is not.
    //
    // The invariant is MEMBERSHIP of the `&&` chain, not terminal position: every link after it is equally aborted by a type failure, so guards may be appended freely. Asserting `endsWith` instead makes this test fail the moment anything new is appended to the chain — a correct change an over-specified assertion has no business rejecting.
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn typecheck');
    expect(ROOT_PACKAGE_JSON.scripts['lint:check']).toContain('yarn typecheck:tests');
    expect(ROOT_PACKAGE_JSON.scripts.typecheck).toBe('turbo run typecheck');
  });

  it('keeps `yarn assert:comment-hygiene` a blocking link of lint:check', () => {
    // The comment-hygiene sweep's load-bearing deliverable. Its durable half is not the edits it made; it is this guard, running on the one command every local run and CI pass through. Every comment written after the sweep can reopen the class, and the only thing standing between them and it is this link. Delete it and the sweep becomes a snapshot — the tree still LOOKS clean, the guard still exists on disk, and nothing tells anybody it stopped running. That silent-green shape is exactly what this assertion exists to prevent: the enforcement, not the ordering, is what makes the sweep durable.
    //
    // The invariant asserted here is MEMBERSHIP of the `&&` chain, not terminal position: every link after it is equally aborted by a failure, so guards may be appended freely.
    // Asserting instead that this link comes LAST is what makes the sibling `yarn typecheck` assertion above fail the moment anything new is appended to the chain — a correct change an over-specified assertion has no business rejecting. Do not reintroduce that shape here.
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:comment-hygiene');
    expect(ROOT_PACKAGE_JSON.scripts['assert:comment-hygiene']).toBe('node scripts/assert-comment-hygiene.mjs');
    // Wired-but-deleted is the third failure mode, and it belongs here rather than at lint time: a missing script file makes the chain fail with a bare `node: cannot find module`, which names no invariant and sends the reader nowhere.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-comment-hygiene.mjs'), 'utf8')).toContain(
      'COMMENT HYGIENE GUARD'
    );
  });
});
