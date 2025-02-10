import type { Core } from '@strapi/strapi';

async function bootstrap({ strapi }: { strapi: Core.Strapi }) {
  const actions = [
    {
      section: 'plugins',
      displayName: 'Send Email',
      uid: 'send-email',
      pluginName: 'openvaa-admin-tools',
    },
  ];
  await strapi.admin.services.permission.actionProvider.registerMany(actions);
}

export default bootstrap;
