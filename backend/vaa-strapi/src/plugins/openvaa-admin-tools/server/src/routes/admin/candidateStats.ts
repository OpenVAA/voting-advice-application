export default [
  {
    method: 'POST',
    path: '/candidate-statistics',
    handler: 'candidateStats.getStats',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.candidate-statistics'] },
        },
      ],
    },
  },
];
