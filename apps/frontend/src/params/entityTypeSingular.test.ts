import { describe, expect, it } from 'vitest';
import { match } from './entityTypeSingular';

/**
 * Unit test for the `entityTypeSingular` SvelteKit param matcher.
 *
 * Accept-set (American spelling per Phase 62 Open Question 1 RESOLVED;
 * extended with `alliance` per Phase 69 ALLIANCE-01):
 *   `candidate` | `organization` | `alliance`
 *
 * Rejects plural forms, British spellings, legacy `party`,
 * empty strings and case variants.
 */
describe('entityTypeSingular matcher', () => {
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
