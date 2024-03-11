export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/admin/send-email',
      handler: 'admin.sendEmail',
      config: {
        policies: [],
        // TODO: Add authentication
        auth: false
      },
    },
    {
      method: 'POST',
      path: '/admin/send-email-to-unregistered',
      handler: 'admin.sendEmailToUnregistered',
      config: {
        policies: [],
        // TODO: Add authentication
        auth: false
      },
    },
  ],
};
