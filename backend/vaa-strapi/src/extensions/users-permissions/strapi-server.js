module.exports = async (plugin) => {
  // Detour bootstrap so we can overwrite default grants
  // TODO: this gets run each boot, figure out how to make this one-off so these can be changed if needed?
  const origBootstrap = plugin.bootstrap;
  plugin.bootstrap = async (ctx) => {
    const res = origBootstrap(ctx);

    const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
    
    const grants = await pluginStore.get({ key: 'grant' });
    grants.email.enabled = false;
    await pluginStore.set({ key: 'grant', value: grants });

    const advanced = await pluginStore.get({ key: 'advanced' });
    advanced.allow_register = false;
    await pluginStore.set({ key: 'advanced', value: advanced });

    return res;
  };
  // TODO: consider adding passkey grant

  // TODO: either add provider somehow or write custom controller fully
  // plugin.controllers.passkey = require('./controllers/passkey');
  // plugin.routes['content-api'].routes.push({
  //   method: 'POST',
  //   path: '/auth/passkey',
  //   handler: 'passkey.callback',
  // });

  return plugin;
};