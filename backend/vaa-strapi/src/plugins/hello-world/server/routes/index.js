'use strict';

module.exports = {
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
};
