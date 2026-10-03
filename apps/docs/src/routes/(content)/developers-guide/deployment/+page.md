# Deployment

A production OpenVAA has two parts:

- **The frontend**, a SvelteKit app built into a Node container from [`apps/frontend/Dockerfile`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/Dockerfile). The repository has a [Render](https://render.com/) Blueprint template for it, [`render.example.yaml`](https://github.com/OpenVAA/voting-advice-application/blob/main/render.example.yaml).
- **The backend**, a hosted [Supabase](https://supabase.com/) project: the database, Auth, Storage and the three Edge Functions.

The frontend reads its configuration at run time (see [Environment variables](/developers-guide/configuration/environmental-variables)), so the same image works in any environment once its variables are set.

## 1. Fork and configure

Fork the repository and make the changes your instance needs. At least edit the [static settings](/developers-guide/configuration/static-settings) in `packages/app-shared/src/settings/staticSettings.ts`: the locales, colours, font and admin email.

## 2. Set up the Supabase project

Create a project in Supabase. The Supabase CLI comes with `yarn install` and runs as `yarn workspace @openvaa/supabase supabase <command>`; Supabase's [deployment guide](https://supabase.com/docs/guides/deployment) explains how to link it to a hosted project and push changes.

1. **Schema.** Push the migrations in [`apps/supabase/supabase/migrations/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/migrations). They are generated from the files in `schema/`; see [Schema and migrations](/developers-guide/backend/intro#schema-and-migrations).
2. **Storage buckets.** Create the two buckets that `apps/supabase/supabase/config.toml` declares for the local stack: `public-assets` (public) and `private-assets` (private). The migrations create the bucket policies, not the buckets.
3. **Auth.** Apply on the hosted project what `config.toml` sets locally:
   - Enable the custom access token hook, `public.custom_access_token_hook` (`[auth.hook.custom_access_token]`). It puts the user's grants into the access token, and the authorisation model depends on it; see [Authentication and authorisation](/developers-guide/backend/authentication).
   - Set the site URL to the frontend's origin, and allow `<frontend origin>/api/candidate/auth/callback` as a redirect URL.
   - Configure an SMTP server for Auth email. The local stack delivers mail to its email testing server instead; see [Email](/developers-guide/backend/email).
4. **API row limit.** Make the API's maximum rows setting equal `dataAdapter.pageSize` in the static settings. Locally both are set to 50000.
5. **Account and project.** `apps/supabase/supabase/seed.sql` is local-development data. It creates two test users with a known password, so do not run it on a production database. Instead, create one row in `accounts` and one in `projects` in the SQL editor, modelled on the default account and project in `seed.sql`. A project is closed to voters by default (`open_for_voters` is `false`); set it to `true` when the voter app should open. The project's id becomes `PUBLIC_PROJECT_ID`.
6. **Storage cleanup.** Triggers delete stored files when the rows that own them are deleted or replaced. They read the Storage URL and the service-role key from the `public.storage_config` table, which only `service_role` and `postgres` can read. `seed.sql` fills it with local values; insert the hosted project's `supabase_url` and `service_role_key` instead.
7. **Feedback rate limit.** Set `behind_cloudflare`; see [below](#feedback-rate-limit-and-cloudflare).
8. **Edge Functions.** Deploy the three functions in [`apps/supabase/supabase/functions/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/functions) and set their variables as secrets of the project (see Supabase's [Edge Functions guide](https://supabase.com/docs/guides/functions)):
   - `PUBLIC_PROJECT_ID` and `SITE_URL` (the frontend's origin)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and `SMTP_USER` and `SMTP_PASS` for a server that needs a login
   - for bank authentication: `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI` and `IDENTITY_PROVIDER_ISSUER`

   Supabase sets `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` for the functions itself. `identity-callback` is called by the browser without a Supabase session, so it runs without JWT verification (`--no-verify-jwt`), as it does locally. [Edge Functions](/developers-guide/backend/edge-functions) describes each function.

## 3. Deploy the frontend on Render

1. Copy `render.example.yaml` to `render.yaml` and replace its placeholders (`<INSTANCE_NAME>`, `<INSTANCE_BRANCH>`, `<INSTANCE_DOMAIN>`), as its header comment lists. Check the values marked `# Check`, such as the plan and whether to deploy automatically.
2. Create the service in Render from the Blueprint. It is a Docker web service built from `./apps/frontend/Dockerfile` with the repository root as the build context. The image builds the shared packages and the frontend and runs `node ./apps/frontend/build/index.js` on port 3000.
3. Set the variables. The template declares:
   - `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`, which you enter in Render (`sync: false`)
   - `PUBLIC_DEBUG` and `PUBLIC_LOG_LEVEL`
   - `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL`
   - a commented-out environment group, `IDENTITY PROVIDER - PRODUCTION CLIENT`, for pre-registration with bank authentication

   Also add **`PUBLIC_PROJECT_ID`**, which the template does not list: the frontend's Supabase adapter throws without it. For bank authentication, the frontend needs the identity-provider variables listed under [Environment variables](/developers-guide/configuration/environmental-variables#bank-authentication-identity-provider), and for the Admin app's LLM features, `LLM_OPENAI_API_KEY`.

   **Never set `SUPABASE_SERVICE_ROLE_KEY` on the frontend service.** The key bypasses row-level security. The frontend never reads it; it belongs only to the Supabase project and to local tooling.

4. To use your own domain, list it under `domains` in `render.yaml` (or add it in the service's settings in Render). Then create a `CNAME` record at your DNS provider that points the domain to the service's Render URL, and verify the domain in Render.

### Upgrading an older Render service

Services created from an older version of the template may still mount a persistent disk at `/var/data/cache` and carry variables for a response cache (`CACHE_*`, `PUBLIC_CACHE_*`), for backend URLs (`PUBLIC_*_BACKEND_URL`) and for a backend API token. The current frontend uses none of them. Detach the disk and delete those variables; any left in place have no effect.

## Feedback rate limit and Cloudflare

Voter feedback is limited to five submissions per five minutes per client. A Postgres trigger on the `feedback` table picks the client's rate-limit bucket from the request headers. Which header it trusts is a database setting, `private.deployment_settings.behind_cloudflare`, and not an environment variable: the feedback insert goes straight from the browser to the database API, so no process that reads `.env` is on that path.

- When the setting is `true`, the bucket is keyed on `cf-connecting-ip`, which Cloudflare sets to the connecting client.
- When it is `false`, a client-sent `cf-connecting-ip` is ignored and the bucket is keyed on the last `x-forwarded-for` hop, which the gateway appends from the connection's peer.

The migration ships the setting as `false`. Set it once in the Supabase SQL editor:

```sql
UPDATE private.deployment_settings
SET
  behind_cloudflare = true;
```

**Precondition:** every request reaches the API through Cloudflare. Hosted Supabase does. A self-hosted gateway qualifies only when its origin accepts connections from Cloudflare alone; otherwise a client can send its own `cf-connecting-ip` and choose its own bucket.

**Hosted Supabase must set it.** On hosted Supabase the last `x-forwarded-for` hop can be a platform-internal address shared by many voters, so with the setting left `false` those voters share one bucket and the sixth submission among them in five minutes is refused.

The local development stack turns the setting on in `apps/supabase/supabase/seed.sql`, so that the E2E suite can give each feedback submission its own bucket.

## Testing a production build locally

[`docker-compose.dev.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/docker-compose.dev.yml) at the repository root builds the frontend's production image and runs it against the local Supabase stack. Start the stack first:

```bash
yarn db:start
docker compose -f docker-compose.dev.yml up --build
```

The app is then on port 3000. The compose file reaches the local API at `http://host.docker.internal:54321` unless `PUBLIC_SUPABASE_URL` says otherwise, and takes `PUBLIC_SUPABASE_ANON_KEY` from your environment.

To build and run the production frontend without Docker, run `yarn build` at the repository root, which builds the shared packages and the frontend, and then start the server with the variables set:

```bash
yarn build
node apps/frontend/build/index.js
```

It also listens on port 3000 by default.
