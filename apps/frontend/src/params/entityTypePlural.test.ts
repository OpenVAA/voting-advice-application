import { describe, expect, it } from 'vitest';
import { match } from './entityTypePlural';

/**
 * Unit test for the `entityTypePlural` SvelteKit param matcher.
 *
 * Accept-set (American spelling):
 *   `candidates` | `organizations` | `alliances`
 *
 * Rejects singular forms, British spellings, legacy `party`/`parties`, empty strings and case variants.
 */
describe('entityTypePlural matcher', () => {
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
