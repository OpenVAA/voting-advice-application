module.exports = async ({ strapi }) => {
  const actions = [
    {
      section: 'plugins',
      displayName: 'Send Email',
      uid: 'send-email',
      pluginName: 'candidate-admin'
    }
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
