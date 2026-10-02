> **Note:** Parts of this page reference the legacy Strapi backend which has been replaced by Supabase. Content will be updated in a future release.

# Environment variables

In addition to basic configuration, some application functions are controlled by env variables. They affect:

- Backend
  - Strapi configuration
  - AWS LocalStack (development only)
  - AWS SES email
  - AWS S3 storage
  - [Mock data generation](/developers-guide/development/seed-data)
  - Dev user credentials (development only)
- Frontend configuration
  - Disk cache
  - Local data adapter
  - Pregistration
  - LLM API keys, used by the Admin App
- Debugging

For a full list of all the variables and their explanations see [.env.example](https://github.com/OpenVAA/voting-advice-application/blob/main/.env.example).

- The feedback rate limit's Cloudflare trust, `private.deployment_settings.behind_cloudflare`, is a database setting and not an environment variable. See [Feedback Rate Limit and Cloudflare](/developers-guide/deployment/#feedback-rate-limit-and-cloudflare).
