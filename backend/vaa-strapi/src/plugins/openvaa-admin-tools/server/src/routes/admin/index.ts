export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/send-email',
      handler: 'email.sendEmail',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: { actions: ['plugin::openvaa-admin-tools.send-email'] },
          },
        ],
      },
    },
    {
      method: 'POST',
      path: '/send-email-to-unregistered',
      handler: 'email.sendEmailToUnregistered',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: { actions: ['plugin::openvaa-admin-tools.send-email'] },
          },
        ],
      },
    },
    {
      method: 'POST',
      path: '/import-data',
      handler: 'data.import',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: { actions: ['plugin::openvaa-admin-tools.import-data'] },
          },
        ],
      },
    },
    {
      method: 'POST',
      path: '/delete-data',
      handler: 'data.delete',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: { actions: ['plugin::openvaa-admin-tools.import-data'] },
          },
        ],
      },
    },
  ],
};
