import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, test } from 'vitest';
import { t } from '$lib/i18n/wrapper';

// Path to inlang message files
const messagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'messages');

// Path to the type-generation translation source catalog. This is the OTHER, independent i18n
// catalog: `tools/translationKey/generateTranslationKeyType.ts` reads it to build the
// `TranslationKey` union, while `messagesDir` above feeds the Paraglide runtime.
const translationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'translations');

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

/**
 * Every dotted key authored in the type-generation catalog (`src/lib/i18n/translations/{locale}`).
 *
 * Those files are UNWRAPPED — `translations/en/components.json` starts straight at `accordionSelect` —
 * so the namespace has to come from the FILENAME (`components.json` -> `components`), exactly as
 * `tools/translationKey/generateTranslationKeyType.ts` does when it builds the `TranslationKey` union.
 * Without that prefix every single key would mismatch.
 *
 * The locale directories also hold `index.ts` and `translations.type.ts`, so non-JSON siblings are
 * filtered out rather than parsed.
 */
function getTranslationKeys(locale: string): Array<string> {
  const localeDir = path.join(translationsDir, locale);
  return fs
    .readdirSync(localeDir)
    .filter((filename) => filename.endsWith('.json'))
    .flatMap((filename) =>
      flattenKeys(JSON.parse(fs.readFileSync(path.join(localeDir, filename), 'utf8')), filename.replace('.json', ''))
    )
    .sort();
}

/**
 * Every dotted key present in the runtime Paraglide catalog (`messages/{locale}`).
 *
 * Those files are WRAPPED — `messages/en/components.json` is `{ "components": { ... } }`, and
 * `messages/en/adminApp.common.json` is `{ "adminApp.common": { ... } }` — so the file's own top-level
 * key already IS the namespace and the flatten must start from an EMPTY prefix.
 *
 * This is why the parity check cannot reuse `getMessageKeys` above: that helper deliberately
 * re-prefixes the filename for its cross-LOCALE comparison (where a constant offset is harmless) and
 * would yield doubled `components.components.*` keys here.
 */
function getRuntimeCatalogKeys(locale: string): Array<string> {
  const localeDir = path.join(messagesDir, locale);
  return fs
    .readdirSync(localeDir)
    .filter((filename) => filename.endsWith('.json'))
    .flatMap((filename) => flattenKeys(JSON.parse(fs.readFileSync(path.join(localeDir, filename), 'utf8')), ''))
    .sort();
}

const firstLocaleFileKeys = Object.fromEntries(
  firstLocaleFilenames.map((filename) => [filename, getMessageKeys(firstLocale, filename)])
);

test('all 7 locales have message directories', () => {
  expect(translationLocales).toEqual(['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv']);
});

test('each locale has 47 message files', () => {
  for (const locale of translationLocales) {
    const files = fs.readdirSync(path.join(messagesDir, locale));
    expect(files.length).toBe(47);
  }
});

test.each(otherLocales)(`'%s' has same message files as '${firstLocale}'`, (locale) => {
  const filenames = fs.readdirSync(path.join(messagesDir, locale)).sort();
  expect(filenames).toEqual(firstLocaleFilenames);
});

test(`'lang.json' in '${firstLocale}' declares a display name for every locale`, () => {
  // The `lang.*` message group (`messages/{locale}/lang.json`) supplies the
  // language-selector display names. Assert the base-locale file carries a
  // non-empty name for every locale that has a message directory; the
  // 'same message keys' matching below then guarantees the other locale files
  // declare the same set of names.
  const lang = JSON.parse(fs.readFileSync(path.join(messagesDir, firstLocale, 'lang.json'), 'utf8')).lang as Record<
    string,
    string
  >;
  for (const locale of translationLocales) {
    expect(lang[locale], `lang.json is missing a display name for '${locale}'`).toBeTruthy();
  }
});

describe.each(otherLocales)(`'%s' has same message keys as '${firstLocale}'`, (locale) => {
  test.each(firstLocaleFilenames)('in %s', (filename) => {
    expect(getMessageKeys(locale, filename)).toEqual(firstLocaleFileKeys[filename]);
  });
});

/**
 * The one legitimate asymmetry between the two catalogs.
 *
 * `messages/{locale}/lang.json` is the language-selector display-name catalog and has no
 * `translations/` counterpart by design: `generateTranslationKeyType.ts:24` SYNTHESISES `lang.{locale}`
 * from the locale directory listing instead of reading a file. Those keys are therefore expected to
 * exist runtime-side only.
 *
 * Deliberately an allowlist of exact KEYS, not "skip the file `lang.json`": a blanket file exclusion
 * would also hide a genuine regression inside that file (a typo'd `lang.se`, a dropped `lang.et`).
 */
const EXPECTED_MESSAGES_ONLY = new Set(translationLocales.map((locale) => `lang.${locale}`));

/**
 * Cross-catalog key-set parity.
 *
 * The two i18n catalogs are independent. `src/lib/i18n/translations/` feeds the `TranslationKey` type;
 * `apps/frontend/messages/` feeds the Paraglide runtime. Adding a key to only the former still
 * type-checks, and at runtime `t()` then renders the raw dotted key path to the user. Seven real
 * user-facing strings shipped through exactly that gap before see phase 134 closed them (including an
 * `aria-label` that announced `components.accordionSelect.listboxAriaLabel` to screen readers).
 * These two assertions make that defect class structurally unreinventable.
 *
 * This must stay a FILESYSTEM assertion: `vitest.config.ts` aliases `$lib/paraglide/*` to mocks, so a
 * `t()` call here would prove nothing about the real runtime catalog.
 */
describe.each(translationLocales)('catalog key-set parity — %s', (locale) => {
  test('every type-gen key exists in the runtime catalog', () => {
    const runtimeKeys = new Set(getRuntimeCatalogKeys(locale));
    const missingFromRuntime = getTranslationKeys(locale).filter((key) => !runtimeKeys.has(key));
    expect(
      missingFromRuntime,
      `[${locale}] authored in src/lib/i18n/translations/ but MISSING from messages/${locale}/ — t() will render these raw dotted key paths to users`
    ).toEqual([]);
  });

  test('every runtime key exists in the type-gen catalog', () => {
    const typeGenKeys = new Set(getTranslationKeys(locale));
    const missingFromTypeGen = getRuntimeCatalogKeys(locale).filter(
      (key) => !typeGenKeys.has(key) && !EXPECTED_MESSAGES_ONLY.has(key)
    );
    expect(
      missingFromTypeGen,
      `[${locale}] present in messages/${locale}/ but MISSING from src/lib/i18n/translations/ — TranslationKey will not include these, so t() cannot be called with them`
    ).toEqual([]);
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

describe('TranslationKey type safety (CLEAN-04)', () => {
  test('t() signature rejects non-TranslationKey strings at compile-time', () => {
    // reason: regression-locker (see phase 78).
    // If `t()` in wrapper.ts is loosened back to `key: string`, the @ts-expect-error
    // directive below becomes "unused @ts-expect-error" and the typecheck (yarn check)
    // fails. The real assertion is the compiler — the runtime smoke below only satisfies
    // vitest's "at least one assertion per test" convention.
    // @ts-expect-error — 'definitely.not.a.real.key' is not a TranslationKey union member
    t('definitely.not.a.real.key');
    expect(true).toBe(true);
  });
});
