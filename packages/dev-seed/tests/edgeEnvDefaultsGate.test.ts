/**
 * The Edge Function environment-default guard's WIRING, asserted rather than described.
 *
 * ## Why a comment is not enough here
 *
 * Phase 155's durable deliverable is not the seven environment defaults it removed; it is `scripts/assert-edge-env-defaults.mjs`, running on the one command every local run and every CI pass goes through. Decision D-D2 rejected fixing the seven sites WITHOUT a guard precisely because the next Edge Function reopens the class. Unwire the guard and the phase becomes a snapshot: the tree still looks clean, the script still exists on disk, and nothing anywhere tells anybody it stopped running. That silent-green shape is what this file exists to prevent.
 *
 * The stakes are higher in this tree than the wording suggests. `turbo run lint --dry` reports the supabase workspace as having no `lint` task and there is no ESLint configuration under it, so besides Prettier and the vitest files phase 155 added, this guard is the ONLY automated check that reaches `apps/supabase/supabase/functions` at all. A removed link does not degrade the coverage of that tree, it ends it.
 *
 * ## Where the guard deliberately is NOT wired, so a later reader does not read the omission as an oversight
 *
 * The guard is a link of `lint:check` only. It is deliberately NOT chained into `test:unit` and NOT into `test:e2e`, and the contrast with its three siblings is the reason rather than an inconsistency: `assert:unit-coverage` is chained into `test:unit` because it gates the test wiring itself, and `assert:i18n-catalog-namespaces` and `assert:a11y-scan-wiring` are chained into `test:e2e` because their absence would make that suite run blind. This guard checks SOURCE SHAPE in a tree the end-to-end suite does not exercise, so coupling it to every suite run would buy nothing and cost a slower loop.
 *
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests. It is a sibling of `ciTypecheckGate.test.ts` rather than an edit to it, so that phase 144's fix in that file is not disturbed and this phase's assertion has its own owner. The supabase workspace cannot host this spec: its vitest `include` is scoped to `supabase/functions/**`, so a root-manifest assertion placed there would never be collected.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('the Edge Function environment-default guard is wired so it actually runs', () => {
  it('keeps `yarn assert:edge-env-defaults` a blocking link of lint:check', () => {
    // The invariant asserted here is MEMBERSHIP of the `&&` chain, not terminal position: every link after a failing one is equally aborted, so guards may be appended freely.
    // Asserting instead that this link comes LAST would fail the moment somebody appends a correct new guard — a correct change an over-specified assertion has no business rejecting. This is phase 144's fix (commit b410d3a90) carried across deliberately; do not reintroduce the ordering shape here.
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:edge-env-defaults');
    expect(ROOT_PACKAGE_JSON.scripts['assert:edge-env-defaults']).toBe('node scripts/assert-edge-env-defaults.mjs');
  });

  it('keeps the guard script itself on disk', () => {
    // Wired-but-deleted is the third failure mode, and it belongs here rather than at lint time: a missing script file makes the chain fail with a bare `node: cannot find module`, which names no invariant and sends the reader nowhere.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-edge-env-defaults.mjs'), 'utf8')).toContain(
      'EDGE-FUNCTION ENVIRONMENT-DEFAULT GUARD'
    );
  });

  it('keeps the shared comment classifier the guard depends on', () => {
    // The guard excludes comments STRUCTURALLY rather than by regex approximation, because phase 155 deliberately wrote four docstrings quoting the forbidden `Deno.env.get('X') || fallback` shape in order to explain why it is abolished. Lose the classifier and the guard either reddens on that documentation, which makes it unkeepable, or gets tuned until it stops complaining, which makes it worthless.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/lib/comment-spans.mjs'), 'utf8')).toContain(
      'export function commentSpans'
    );
  });

  it('leaves the guard OUT of test:unit and test:e2e, which is a decision rather than an omission', () => {
    // Recorded as an assertion so that a later reader who wonders why the other three assert scripts are chained into a suite and this one is not finds the answer enforced rather than merely claimed. See the docblock above for the reasoning.
    expect(ROOT_PACKAGE_JSON.scripts['test:unit']).not.toMatch(/assert:edge-env-defaults/);
    expect(ROOT_PACKAGE_JSON.scripts['test:e2e']).not.toMatch(/assert:edge-env-defaults/);
  });
});
