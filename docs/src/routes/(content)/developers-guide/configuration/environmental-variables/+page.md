# Environmental variables

In addition to basic configuration, some application functions are controlled by env variables. They affect:

- Backend
  - Strapi configuration
  - AWS LocalStack (development only)
  - AWS SES email
  - AWS S3 storage
  - [Mock data generation](/developers-guide/backend/mock-data-generation)
- Frontend configuration
  - Disk cache
  - Local data adapter
  - Pregistration
  - LLM API keys, used by the Admin App
- Debugging

For a full list of all the variables and their explanations see [.env.example](https://github.com/OpenVAA/voting-advice-application/blob/main/.env.example).
