'use strict';
import { validatePassword } from '@openvaa/app-shared';
import { errors, sanitize, validateYupSchema, yup } from '@strapi/utils';

const { ValidationError, ApplicationError } = errors;

const checkSchema = yup.object({
  registrationKey: yup.string().required()
});
const validateCheckBody = validateYupSchema(checkSchema);

const registerSchema = yup.object({
  registrationKey: yup.string().required(),
  password: yup.string().required()
});
const validateRegisterBody = validateYupSchema(registerSchema);

function sanitizeCandidate(candidate, ctx) {
  const { auth } = ctx.state;
  const candidateSchema = strapi.getModel('api::candidate.candidate');

  return sanitize.contentAPI.output(candidate, candidateSchema, { auth }) as typeof candidate;
}

module.exports = {
  async check(ctx) {
    const params = ctx.request.body;
    await validateCheckBody(params);

    const candidate = await strapi.query('api::candidate.candidate').findOne({
      populate: ['user'],
      where: { registrationKey: params.registrationKey }
    });

    if (!candidate) {
      throw new ValidationError('Incorrect registration key');
    }

    if (candidate.user) {
      throw new ValidationError('The user associated with the registration key is already registered.');
    }

    return {
      candidate: {
        ...(await sanitizeCandidate(candidate, ctx)),
        //Return email associated with the registration key so that the login
        //page can be prefilled on navigation
        email: candidate.email
      }
    };
  },
  async register(ctx) {
    const params: {
      registrationKey: string;
      password: string;
    } = ctx.request.body;

    await validateRegisterBody(params);

    const valid = validatePassword(params.password);
    if (!valid) {
      throw new ValidationError('Password does not meet requirements');
    }

    const candidate = await strapi.query('api::candidate.candidate').findOne({
      populate: ['user'],
      where: { registrationKey: params.registrationKey }
    });

    if (!candidate) {
      throw new ValidationError('Incorrect registration key');
    }

    if (candidate.user) {
      throw new ValidationError('The user associated with the registration key is already registered.');
    }

    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
    const settings = (await pluginStore.get({ key: 'advanced' })) as { default_role: string };

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: settings.default_role } });

    if (!role) {
      throw new ApplicationError('Impossible to find the default role');
    }

    const user = await strapi.plugin('users-permissions').service('user').add({
      role: role.id,
      username: candidate.email,
      email: candidate.email,
      password: params.password,
      provider: 'local',
      confirmed: true
    });

    // TODO: this could be improved, specifically, there exists candidate per locale,
    // so we have to update based on email (unique) compared to relying on the ID
    await strapi.query('api::candidate.candidate').update({
      where: { email: candidate.email },
      data: {
        registrationKey: null,
        user: user.id
      }
    });

    return {
      success: true
    };
  }
};
