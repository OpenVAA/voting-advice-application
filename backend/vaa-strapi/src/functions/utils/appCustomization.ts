import {staticSettings} from 'vaa-shared';
import en from './translations/en.json';
import fi from './translations/fi.json';
import sv from './translations/sv.json';

/**
 * Get dynamic translations from json files in format used in Strapi.
 */
export function getDynamicTranslations() {
  const locales = staticSettings.supportedLocales.map((locale) => locale.code);

  // TODO: Move translations from frontend to vaa-shared and use those instead of hardcoding these copied files
  const translationsFromFiles = {
    en: flattenKeys(en),
    fi: flattenKeys(fi),
    sv: flattenKeys(sv)
  };

  const dynamicTranslations = Array<DynamicTranslation>();

  for (const key in translationsFromFiles[locales[0]]) {
    const dynamicTranslation: DynamicTranslation = {
      translationKey: key,
      translations: []
    };

    locales.forEach((locale) => {
      dynamicTranslation.translations.push({
        languageCode: locale,
        translation: translationsFromFiles[locale][key]
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

type DynamicTranslation = {
  translationKey: string;
  translations: Array<{
    languageCode: string;
    translation?: string;
  }>;
};
