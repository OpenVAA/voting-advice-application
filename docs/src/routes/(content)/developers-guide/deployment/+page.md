# Deployment

The frontend is containerized and the recommended way of deploying it is as a Docker container. The backend uses Supabase, either cloud-hosted or self-hosted.

## Costs

The hosting costs vary depending on the providers you use and the amount of expected traffic.

Recent (2024-2025) realized costs on Render have been:

- Frontend service $25-85/month
- Supabase (cloud) Free tier or Pro $25/month depending on usage
- External analytics server (Umami) $20/month

## Setup with Render and Supabase

The instructions below detail how the application is deployed using [Render](https://render.com/) for the frontend and [Supabase](https://supabase.com/) for the backend.

### 1. Fork

Fork the repo and make any changes you need to the source code. You'll most likely need to edit at least:

- [StaticSettings](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts)
- For local development, copy `.env.example` to `.env` and edit the variables therein.

### 2. Set up Supabase

Create a Supabase project (cloud or self-hosted). Apply the database migrations from `apps/supabase/supabase/migrations/` and deploy Edge Functions from `apps/supabase/supabase/functions/`.

You will need the following environment variables from your Supabase project:

```dotenv
PUBLIC_SUPABASE_URL=<your Supabase project URL>
PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

### 3. Create the Frontend web service on Render

Create a new Web Service.

- Select an instance type: Standard (2GB, 1CPU) or higher is safer than Starter, which may crash
- Link to your repository on Github
- Select the branch to deploy from
- Edit settings:
  - Set `Dockerfile Path` to `./frontend/Dockerfile`
  - You may want to turn `Auto-Deploy` off
  - The other settings can be left to defaults

Set up environment variables for the frontend:

```dotenv
PUBLIC_DEBUG=false
PUBLIC_SUPABASE_URL=<your Supabase project URL>
PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

If you're using bank authentication, also add the identity provider variables (see `.env.example` for the full list).

### 4. Use your own domain name for the frontend

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

## Manually Creating a Production Build

### Building the frontend separately

To build the frontend separately for production, run `yarn build` in the `frontend` directory. This will build the frontend into JavaScript
files contained in the `build` directory. You can then copy the contents of the `build` folder into a Node server along with
the `package.json` and `yarn.lock` files and can start the frontend by running `node index.js` in the directory. The frontend
will use port 3000 by default.

Don't forget to run `yarn install --production` before starting the frontend.
