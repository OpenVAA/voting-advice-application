/**
 * The shared `$app/state` stub's `navigating` cannot be changed by a test.
 *
 * Every test file that does not mock `$app/state` itself reads this one module object, so a member set by one case would stay set for every later case of the file. A test that needs a navigation in flight injects its own object with `vi.mock`.
 */

import { describe, expect, it } from 'vitest';
import { navigating } from './__mocks__/app-state';

describe('the $app/state stub', () => {
  it('holds no navigation in flight', () => {
    expect(navigating).toEqual({ from: null, to: null, type: null, willUnload: null, delta: null, complete: null });
  });

  it('refuses a write to navigating', () => {
    expect(Object.isFrozen(navigating)).toBe(true);
    expect(() => {
      (navigating as { to: unknown }).to = { url: new URL('http://localhost/') };
    }).toThrow(TypeError);
    expect(navigating.to).toBeNull();
  });
});
