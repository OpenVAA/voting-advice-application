'use strict';

import { validatePassword } from '@openvaa/app-shared';
import { errors } from '@strapi/utils';
import fs from 'fs';
import candidate from './controllers/candidate';
import { restrictFilters, restrictPopulate } from '../../util/acl';

const { ValidationError } = errors;

// NOTE: Before adding permissions here, please make sure you've implemented the appropriate access control for the resource
const defaultPermissions = [
  { action: 'plugin::users-permissions.candidate.check', roleType: 'public' },
  { action: 'plugin::users-permissions.candidate.register', roleType: 'public' },
  { action: 'plugin::upload.content-api.upload', roleType: 'authenticated' },
  { action: 'plugin::upload.content-api.destroy', roleType: 'authenticated' },
  { action: 'api::candidate.candidate.find', roleType: 'authenticated' },
  { action: 'api::candidate.candidate.findOne', roleType: 'authenticated' },
  { action: 'api::candidate.candidate.update', roleType: 'authenticated' },
  { action: 'api::party.party.find', roleType: 'authenticated' },
  { action: 'api::party.party.findOne', roleType: 'authenticated' },
  { action: 'api::nomination.nomination.find', roleType: 'authenticated' },
  { action: 'api::nomination.nomination.findOne', roleType: 'authenticated' },
  { action: 'api::constituency.constituency.find', roleType: 'authenticated' },
  { action: 'api::constituency.constituency.findOne', roleType: 'authenticated' },
  { action: 'api::language.language.find', roleType: 'authenticated' },
  { action: 'api::language.language.findOne', roleType: 'authenticated' },
  { action: 'api::election.election.find', roleType: 'authenticated' },
  { action: 'api::election.election.findOne', roleType: 'authenticated' },
  { action: 'api::question.question.find', roleType: 'authenticated' },
  { action: 'api::question.question.findOne', roleType: 'authenticated' },
  { action: 'api::question-category.question-category.find', roleType: 'authenticated' },
  { action: 'api::question-category.question-category.findOne', roleType: 'authenticated' },
  { action: 'api::question-type.question-type.find', roleType: 'authenticated' },
  { action: 'api::question-type.question-type.findOne', roleType: 'authenticated' },
  { action: 'api::answer.answer.create', roleType: 'authenticated' },
  { action: 'api::answer.answer.delete', roleType: 'authenticated' },
  { action: 'api::answer.answer.find', roleType: 'authenticated' },
  { action: 'api::answer.answer.findOne', roleType: 'authenticated' },
  { action: 'api::answer.answer.update', roleType: 'authenticated' }
];

module.exports = async (plugin) => {
  const origBootstrap = plugin.bootstrap;
  plugin.bootstrap = async (ctx) => {
    const res = await origBootstrap(ctx);

    const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });

    const advanced = await pluginStore.get({ key: 'advanced' });
    advanced.allow_register = false; // Disable registration by default
    const url = new URL(process.env.PUBLIC_BROWSER_FRONTEND_URL ?? 'http://localhost:5173');
    url.pathname = '/candidate/password-reset';
    advanced.email_reset_password = url; // Setup correct frontend URL for password resets
    await pluginStore.set({ key: 'advanced', value: advanced });

    // Setup default permissions
    for (const permission of defaultPermissions) {
      const role = await strapi.query('plugin::users-permissions.role').findOne({
        where: {
          type: permission.roleType
        }
      });
      if (!role) {
        console.error(`Failed to initialize default permissions due to missing role type: ${permission.roleType}`);
        continue;
      }

      const count = await strapi.query('plugin::users-permissions.permission').count({
        where: {
          action: permission.action,
          role: role.id
        }
      });
      if (count !== 0) continue;

      await strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: permission.action,
          role: role.id
        }
      });
    }

    // Setup email template (the default template also does not make the URL clickable)
    const email = await pluginStore.get({ key: 'email' });
    // All options can be found here:
    // https://github.com/strapi/strapi/blob/2a2faea1d49c0d84077f66a57b3b73021a4c3ba7/packages/plugins/users-permissions/server/bootstrap/index.js#L41-L79
    email.reset_password.options.message = fs.readFileSync('config/email-templates/reset-password.html').toString();
    await pluginStore.set({ key: 'email', value: email });

    return res;
  };

  // Implement candidate registration functionality
  plugin.controllers.candidate = candidate;
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/candidate/check',
    handler: 'candidate.check',
    config: {
      middlewares: ['plugin::users-permissions.rateLimit'],
      prefix: ''
    }
  });
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/candidate/register',
    handler: 'candidate.register',
    config: {
      middlewares: ['plugin::users-permissions.rateLimit'],
      prefix: ''
    }
  });

  // Enforce ACL on the /users/me endpoint
  for (const route of plugin.routes['content-api'].routes) {
    if (route.method !== 'GET' || route.path !== '/users/me') continue;

    route.config.policies = [
      // Disable populate by default to avoid accidentally leaking data through relations
      restrictPopulate([
        'candidate.populate.nomination.populate.party',
        'candidate.populate.nomination.populate.constituency',
        'candidate.populate.nomination.populate.election',
        'candidate.populate.party',
        'candidate.populate.photo',
        'candidate.populate.appLanguage'
      ]),
      // Disable filters by default to avoid accidentally leaking data of relations
      restrictFilters([])
    ];
  }

  // Implements a curry function helper for detouring existing function, allowing to run some specific code before the real function.
  function detour(detourFn, fn) {
    return async (ctx) => {
      await fn(ctx);
      return await detourFn(ctx);
    };
  }

  // Enforce our password validation to existing endpoints
  const authController = plugin.controllers.auth;
  // We only check the `password` field from the body even though there are multiple variations of the password field.
  // This is because there's usually password confirmation which is compared against `password`, so the password equivalency
  // check would fail anyway if the confirmation password does not match password requirements.
  async function checkPasswordRequirements(ctx) {
    const body = ctx.request.body;
    if (!body.password || typeof body.password !== 'string')
      throw new ValidationError('Missing password field in the body.');

    const valid = validatePassword(body.password);
    if (!valid) {
      throw new ValidationError('Password does not meet requirements');
    }
  }
  authController.changePassword = detour(authController.changePassword, checkPasswordRequirements);
  authController.resetPassword = detour(authController.resetPassword, checkPasswordRequirements);

  return plugin;
};
