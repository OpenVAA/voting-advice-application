'use strict';

/**
 * election service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::election.election');
