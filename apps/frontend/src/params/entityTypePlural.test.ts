import { describe, expect, it } from 'vitest';
import { match } from './entityTypePlural';

/**
 * Unit test for the `entityTypePlural` SvelteKit param matcher.
 *
 * Accept-set (American spelling per Phase 62 Open Question 1 RESOLVED):
 *   `candidates` | `organizations`
 *
 * Rejects singular forms, British spellings, legacy `party`/`parties`,
 * empty strings and case variants.
 */
describe('entityTypePlural matcher', () => {
  it.each([
    ['candidates', true],
    ['organizations', true],
    ['candidate', false],
    ['organization', false],
    ['organisations', false],
    ['party', false],
    ['parties', false],
    ['', false],
    ['CANDIDATES', false]
  ])('match(%p) === %p', (input, expected) => {
    expect(match(input)).toBe(expected);
  });
});
