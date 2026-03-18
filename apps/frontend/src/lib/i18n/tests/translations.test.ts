import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, test } from 'vitest';

// Path to inlang message files
const messagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'messages');

const translationLocales = fs
  .readdirSync(messagesDir)
  .filter((name) => fs.lstatSync(path.join(messagesDir, name)).isDirectory())
  .sort();

const firstLocale = translationLocales.includes('en') ? 'en' : translationLocales[0];
const otherLocales = translationLocales.filter((l) => l !== firstLocale);
const firstLocaleFilenames = fs.readdirSync(path.join(messagesDir, firstLocale)).sort();

/**
 * Recursive function to extract leaf keys, handling inlang variant arrays.
 * Variant arrays (array values) are treated as leaf nodes (same as string values).
 */
function flattenKeys(obj: unknown, prefix: string): Array<string> {
  const res: Array<string> = [];
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    // Leaf node (string, number, or variant array)
    res.push(prefix);
  } else {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      res.push(...flattenKeys(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  return res.sort();
}

function getMessageKeys(locale: string, filename: string): Array<string> {
  const filePath = path.join(messagesDir, locale, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return flattenKeys(content, filename.replace('.json', ''));
}

const firstLocaleFileKeys = Object.fromEntries(
  firstLocaleFilenames.map((filename) => [filename, getMessageKeys(firstLocale, filename)])
);

test('all 7 locales have message directories', () => {
  expect(translationLocales).toEqual(['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv']);
});

test('each locale has 46 message files', () => {
  for (const locale of translationLocales) {
    const files = fs.readdirSync(path.join(messagesDir, locale));
    expect(files.length).toBe(46);
  }
});

test.each(otherLocales)(`'%s' has same message files as '${firstLocale}'`, (locale) => {
  const filenames = fs.readdirSync(path.join(messagesDir, locale)).sort();
  expect(filenames).toEqual(firstLocaleFilenames);
});

describe.each(otherLocales)(`'%s' has same message keys as '${firstLocale}'`, (locale) => {
  test.each(firstLocaleFilenames)('in %s', (filename) => {
    expect(getMessageKeys(locale, filename)).toEqual(firstLocaleFileKeys[filename]);
  });
});

test('inlang variant syntax is used for plural messages (not ICU inline)', () => {
  const resultsContent = fs.readFileSync(path.join(messagesDir, 'en', 'results.json'), 'utf8');
  const results = JSON.parse(resultsContent);
  const allValues = JSON.stringify(results);
  // Should NOT contain ICU inline plural syntax
  expect(allValues).not.toContain(', plural,');
  expect(allValues).not.toContain(', date,');
  // Should contain inlang variant syntax
  expect(allValues).toContain('declarations');
  expect(allValues).toContain('selectors');
  expect(allValues).toContain('match');
});

test('no DEFAULT_PAYLOAD variables remain in message files', () => {
  for (const locale of translationLocales) {
    for (const filename of firstLocaleFilenames) {
      const content = fs.readFileSync(path.join(messagesDir, locale, filename), 'utf8');
      expect(content).not.toContain('candidateSingular');
      expect(content).not.toContain('candidatePlural');
      expect(content).not.toContain('partySingular');
      expect(content).not.toContain('partyPlural');
      expect(content).not.toContain('adminEmailLink');
    }
  }
});

test('analyticsLink preserved in privacy.json as simple variable', () => {
  const privacy = fs.readFileSync(path.join(messagesDir, 'en', 'privacy.json'), 'utf8');
  expect(privacy).toContain('analyticsLink');
});

test('all message files are valid JSON', () => {
  for (const locale of translationLocales) {
    for (const filename of fs.readdirSync(path.join(messagesDir, locale))) {
      const content = fs.readFileSync(path.join(messagesDir, locale, filename), 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    }
  }
});
