import { staticSettings } from '@openvaa/app-shared';
import en from './translations/en/dynamic.json';
import fi from './translations/fi/dynamic.json';
import sv from './translations/sv/dynamic.json';

/**
 * Get dynamic translations from json files in format used in Strapi.
 */
export function getDynamicTranslations(): Array<TranslationOverride> {
  const locales = staticSettings.supportedLocales.map((locale) => locale.code);

  // TODO: Move translations from frontend to @openvaa/app-shared and use those instead of hardcoding these copied files
  const translationsFromFiles = {
    en: flattenKeys(en),
    fi: flattenKeys(fi),
    sv: flattenKeys(sv)
  };

  const dynamicTranslations = Array<TranslationOverride>();

  for (const key in translationsFromFiles[locales[0]]) {
    const dynamicTranslation: TranslationOverride = {
      translationKey: key,
      translations: []
    };

    locales.forEach((locale) => {
      dynamicTranslation.translations.push({
        locale: locale,
        translation: translationsFromFiles[locale]?.[key]
      });
    });

    dynamicTranslations.push(dynamicTranslation);
  }
  return dynamicTranslations;
}

function flattenKeys(obj) {
  function recurse(obj, prefix) {
    const res = [];
    for (const key in obj) {
      if (typeof obj[key] !== 'string') {
        res.push(...recurse(obj[key], `${prefix}.${key}`));
      } else if (typeof obj[key] === 'string') {
        res.push([`${prefix}.${key}`, obj[key]]);
      }
    }
    return res;
  }

  return Object.fromEntries(recurse(obj, 'dynamic'));
}

type TranslationOverride = {
  translationKey: string;
  translations: Array<{
    locale: string;
    translation?: string;
  }>;
};
