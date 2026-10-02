# Environment variables

OpenVAA reads its per-deployment configuration from environment variables. Locally they live in two files: the repo-root `.env` for the frontend and the tooling, and `apps/supabase/supabase/functions/.env` for the Edge Functions. In production they are set on the hosting platform and as secrets of the Supabase project (see [Deployment](/developers-guide/deployment)).

Both files are copied from a committed template, and both are ignored by Git. Never commit a `.env` file, and never put a real key into a template.

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

A running Edge runtime keeps the environment it started with, so restart the stack after every change. The template lists the ten variables the functions need: the identity-provider settings, `PUBLIC_PROJECT_ID`, `SITE_URL` and the SMTP settings. The runtime sets `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` itself. [Edge Functions](/developers-guide/backend/edge-functions#configuration) shows which function reads which variable.

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

## `PUBLIC_PROJECT_ID`

Every query the frontend makes on a project-scoped table is limited to the project named by `PUBLIC_PROJECT_ID`. The variable is mandatory and has no fallback: if it is empty, or is not a canonical UUID, the Supabase adapter throws when it is constructed, and the message names the variable and the local default. The local value in `.env.example` is `00000000-0000-0000-0000-000000000001`, the default project that `seed.sql` creates.

The `identity-callback` Edge Function reads the same name to decide which project a self-registered candidate joins, so the Edge Function `.env` carries it too.

## Reading variables in the frontend

Only two modules read the environment, and every other module imports a `constants` object from one of them:

- [`$lib/utils/constants`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/constants.ts) reads `$env/dynamic/public`: the `PUBLIC_` variables, usable anywhere.
- [`$lib/server/constants`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/server/constants.ts) reads `$env/dynamic/private`: the private variables, usable only on the server.

```ts
import { constants } from '$lib/utils/constants';
const projectId = constants.PUBLIC_PROJECT_ID;
```

Both modules turn an unset variable into an empty string and never throw, because they are imported everywhere. The one default is `PUBLIC_IDENTITY_PROVIDER_TYPE`, which falls back to `signicat-ftn`. A required value is checked where it is used: the project id in the Supabase adapter, the identity-provider values when bank authentication runs. To add a variable, add it to the right `constants` module and to `.env.example`.

Because both modules use `$env/dynamic/*`, the values are read when the server starts, not when the app is built. A production container therefore takes its configuration from the hosting platform's environment.

## The variables

The [`.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/.env.example) file explains each variable in more detail. By group:

### Supabase

- `PUBLIC_SUPABASE_URL`, `SUPABASE_URL`: the Supabase API URL (`http://127.0.0.1:54321` locally). The seed tool uses `SUPABASE_URL`, falling back to `PUBLIC_SUPABASE_URL`.
- `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`: the anon (publishable) key.
- `SUPABASE_SERVICE_ROLE_KEY`: the service-role key. It bypasses row-level security, so it has no `PUBLIC_` twin and nothing in the frontend reads it. The seed tool, the E2E wrapper script and the bank-auth E2E specs need it.

For the local stack, `yarn workspace @openvaa/supabase supabase status -o env` prints the keys (see [Quick start](/developers-guide/quick-start)).

### Project scoping

- `PUBLIC_PROJECT_ID`: the project this deployment serves (see above).
- `E2E_PROJECT_ID`: commented out in the template. The E2E harness reads it to override the project its suite owns, `00000000-0000-0000-0000-0000000000e2`. Keep it commented out, as the template says.

### Frontend

- `FRONTEND_PORT`: the dev server port (5173 in the template).
- `PUBLIC_BROWSER_FRONTEND_URL`, `PUBLIC_SERVER_FRONTEND_URL`: the frontend's own URL as seen from the browser and from the server. The public `constants` module exposes them.
- `LOCAL_DATA_DIR`: the directory of JSON files for the `local` data adapter. It is used only when `dataAdapter.type` in the [static settings](/developers-guide/configuration/static-settings) is `local`.
- `PUBLIC_DEBUG`: when `true`, makes `debug` the default log level.
- `PUBLIC_LOG_LEVEL`: the minimum log level, one of `debug`, `info`, `warn` and `error`. When it is unset, the level is `warn`, or `debug` in a dev build or when `PUBLIC_DEBUG=true`. Any other value, `silent` included, logs one error and falls back.

### Bank authentication (identity provider)

[Bank authentication](/developers-guide/candidate-app/bank-authentication) describes the flow, and [`docs/key-generation.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/key-generation.md) explains how to make the keys.

- `PUBLIC_IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_TYPE`: `signicat-ftn` or `idura-ftn`.
- `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_CLIENT_ID`: the client id at the provider. `identity-callback` checks it as the token's audience.
- `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`: the private decryption keys, the provider's key-set URL and its issuer. Both providers use them, so change them when you switch providers.
- For Signicat: `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`, `IDENTITY_PROVIDER_TOKEN_ENDPOINT`, `IDENTITY_PROVIDER_CLIENT_SECRET`.
- For Idura: `IDURA_DOMAIN`, `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`.

### Edge Functions

- `SITE_URL`: the site origin used in post-login redirects and invitation links. There is no fallback.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`: the mail server that `send-email` uses (the local email testing server in the template).

The functions read these from their own `.env`. The root `.env` carries them too, for serving a function directly against the root file, as the comments in `.env.example` describe.

### Admin app

- `LLM_OPENAI_API_KEY`: the API key for the [Admin app](/developers-guide/admin-app)'s LLM features. They throw without it.

## Settings that are not environment variables

The feedback rate limit's Cloudflare trust, `private.deployment_settings.behind_cloudflare`, is a database setting. See [Feedback rate limit and Cloudflare](/developers-guide/deployment#feedback-rate-limit-and-cloudflare).
