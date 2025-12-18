import { generateMockDataOnInitialise, generateMockDataOnRestart } from './constants';
import { generateMockData } from './functions/generateMockData';
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

  register(/*{ strapi }*/) {
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
      if (generateMockDataOnInitialise || generateMockDataOnRestart) {
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
    setDefaultApiPermissions('public');
    setDefaultApiPermissions('authenticated');
    setDefaultApiPermissions('admin');
  }
};
