const aws = require('@aws-sdk/client-ses');

export default ({env}) => {
  /**
   * Strapi initilises nodemailer transporter only once using main plugin config.
   * It allows to override only transporter specific (SMPT or SES) settings using [env]/plugins.ts, not the transporter type itself.
   * So we have to make sure that for development we initilise the transporter as SMTP to be able to use maildev.
   */
  const emailProviderOptions =
    env('NODE_ENV') === 'development'
      ? undefined
      : {
          SES: {
            ses: new aws.SES({
              apiVersion: '2010-12-01',
              region: env('AWS_REGION'),
              credentials: {
                accessKeyId: env('AWS_ACCESS_KEY_ID'),
                secretAccessKey: env('AWS_SECRET_ACCESS_KEY')
              }
            }),
            aws
          },
          // max 14 messages per second to comply with AWS SES
          sendingRate: 14
        };
  return {
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
          ...emailProviderOptions
        },
        settings: {
          defaultFrom: env('MAIL_FROM'),
          defaultReplyTo: env('MAIL_REPLY_TO')
        }
      }
    },
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          baseUrl: env('STATIC_CONTENT_BASE_URL'),
          rootPath: env('STATIC_MEDIA_CONTENT_PATH'),
          s3Options: {
            credentials: {
              accessKeyId: env('AWS_S3_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_S3_ACCESS_SECRET')
            },
            region: env('AWS_S3_REGION'),
            params: {
              ACL: 'private',
              Bucket: env('AWS_S3_BUCKET')
            }
          }
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {}
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
  };
};
