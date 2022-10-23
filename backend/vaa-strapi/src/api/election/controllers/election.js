'use strict';

/**
 * election controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::election.election');
