export default [
  {
    method: 'POST',
    path: '/candidate-auth/search',
    handler: 'candidateAuth.search',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.manage-candidate-auth'] },
        },
      ],
    },
  },
  {
    method: 'POST',
    path: '/candidate-auth/info',
    handler: 'candidateAuth.getInfo',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.manage-candidate-auth'] },
        },
      ],
    },
  },
  {
    method: 'POST',
    path: '/candidate-auth/force-register',
    handler: 'candidateAuth.forceRegister',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.manage-candidate-auth'] },
        },
      ],
    },
  },
  {
    method: 'POST',
    path: '/candidate-auth/forgot-password',
    handler: 'candidateAuth.sendForgotPassword',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.manage-candidate-auth'] },
        },
      ],
    },
  },
  {
    method: 'POST',
    path: '/candidate-auth/set-password',
    handler: 'candidateAuth.setPassword',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.manage-candidate-auth'] },
        },
      ],
    },
  },
  {
    method: 'POST',
    path: '/candidate-auth/generate-password',
    handler: 'candidateAuth.generatePassword',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: ['plugin::openvaa-admin-tools.manage-candidate-auth'] },
        },
      ],
    },
  },
];
