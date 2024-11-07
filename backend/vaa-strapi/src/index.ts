'use strict';
import { Strapi } from '@strapi/strapi';
import { generateMockDataOnInitialise, generateMockDataOnRestart, loadDataFolder } from './constants';
import { generateMockData } from './functions/generateMockData';
import { loadData } from './functions/loadData';
import { loadDefaultAppSettings } from './functions/loadDefaultAppSettings';
import { loadDefaultData } from './functions/loadDefaultData';
import { loadDynamicTranslations } from './functions/loadDynamicTranslations';
import { setDefaultApiPermissions } from './functions/setDefaultApiPermissions';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  // eslint-disable-next-line no-empty-pattern
  register({}: { strapi: Strapi }) {
    // ...
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {
    // 1. Default, mock or loaded data
    try {
      // Due to ENV variable handling, we'll bypass some falsy values
      if (loadDataFolder && !['""', "''", '-', 'false', 'FALSE', '0'].includes(loadDataFolder)) {
        loadData(loadDataFolder);
      } else if (generateMockDataOnInitialise || generateMockDataOnRestart) {
        generateMockData();
      } else {
        loadDefaultAppSettings();
        loadDynamicTranslations();
        loadDefaultData();
      }
    } catch (e) {
      console.error('There was an error in loading or generating data!', e);
    }

    // 2. Default API permissions
    setDefaultApiPermissions();
  }
};
