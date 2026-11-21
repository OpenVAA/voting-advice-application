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

test('every message file of the base locale is listed for compilation, and no other', () => {
  const patterns: Array<string> = inlangSettings['plugin.inlang.messageFormat'].pathPattern;
  const listed = patterns.map((pattern) => path.basename(pattern.split('{locale}').join(baseLocale))).sort();
  expect(listed).toEqual(baseLocaleFilenames);
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

  test.each(baseLocaleFilenames)('in %s, every string uses the same placeholders and HTML tags', (filename) => {
    const base = getAllStrings(baseLocale, filename);
    const translated = getAllStrings(locale, filename);
    const mismatches = [...base]
      .filter(([key]) => translated.has(key))
      .filter(([key, value]) => {
        const other = translated.get(key)!;
        return (
          getPlaceholders(value).join() !== getPlaceholders(other).join() ||
          getHtmlTags(value).join() !== getHtmlTags(other).join()
        );
      })
      .map(
        ([key, value]) =>
          `${key}: {${getPlaceholders(value)}} <${getHtmlTags(value)}> in ${baseLocale}, {${getPlaceholders(translated.get(key)!)}} <${getHtmlTags(translated.get(key)!)}> in ${locale}`
      );
    expect(mismatches, `[${locale}] ${filename}`).toEqual([]);
  });
});

/**
 * Every string of one message file, keyed as `collectStrings` keys them, so that each variant of a plural message is its own entry.
 */
function getAllStrings(locale: string, filename: string): Map<string, string> {
  const found: Array<[string, string]> = [];
  collectStrings(JSON.parse(fs.readFileSync(path.join(messagesDir, locale, filename), 'utf8')), '', found);
  return new Map(found);
}

/** The distinct `{placeholder}` names a string uses, sorted. */
function getPlaceholders(value: string): Array<string> {
  return [...new Set([...value.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]))].sort();
}

/** The distinct HTML tag names a string opens or closes, lower-cased and sorted. */
function getHtmlTags(value: string): Array<string> {
  return [...new Set([...value.matchAll(/<\/?([a-zA-Z][\w-]*)/g)].map((match) => match[1].toLowerCase()))].sort();
}

/**
 * The one base-locale file every locale holds byte for byte: it lists each language under its own name.
 */
const SAME_IN_EVERY_LOCALE: ReadonlyArray<string> = ['lang.json'];

test("no catalogue file of another locale is a copy of the base locale's", () => {
  const copies = otherLocales.flatMap((locale) =>
    baseLocaleFilenames
      .filter((filename) => !SAME_IN_EVERY_LOCALE.includes(filename))
      .filter((filename) =>
        fs
          .readFileSync(path.join(messagesDir, locale, filename))
          .equals(fs.readFileSync(path.join(messagesDir, baseLocale, filename)))
      )
      .map((filename) => `${locale}/${filename}`)
  );
  expect(copies, 'files that are a copy of the base locale’s').toEqual([]);
});

/**
 * One string of a locale other than the base locale that is the same as the base locale's at the same key.
 */
type SameAsBaseLocale = {
  locale: string;
  file: string;
  key: string;
  value: string;
  reason: string;
};

/**
 * The strings of the locales other than the base locale allowed to equal the base locale's, each pinned to its value. An entry is a string that is the same word in that language, a proper name or an abbreviation written alike; never an untranslated string, which is translated instead. An entry whose key is gone or whose value has changed in either locale fails, so no exemption outlives its reason.
 */
const SAME_AS_BASE_LOCALE: ReadonlyArray<SameAsBaseLocale> = [
  { locale: 'fr', file: 'about.json', key: 'about.source.sitename', value: 'GitHub', reason: 'a proper name' },
  { locale: 'fr', file: 'common.json', key: 'common.openVAA', value: 'OpenVAA', reason: 'a proper name' },
  {
    locale: 'fr',
    file: 'adminApp.jobs.json',
    key: 'adminApp.jobs.id',
    value: 'ID',
    reason: 'an abbreviation written the same'
  },
  {
    locale: 'fr',
    file: 'adminApp.jobs.json',
    key: 'adminApp.jobs.messages',
    value: 'Messages',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'adminApp.login.json',
    key: 'adminApp.login.appSubtitle',
    value: 'Administration',
    reason: 'the same word in French'
  },
  { locale: 'fr', file: 'common.json', key: 'common.info', value: 'Info', reason: 'the same word in French' },
  {
    locale: 'fr',
    file: 'common.json',
    key: 'common.alliance.singular',
    value: 'alliance',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'common.json',
    key: 'common.alliance.plural',
    value: 'alliances',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'common.json',
    key: 'common.faction.singular',
    value: 'faction',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'common.json',
    key: 'common.faction.plural',
    value: 'factions',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'common.json',
    key: 'common.entityImage.candidate',
    value: 'Portrait',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'common.json',
    key: 'common.entityImage.organization',
    value: 'Logo',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'common.json',
    key: 'common.nomination',
    value: 'Nomination',
    reason: 'the same word in French'
  },
  { locale: 'fr', file: 'common.json', key: 'common.question', value: 'Question', reason: 'the same word in French' },
  {
    locale: 'fr',
    file: 'components.json',
    key: 'components.video.pause',
    value: 'Pause',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'contestantApp.questions.json',
    key: 'contestantApp.questions.openAnswerPrompt',
    value: 'Arguments',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'questions.json',
    key: 'questions.arguments.title',
    value: 'Arguments',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'entityFilters.json',
    key: 'entityFilters.numeric.maxLabel',
    value: 'Maximum',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'entityFilters.json',
    key: 'entityFilters.numeric.minLabel',
    value: 'Minimum',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'privacy.json',
    key: 'privacy.cookies.title',
    value: 'Cookies',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'questions.json',
    key: 'questions.title',
    value: 'Opinions',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'questions.json',
    key: 'questions.category.numQuestions#0/numQuestions=1',
    value: '1 question',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'questions.json',
    key: 'questions.category.numQuestions#0/numQuestions=*',
    value: '{numQuestions} questions',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'results.json',
    key: 'results.alliance.numShown#0/numShown=1',
    value: '1 alliance',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'results.json',
    key: 'results.alliance.numShown#0/numShown=*',
    value: '{numShown} alliances',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'results.json',
    key: 'results.faction.numShown#0/numShown=1',
    value: '1 faction',
    reason: 'the same word in French'
  },
  {
    locale: 'fr',
    file: 'results.json',
    key: 'results.faction.numShown#0/numShown=*',
    value: '{numShown} factions',
    reason: 'the same word in French'
  },
  { locale: 'lb', file: 'about.json', key: 'about.source.sitename', value: 'GitHub', reason: 'a proper name' },
  { locale: 'lb', file: 'common.json', key: 'common.openVAA', value: 'OpenVAA', reason: 'a proper name' },
  {
    locale: 'lb',
    file: 'adminApp.jobs.json',
    key: 'adminApp.jobs.id',
    value: 'ID',
    reason: 'an abbreviation written the same'
  },
  {
    locale: 'lb',
    file: 'about.json',
    key: 'about.feedback.title',
    value: 'Feedback',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'feedback.json',
    key: 'feedback.title',
    value: 'Feedback',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'feedback.json',
    key: 'feedback.error.emailSubject',
    value: 'Feedback',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'common.json',
    key: 'common.entityImage.candidate',
    value: 'Portrait',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'common.json',
    key: 'common.entityImage.organization',
    value: 'Logo',
    reason: 'the same word in Luxembourgish'
  },
  { locale: 'lb', file: 'common.json', key: 'common.info', value: 'Info', reason: 'the same word in Luxembourgish' },
  {
    locale: 'lb',
    file: 'components.json',
    key: 'components.video.transcript',
    value: 'Text',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'components.json',
    key: 'components.video.video',
    value: 'Video',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'entityFilters.json',
    key: 'entityFilters.text.ariaLabel',
    value: 'Text:',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'contestantApp.common.json',
    key: 'contestantApp.common.home',
    value: 'Start',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'contestantApp.help.json',
    key: 'contestantApp.help.title',
    value: 'Support',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'contestantApp.nominations.json',
    key: 'contestantApp.nominations.state.label',
    value: 'Status',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'entityFilters.json',
    key: 'entityFilters.filterButtonLabel',
    value: 'Filter',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'entityFilters.json',
    key: 'entityFilters.numeric.maxLabel',
    value: 'Maximum',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'lb',
    file: 'entityFilters.json',
    key: 'entityFilters.numeric.minLabel',
    value: 'Minimum',
    reason: 'the same word in Luxembourgish'
  },
  {
    locale: 'da',
    file: 'about.json',
    key: 'about.feedback.title',
    value: 'Feedback',
    reason: 'the same word in Danish'
  },
  { locale: 'da', file: 'about.json', key: 'about.source.sitename', value: 'GitHub', reason: 'a proper name' },
  {
    locale: 'da',
    file: 'adminApp.jobs.json',
    key: 'adminApp.jobs.id',
    value: 'ID',
    reason: 'an abbreviation written the same'
  },
  {
    locale: 'da',
    file: 'adminApp.login.json',
    key: 'adminApp.login.appSubtitle',
    value: 'Administration',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'common.json',
    key: 'common.alliance.singular',
    value: 'alliance',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'common.json',
    key: 'common.entityImage.organization',
    value: 'Logo',
    reason: 'the same word in Danish'
  },
  { locale: 'da', file: 'common.json', key: 'common.info', value: 'Info', reason: 'the same word in Danish' },
  {
    locale: 'da',
    file: 'components.json',
    key: 'components.matchScore.label',
    value: 'match',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'components.json',
    key: 'components.video.pause',
    value: 'Pause',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'components.json',
    key: 'components.video.video',
    value: 'Video',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'contestantApp.common.json',
    key: 'contestantApp.common.home',
    value: 'Start',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'contestantApp.help.json',
    key: 'contestantApp.help.title',
    value: 'Support',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'contestantApp.nominations.json',
    key: 'contestantApp.nominations.state.label',
    value: 'Status',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'entityDetails.json',
    key: 'entityDetails.links',
    value: 'Links',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'entityFilters.json',
    key: 'entityFilters.numeric.minLabel',
    value: 'Minimum',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'feedback.json',
    key: 'feedback.error.emailSubject',
    value: 'Feedback',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'feedback.json',
    key: 'feedback.send',
    value: 'Send feedback',
    reason: 'the same words in Danish'
  },
  { locale: 'da', file: 'feedback.json', key: 'feedback.title', value: 'Feedback', reason: 'the same word in Danish' },
  {
    locale: 'da',
    file: 'privacy.json',
    key: 'privacy.cookies.title',
    value: 'Cookies',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'questions.json',
    key: 'questions.arguments.pro',
    value: 'For',
    reason: 'the same word in Danish'
  },
  {
    locale: 'da',
    file: 'questions.json',
    key: 'questions.arguments.proCategory',
    value: 'For {option}',
    reason: 'the same words in Danish'
  },
  {
    locale: 'da',
    file: 'results.json',
    key: 'results.alliance.numShown#0/numShown=1',
    value: '1 alliance',
    reason: 'the same words in Danish'
  },
  {
    locale: 'et',
    file: 'adminApp.jobs.json',
    key: 'adminApp.jobs.id',
    value: 'ID',
    reason: 'an abbreviation written the same'
  },
  {
    locale: 'et',
    file: 'common.json',
    key: 'common.entityImage.organization',
    value: 'Logo',
    reason: 'the same word in Estonian'
  },
  { locale: 'et', file: 'common.json', key: 'common.openVAA', value: 'OpenVAA', reason: 'a proper name' },
  {
    locale: 'et',
    file: 'components.json',
    key: 'components.video.video',
    value: 'Video',
    reason: 'the same word in Estonian'
  },
  {
    locale: 'et',
    file: 'contestantApp.register.json',
    key: 'contestantApp.register.passwordValidation.number',
    value: 'Number',
    reason: 'the same word in Estonian'
  },
  {
    locale: 'fi',
    file: 'adminApp.jobs.json',
    key: 'adminApp.jobs.id',
    value: 'ID',
    reason: 'an abbreviation written the same'
  },
  {
    locale: 'fi',
    file: 'common.json',
    key: 'common.entityImage.organization',
    value: 'Logo',
    reason: 'the same word in Finnish'
  },
  { locale: 'fi', file: 'common.json', key: 'common.openVAA', value: 'OpenVAA', reason: 'a proper name' },
  {
    locale: 'fi',
    file: 'components.json',
    key: 'components.video.video',
    value: 'Video',
    reason: 'the same word in Finnish'
  },
  { locale: 'sv', file: 'about.json', key: 'about.source.sitename', value: 'GitHub', reason: 'a proper name' },
  {
    locale: 'sv',
    file: 'adminApp.jobs.json',
    key: 'adminApp.jobs.id',
    value: 'ID',
    reason: 'an abbreviation written the same'
  },
  {
    locale: 'sv',
    file: 'adminApp.login.json',
    key: 'adminApp.login.appSubtitle',
    value: 'Administration',
    reason: 'the same word in Swedish'
  },
  { locale: 'sv', file: 'common.json', key: 'common.openVAA', value: 'OpenVAA', reason: 'a proper name' },
  {
    locale: 'sv',
    file: 'components.json',
    key: 'components.video.transcript',
    value: 'Text',
    reason: 'the same word in Swedish'
  },
  {
    locale: 'sv',
    file: 'components.json',
    key: 'components.video.video',
    value: 'Video',
    reason: 'the same word in Swedish'
  },
  {
    locale: 'sv',
    file: 'contestantApp.help.json',
    key: 'contestantApp.help.title',
    value: 'Support',
    reason: 'the same word in Swedish'
  },
  {
    locale: 'sv',
    file: 'contestantApp.nominations.json',
    key: 'contestantApp.nominations.state.label',
    value: 'Status',
    reason: 'the same word in Swedish'
  },
  {
    locale: 'sv',
    file: 'entityFilters.json',
    key: 'entityFilters.filterButtonLabel',
    value: 'Filter',
    reason: 'the same word in Swedish'
  },
  {
    locale: 'sv',
    file: 'entityFilters.json',
    key: 'entityFilters.text.ariaLabel',
    value: 'Text:',
    reason: 'the same word in Swedish'
  },
  { locale: 'sv', file: 'feedback.json', key: 'feedback.title', value: 'Feedback', reason: 'the same word in Swedish' }
];

/** Whether a node is a variant message, by its shape: an object, not an array, holding `match` together with `declarations` or `selectors`. */
function isVariantMessage(node: unknown): node is { match?: Record<string, unknown> } {
  return (
    typeof node === 'object' &&
    node !== null &&
    !Array.isArray(node) &&
    'match' in node &&
    ('declarations' in node || 'selectors' in node)
  );
}

/** Collect the texts of a variant's `match`, each keyed by the variant's key and its match key. */
function collectVariantTexts(
  variant: { match?: Record<string, unknown> },
  key: string,
  out: Array<[string, string]>
): void {
  for (const [matchKey, text] of Object.entries(variant.match ?? {})) collectStrings(text, `${key}/${matchKey}`, out);
}

/** Collect every string of a node, keyed as `getComparedStrings` describes. */
function collectStrings(node: unknown, key: string, out: Array<[string, string]>): void {
  if (typeof node === 'string') {
    out.push([key, node]);
  } else if (Array.isArray(node)) {
    node.forEach((item, index) =>
      isVariantMessage(item)
        ? collectVariantTexts(item, `${key}#${index}`, out)
        : collectStrings(item, `${key}#${index}`, out)
    );
  } else if (isVariantMessage(node)) {
    collectVariantTexts(node, `${key}#0`, out);
  } else if (typeof node === 'object' && node !== null) {
    for (const [child, value] of Object.entries(node)) collectStrings(value, key ? `${key}.${child}` : child, out);
  }
}

const comparedStringsCache = new Map<string, Map<string, string>>();

/**
 * The strings of one message file a reader reads, keyed as they are compared. A plain message is keyed by its translation key (`common.info`). A variant message contributes each text of its `match`, keyed by its translation key, the variant's index and the match key (`questions.category.numQuestions#0/numQuestions=1`); its `declarations` and `selectors` are code, the same in every locale, and are not returned. A string with no letter once its `{placeholders}` are removed (an emoji, a dash, `{score}%`, an empty string) carries no word to translate and is not returned either.
 */
function getComparedStrings(locale: string, filename: string): Map<string, string> {
  const cacheKey = `${locale}/${filename}`;
  const cached = comparedStringsCache.get(cacheKey);
  if (cached) return cached;
  const found: Array<[string, string]> = [];
  collectStrings(JSON.parse(fs.readFileSync(path.join(messagesDir, locale, filename), 'utf8')), '', found);
  const strings = new Map(found.filter(([, value]) => /\p{L}/u.test(value.replace(/\{[^}]*\}/g, ''))));
  comparedStringsCache.set(cacheKey, strings);
  return strings;
}

test('the walk takes an object for a variant message only when it has a variant’s shape', () => {
  const namespace: Array<[string, string]> = [];
  collectStrings({ results: { match: { label: 'Your match' }, heading: 'Results' } }, '', namespace);
  expect(namespace, 'the strings of a namespace holding a key named match').toEqual([
    ['results.match.label', 'Your match'],
    ['results.heading', 'Results']
  ]);

  const variant: Array<[string, string]> = [];
  collectStrings(
    {
      count: [
        {
          declarations: ['input count'],
          selectors: ['count'],
          match: { 'count=1': '1 question', 'count=*': '{count} questions' }
        }
      ]
    },
    '',
    variant
  );
  expect(variant, 'the texts of a variant message').toEqual([
    ['count#0/count=1', '1 question'],
    ['count#0/count=*', '{count} questions']
  ]);
});

const comparedFilenames = baseLocaleFilenames.filter((filename) => !SAME_IN_EVERY_LOCALE.includes(filename));

test("no catalogue file of another locale has every value equal to the base locale's", () => {
  const unchanged = otherLocales.flatMap((locale) =>
    comparedFilenames
      .filter((filename) => {
        const base = getComparedStrings(baseLocale, filename);
        const translated = getComparedStrings(locale, filename);
        return base.size > 0 && [...base].every(([key, value]) => translated.get(key) === value);
      })
      .map((filename) => `${locale}/${filename}`)
  );
  expect(unchanged, `files whose every string equals the base locale’s: ${unchanged.join(', ')}`).toEqual([]);
});

/**
 * Whether a string of `locale` is the base locale's string at its key, alone or behind the locale's code in capitals and one space (`SV Send feedback`), the form of a placeholder left untranslated.
 */
function equalsBaseLocaleString(locale: string, value: string, baseValue: string | undefined): boolean {
  return baseValue !== undefined && (value === baseValue || value === `${locale.toUpperCase()} ${baseValue}`);
}

test("no string of another locale equals the base locale's, alone or behind a locale tag, but those the allowlist names", () => {
  const unlisted = otherLocales.flatMap((locale) =>
    comparedFilenames.flatMap((filename) => {
      const base = getComparedStrings(baseLocale, filename);
      return [...getComparedStrings(locale, filename)]
        .filter(([key, value]) => equalsBaseLocaleString(locale, value, base.get(key)))
        .filter(
          ([key, value]) =>
            !SAME_AS_BASE_LOCALE.some(
              (entry) =>
                entry.locale === locale && entry.file === filename && entry.key === key && entry.value === value
            )
        )
        .map(([key]) => `${locale}/${filename} ${key}`);
    })
  );
  expect(
    unlisted,
    `strings equal to the base locale’s that the allowlist does not name: ${unlisted.join('; ')}`
  ).toEqual([]);
});

test("every allowlist entry names a string equal to the base locale's", () => {
  const stale = SAME_AS_BASE_LOCALE.filter(
    (entry) =>
      getComparedStrings(entry.locale, entry.file).get(entry.key) !== entry.value ||
      getComparedStrings(baseLocale, entry.file).get(entry.key) !== entry.value
  ).map((entry) => `${entry.locale}/${entry.file} ${entry.key}`);
  expect(stale, `allowlist entries no longer equal in both locales: ${stale.join('; ')}`).toEqual([]);
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
