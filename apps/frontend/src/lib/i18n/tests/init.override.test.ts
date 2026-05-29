import { beforeEach, describe, expect, test } from 'vitest';
import { applyDynamicOverride, defaultLocale, locales } from '../init';

/**
 * Phase 90 Plan 01 Task 2 (Stage A — D-90-10 / TIR5:28-50):
 * `init.ts` resolves the effective `supportedLocales` as
 *   `dynamicSettings.i18n.supportedLocales ?? staticSettings.supportedLocales`,
 * and the exported `locales` array filters to the override codes when present.
 *
 * `applyDynamicOverride(dynamicSettings)` is the canonical writer (called from
 * the root +layout.ts load fn BEFORE any consumer reads `locales` / `defaultLocale`).
 * Calling with `undefined` (or with no `i18n.supportedLocales`) is a no-op and
 * preserves the static-default behaviour for baseV1 / e2e / 89-04 perms.
 */
describe('i18n init — runtime supportedLocales override', () => {
  beforeEach(() => {
    // Reset to default behaviour between tests
    applyDynamicOverride(undefined);
  });

  test('Without override, locales equals the Paraglide compile-time superset', () => {
    applyDynamicOverride(undefined);
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThan(1);
    // Default locale comes from staticSettings (currently 'en')
    expect(typeof defaultLocale).toBe('string');
    expect(defaultLocale.length).toBeGreaterThan(0);
  });

  test('With override of one locale, locales is filtered to that single code', () => {
    applyDynamicOverride({
      i18n: {
        supportedLocales: [{ code: 'en', name: 'English', isDefault: true }]
      }
    } as never);
    expect(locales).toEqual(['en']);
    expect(defaultLocale).toBe('en');
  });

  test('With override of two locales, locales is filtered to both codes (order preserved by Paraglide superset)', () => {
    applyDynamicOverride({
      i18n: {
        supportedLocales: [
          { code: 'en', name: 'English', isDefault: true },
          { code: 'fi', name: 'Suomi' }
        ]
      }
    } as never);
    expect(locales).toEqual(expect.arrayContaining(['en', 'fi']));
    expect(locales.length).toBe(2);
    expect(defaultLocale).toBe('en');
  });

  test('Override with empty supportedLocales array falls back to static default', () => {
    applyDynamicOverride({ i18n: { supportedLocales: [] } } as never);
    expect(locales.length).toBeGreaterThan(1);
  });

  test('Override without i18n key falls back to static default', () => {
    applyDynamicOverride({} as never);
    expect(locales.length).toBeGreaterThan(1);
  });
});
