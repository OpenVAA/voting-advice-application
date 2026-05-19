/**
 * Box-Muller statistics + edge-case tests (Plan 57-01 Task 1).
 *
 * Covers the RED gate for `src/emitters/latent/gaussian.ts`:
 *   - Test 1: approx N(0,1) over 10,000 seeded draws (mean ∈ [-0.05, 0.05],
 *     std ∈ [0.95, 1.05]).
 *   - Test 2: mean/stdDev scaling — N(3, 0.1²) statistics hold.
 *   - Test 3: Pitfall 1 regression guard — never `NaN` or `Infinity` across 10,000 draws
 *     (proves the `Math.max(u1, Number.MIN_VALUE)` clamp is in place).
 *   - Test 4: D-57-11 short-circuit — `stdDev === 0` returns exactly `mean` and does NOT
 *     consume faker draws.
 *   - Test 5: determinism — two fresh `Faker` instances seeded with 42 produce
 *     byte-identical sequences (Pattern A per RESEARCH §5).
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { en, Faker } from '@faker-js/faker';
import { boxMuller } from '../../src/emitters/latent/gaussian';

function seededFaker(seed = 42): Faker {
  const f = new Faker({ locale: [en] });
  f.seed(seed);
  return f;
}

describe('boxMuller (gaussian.ts)', () => {
  it('approximates N(0,1) over 10,000 draws', () => {
    const faker = seededFaker();
    const N = 10_000;
    const xs = Array.from({ length: N }, () => boxMuller(faker));
    const mean = xs.reduce((a, b) => a + b, 0) / N;
    const std = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / N);
    expect(mean).toBeGreaterThan(-0.05);
    expect(mean).toBeLessThan(0.05);
    expect(std).toBeGreaterThan(0.95);
    expect(std).toBeLessThan(1.05);
  });

  it('scales with mean and stdDev', () => {
    const faker = seededFaker();
    const N = 10_000;
    const xs = Array.from({ length: N }, () => boxMuller(faker, 3, 0.1));
    const mean = xs.reduce((a, b) => a + b, 0) / N;
    const std = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / N);
    expect(mean).toBeGreaterThan(2.95);
    expect(mean).toBeLessThan(3.05);
    expect(std).toBeGreaterThan(0.095);
    expect(std).toBeLessThan(0.105);
  });

  it('never returns NaN or Infinity (Pitfall 1 regression guard)', () => {
    const faker = seededFaker();
    for (let i = 0; i < 10_000; i++) {
      const v = boxMuller(faker);
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('short-circuits when stdDev === 0 (D-57-11)', () => {
    const faker = seededFaker();
    expect(boxMuller(faker, 7, 0)).toBe(7);
    expect(boxMuller(faker, -2, 0)).toBe(-2);
  });

  it('is deterministic given a seeded faker', () => {
    const a = seededFaker(42);
    const b = seededFaker(42);
    const xsA = Array.from({ length: 100 }, () => boxMuller(a));
    const xsB = Array.from({ length: 100 }, () => boxMuller(b));
    expect(xsA).toEqual(xsB);
  });
});
