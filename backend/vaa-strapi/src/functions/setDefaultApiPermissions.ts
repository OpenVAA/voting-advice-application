export async function setDefaultApiPermissions() {
  const roleId = 2; // Role for public user

  const contentTypes = [
    'api::answer.answer',
    'api::candidate-attribute.candidate-attribute',
    'api::candidate.candidate',
    'api::constituency.constituency',
    'api::election-app-label.election-app-label',
    'api::election.election',
    'api::language.language',
    'api::nomination.nomination',
    'api::party.party',
    'api::question-category.question-category',
    'api::question-type.question-type',
    'api::question.question'
  ];

  for (const contentType of contentTypes) {
    await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action: contentType + '.find',
        role: roleId
      }
    });
    await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action: contentType + '.findOne',
        role: roleId
      }
    });
  }

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
