'use strict';
import {setFrontendPermissions} from './functions/set-frontend-permissions';
import {generateFrontendToken} from './functions/generate-frontend-token';
import {Strapi} from '@strapi/strapi';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  // eslint-disable-next-line no-empty-pattern
  register({strapi}: {strapi: Strapi}) {
    // ...
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap() {
    generateFrontendToken(strapi)
    setFrontendPermissions();
  }
};
