import type {Translations} from '@sveltekit-i18n/base';

/**
 * Remove nullish values from `translations` so that they will not overwrite existing translations.
 * @param translations A translations object tree
 * @returns Purged translations
 */
export function purgeTranslations(translations: Trl): Trl {
  if (translations == null) return undefined;
  const merged: Trl = {};
  for (const [k, v] of Object.entries(translations)) {
    if (v == null) continue;
    if (typeof v === 'object') {
      const res = purgeTranslations(v);
      if (res != null) merged[k] = res;
    } else {
      merged[k] = v;
    }
  }
  return merged;
}

type Trl = Translations.SerializedTranslations | undefined;
