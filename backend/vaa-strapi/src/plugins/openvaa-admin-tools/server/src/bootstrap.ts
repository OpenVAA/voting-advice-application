import type { Core } from '@strapi/strapi';

async function bootstrap({ strapi }: { strapi: Core.Strapi }) {
  const actions = [
    {
      section: 'plugins',
      displayName: 'Send Email',
      uid: 'send-email',
      pluginName: 'openvaa-admin-tools',
    },
    {
      section: 'plugins',
      displayName: 'Import Data',
      uid: 'import-data',
      pluginName: 'openvaa-admin-tools',
    },
    {
      section: 'plugins',
      displayName: 'Manage Candidate Auth',
      uid: 'manage-candidate-auth',
      pluginName: 'openvaa-admin-tools',
    },
    {
      section: 'plugins',
      displayName: 'Add Candidate',
      uid: 'add-candidate',
      pluginName: 'openvaa-admin-tools',
    },
    {
      section: 'plugins',
      displayName: 'Candidate Statistics',
      uid: 'candidate-statistics',
      pluginName: 'openvaa-admin-tools',
    },
  ];
  await strapi.admin.services.permission.actionProvider.registerMany(actions);
}

export default bootstrap;
