/**
 * Determinism tests (TMPL-08).
 *
 * Cross-cutting: exercises every generator's faker reads through a single
 * `runPipeline({ seed })` call and asserts byte-identical output across runs.
 *
 * Pattern A per RESEARCH §5: each `runPipeline` call constructs a fresh
 * `new Faker()` instance (inside `buildCtx`) and seeds it. No module-level
 * `faker.seed()` — that's the shared-state trap this contract exists to prevent.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/pipeline';

describe('determinism (TMPL-08)', () => {
  it('same seed (42) produces byte-identical output across two fresh runs', () => {
    const run1 = runPipeline({ seed: 42 });
    const run2 = runPipeline({ seed: 42 });
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  it('different seeds produce different output', () => {
    const run1 = runPipeline({ seed: 42 });
    const run2 = runPipeline({ seed: 99 });
    expect(JSON.stringify(run1)).not.toEqual(JSON.stringify(run2));
  });

  it('default seed (no `seed` field — falls back to 42) is still deterministic', () => {
    // buildCtx defaults seed to 42 when template.seed is undefined. Two runs
    // with the same `{}` template should therefore produce identical output.
    const run1 = runPipeline({});
    const run2 = runPipeline({});
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });
});
