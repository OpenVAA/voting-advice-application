const path = require('path');

module.exports = ({ env }) => ({
	connection: {
		client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'strapi'),
      schema: env('DATABASE_SCHEMA', 'public'), // Not required
      ssl: env.bool('DATABASE_SSL_SELF') ? {
        rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false)
      } : false // This is a workaround due to a Strapi bug, it is documented at https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/configurations/required/databases.html#configuration-structure
    },
		useNullAsDefault: true
	}
});
