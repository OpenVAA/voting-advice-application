import { dynamicSettings } from '@openvaa/app-shared';
import { getCardContentsFromFile } from './utils/appSettings';
import { addMissingPartialRecords } from './utils/appSettings';

/**
 * Add the settings from the `dynamicSettings.ts` file as defaults into Strapi if they don't exist yet.
 */
export async function loadDefaultAppSettings(): Promise<void> {
  if ((await strapi.documents('api::app-setting.app-setting').findMany()).length > 0) {
    console.info('[loadDefaultAppSettings] App settings found - skipping loading of default app settings.');
    return;
  }
  const cardContents = getCardContentsFromFile();
  const settings = addMissingPartialRecords(dynamicSettings);
  await strapi.documents('api::app-setting.app-setting').create({
    data: { ...settings, results: { ...settings.results, ...cardContents } }
  });
  console.info('[loadDefaultAppSettings] Default app settings loaded.');
}
