export default [
  {
    method: 'POST',
    path: '/add-candidate/form-options',
    handler: 'addCandidate.getFormOptions',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.add-candidate'] },
        },
      ],
    },
  },
  {
    method: 'POST',
    path: '/add-candidate/submit',
    handler: 'addCandidate.submit',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.add-candidate'] },
        },
      ],
    },
  },
];
