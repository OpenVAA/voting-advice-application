'use strict';
import {Strapi} from '@strapi/strapi';
import {loadDataFolder} from './constants';
import {generateMockData} from './functions/generateMockData';
import {loadData} from './functions/loadData';
import {setDefaultApiPermissions} from './functions/setDefaultApiPermissions';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  // eslint-disable-next-line no-empty-pattern
  register({}: {strapi: Strapi}) {
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
    try {
      if (loadDataFolder) {
        loadData(loadDataFolder);
      } else {
        generateMockData();
      }
    } catch (e) {
      console.error('There was an error running loadData or generateMockData!', e);
    }
    setDefaultApiPermissions();
  }
};
