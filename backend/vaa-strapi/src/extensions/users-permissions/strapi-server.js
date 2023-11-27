'use strict';

import candidate from './controllers/candidate';

const defaultPermissions = [
  { action: 'plugin::users-permissions.candidate.check', roleType: 'public' },
  { action: 'plugin::users-permissions.candidate.register', roleType: 'public' },
  { action: 'api::candidate.candidate.findOne', roleType: 'authenticated' },
  { action: 'api::candidate.candidate.find', roleType: 'authenticated' },
];

module.exports = async (plugin) => {
  const origBootstrap = plugin.bootstrap;
  plugin.bootstrap = async (ctx) => {
    const res = origBootstrap(ctx);

    const pluginStore = strapi.store({type: 'plugin', name: 'users-permissions'});

    // Disable registration by default
    const advanced = await pluginStore.get({key: 'advanced'});
    advanced.allow_register = false;
    await pluginStore.set({key: 'advanced', value: advanced});

    // Setup default permissions
    for (const permission of defaultPermissions) {
      const role = await strapi.query('plugin::users-permissions.role').findOne({
        where: {
          type: permission.roleType,
        },
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

    return res;
  };

  // Implement candidate registration functionality
  plugin.controllers.candidate = candidate;
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/candidate/check',
    handler: 'candidate.check',
    config : {
      middlewares: ['plugin::users-permissions.rateLimit'],
      prefix: '',
    },
  })
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/candidate/register',
    handler: 'candidate.register',
    config : {
      middlewares: ['plugin::users-permissions.rateLimit'],
      prefix: '',
    },
  })

  return plugin;
};
