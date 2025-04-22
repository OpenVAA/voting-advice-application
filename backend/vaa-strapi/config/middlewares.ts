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
  /**
   * Increase limits for importing data
   */
  {
    name: 'strapi::body',
    config: {
      formLimit: '20mb', // modify form body
      jsonLimit: '20mb', // modify JSON body
      textLimit: '20mb', // modify text body
      formidable: {
        maxFileSize: 20 * 1024 * 1024 // multipart data, modify here limit of uploaded file size
      }
    }
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'global::error-capture',
    config: {}
  }
];
