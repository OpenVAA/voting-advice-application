import { describe, expect, it } from 'vitest';
import { match } from './entityTypeSingular';

/**
 * Unit test for the `entityTypeSingular` SvelteKit param matcher.
 *
 * Accept-set (American spelling per Phase 62 Open Question 1 RESOLVED):
 *   `candidate` | `organization`
 *
 * Rejects plural forms, British spellings, legacy `party`,
 * empty strings and case variants.
 */
describe('entityTypeSingular matcher', () => {
  it.each([
    ['candidate', true],
    ['organization', true],
    ['candidates', false],
    ['organisation', false],
    ['party', false],
    ['', false],
    ['CANDIDATE', false]
  ])('match(%p) === %p', (input, expected) => {
    expect(match(input)).toBe(expected);
  });
});
