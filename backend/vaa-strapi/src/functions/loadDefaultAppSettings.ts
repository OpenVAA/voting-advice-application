import { dynamicSettings } from '@openvaa/app-shared';
import { addMissingPartialRecords, getCardContentsFromFile } from '../util/appSettings';

/**
 * Add the settings from the `dynamicSettings.ts` file as defaults into Strapi if they don't exist yet.
 */
export async function loadDefaultAppSettings(): Promise<void> {
  if (await strapi.documents('api::app-setting.app-setting').findFirst()) {
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
