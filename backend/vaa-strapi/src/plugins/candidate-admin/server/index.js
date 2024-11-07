/* eslint-disable @typescript-eslint/no-require-imports -- require might be needed */
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
