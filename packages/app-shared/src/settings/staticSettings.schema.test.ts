/**
 * `StaticSettingsSchema` — the strict schema an instance overlay's merged settings are validated against.
 *
 * Covers the shipped literal, one unknown-key rejection per nesting level, the colour, asset URL and font name formats that keep a value from escaping its CSS or HTML context, and the locale list rules.
 */

import { describe, expect, expectTypeOf, it } from 'vitest';
import { staticSettings } from './staticSettings';
import { StaticSettingsSchema } from './staticSettings.schema';
import { mergeSettings } from '../utils/mergeSettings';
import type { z } from 'zod';
import type { StaticSettings } from './staticSettings.type';

/**
 * Parse the shipped settings with `override` merged over them.
 */
function parseWith(override: object) {
  return StaticSettingsSchema.safeParse(mergeSettings(staticSettings, override));
}

/**
 * The paths of every issue of a failed parse, or `null` for a successful one.
 */
function issuePaths(result: ReturnType<typeof parseWith>): Array<Array<PropertyKey>> | null {
  return result.success ? null : result.error.issues.map((issue) => issue.path);
}

/**
 * The messages of every issue of a failed parse, joined, or `null` for a successful one.
 */
function issueMessages(result: ReturnType<typeof parseWith>): string | null {
  return result.success ? null : result.error.issues.map((issue) => issue.message).join('\n');
}

describe('StaticSettingsSchema', () => {
  it('accepts the shipped settings unchanged', () => {
    const result = StaticSettingsSchema.safeParse(staticSettings);
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data).toEqual(staticSettings);
  });

  it('infers a type assignable to StaticSettings', () => {
    expectTypeOf<z.infer<typeof StaticSettingsSchema>>().toMatchTypeOf<StaticSettings>();
  });

  it('leaves the optional seams absent in the shipped settings', () => {
    expect('logo' in staticSettings).toBe(false);
    expect('primary-content' in staticSettings.colors.light).toBe(false);
    expect('primary-content' in staticSettings.colors.dark).toBe(false);
  });

  it('accepts the optional content colours and logo when valid', () => {
    const result = parseWith({
      colors: {
        light: { 'primary-content': '#000000', 'warning-content': '#FFFFFF' },
        dark: { 'base-content': '#eeeeee' }
      },
      logo: { url: '/images/logo.svg', urlDark: 'https://example.org/logo-dark.svg' }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  describe('rejects an unknown key at every level', () => {
    it.each([
      ['the top level', { colours: {} }, []],
      ['colors.light', { colors: { light: { primay: '#123456' } } }, ['colors', 'light']],
      ['font', { font: { weight: 400 } }, ['font']],
      ['logo', { logo: { url: '/images/logo.svg', alt: 'Logo' } }, ['logo']]
    ])('inside %s', (_level, override, path) => {
      const result = parseWith(override);
      expect(result.success).toBe(false);
      expect(issueMessages(result)).toMatch(/Unrecognized key/);
      expect(issuePaths(result)).toContainEqual(path);
    });

    it('inside a supportedLocales element', () => {
      const result = parseWith({ supportedLocales: [{ code: 'fi', name: 'Suomi', isDefault: true, flag: 'fi' }] });
      expect(result.success).toBe(false);
      expect(issueMessages(result)).toMatch(/Unrecognized key/);
      expect(issuePaths(result)).toContainEqual(['supportedLocales', 0]);
    });
  });

  it.each(['#12345', 'red', '#1234567', '#123456;}'])('rejects the colour %j', (colour) => {
    const result = parseWith({ colors: { light: { accent: colour } } });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual([['colors', 'light', 'accent']]);
  });

  it('rejects an invalid optional content colour', () => {
    const result = parseWith({ colors: { dark: { 'primary-content': 'white' } } });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual([['colors', 'dark', 'primary-content']]);
  });

  it('rejects two default locales', () => {
    const result = parseWith({
      supportedLocales: [
        { code: 'fi', name: 'Suomi', isDefault: true },
        { code: 'sv', name: 'Svenska', isDefault: true }
      ]
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual([['supportedLocales']]);
    expect(issueMessages(result)).toMatch(/supportedLocales/);
  });

  it('rejects an empty locale list', () => {
    const result = parseWith({ supportedLocales: [] });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual([['supportedLocales']]);
  });

  describe('asset URLs', () => {
    const accepted = ['/fonts/x.css', '/images/logo.svg', 'https://example.org/a.css'];
    const rejected = [
      '//evil.example/x',
      'http://example.org/x',
      'javascript:alert(1)',
      '/a/../b',
      '/a b.css',
      '/a"b.css',
      "/a'b.css",
      '/a<b.css',
      '/a>b.css',
      '/a)b.css',
      '/a\\b.css',
      'fonts/x.css'
    ];

    it.each(accepted)('accepts %j as font.url, logo.url and logo.urlDark', (url) => {
      const result = parseWith({ font: { url }, logo: { url, urlDark: url } });
      expect(result.success === false ? result.error.issues : result.success).toBe(true);
    });

    it.each(rejected)('rejects %j as font.url', (url) => {
      const result = parseWith({ font: { url } });
      expect(result.success).toBe(false);
      expect(issuePaths(result)).toEqual([['font', 'url']]);
    });

    it.each(rejected)('rejects %j as logo.url and logo.urlDark', (url) => {
      const result = parseWith({ logo: { url, urlDark: url } });
      expect(result.success).toBe(false);
      expect(issuePaths(result)).toEqual([
        ['logo', 'url'],
        ['logo', 'urlDark']
      ]);
    });
  });

  describe('font.name', () => {
    it.each(['Inter', 'Open Sans', 'Source_Serif-4'])('accepts %j', (name) => {
      const result = parseWith({ font: { name } });
      expect(result.success === false ? result.error.issues : result.success).toBe(true);
    });

    it.each(["'Inter'", 'Inter;}', 'a"b', '', ' Inter'])('rejects %j', (name) => {
      const result = parseWith({ font: { name } });
      expect(result.success).toBe(false);
      expect(issuePaths(result)).toEqual([['font', 'name']]);
    });
  });

  it('rejects a font style other than sans or serif', () => {
    const result = parseWith({ font: { style: 'mono' } });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual([['font', 'style']]);
  });

  it('rejects a data adapter whose flags do not match its type', () => {
    const result = parseWith({ dataAdapter: { supportsAdminApp: false } });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual([['dataAdapter', 'supportsAdminApp']]);
  });
});
