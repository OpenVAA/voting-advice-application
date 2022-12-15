'use strict';
import { Strapi } from '@strapi/strapi';
import {generateMockData} from "./functions/generate-mock-data";

module.exports = {
	/**
	 * An asynchronous register function that runs before
	 * your application is initialized.
	 *
	 * This gives you an opportunity to extend code.
	 */
  register( { strapi }: { strapi: Strapi }) {
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
