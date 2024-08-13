import {generateMockDataOnInitialise, generateMockDataOnRestart} from '../constants';
import {dynamicSettings} from 'vaa-shared';
import {API} from './utils/api';
import {getCardContentsFromFile} from './utils/appSettings';

export async function loadDefaultAppSettings() {
  if (generateMockDataOnInitialise || generateMockDataOnRestart) {
    console.info(
      '[loadDefaultAppSettings] Mock data generation enabled - skipping loading of default app settings.'
    );
    return;
  }
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
