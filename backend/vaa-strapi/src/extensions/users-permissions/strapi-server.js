'use strict';

const defaultAuthenticatedPermissions = [
  'api::candidate.candidate.findOne',
  'api::candidate.candidate.find'
];

module.exports = async (plugin) => {
  const origBootstrap = plugin.bootstrap;
  plugin.bootstrap = async (ctx) => {
    const res = await origBootstrap(ctx);

    const pluginStore = strapi.store({type: 'plugin', name: 'users-permissions'});

    // Disable registration by default
    const advanced = await pluginStore.get({key: 'advanced'});
    advanced.allow_register = false;
    await pluginStore.set({key: 'advanced', value: advanced});

    // Setup default permissions for authenticated role
    const authenticated = await strapi.query('plugin::users-permissions.role').findOne({
      where: {
        type: 'authenticated'
      }
    });

    for (const permission of defaultAuthenticatedPermissions) {
      const count = await strapi.query('plugin::users-permissions.permission').count({
        where: {
          action: permission,
          role: authenticated.id
        }
      });
      if (count !== 0) continue;

      await strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: permission,
          role: authenticated.id
        }
      });
    }

    return res;
  };

  return plugin;
};
