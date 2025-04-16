import { PUBLIC_API } from '../util/api';

export async function setDefaultApiPermissions(role: { type: 'public' | 'authenticated' | 'admin' }) {
  console.info('[setDefaultApiPermissions] Setting default API permissions');

  let roleId: number;
  switch (role.type) {
    case 'authenticated': {
      roleId = 1;
      break;
    }
    case 'public': {
      roleId = 2;
      break;
    }
    case 'admin': {
      roleId = 3;
      break;
    }
  }

  // Voter App
  for (const contentType of Object.values(PUBLIC_API)) {
    await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action: contentType + '.find',
        role: roleId
      }
    });
    // App Customization is a single type, so we don't need to create a '.findOne' permission for it
    if (contentType.indexOf('app-customization') > -1) continue;
    await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action: contentType + '.findOne',
        role: roleId
      }
    });
  }

  // Allow sending feedback
  await strapi.query('plugin::users-permissions.permission').create({
    data: {
      action: 'api::feedback.feedback' + '.create',
      role: roleId
    }
  });

  // Candidate App
  const authTypes = [
    'plugin::users-permissions.auth.callback',
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.auth.connect',
    'plugin::users-permissions.auth.emailConfirmation',
    'plugin::users-permissions.auth.forgotPassword',
    'plugin::users-permissions.auth.register',
    'plugin::users-permissions.auth.resetPassword',
    'plugin::users-permissions.auth.sendEmailConfirmation',
    'plugin::users-permissions.candidate.check',
    'plugin::users-permissions.candidate.register'
  ];

  for (const authType of authTypes) {
    await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action: authType,
        role: roleId
      }
    });
  }
}
