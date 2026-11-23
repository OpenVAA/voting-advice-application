/**
 * `resolveStaticSettings` — an instance overlay merged over the shipped static settings and validated.
 *
 * Covers the empty overlay, the merge semantics an overlay relies on (objects merged, arrays replaced whole), the inputs rejected before the merge, a schema failure labelled with its source, and a `__proto__` key that must not reach `Object.prototype`.
 */

import { describe, expect, it } from 'vitest';
import { resolveStaticSettings } from './resolveStaticSettings';
import { staticSettings } from './staticSettings';

describe('resolveStaticSettings', () => {
  it('returns the base settings for an empty overlay', () => {
    expect(resolveStaticSettings({ base: staticSettings, overlay: {} })).toEqual(staticSettings);
  });

  it('changes only the member an overlay names', () => {
    const resolved = resolveStaticSettings({ base: staticSettings, overlay: { admin: { email: 'a@b.fi' } } });
    expect(resolved).toEqual({ ...staticSettings, admin: { email: 'a@b.fi' } });
  });

  it('merges a colour into its theme and keeps every other colour', () => {
    const resolved = resolveStaticSettings({
      base: staticSettings,
      overlay: { colors: { light: { primary: '#123456' } } }
    });
    expect(resolved.colors.light).toEqual({ ...staticSettings.colors.light, primary: '#123456' });
    expect(resolved.colors.dark).toEqual(staticSettings.colors.dark);
  });

  it('replaces the locale list whole', () => {
    const supportedLocales = [{ code: 'fi', name: 'Suomi', isDefault: true }];
    const resolved = resolveStaticSettings({ base: staticSettings, overlay: { supportedLocales } });
    expect(resolved.supportedLocales).toEqual(supportedLocales);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'settings']
  ])('rejects %s as the overlay', (_label, overlay) => {
    expect(() => resolveStaticSettings({ base: staticSettings, overlay })).toThrow(
      'instance/staticSettings.json must hold a JSON object'
    );
  });

  it('rejects a data adapter in the overlay', () => {
    expect(() => resolveStaticSettings({ base: staticSettings, overlay: { dataAdapter: { pageSize: 1000 } } })).toThrow(
      /dataAdapter.*not instance-overlayable/
    );
  });

  it('names the source and the unknown key when the merged settings are invalid', () => {
    expect(() =>
      resolveStaticSettings({ base: staticSettings, overlay: { colours: {} }, source: 'fixture.json' })
    ).toThrow(/^fixture\.json[\s\S]*Unrecognized key[\s\S]*colours/);
  });

  it('does not let a `__proto__` key reach Object.prototype', () => {
    const overlay: unknown = JSON.parse('{ "__proto__": { "polluted": true } }');
    let resolved: unknown;
    try {
      resolved = resolveStaticSettings({ base: staticSettings, overlay });
    } catch {
      resolved = undefined;
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    if (resolved !== undefined) expect(resolved).toEqual(staticSettings);
  });
});
