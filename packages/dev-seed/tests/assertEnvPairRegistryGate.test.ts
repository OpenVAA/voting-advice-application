/**
 * The cross-runtime env-pair registry guard's WIRING, asserted rather than described.
 *
 * ## What went wrong, and why a comment is not enough
 *
 * Four variables exist twice — once under the un-prefixed name the Deno Edge Functions read, once under the `PUBLIC_`-prefixed name Vite exposes to the client bundle — and the two copies of the identity-provider configuration drifted apart twice, both times undetected. Nothing was red either time. The durable deliverable is therefore not the `.env.example` block that documents the pairs today; it is the guard that fails when the fifth pair appears undocumented, and a guard is only worth anything on the days it actually runs.
 *
 * That makes the load-bearing property WIRING, not behaviour. A guard script sitting unreferenced on disk still exists, still passes when anyone runs it by hand, and reports nothing at all when the link that invoked it is deleted from the `lint:check` chain. The tree keeps looking clean and no signal says the check stopped happening. A comment beside the chain cannot hold that property, because deleting the link deletes the comment with it.
 *
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests. It sits beside `assertDeclaredBinariesGate.test.ts` and `ciTypecheckGate.test.ts` rather than in a new home of its own.
 *
 * ⚠ The invariant asserted here is MEMBERSHIP of the `&&` chain, never terminal position, never the whole string, never the link count. Every link after a failing one is equally aborted, so guards may be appended to the chain freely, and an assertion on position or length reddens a correct append. That over-specified shape has already had to be removed from a sibling spec in this directory once; do not reintroduce it here.
 *
 * ⚠ This spec deliberately asserts nothing about `.env.example`'s CONTENTS. That is the guard's own job, and duplicating it here would create a second opinion about the pairing contract — which is the failure mode the pairs themselves demonstrate.
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

describe('the cross-runtime env-pair registry guard is wired so it actually runs', () => {
  it('keeps `yarn assert:env-pair-registry` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:env-pair-registry');
  });

  it('points the registered script at the guard it claims to run', () => {
    // Wired-to-nothing is the second failure mode: a chain link naming a script key that no longer exists fails with a bare "command not found", which names no invariant and sends the reader nowhere.
    expect(ROOT_PACKAGE_JSON.scripts['assert:env-pair-registry']).toBe('node scripts/assert-env-pair-registry.mjs');
  });

  it('keeps the guard file itself present and recognisable', () => {
    // Wired-but-deleted is the third failure mode, and it belongs here rather than at lint time, where it would surface only as `node: cannot find module`.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-env-pair-registry.mjs'), 'utf8')).toContain(
      'CROSS-RUNTIME ENV-PAIR REGISTRY GUARD'
    );
  });

  it('keeps the runtime agreement checker present and OUT of the lint:check chain', () => {
    // The two scripts answer different questions and only one of them can run in CI. The registry guard proves the pairing CONTRACT from source and cannot see a value; the agreement checker compares VALUES and needs an env file CI does not have. Wiring the checker into `lint:check` would either fail every CI run or, worse, be "fixed" by making it pass when it can compare nothing — a gate that examines nothing and reports green. Its script key is deliberately `check:env-pairs-agree` rather than `assert:*`, because every existing `assert:*` key IS a chain link and a ninth one would read as an omission.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-env-pairs-agree.mjs'), 'utf8')).toContain(
      'CROSS-RUNTIME ENV-PAIR VALUE-AGREEMENT CHECKER'
    );
    expect(ROOT_PACKAGE_JSON.scripts['check:env-pairs-agree']).toBe('node scripts/assert-env-pairs-agree.mjs');
    expect(ROOT_PACKAGE_JSON.scripts['lint:check']).not.toContain('env-pairs-agree');
    expect(ROOT_PACKAGE_JSON.scripts['lint:check']).not.toContain('assert-env-pairs-agree');
  });
});
