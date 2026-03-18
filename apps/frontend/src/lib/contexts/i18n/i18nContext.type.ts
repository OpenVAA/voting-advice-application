import type { Readable } from 'svelte/store';

/**
 * A Context containing all localization-related utilities.
 *
 * After Paraglide migration:
 * - `locale` is a readable store wrapping Paraglide's getLocale() (constant within a page lifecycle)
 * - `locales` is a readable store wrapping Paraglide's locale array
 * - `t` is a plain function (not a store) -- no `$` prefix needed in templates
 * - `translate` is a plain function for translating localized objects
 *
 * Note: `t` is NOT a store. Use `t(key)` directly, not `$t(key)`.
 * `locale` and `locales` are still stores for backward compatibility with
 * code that subscribes to them (e.g., filterStore, candidateUserDataStore).
 * In templates, use `$locale` for the locale string and `$locales` for the array.
 */
export type I18nContext = {
  locale: Readable<string>;
  locales: Readable<readonly string[]>;
  t: (key: string, params?: Record<string, unknown>) => string;
  translate: (strings: LocalizedString | string | undefined | null, locale?: string | null) => string;
};
