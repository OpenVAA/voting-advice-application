# Environment variables

OpenVAA reads its per-deployment configuration from environment variables. Locally they live in two files: the repo-root `.env` for the frontend and the tooling, and `apps/supabase/supabase/functions/.env` for the Edge Functions. In a deployment they are set in the frontend task's environment and as secrets of the Supabase project (see [Deployment](/developers-guide/deployment)).

Both files are copied from a committed template, and both are ignored by Git. Never commit a `.env` file, and never put a real key into a template.

The variables are grouped below by role. A unit test, `apps/frontend/src/lib/server/startup/environmentReference.test.ts`, fails when a variable of the frontend task's environment list, of the start-up check, of the analytics configuration or of the bootstrap script is missing from this page.

## The repo-root `.env`

Create it from the template:

```bash
cp .env.example .env
```

This one file is read by:

- **The frontend.** `apps/frontend/svelte.config.js` points SvelteKit's env loader (`kit.env.dir`) at the repository root, so both `$env/dynamic/public` and `$env/dynamic/private` read this file. SvelteKit exposes only `PUBLIC_`-prefixed variables to the browser, so a private key in the same file does not reach the client.
- **The Vite config**, which reads `FRONTEND_PORT` from it. A value set in the shell overrides the file.
- **The seed tool** (`yarn db:seed`) and **the Playwright config**, which both load it.

There is no `apps/frontend/.env`. Its template, `apps/frontend/.env.example`, holds no variables and explains that such a file would not be read; delete one if you have it left over.

The dev server restarts by itself when you edit the root `.env`.

## The Edge Function `.env`

The local Edge runtime does not read the repo-root `.env`. The three Edge Functions read `apps/supabase/supabase/functions/.env`:

```bash
cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env
yarn db:stop && yarn db:start
```

A running Edge runtime keeps the environment it started with, so restart the stack after every change. The template lists the eleven variables the functions need: the identity-provider settings, `IDENTITY_CALLBACK_SERVER_SECRET`, `PUBLIC_PROJECT_ID`, `SITE_URL` and the SMTP settings. The runtime sets `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` itself. [Edge Functions](/developers-guide/backend/edge-functions#configuration) shows which function reads which variable.

## Variables that exist twice

Four values are needed by both runtimes. The frontend reads a `PUBLIC_`-prefixed name and the Edge Functions read the same name without the prefix, and the two must hold the same value:

| Frontend                             | Edge Functions                |
| ------------------------------------ | ----------------------------- |
| `PUBLIC_SUPABASE_URL`                | `SUPABASE_URL`                |
| `PUBLIC_SUPABASE_ANON_KEY`           | `SUPABASE_ANON_KEY`           |
| `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` | `IDENTITY_PROVIDER_CLIENT_ID` |
| `PUBLIC_IDENTITY_PROVIDER_TYPE`      | `IDENTITY_PROVIDER_TYPE`      |

With both files in place, check them:

```bash
yarn check:env-local
```

It compares each pair between the root `.env` and the functions' `.env`, and checks that the functions' `.env` declares every variable the functions require. It prints variable names only, never values. `yarn lint:check` also runs `yarn assert:env-pair-registry`, which fails if a new twin appears in the source without an entry in the pair block of `.env.example`.

## Reading variables in the frontend

Only two modules read the environment, and every other module imports a `constants` object from one of them:

- [`$lib/utils/constants`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/constants.ts) reads `$env/dynamic/public`: the `PUBLIC_` variables, usable anywhere.
- [`$lib/server/constants`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/server/constants.ts) reads `$env/dynamic/private`: the private variables, usable only on the server.

```ts
import { constants } from '$lib/utils/constants';
const projectId = constants.PUBLIC_PROJECT_ID;
```

Both modules turn an unset variable into an empty string and never throw, because they are imported everywhere. The one default is `PUBLIC_IDENTITY_PROVIDER_TYPE`, which falls back to `signicat-ftn`. A required value is checked where it is used: the project id in the Supabase adapter, the identity-provider values when bank authentication runs. To add a variable, add it to the right `constants` module and to `.env.example`.

Because both modules use `$env/dynamic/*`, the values are read when the server starts, not when the app is built. A production container therefore takes its configuration from its task's environment.

The [`.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/.env.example) file explains each variable in more detail.

## Required at start

A production server refuses to start while one of these is unset, and its error names each one.

- `PUBLIC_SUPABASE_URL`: the Supabase API URL (`http://127.0.0.1:54321` locally).
- `PUBLIC_SUPABASE_ANON_KEY`: the anon (publishable) key.
- `PUBLIC_PROJECT_ID`: the project this deployment serves (see the next section).
- `ORIGIN`: the public origin of the deployment as a browser sees it (see [Proxy](#proxy)).

## `PUBLIC_PROJECT_ID`

Every query the frontend makes on a project-scoped table is limited to the project named by `PUBLIC_PROJECT_ID`. The variable is mandatory and has no fallback: if it is empty, or is not a canonical UUID, the Supabase adapter throws when it is constructed, and the message names the variable and the local default. The local value in `.env.example` is `00000000-0000-0000-0000-000000000001`, the default project that `seed.sql` creates.

## Proxy

- `ORIGIN`: the public origin, scheme and host with no trailing slash.
- `ADDRESS_HEADER`: the request header in which the nearest trusted proxy sets the client address.
- `XFF_DEPTH`: the number of trusted proxies in front of the server, counted from the right of the address header.

## Timeouts

- `KEEP_ALIVE_TIMEOUT`: seconds the server keeps an idle connection open.
- `HEADERS_TIMEOUT`: seconds the server waits for a request's headers.
- `SHUTDOWN_TIMEOUT`: seconds the server waits for requests in flight after a stop signal.

## Analytics

- `ANALYTICS_PROVIDER`: where analytics events go, `none`, `log` or `posthog`.
- `ANALYTICS_CONSENT_MODE`: whether events wait for the voter's consent, `gated` or `free`.
- `ANALYTICS_VISIT_ID_MODE`: how a visit is identified across events, `memory` or `none`.
- `ANALYTICS_POSTHOG_KEY`: the PostHog project key.
- `ANALYTICS_POSTHOG_HOST`: the PostHog host.
- `ANALYTICS_FLUSH_INTERVAL_MS`: how often queued events are handed to the provider.

## Logging and diagnostics

- `PUBLIC_LOG_LEVEL`: the minimum log level, one of `debug`, `info`, `warn` and `error`. When it is unset, the level is `warn`, or `debug` in a dev build or when `PUBLIC_DEBUG=true`. Any other value, `silent` included, logs one error and falls back.
- `PUBLIC_DEBUG`: when `true`, makes `debug` the default log level.
- `DEPLOYMENT_DIAGNOSTICS`: when `true`, switches on `/api/diagnostics`.

## Identity provider

[Bank authentication](/developers-guide/contestant-app/bank-authentication) describes the flow, and [`docs/key-generation.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/key-generation.md) explains how to make the keys.

- `PUBLIC_IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_TYPE`: `signicat-ftn` or `idura-ftn`.
- `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_CLIENT_ID`: the client id at the provider. `identity-callback` checks it as the token's audience.
- `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`: the private decryption keys, the provider's key-set URL and its issuer. Both providers use them, so change them when you switch providers.
- For Signicat: `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`, `IDENTITY_PROVIDER_TOKEN_ENDPOINT`, `IDENTITY_PROVIDER_CLIENT_SECRET`.
- For Idura: `IDURA_DOMAIN`, `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`.
- `IDENTITY_CALLBACK_SERVER_SECRET`: the secret the frontend server sends to `identity-callback` in the `x-identity-callback-secret` header. The function refuses every request without it. Generate one random value of at least 32 bytes per deployment (for example `openssl rand -hex 32`) and set the same value in the root `.env`, for the frontend server, and in the functions' `.env`. It is not a `PUBLIC_` variable and never reaches a browser. Without it, bank authentication ends on the error screen with `configuration_error`. The E2E wrapper generates its own for each run.

## Edge Functions

- `SITE_URL`: the site origin of post-login redirects and of the sign-in links `account-access` mails. There is no fallback.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`: the mail server that `send-email` and `account-access` use (the local email testing server in the template).

The functions read these from their own `.env`. The root `.env` carries them too, for serving a function directly against the root file, as the comments in `.env.example` describe.

## Bootstrap

`infra/scripts/bootstrap.sql` writes the rows a deployment needs that no migration can write. It reads:

- `PUBLIC_PROJECT_ID`
- `BOOTSTRAP_STORAGE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOOTSTRAP_BEHIND_CLOUDFLARE`
- `BOOTSTRAP_ACCOUNT_NAME`
- `BOOTSTRAP_PROJECT_NAME`
- `BOOTSTRAP_DEFAULT_LOCALE`
- `BOOTSTRAP_OPEN_FOR_VOTERS`

## Admin app

- `LLM_OPENAI_API_KEY`: the API key for the [Admin app](/developers-guide/admin-app)'s LLM features. They throw without it.

## Local only

- `FRONTEND_PORT`: the dev server port (5173 in the template).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: the seed tool uses `SUPABASE_URL`, falling back to `PUBLIC_SUPABASE_URL`.
- `E2E_PROJECT_ID`: commented out in the template. The E2E harness reads it to override the project its suite owns, `00000000-0000-0000-0000-0000000000e2`. Keep it commented out, as the template says.
- `LOCAL_DATA_DIR`: the directory of JSON files for the `local` data adapter. It is used only when `dataAdapter.type` in the [static settings](/developers-guide/configuration/static-settings) is `local`.

For the local stack, `yarn workspace @openvaa/supabase supabase status -o env` prints the keys (see [Quick start](/developers-guide/quick-start)).

## Settings that are not environment variables

The feedback rate limit's Cloudflare trust, `private.deployment_settings.behind_cloudflare`, is a database setting. See [Feedback rate limit and Cloudflare](/developers-guide/deployment#feedback-rate-limit-and-cloudflare).
