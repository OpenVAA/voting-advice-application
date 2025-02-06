export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'your-jwt-secret')
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'your-api-token-salt')
  },
  watchIgnoreFiles: ['**/data', '**/data/**']
});
