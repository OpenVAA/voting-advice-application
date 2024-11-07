module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  /*
   * To enable AWS S3 support:
   * https://github.com/strapi/strapi/tree/main/packages/providers/upload-aws-s3
   **/
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", env('NODE_ENV') === 'development' ? 'http:' : 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', `${env('STATIC_CONTENT_BASE_URL')}`],
          'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', `${env('STATIC_CONTENT_BASE_URL')}`],
          upgradeInsecureRequests: null
        }
      }
    }
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public'
];
