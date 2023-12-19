'use strict';

import candidate from './controllers/candidate';

const defaultPermissions = [
  {action: 'plugin::users-permissions.candidate.check', roleType: 'public'},
  {action: 'plugin::users-permissions.candidate.register', roleType: 'public'},
  {action: 'api::candidate.candidate.find', roleType: 'authenticated'},
  {action: 'api::candidate.candidate.findOne', roleType: 'authenticated'},
  {action: 'api::party.party.find', roleType: 'authenticated'},
  {action: 'api::party.party.findOne', roleType: 'authenticated'},
  {action: 'api::nomination.nomination.find', roleType: 'authenticated'},
  {action: 'api::nomination.nomination.findOne', roleType: 'authenticated'},
  {action: 'api::constituency.constituency.find', roleType: 'authenticated'},
  {action: 'api::constituency.constituency.findOne', roleType: 'authenticated'}
];

module.exports = async (plugin) => {
  const origBootstrap = plugin.bootstrap;
  plugin.bootstrap = async (ctx) => {
    const res = await origBootstrap(ctx);

    const pluginStore = strapi.store({type: 'plugin', name: 'users-permissions'});

    const advanced = await pluginStore.get({key: 'advanced'});
    advanced.allow_register = false; // Disable registration by default
    const url = new URL(process.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173');
    url.pathname = '/candidate/password-reset';
    advanced.email_reset_password = url; // Setup correct frontend URL for password resets
    await pluginStore.set({key: 'advanced', value: advanced});

    // Setup default permissions
    for (const permission of defaultPermissions) {
      const role = await strapi.query('plugin::users-permissions.role').findOne({
        where: {
          type: permission.roleType
        }
      });
      if (!role) {
        console.error(
          `Failed to initialize default permissions due to missing role type: ${permission.roleType}`
        );
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

    // Setup email template (left for the future, the default template also does not make the URL clickable)
    const email = await pluginStore.get({key: 'email'});
    // All options can be found here:
    // https://github.com/strapi/strapi/blob/2a2faea1d49c0d84077f66a57b3b73021a4c3ba7/packages/plugins/users-permissions/server/bootstrap/index.js#L41-L79
    email.reset_password.options.message = `<p>We heard that you lost your password. Sorry about that!</p>

<p>But don’t worry! You can use the following link to reset your password:</p>
<a href="<%= URL %>?code=<%= TOKEN %>"><%= URL %>?code=<%= TOKEN %></a>

<p>Thanks.</p>`;
    await pluginStore.set({key: 'email', value: email});

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

  return plugin;
};
