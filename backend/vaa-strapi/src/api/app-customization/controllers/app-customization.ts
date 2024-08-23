/**
 * app-customization controller
 */

import {factories} from '@strapi/strapi';
import {API} from '../../../functions/utils/api';
import {staticSettings} from 'vaa-shared';

export default factories.createCoreController(API.AppCustomization, () => ({
  async find(ctx) {
    const response = await super.find(ctx);

    if (response) {
      const {dynamicTranslations, translationOverrides} = response.data.attributes;

      if (dynamicTranslations) {
        const dynamicTranslationsByLocale = Object.fromEntries(
          staticSettings.supportedLocales.map((locale) => [locale.code, {}])
        );
        dynamicTranslations.forEach((dynTrs) => {
          dynTrs.translations?.forEach((trs) => {
            if (trs.translation) {
              dynamicTranslationsByLocale[trs.languageCode][dynTrs.translationKey] =
                trs.translation;
            }
          });
        });
        response.data.attributes.dynamicTranslations = dynamicTranslationsByLocale;
      }
      if (translationOverrides) {
        const translationOverridesByLocale = Object.fromEntries(
          staticSettings.supportedLocales.map((locale) => [locale.code, {}])
        );
        translationOverrides.forEach((trsOverride) => {
          trsOverride.translations?.forEach((trs) => {
            if (trs.translation) {
              translationOverridesByLocale[trs.languageCode][trsOverride.translationKey] =
                trs.translation;
            }
          });
        });
        response.data.attributes.translationOverrides = translationOverridesByLocale;
      }
    }

    return response;
  }
}));
