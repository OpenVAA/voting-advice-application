'use strict';

module.exports = {
  sayHello: async (ctx) => {
    ctx.body = { message: 'Hello from the plugin!' };
  }
};
