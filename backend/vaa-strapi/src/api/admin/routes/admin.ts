/**
 * Auth of these routes is set to false because it would try to authenticate
 * candidate users instead of admin users. Custom is-admin policy is used to
 * make sure that only admin users can send emails.
 */
export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/admin/send-email',
      handler: 'admin.sendEmail',
      config: {
        policies: ['is-admin'],
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/admin/send-email-to-unregistered',
      handler: 'admin.sendEmailToUnregistered',
      config: {
        policies: ['is-admin'],
        auth: false
      }
    }
  ]
};
