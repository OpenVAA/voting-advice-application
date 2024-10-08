module.exports = ({env}) => ({
  email: {
    config: {
      // Use the bundled maildev instance part of docker-compose
      provider: 'nodemailer',
      providerOptions: {
        host: 'maildev',
        port: 1025,
        ignoreTLS: true
      }
    }
  },
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 100000
      }
    }
  }
});
