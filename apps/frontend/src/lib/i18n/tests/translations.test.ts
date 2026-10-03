import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, test } from 'vitest';
import { t } from '$lib/i18n/wrapper';

/**
 * Structure tests for the Paraglide message catalog in `apps/frontend/messages/`.
 *
 * These must stay FILESYSTEM assertions: `vitest.config.ts` aliases `$lib/paraglide/*` to mocks, so a `t()` call here would prove nothing about the real catalog.
 */

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const messagesDir = path.join(frontendRoot, 'messages');
const translationKeyTypePath = path.join(frontendRoot, 'src', 'lib', 'types', 'generated', 'translationKey.ts');
const inlangSettings = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'project.inlang', 'settings.json'), 'utf8'));

const translationLocales = fs
  .readdirSync(messagesDir)
  .filter((name) => fs.lstatSync(path.join(messagesDir, name)).isDirectory())
  .sort();

const baseLocale: string = inlangSettings.baseLocale;
const otherLocales = translationLocales.filter((l) => l !== baseLocale);
const baseLocaleFilenames = fs.readdirSync(path.join(messagesDir, baseLocale)).sort();

/**
 * Flattens a message tree into dot-separated key paths. Inlang variant arrays and bare variant objects (carrying `declarations`, `selectors` or `match`) are single leaves, as in the `TranslationKey` generator.
 */
function flattenMessageKeys(tree: unknown, prefix: string): Array<string> {
  const isBranch =
    typeof tree === 'object' &&
    tree !== null &&
    !Array.isArray(tree) &&
    !('declarations' in tree || 'selectors' in tree || 'match' in tree);
  if (!isBranch) return [prefix];
  return Object.entries(tree).flatMap(([key, value]) => flattenMessageKeys(value, `${prefix}.${key}`));
}

/**
 * The full translation keys of one message file. The file's single top-level key is its namespace, the filename without `.json`, and every key starts with it.
 */
function getMessageKeys(locale: string, filename: string): Array<string> {
  const namespace = filename.replace(/\.json$/, '');
  const content = JSON.parse(fs.readFileSync(path.join(messagesDir, locale, filename), 'utf8'));
  return flattenMessageKeys(content[namespace], namespace).sort();
}

/**
 * Every key in the base-locale files that Paraglide compiles, read the way the `TranslationKey` generator reads them: `pathPattern` from `project.inlang/settings.json`, each file unwrapped from its namespace key.
 */
function getBaseLocaleCatalogKeys(): Array<string> {
  const patterns: Array<string> = inlangSettings['plugin.inlang.messageFormat'].pathPattern;
  return patterns
    .flatMap((pattern) => getMessageKeys(baseLocale, path.basename(pattern.split('{locale}').join(baseLocale))))
    .sort();
}

const baseLocaleFileKeys = Object.fromEntries(
  baseLocaleFilenames.map((filename) => [filename, getMessageKeys(baseLocale, filename)])
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

test.each(otherLocales)(`'%s' has same message files as '${baseLocale}'`, (locale) => {
  const filenames = fs.readdirSync(path.join(messagesDir, locale)).sort();
  expect(filenames).toEqual(baseLocaleFilenames);
});

test.each(translationLocales)('every message file in %s is wrapped in its namespace key', (locale) => {
  for (const filename of fs.readdirSync(path.join(messagesDir, locale))) {
    const content = JSON.parse(fs.readFileSync(path.join(messagesDir, locale, filename), 'utf8'));
    expect(Object.keys(content), `${locale}/${filename}`).toEqual([filename.replace(/\.json$/, '')]);
  }
});

test(`'lang.json' in '${baseLocale}' declares a display name for every locale`, () => {
  // The `lang.*` message group (`messages/{locale}/lang.json`) supplies the language-selector display names. Assert the base-locale file carries a non-empty name for every locale that has a message directory; the 'same message keys' matching below then guarantees the other locale files declare the same set of names.
  const lang = JSON.parse(fs.readFileSync(path.join(messagesDir, baseLocale, 'lang.json'), 'utf8')).lang as Record<
    string,
    string
  >;
  for (const locale of translationLocales) {
    expect(lang[locale], `lang.json is missing a display name for '${locale}'`).toBeTruthy();
  }
});

describe.each(otherLocales)(`'%s' has same message keys as '${baseLocale}'`, (locale) => {
  test.each(baseLocaleFilenames)('in %s', (filename) => {
    expect(getMessageKeys(locale, filename)).toEqual(baseLocaleFileKeys[filename]);
  });
});

/**
 * The labels that tell a voter which way an argument group points.
 *
 * `QuestionArguments` heads pro groups with `questions.arguments.pro`, con groups with `questions.arguments.con` and categorical groups with `questions.arguments.proCategory`, which names a choice the arguments are for. A catalogue whose `pro` and `con` values are swapped labels every group with the wrong direction, so each locale must keep `proCategory` built from its `pro` label.
 */
describe.each(translationLocales)('argument labels — %s', (locale) => {
  const runtimeArguments = JSON.parse(fs.readFileSync(path.join(messagesDir, locale, 'questions.json'), 'utf8'))
    .questions.arguments as Record<string, string>;

  test('the pro label differs from the con label and proCategory carries the pro label, not the con label', () => {
    const { pro, con, proCategory } = runtimeArguments;
    expect(pro.toLowerCase()).not.toBe(con.toLowerCase());
    const categoryLabel = proCategory.replace('{option}', '').toLowerCase();
    expect(categoryLabel, `[${locale}] proCategory should contain the pro label '${pro}'`).toContain(pro.toLowerCase());
    expect(categoryLabel, `[${locale}] proCategory should not contain the con label '${con}'`).not.toContain(
      con.toLowerCase()
    );
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
    for (const filename of baseLocaleFilenames) {
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

/**
 * The generated `TranslationKey` union must hold exactly the base-locale message keys.
 *
 * `t()` accepts only union members, so a union that drifts from `messages/` either rejects a key that renders or accepts one that renders raw.
 */
test('the generated TranslationKey union matches the base-locale message keys', () => {
  const generated = fs.readFileSync(translationKeyTypePath, 'utf8');
  const unionKeys = (generated.match(/'[^']*'/g) ?? []).map((literal) => literal.slice(1, -1)).sort();
  const catalogKeys = getBaseLocaleCatalogKeys();
  const missingFromUnion = catalogKeys.filter((key) => !unionKeys.includes(key));
  const missingFromCatalog = unionKeys.filter((key) => !catalogKeys.includes(key));
  expect(
    { missingFromUnion, missingFromCatalog },
    'translationKey.ts is stale: run `yarn workspace @openvaa/frontend generate:translation-key-type`'
  ).toEqual({ missingFromUnion: [], missingFromCatalog: [] });
  expect(unionKeys).toEqual(catalogKeys);
});

describe('TranslationKey type safety (CLEAN-04)', () => {
  test('t() signature rejects non-TranslationKey strings at compile-time', () => {
    // reason: regression-locker.
    // If `t()` in wrapper.ts is loosened back to `key: string`, the @ts-expect-error directive below becomes "unused @ts-expect-error" and the typecheck (yarn check) fails. The real assertion is the compiler — the runtime smoke below only satisfies vitest's "at least one assertion per test" convention.
    // @ts-expect-error — 'definitely.not.a.real.key' is not a TranslationKey union member
    t('definitely.not.a.real.key');
    expect(true).toBe(true);
  });
});
