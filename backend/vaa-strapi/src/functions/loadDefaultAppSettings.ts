import {dynamicSettings} from 'vaa-app-shared';
import {API} from './utils/api';
import {getCardContentsFromFile} from './utils/appSettings';

export async function loadDefaultAppSettings() {
  if ((await strapi.entityService.findMany(API.AppSettings)).length > 0) {
    console.info(
      '[loadDefaultAppSettings] App settings found - skipping loading of default app settings.'
    );
    return;
  }

  const cardContents = getCardContentsFromFile();

  await strapi.entityService.create(API.AppSettings, {
    data: {...dynamicSettings, results: {...dynamicSettings.results, ...cardContents}}
  });
  console.info('[loadDefaultAppSettings] Default app settings loaded.');
}
