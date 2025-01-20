import { getDynamicTranslations } from './utils/appCustomization';

export async function loadDynamicTranslations() {
  if (await strapi.documents('api::app-customization.app-customization').findMany()) {
    console.info('[loadDynamicTranslations] App customization found - loading of dynamic translations skipped.');
    return;
  }

  await strapi.documents('api::app-customization.app-customization').create({
    data: { translationOverrides: getDynamicTranslations() }
  });
  console.info('[loadDynamicTranslations] Dynamic translations loaded.');
}
