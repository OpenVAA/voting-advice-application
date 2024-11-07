import { API } from './utils/api';
import { getDynamicTranslations } from './utils/appCustomization';

export async function loadDynamicTranslations() {
  if (await strapi.entityService.findMany(API.AppCustomization)) {
    console.info('[loadDynamicTranslations] App customization found - loading of dynamic translations skipped.');
    return;
  }

  await strapi.entityService.create(API.AppCustomization, {
    data: { translationOverrides: getDynamicTranslations() }
  });
  console.info('[loadDynamicTranslations] Dynamic translations loaded.');
}
