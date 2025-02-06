'use strict';

module.exports = ({ strapi }) => {
  return {
    async register() {
      console.log('Hello World Plugin: registered');
    },

    async bootstrap() {
      console.log('Hello World Plugin: bootstrapped');
    },

    async destroy() {
      console.log('Hello World Plugin: destroyed');
    },

    controllers: {
      hello: require('./controllers/hello')
    },

    routes: {
      admin: {
        type: 'admin',
        routes: []
      },
      'content-api': {
        type: 'content-api',
        routes: [
          {
            method: 'GET',
            path: '/hello',
            handler: 'hello.sayHello',
            config: {
              auth: false
            }
          }
        ]
      }
    }
  };
};
