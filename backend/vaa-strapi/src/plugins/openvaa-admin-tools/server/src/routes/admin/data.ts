export default [
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
  {
    method: 'POST',
    path: '/find-data',
    handler: 'data.find',
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
    path: '/find-candidates',
    handler: 'data.findCandidates',
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
];
