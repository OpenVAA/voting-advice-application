export default ({env}) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '4h'
      },
      register: {
        allowedFields: ['candidate']
      }
    }
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.example.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD')
        }
      },
      settings: {
        defaultFrom: env('MAIL_FROM', 'candidate-app@example.com'),
        defaultReplyTo: env('MAIL_REPLY_TO', 'candidate-app@example.com')
      },
      ratelimit: env.NODE_ENV === 'development' && {
        max: 10000,
        interval: 60000
      }
    }
  },
  'import-export-entries': {
    enabled: true,
    resolve: './strapi-plugin-import-export-entries'
  },
  'candidate-admin': {
    enabled: true,
    resolve: './src/plugins/candidate-admin'
  }
});
