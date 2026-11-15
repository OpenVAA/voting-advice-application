import { describe, expect, it } from 'vitest';
import { match } from './uuid';

const LOWER = '3f2b8c1e-9a4d-4e6f-8b7a-0c1d2e3f4a5b';

/**
 * Unit test for the `uuid` SvelteKit param matcher.
 *
 * Accept-set: the canonical textual form of a uuid, five groups of 8, 4, 4, 4 and 12 hexadecimal digits joined by hyphens, in either letter case.
 *
 * Rejects a short id, a non-hexadecimal digit, the unhyphenated and the braced forms, anything after the last group and the empty string.
 */
describe('uuid matcher', () => {
  it.each([
    ['a lower-case uuid', LOWER, true],
    ['an upper-case uuid', LOWER.toUpperCase(), true],
    ['a uuid of decimal digits only', '00000000-0000-0000-0000-000000000001', true],
    ['one digit short', LOWER.slice(0, -1), false],
    ['one digit long', `${LOWER}0`, false],
    ['a non-hexadecimal digit', `g${LOWER.slice(1)}`, false],
    ['no hyphens', LOWER.replaceAll('-', ''), false],
    ['wrapped in braces', `{${LOWER}}`, false],
    ['a trailing slash', `${LOWER}/`, false],
    ['a trailing line break', `${LOWER}\n`, false],
    ['the empty string', '', false]
  ])('%s: match(%p) === %p', (_label, input, expected) => {
    expect(match(input)).toBe(expected);
  });
});
