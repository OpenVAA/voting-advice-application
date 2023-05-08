'use strict';
import {Strapi} from '@strapi/strapi';
import {generateMockData} from './functions/generateMockData';

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
    generateMockData();
  }
};
