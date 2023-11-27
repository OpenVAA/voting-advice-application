'use strict';

const { yup, validateYupSchema, sanitize, errors: { ValidationError } } = require('@strapi/utils');

const checkSchema = yup.object({
  registrationKey: yup.string().required(),
});
const validateCheckBody = validateYupSchema(checkSchema);

const registerSchema = yup.object({
  registrationKey: yup.string().required(),
  password: yup.string().required(),
});
const validateRegisterBody = validateYupSchema(registerSchema);

const sanitizeCandidate = (candidate, ctx) => {
  const { auth } = ctx.state;
  const candidateSchema = strapi.getModel('api::candidate.candidate');

  return sanitize.contentAPI.output(candidate, candidateSchema, { auth });
};

module.exports = {
  async check(ctx) {
    const params = ctx.request.body;
    await validateCheckBody(params);

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { registrationKey: params.registrationKey },
      populate: ['candidate'],
    });

    if (!user || !user.candidate) {
      throw new ValidationError('Incorrect registration key');
    }

    return {
      candidate: await sanitizeCandidate(user.candidate, ctx),
    };
  },
  async register(ctx) {
    const params = ctx.request.body;
    await validateRegisterBody(params);

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { registrationKey: params.registrationKey },
      populate: ['candidate'],
    });

    if (!user || !user.candidate) {
      throw new ValidationError('Incorrect registration key');
    }

    // TODO: validate password requirements
    // TODO: set the user password
  },
};