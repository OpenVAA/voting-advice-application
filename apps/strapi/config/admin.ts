module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET')
  },
  apiToken: {
    salt: env('API_TOKEN_SALT')
  },
  // Increase admin login rate limit for development/test (default: 5 per 5 min).
  // Parallel E2E test workers share the same IP and admin email, which quickly
  // exhausts the default limit.
  ...(env('NODE_ENV') !== 'production' && {
    rateLimit: {
      enabled: true,
      interval: { min: 1 },
      max: 100
    }
  }),
  watchIgnoreFiles: ['**/data', '**/data/**']
});
