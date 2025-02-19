# Deploying the Voting Advice Application

The application is fully containerized and the recommended way of deploying it is as Docker containers.

The instructions below detail how the application is deployed using [Render](https://render.com/) and [AWS](https://aws.amazon.com/) for email and media CDN, but the process is essentially the same with other cloud infrastructure providers.

## Costs

The hosting costs vary depending on the providers you use and the amount of expected traffic.

Recent (2024–2025) realized costs on Render have been:

- Database $19–55/month
- Backend service $25–85/month – a more performant instance is needed if there are a lot of candidates
- Frontend service $25–85/month
- Media CDN on AWS $10–100/month - the higher figure was for a version with 30 videos, the smaller figure is more likely in most cases
- External analytics server (Umami) $20/month

## Setup with Render and AWS

### 1. Fork

Fork the repo and make any changes you need to the source code. You’ll most likely need to edit at least:

- [StaticSettings](/packages/app-shared/src/settings/staticSettings.ts)
- For local development, copy [.env.example](/.env.example) to `.env` and edit the variables therein.

### 2. Configure AWS

The backend uses AWS by default for media storage (S3) and email (SES). If you do not wish to use AWS, you will need to edit the [Strapi plugin config](/backend/vaa-strapi/config/plugins.ts).

You will need to set the following `env` variables for AWS to work. You can collect the variables in an `.env` file for easier import into Render services, which are set up below.

```dotenv
## https://docs.localstack.cloud/references/configuration/
AWS_SES_ACCESS_KEY_ID="test"
AWS_SES_SECRET_ACCESS_KEY="test"
AWS_SES_REGION=us-east-1

# `MAIL_FROM` and `MAIL_REPLY_TO` variables will not take effect for emails sent by `user-permissions` Strapi plugin
# (f.e. reset password emails) as they are configured separately via Strapi UI in `Settings > Email Templates`.
MAIL_FROM="no-reply@example.com"
MAIL_REPLY_TO="contact@example.com"

## AWS S3 settings
AWS_S3_BUCKET=static.example.com

## https://docs.localstack.cloud/references/configuration/
AWS_S3_ACCESS_KEY_ID="test"
AWS_S3_ACCESS_SECRET="test"
AWS_S3_REGION=us-east-1

## The base URL is used to access static content uploaded via Strapi's UI to AWS S3:
## - on production it uses a dedicated subdomain which is linked to an eponymous AWS S3 bucket via a CNAME DNS record
## - in development it points directly to LocalStack host and is appended by the S3 bucket name in Strapi's `plugin.ts`
STATIC_CONTENT_BASE_URL=http://localhost:4566
STATIC_MEDIA_CONTENT_PATH=public/media
```

### 3. Create Render project

Login to Render or create an account.

Create a new project for your app. Next, you’ll need to create three services in it.

### 4. Create Postgres database

Create a new Postgres service.

- Use Postgres version 16.
- Select an appropriate instance type:
  - Even Basic-1gb may be enough
  - Disk size can be the smallest possible, e.g. 1GB, because we’re using AWS for media storage.
- Select a Database name and Username

Copy the following details from the newly-created instance to your `env` variables.

```dotenv
DATABASE_HOST=<Hostname, e.g. dpg-123456abcdefg-a>
DATABASE_PORT=<Port, e.g. 5432>
DATABASE_NAME=<Database>
DATABASE_USERNAME=<Username>
DATABASE_PASSWORD=<Password>
```

### 5. Create the Backend web service

Create a new Web Service.

- Select an instance type: Standard (2GB, 1CPU) or higher is safer than Starter, which may crash
- Link to your repository on Github
- Select the branch to deploy from
- Edit settings:
  - Set `Dockerfile Path` to `./backend/vaa-strapi/Dockerfile`
  - You may want to turn `Auto-Deploy` off
  - The other settings can be left to defaults

Set up `env` variables for the backend.

1. Create the following new variables:

```dotenv
STRAPI_HOST=0.0.0.0
STRAPI_PORT=1337
APP_KEYS="<toBeModified1>,<toBeModified2>"
API_TOKEN_SALT=<tobemodified3>
# ADMIN_JWT_SECRET and JWT_SECRET have to be different
ADMIN_JWT_SECRET=<tobemodified4>
JWT_SECRET=<tobemodified5>
DATABASE_SCHEMA=public
DATABASE_SSL_SELF=false
# Set to true if you want create mock data on an empty database
GENERATE_MOCK_DATA_ON_INITIALISE=false
GENERATE_MOCK_DATA_ON_RESTART=false
```

2. Add the following variables from above:

```dotenv
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USERNAME
DATABASE_PASSWORD
```

Copy the following details from the newly-created instance to your `env` variables.

```dotenv
PUBLIC_BROWSER_BACKEND_URL=<The Service URL>
PUBLIC_SERVER_BACKEND_URL=<The Service URL>
```

### 6. Create the Frontend web service

Create a new Web Service.

- Select an instance type: Standard (2GB, 1CPU) or higher is safer than Starter, which may crash
- Link to your repository on Github (likely the same as for the backend)
- Select the branch to deploy from (likely the same as for the backend)
- Edit settings:
  - Set `Dockerfile Path` to `./frontend/Dockerfile`
  - You may want to turn `Auto-Deploy` off
  - The other settings can be left to defaults

1. Create the following new variables:

```dotenv
PUBLIC_DEBUG=false
PUBLIC_BROWSER_FRONTEND_URLL=<The Service URL>
PUBLIC_SERVER_FRONTEND_URLL=<The Service URL>
```

2. Add the following variables from above:

```dotenv
PUBLIC_BROWSER_BACKEND_URL
PUBLIC_SERVER_BACKEND_URL
```

3. If you're using bank authentication, also add the following variables:

```dotenv
# Source: https://openvaa.sandbox.signicat.com/auth/open/.well-known/openid-configuration
# The URL where users are redirected to authenticate with the OpenID Connect provider before obtaining an authorization code.
PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT=https://openvaa.sandbox.signicat.com/auth/open/connect/authorize
# The URL used to exchange an authorization code for access, ID, and refresh tokens.
IDENTITY_PROVIDER_TOKEN_ENDPOINT=https://openvaa.sandbox.signicat.com/auth/open/connect/token
# The endpoint that provides a JSON Web Key Set (JWKS) used to verify the authenticity of signed tokens from the identity provider.
IDENTITY_PROVIDER_JWKS_URI=https://openvaa.sandbox.signicat.com/auth/open/.well-known/openid-configuration/jwks
# Source: https://dashboard.signicat.com/oidc-clients/clientdetails/{client_id}
PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=client_id
# Source: https://dashboard.signicat.com/oidc-clients/clientdetails/{client_id}/secrets
IDENTITY_PROVIDER_CLIENT_SECRET=client_secret
# Source: https://dashboard.signicat.com/oidc-clients/new-public-key/{client_id}.
# Select "Encryption", keep the private part of the key pair.
IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY='{"kty":"RSA","kid":"{key_id}","use":"enc","alg":"RSA-OAEP","e":"{secret}","n":"{secret}","d":"{secret}","p":"{secret}","q":"{secret}","dp":"{secret}","dq":"{secret}","qi":"{secret}"}'
```

### 7. Create a Strapi Admin

Go to the Strapi admin panel via the backend url and create the new Admin user as prompted.

If using bank authentication, create an API access token for the frontend:

1. In the Admin panel, go to Settings > API Tokens
2. Create a new token:
   - Type: Custom
   - Duration: Unlimited
   - Permissions (only one):
     - `Users-permissions.Candidate.preregister`
3. Copy the token into the `env` variable

```dotenv
BACKEND_API_TOKEN="<API Token>"
```

### 8. Fill in further `env` variables

There are still a couple of `env` variables you now have, which need to be added to the services.

1. Backend:

```dotenv
PUBLIC_FRONTEND_URL
```

2. If using bank authentication, frontend:

```dotenv
BACKEND_API_TOKEN
```

### 9. Use your own domain name for the frontend

1. In Render, go to the Frontend Service.
   - Go to Settings > Custom Domain > Add Custom domain:
     - Set the domain name you want to use, e.g. `subdomain.domain.tld`
     - Write down the Render URL
2. Go to your DNS provider, e.g, Cloudflare.
   - Create a new CNAME record in the DNS:
     - Type: `CNAME`
     - Name: the `subdomain` you chose above
     - Target: the Render frontend URL
3. Go back to Render and verify the domain.
