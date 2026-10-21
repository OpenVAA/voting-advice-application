import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from './motion';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // jsdom implements no `matchMedia`, so there is no method to spy on: stub the global instead.
  function stubMatchMedia(matches: boolean): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: matches && query === '(prefers-reduced-motion: reduce)' }) as MediaQueryList)
    );
  }

  it('is true when the reduced-motion media query matches', () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('is false when the media query does not match', () => {
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('is false when the environment has no matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});
