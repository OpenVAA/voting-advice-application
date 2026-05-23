import { describe, expect, it } from 'vitest';
import { match } from './etSg';

/**
 * Unit test for the `etSg` SvelteKit param matcher (short-name alias of
 * `entityTypeSingular`, introduced by Phase 88 Plan 88-02).
 *
 * Accept-set (American spelling per Phase 62 Open Question 1 RESOLVED;
 * extended with `alliance` per Phase 69 ALLIANCE-01):
 *   `candidate` | `organization` | `alliance`
 *
 * Rejects plural forms, British spellings, legacy `party`,
 * empty strings and case variants.
 */
describe('etSg matcher', () => {
  it.each([
    ['candidate', true],
    ['organization', true],
    ['alliance', true],
    ['candidates', false],
    ['alliances', false], // plural spelling rejected by singular matcher
    ['organisation', false],
    ['party', false],
    ['', false],
    ['CANDIDATE', false],
    ['ALLIANCE', false] // case-sensitive
  ])('match(%p) === %p', (input, expected) => {
    expect(match(input)).toBe(expected);
  });
});
