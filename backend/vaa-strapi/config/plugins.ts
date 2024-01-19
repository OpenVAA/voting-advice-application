export default ({env}) => ({
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
      }
    }
  },
  'import-export-entries': {
    enabled: true
  }
});
