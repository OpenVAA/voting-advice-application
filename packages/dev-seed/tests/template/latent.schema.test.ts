/**
 * Template schema — latent block acceptance + rejection tests (Plan 57-01 Task 2).
 *
 * Covers the RED gate for the `.extend({ latent: ... })` schema change:
 *   - Test 1: Phase 56 regression — `{}` still validates (TMPL-02).
 *   - Test 2: `{ latent: {} }` accepted — nested block is optional per D-57-21.
 *   - Test 3: matching `dimensions` + `eigenvalues` length accepted.
 *   - Test 4 (D-57-02): mismatched lengths rejected with
 *     `template.latent.eigenvalues: Expected length 2, got 1`.
 *   - Test 5: negative `noise` rejected (`.nonnegative()` enforcement).
 *   - Test 6 (TMPL-09 + .strict): typo `loading` (singular) → error path
 *     `template.latent.loading` — proves `.strict()` catches unknown keys.
 *   - Test 7: importing the `Ctx` type with `latent?: LatentHooks` compiles
 *     (smoke check — if the ctx extension drifts, this test file won't type-check).
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
// Smoke-check import — keeps `Ctx` + `LatentHooks` in the graph so drift at the
// ctx extension (latent?: LatentHooks) surfaces in the dev-seed typecheck.
import type { Ctx } from '../../src/ctx';
import type { LatentHooks } from '../../src/emitters/latent/latentTypes';
import { validateTemplate } from '../../src/template/schema';

describe('template schema — latent block (D-57-21)', () => {
  it('accepts an empty template (Phase 56 regression)', () => {
    expect(() => validateTemplate({})).not.toThrow();
  });

  it('accepts empty latent block', () => {
    expect(() => validateTemplate({ latent: {} })).not.toThrow();
  });

  it('accepts matching dimensions + eigenvalues', () => {
    expect(() =>
      validateTemplate({ latent: { dimensions: 3, eigenvalues: [1, 0.333, 0.111] } })
    ).not.toThrow();
  });

  it('rejects mismatched dimensions/eigenvalues length (D-57-02)', () => {
    expect(() => validateTemplate({ latent: { dimensions: 2, eigenvalues: [1] } })).toThrow(
      /template\.latent\.eigenvalues.*Expected length 2, got 1/
    );
  });

  it('rejects negative noise', () => {
    expect(() => validateTemplate({ latent: { noise: -1 } })).toThrow(/template\.latent\.noise/);
  });

  it('rejects unknown keys via .strict() (TMPL-09 typo-catching)', () => {
    // `loading` (singular) is a typo — `loadings` is the correct key.
    expect(() => validateTemplate({ latent: { loading: {} } })).toThrow(/template\.latent\.loading/);
  });

  it('Ctx.latent field compiles under the LatentHooks type', () => {
    // Compile-time-only smoke check: if the ctx extension or LatentHooks
    // signatures drift, this type-narrow assignment stops compiling at
    // `yarn workspace @openvaa/dev-seed typecheck` before we ever run vitest.
    const assertCtxExtension = (ctx: Ctx): LatentHooks | undefined => ctx.latent;
    expect(assertCtxExtension).toBeTypeOf('function');
  });
});
