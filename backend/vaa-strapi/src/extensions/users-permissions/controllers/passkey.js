'use strict';

const { validateLoginBody } = require('./validation/passkey');

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

module.exports = {
  async callback(ctx) {
    const params = ctx.request.body;
    await validateLoginBody(params);

    return ctx.send({
        'result': 'hello world',
    });
  },
};
