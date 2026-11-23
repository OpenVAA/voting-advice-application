// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  collectStrings,
  flattenMessageKeys,
  getHtmlTags,
  getPlaceholders,
  isVariantMessage,
  readLocaleCatalog
} from './messageCatalog';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const inlangSettings = JSON.parse(fs.readFileSync(path.join(frontendDir, 'project.inlang', 'settings.json'), 'utf8'));
const pathPatterns: Array<string> = inlangSettings['plugin.inlang.messageFormat'].pathPattern;

describe('flattenMessageKeys', () => {
  test('flattens branches with dots and keeps a variant message as one leaf', () => {
    expect(flattenMessageKeys({ a: { b: 'x', c: [{ declarations: [], match: {} }] } }, 'ns')).toEqual([
      'ns.a.b',
      'ns.a.c'
    ]);
  });

  test('keeps a bare variant object as one leaf', () => {
    expect(flattenMessageKeys({ n: { selectors: [], match: { '*': 'x' } } }, 'ns')).toEqual(['ns.n']);
  });
});

describe('getPlaceholders and getHtmlTags', () => {
  test('return the distinct placeholder names, sorted', () => {
    expect(getPlaceholders('Hi {name}, {count} and {name}')).toEqual(['count', 'name']);
  });

  test('return the distinct tag names, lower-cased and sorted', () => {
    expect(getHtmlTags('<p>a <strong>b</strong></p>')).toEqual(['p', 'strong']);
    expect(getHtmlTags('<P>a</P>')).toEqual(['p']);
  });
});

describe('isVariantMessage and collectStrings', () => {
  test('isVariantMessage needs match together with declarations or selectors', () => {
    expect(isVariantMessage({ declarations: [], match: {} })).toBe(true);
    expect(isVariantMessage({ match: { label: 'x' } })).toBe(false);
    expect(isVariantMessage([{ declarations: [], match: {} }])).toBe(false);
  });

  test('keys a plain message by its key and each variant text by key#index/matchKey', () => {
    const found: Array<[string, string]> = [];
    collectStrings(
      {
        plain: 'Hello',
        count: [{ declarations: [], selectors: ['n'], match: { 'n=1': 'One', 'n=*': '{n} many' } }]
      },
      'ns',
      found
    );
    expect(found).toEqual([
      ['ns.plain', 'Hello'],
      ['ns.count#0/n=1', 'One'],
      ['ns.count#0/n=*', '{n} many']
    ]);
  });
});

describe('readLocaleCatalog', () => {
  test('the en catalogue holds exactly the keys of the generated TranslationKey union', () => {
    const catalog = readLocaleCatalog({ frontendDir, locale: 'en', pathPatterns });
    const unionKeys = fs
      .readFileSync(path.join(frontendDir, 'src', 'lib', 'types', 'generated', 'translationKey.ts'), 'utf8')
      .split('\n')
      .flatMap((line) => line.match(/^\s*\| '([^']+)'/)?.[1] ?? []);
    expect(unionKeys.length).toBeGreaterThan(0);
    expect(Object.keys(catalog).sort()).toEqual([...unionKeys].sort());
  });

  test('a variant message is a single entry holding the variant node', () => {
    const catalog = readLocaleCatalog({ frontendDir, locale: 'en', pathPatterns });
    const variants = Object.values(catalog).filter((node) => Array.isArray(node) || isVariantMessage(node));
    expect(variants.length).toBeGreaterThan(0);
  });

  test('a missing pattern file throws naming it', () => {
    expect(() =>
      readLocaleCatalog({ frontendDir, locale: 'en', pathPatterns: ['./messages/{locale}/doesNotExist.json'] })
    ).toThrow(/doesNotExist\.json/);
  });
});
