import { describe, expect, test } from 'vitest';
import { messageOf, messagesOf } from './messages';

describe('messagesOf', () => {
  test('returns the namespace under the file’s single top-level key', () => {
    expect(messagesOf('common')).toHaveProperty('login');
  });

  test('returns the same object on a second read', () => {
    expect(messagesOf('common')).toBe(messagesOf('common'));
  });

  test('reads the file of the given locale', () => {
    expect(messagesOf('common', 'fi')).not.toBe(messagesOf('common'));
  });

  test('throws for a file the catalogue does not hold', () => {
    expect(() => messagesOf('noSuchFile')).toThrow();
  });
});

describe('messageOf', () => {
  test('returns a top-level message of the namespace', () => {
    expect(messageOf('common', 'login')).toBe((messagesOf('common') as Record<string, string>).login);
  });

  test('walks a dotted key into nested groups', () => {
    const privacy = messagesOf('privacy') as { usageData: { title: string } };
    expect(messageOf('privacy', 'usageData.title')).toBe(privacy.usageData.title);
  });

  test('throws for a key that holds no message', () => {
    expect(() => messageOf('common', 'noSuchKey')).toThrow(/noSuchKey/);
    expect(() => messageOf('privacy', 'usageData')).toThrow(/usageData/);
  });
});
