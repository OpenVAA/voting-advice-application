/**
 * app-customization controller
 */

import { Data, factories } from '@strapi/strapi';
import { StrapiContext } from '../../../../types/customStrapiTypes';

export default factories.createCoreController('api::app-customization.app-customization', () => ({
  async find(ctx: StrapiContext) {
    const response = await super.find(ctx);

    if (response?.data) {
      const { candidateAppFAQ, translationOverrides } =
        response.data as Data.ContentType<'api::app-customization.app-customization'>;

      /**
       *  The translations are originally in the format:
       *  Array<{
       *    id: number;
       *    translationKey: string;
       *    translations: Array<{
       *      locale: string;
       *      translation: string;
       *    }>;
       *  }> or
       *  Before returning them to the frontend, they are transformed into the format:
       *  {
       *    [locale: string]: {
       *      [translationKey: string]: string;
       *    }
       *  }
       */
      if (translationOverrides) {
        const byLocale: { [locale: string]: { [key: string]: string } } = {};
        translationOverrides.forEach((trsOverride) => {
          trsOverride.translations?.forEach((trs) => {
            if (trs.translation) {
              byLocale[trs.locale] ??= {};
              byLocale[trs.locale][trsOverride.translationKey] = trs.translation;
            }
          });
        });
        response.data.translationOverrides = byLocale;
      }

      /**
       *  The candidateApp FAQ is in the format:
       *  Array<{
       *    locale: string;
       *    question: string;
       *    answer: string;
       *  }>
       *  It's transformed into the format:
       *  {
       *    [locale: string]: Array<{answer: string; question: string; }>;
       *  }
       */
      if (candidateAppFAQ) {
        const byLocale: { [locale: string]: Array<{ question: string; answer: string }> } = {};
        candidateAppFAQ.forEach(({ locale, question, answer }) => {
          byLocale[locale] ??= [];
          byLocale[locale].push({ question, answer });
        });
        response.data.candidateAppFAQ = byLocale;
      }
    }

    return response;
  }
}));
