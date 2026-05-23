import { describe, expect, it } from 'vitest';
import { match } from './etPl';

/**
 * Unit test for the `etPl` SvelteKit param matcher (short-name alias of
 * `entityTypePlural`, introduced by Phase 88 Plan 88-02).
 *
 * Accept-set (American spelling per Phase 62 Open Question 1 RESOLVED;
 * extended with `alliances` per Phase 69 ALLIANCE-01):
 *   `candidates` | `organizations` | `alliances`
 *
 * Rejects singular forms, British spellings, legacy `party`/`parties`,
 * empty strings and case variants.
 */
describe('etPl matcher', () => {
  it.each([
    ['candidates', true],
    ['organizations', true],
    ['alliances', true],
    ['candidate', false],
    ['organization', false],
    ['alliance', false], // singular spelling rejected by plural matcher
    ['organisations', false],
    ['party', false],
    ['parties', false],
    ['', false],
    ['CANDIDATES', false],
    ['ALLIANCES', false] // case-sensitive
  ])('match(%p) === %p', (input, expected) => {
    expect(match(input)).toBe(expected);
  });
});
