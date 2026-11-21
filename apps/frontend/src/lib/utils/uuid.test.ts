import { describe, expect, it } from 'vitest';
import { isCanonicalUuid } from './uuid';

const LOWER = '3f2b8c1e-9a4d-4e6f-8b7a-0c1d2e3f4a5b';

describe('isCanonicalUuid', () => {
  it.each([
    ['a lower-case uuid', LOWER, true],
    ['a uuid of decimal digits only', '00000000-0000-0000-0000-000000000001', true],
    ['an upper-case uuid', LOWER.toUpperCase(), false],
    ['a uuid with one upper-case digit', `${LOWER.slice(0, -1)}B`, false],
    ['a padded uuid', ` ${LOWER} `, false],
    ['the unhyphenated form', LOWER.replaceAll('-', ''), false],
    ['the braced form', `{${LOWER}}`, false],
    ['a non-hexadecimal digit', `${LOWER.slice(0, -1)}g`, false],
    ['the empty string', '', false],
    ['a number', 1, false],
    ['null', null, false]
  ])('%s → %s', (_, value, expected) => {
    expect(isCanonicalUuid(value)).toBe(expected);
  });
});
