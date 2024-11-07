import { describe, expect, test } from 'vitest';
import { formatInitials } from '../utils/format';
import type { Candidate } from '../internal';

describe('formatInitials', () => {
  test('Should return "JDS" when the candidate\'s name is "John Doe Smith"', () => {
    const candidate = { firstName: 'John', lastName: 'Doe Smith' };
    const result = formatInitials({ object: candidate as Candidate });
    expect(result).toBe('JDS');
  });
});
