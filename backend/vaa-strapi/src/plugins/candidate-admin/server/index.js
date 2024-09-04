/* eslint-disable @typescript-eslint/no-require-imports -- require is needed with Strapi */
const bootstrap = require('./bootstrap');
const controllers = require('./controllers');
const routes = require('./routes');
const services = require('./services');

module.exports = {
  bootstrap,
  controllers,
  routes,
  services
};
