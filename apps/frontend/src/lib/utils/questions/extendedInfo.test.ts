import { describe, expect, test } from 'vitest';
import { hasExtendedInfo } from './extendedInfo';
import type { AnyQuestionVariant } from '@openvaa/data';

/** A question fixture. `getCustomData` is `object.customData ?? {}`, so a plain object literal is a sufficient subject. */
function question(info: string, customData?: Record<string, unknown>): AnyQuestionVariant {
  return { id: 'q1', text: 'A question', info, customData } as unknown as AnyQuestionVariant;
}

describe('hasExtendedInfo', () => {
  test('is true for a question with info text only', () => {
    expect(hasExtendedInfo(question('Some info'))).toBe(true);
  });

  test('is true for a question with info sections only', () => {
    expect(hasExtendedInfo(question('', { infoSections: [{ title: 'Section', content: 'Content' }] }))).toBe(true);
  });

  test('is true for a question with arguments only', () => {
    expect(
      hasExtendedInfo(question('', { arguments: [{ type: 'likertPros', arguments: [{ content: 'Pro' }] }] }))
    ).toBe(true);
  });

  test('is false for a question with no info and no custom data', () => {
    expect(hasExtendedInfo(question(''))).toBe(false);
  });

  test('is false for a question with empty info, info sections and arguments', () => {
    expect(hasExtendedInfo(question('', { infoSections: [], arguments: [] }))).toBe(false);
  });
});
