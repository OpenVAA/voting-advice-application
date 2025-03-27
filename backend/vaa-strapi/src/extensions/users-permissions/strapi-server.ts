import { validatePassword } from '@openvaa/app-shared';
import { errors } from '@strapi/utils';
import fs from 'fs';
import * as candidate from './controllers/candidate';
import type { Core, UID } from '@strapi/strapi';
import { StrapiContext } from '../../../types/customStrapiTypes';
import { frontendUrl } from '../../constants';

const { ValidationError } = errors;

// NB! Before adding permissions here, please make sure you've implemented the appropriate access control for the resource
// Make sure to allow the user access to all publicly available data
const defaultPermissions: Array<{
  action: UID.Controller;
  roleTypes: ('public' | 'authenticated' | 'admin')[];
}> = [
  { action: 'plugin::users-permissions.candidate.check', roleTypes: ['public'] },
  { action: 'plugin::users-permissions.candidate.register', roleTypes: ['public'] },
  { action: 'plugin::users-permissions.user.me', roleTypes: ['authenticated', 'admin'] },
  { action: 'plugin::users-permissions.role.find', roleTypes: ['authenticated', 'admin'] },
  { action: 'plugin::users-permissions.role.findOne', roleTypes: ['authenticated', 'admin'] },
  { action: 'plugin::upload.content-api.upload', roleTypes: ['authenticated'] },
  { action: 'plugin::upload.content-api.destroy', roleTypes: ['authenticated'] },
  { action: 'api::candidate.candidate.find', roleTypes: ['authenticated'] },
  { action: 'api::candidate.answers.overwrite', roleTypes: ['authenticated'] },
  { action: 'api::candidate.answers.update', roleTypes: ['authenticated'] },
  { action: 'api::candidate.candidate.findOne', roleTypes: ['authenticated'] },
  { action: 'api::candidate.candidate.update', roleTypes: ['authenticated'] },
  { action: 'api::candidate.properties.update', roleTypes: ['authenticated'] },
  { action: 'api::alliance.alliance.find', roleTypes: ['authenticated'] },
  { action: 'api::alliance.alliance.findOne', roleTypes: ['authenticated'] },
  { action: 'api::constituency.constituency.find', roleTypes: ['authenticated'] },
  { action: 'api::constituency.constituency.findOne', roleTypes: ['authenticated'] },
  { action: 'api::constituency-group.constituency-group.find', roleTypes: ['authenticated'] },
  { action: 'api::constituency-group.constituency-group.findOne', roleTypes: ['authenticated'] },
  { action: 'api::election.election.find', roleTypes: ['authenticated'] },
  { action: 'api::election.election.findOne', roleTypes: ['authenticated'] },
  { action: 'api::nomination.nomination.find', roleTypes: ['authenticated'] },
  { action: 'api::nomination.nomination.findOne', roleTypes: ['authenticated'] },
  { action: 'api::party.party.find', roleTypes: ['authenticated'] },
  { action: 'api::party.party.findOne', roleTypes: ['authenticated'] },
  { action: 'api::question.question.find', roleTypes: ['authenticated'] },
  { action: 'api::question.question.findOne', roleTypes: ['authenticated'] },
  { action: 'api::question.question.generateInfo', roleTypes: ['admin'] },
  { action: 'api::question-category.question-category.find', roleTypes: ['authenticated'] },
  { action: 'api::question-category.question-category.findOne', roleTypes: ['authenticated'] },
  { action: 'api::question-type.question-type.find', roleTypes: ['authenticated'] },
  { action: 'api::question-type.question-type.findOne', roleTypes: ['authenticated'] }
];

module.exports = async (plugin: Core.Plugin) => {
  const origBootstrap = plugin.bootstrap;

  plugin.bootstrap = async (ctx) => {
    const res = await origBootstrap(ctx);

    const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });

    // Setup advanced settings
    const advanced = (await pluginStore.get({ key: 'advanced' })) as AdvancedOptions;
    // Disable registration by default
    advanced.allow_register = false;
    // Setup correct frontend URL for password resets
    const url = new URL(frontendUrl);
    url.pathname = '/candidate/password-reset';
    advanced.email_reset_password = url;
    await pluginStore.set({ key: 'advanced', value: advanced });

    const adminType = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'admin' } });

    if (!adminType) {
      // Create admin role for admin-ui functions
      await strapi.query('plugin::users-permissions.role').create({
        data: {
          name: 'Admin',
          description: 'Role for admin that can access LLM-admin-ui.',
          type: 'admin'
        }
      });
    }

    // Setup default permissions
    for (const permission of defaultPermissions) {
      for (const roleType of permission.roleTypes) {
        const role = await strapi.query('plugin::users-permissions.role').findOne({
          where: {
            type: roleType
          }
        });
        if (!role) {
          console.error(`Failed to initialize default permissions due to missing role type: ${roleType}`);
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
    }

    // Setup email template (the default template also does not make the URL clickable)
    const email = (await pluginStore.get({ key: 'email' })) as EmailTemplateOptions;
    email.reset_password.options.message = fs.readFileSync('config/email-templates/reset-password.html').toString();
    // TODO: Insert AWS_SES env vars here
    // const emailSender = {
    //   name: '',
    //   email: '',
    // }
    // email.reset_password.options.from = emailSender;
    // email.email_confirmation.options.from = emailSender;
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
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/candidate/preregister',
    handler: 'candidate.preregister',
    config: {
      middlewares: ['plugin::users-permissions.rateLimit'],
      prefix: ''
    }
  });

  // Enforce ACL on the /users/me endpoint
  for (const route of plugin.routes['content-api'].routes) {
    if (route.method !== 'GET' || route.path !== '/users/me') continue;
    route.config.policies = ['global::restrict-populate', 'global::disallow-all-filters'];
  }

  // Enforce our password validation to existing endpoints
  const authController = plugin.controllers.auth;
  authController.changePassword = detour(authController.changePassword, checkPasswordRequirements);
  authController.resetPassword = detour(authController.resetPassword, checkPasswordRequirements);

  return plugin;
};

/**
 * We only check the `password` field from the body even though there are multiple variations of the password field. This is because there's usually password confirmation which is compared against `password`, so the password equivalency check would fail anyway if the confirmation password does not match password requirements.
 */
function checkPasswordRequirements(ctx: StrapiContext): void {
  const { body } = ctx.request;
  if (!body?.password || typeof body.password !== 'string')
    throw new ValidationError('Missing password field in the body.');

  const valid = validatePassword(body.password);
  if (!valid) {
    throw new ValidationError('Password does not meet requirements');
  }
}

/**
 * Implements a curry function helper for detouring existing function, allowing to run some specific code before the real function.
 */
function detour(detourFn: (...args: Array<unknown>) => unknown, fn: (ctx: StrapiContext) => void | Promise<void>) {
  return async (ctx: StrapiContext) => {
    await fn(ctx);
    return await detourFn(ctx);
  };
}

/**
 * Incomplete typing
 * See: https://github.com/strapi/strapi/blob/008421e40e4f0fb98aab7504cea5a2b8ef7099d5/packages/plugins/users-permissions/server/bootstrap/index.js#L88
 */
interface AdvancedOptions {
  allow_register: boolean;
  email_reset_password: URL | null;
}

/**
 * Incomplete typing
 * See: https://github.com/strapi/strapi/blob/2a2faea1d49c0d84077f66a57b3b73021a4c3ba7/packages/plugins/users-permissions/server/bootstrap/index.js#L41-L79
 */
interface EmailTemplateOptions {
  reset_password: {
    options: {
      subject: string;
      message: string;
    };
  };
}
