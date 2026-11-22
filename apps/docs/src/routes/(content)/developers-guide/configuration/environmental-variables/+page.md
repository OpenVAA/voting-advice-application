# Environment variables

OpenVAA reads its per-deployment configuration from environment variables. Locally they live in two files: the repo-root `.env` for the frontend and the tooling, and `apps/supabase/supabase/functions/.env` for the Edge Functions. In a deployment they are set in the frontend task's environment and as secrets of the Supabase project (see [Deployment](/developers-guide/deployment)).

Both files are copied from a committed template, and both are ignored by Git. Never commit a `.env` file, and never put a real key into a template.

The variables are grouped below by role. A unit test, `apps/frontend/src/lib/server/startup/environmentReference.test.ts`, fails when a variable of the frontend task's environment list, of the start-up check, of the analytics configuration, of either `constants` module or of the bootstrap script is missing from this page, and when a table or list on this page names a variable that neither that code, an Edge Function nor one of the two `.env.example` templates declares.

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

## Where a deployment sets them

The tables below say, for each variable, what it does, who reads it, what happens when it is unset, and where a deployment sets it. On the AWS path described in [Deployment](/developers-guide/deployment), the frontend task receives exactly the variables of [`infra/modules/frontend-service/task-environment.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/modules/frontend-service/task-environment.json), those of bank authentication only when the root sets `identity_provider_type`. An entry whose source is `value` is set in `environment_values` of the root's `terraform.tfvars`; an entry whose source is `parameter` is a SecureString in the AWS parameter store, which the task's execution role reads. The Edge Functions read secrets of the Supabase project, which the Supabase Terraform module writes. The bootstrap script reads the operator's shell.

## Required at start

A production server checks these once, before it answers its first request, and refuses to start while one is unset; its error names each unset variable and prints no value. A dev server skips the check.

| Variable                   | What it does                                                                                                                                                                                                | Read by                       | When unset         | Set in a deployment                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------ | --------------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`      | The Supabase API URL, the project's API URL as the Supabase dashboard shows it (`http://127.0.0.1:54321` locally).                                                                                          | The frontend server, browsers | The server refuses | Task environment, `value`                                       |
| `PUBLIC_SUPABASE_ANON_KEY` | The anon (publishable) key. It is public by design and reaches every browser, but it is a signed token, so it is kept out of tracked files.                                                                 | The frontend server, browsers | The server refuses | Task environment, `parameter`                                   |
| `PUBLIC_PROJECT_ID`        | The project this deployment serves; see the next section.                                                                                                                                                   | See the next section          | The server refuses | Task environment, `value`; a function secret; the bootstrap run |
| `ORIGIN`                   | The public origin of the deployment as a browser sees it, scheme and host with no trailing slash. Without it the server would take each request's origin from headers the client sets; see [Proxy](#proxy). | The frontend server           | The server refuses | Task environment, `value`                                       |

## `PUBLIC_PROJECT_ID`

Every query the frontend makes on a project-scoped table is limited to the project named by `PUBLIC_PROJECT_ID`. The variable is mandatory and has no fallback: if it is empty, or is not a canonical UUID, the Supabase adapter throws when it is constructed, and the message names the variable and the local default. The local value in `.env.example` is `00000000-0000-0000-0000-000000000001`, the default project that `seed.sql` creates.

Three readers take the same name:

- **The frontend**, on the server and in the browser, as above. A deployment sets it in the task environment as a `value`.
- **The `account-access` and `send-email` Edge Functions**, the two functions that read it. Each refuses a request for another project, and `send-email` renders entity names into a message only out of this project. A deployment sets it as a secret of the Supabase project; locally the functions' `.env` carries it. `identity-callback` reads no project from its environment: it takes the project the request names.
- **The bootstrap script**, which creates the project and its settings row under this id. See [Bootstrap](#bootstrap).

## Proxy

The production server is SvelteKit's Node adapter. Behind a reverse proxy it must be told the public origin and where to find the client address, or it trusts what the client sends.

| Variable         | What it does                                                                                                                                                | Read by             | When unset                                                                               | Set in a deployment       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------- | ------------------------- |
| `ORIGIN`         | The public origin, as in [Required at start](#required-at-start).                                                                                           | The frontend server | The server refuses to start                                                              | Task environment, `value` |
| `ADDRESS_HEADER` | The request header in which the nearest trusted proxy sets the client address, usually `x-forwarded-for` behind a load balancer.                            | The frontend server | The client address is the address of the connection, which behind a proxy is the proxy's | Task environment, `value` |
| `XFF_DEPTH`      | The number of trusted proxies in front of the server, counted from the right of the address header. It must equal the number of proxies the deployment has. | The frontend server | `1`                                                                                      | Task environment, `value` |

Each proxy appends the address it received the request from to `x-forwarded-for`, so the client's own address is the entry `XFF_DEPTH` places from the right, and every entry to its left is whatever the client chose to send. A depth that is too small resolves a proxy's address as every client's; one that is too large lets a client choose its own address by sending the header itself. On the AWS path two proxies stand in front of the server, CloudFront and then the load balancer, so the root sets `XFF_DEPTH` to `2` and `ADDRESS_HEADER` to `x-forwarded-for`.

Measure the depth on the running deployment rather than counting proxies on paper: switch on `DEPLOYMENT_DIAGNOSTICS`, request `/api/diagnostics` once plainly and once with a client-sent `X-Forwarded-For`, and read the position of your own address counted from the right of the header the server received. The depth is right when it resolves your address in both requests. [Step 9 of the staging AWS runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-9-the-forwarded-headers-the-proxy-depth-and-the-origin-locks) gives the commands and the record of that measurement; switch diagnostics off again afterwards.

## Timeouts

All three are in seconds and are read by the frontend server when it starts.

| Variable             | What it does                                                                                                                                                     | When unset                 | Set in a deployment                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------- |
| `KEEP_ALIVE_TIMEOUT` | How long the server keeps an idle connection open. Set it above the load balancer's idle timeout, so the load balancer, not the server, closes idle connections. | Node's default, 5 seconds  | Task environment, `value` (`65` on AWS) |
| `HEADERS_TIMEOUT`    | How long the server waits for a request's headers. Set it above `KEEP_ALIVE_TIMEOUT`, so a reused connection is never cut while its next request is arriving.    | Node's default, 60 seconds | Task environment, `value` (`66` on AWS) |
| `SHUTDOWN_TIMEOUT`   | How long the server waits for requests in flight after a stop signal before it exits. Set it below the container's stop timeout, so the process exits by itself. | `30`                       | Task environment, `value` (`25` on AWS) |

## Analytics

The frontend server reads these when it starts; none is `PUBLIC_`, so none reaches the browser. [Analytics](/developers-guide/configuration/analytics) describes the relay, the events, the privacy mechanism and the checklist a deployer works through before turning analytics on.

| Variable                      | What it does                                                                                                                                               | When unset                                       | Set in a deployment           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------- |
| `ANALYTICS_PROVIDER`          | Where events go: `none` keeps nothing, `log` writes one line per event, `posthog` forwards to PostHog.                                                     | `none`                                           | Task environment, `value`     |
| `ANALYTICS_CONSENT_MODE`      | Whether events wait for the voter's consent, `gated` or `free`. Whether consent is needed is for the deployer to determine.                                | `gated`                                          | Task environment, `value`     |
| `ANALYTICS_VISIT_ID_MODE`     | How a visit is identified across events, `memory` or `none`.                                                                                               | `memory`                                         | Task environment, `value`     |
| `ANALYTICS_POSTHOG_KEY`       | The PostHog project key events are forwarded with. It is a secret, read only when `ANALYTICS_PROVIDER` is `posthog`.                                       | With `posthog` the server refuses to start       | Task environment, `parameter` |
| `ANALYTICS_POSTHOG_HOST`      | The PostHog host events are forwarded to, an `https` origin.                                                                                               | The PostHog EU cloud, `https://eu.i.posthog.com` | Task environment, `value`     |
| `ANALYTICS_FLUSH_INTERVAL_MS` | How often queued events are handed to the provider, in milliseconds, an integer from 500 to 600000. An invalid value refuses start and names the variable. | `2000`                                           | Task environment, `value`     |

## Logging and diagnostics

| Variable                 | What it does                                                                                                                                                                                                                            | Read by                              | When unset                                               | Set in a deployment                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------ |
| `PUBLIC_LOG_LEVEL`       | The minimum log level, one of `debug`, `info`, `warn` and `error`. Any other value, `silent` included, logs one error and falls back.                                                                                                   | The frontend server, browsers        | `warn`, or `debug` in a dev build or with `PUBLIC_DEBUG` | Task environment, `value`                  |
| `PUBLIC_DEBUG`           | When `true`, makes `debug` the default log level.                                                                                                                                                                                       | The frontend server, browsers        | Off                                                      | Not set                                    |
| `DEPLOYMENT_DIAGNOSTICS` | When `true`, switches on `/api/diagnostics`, which reports the resolved origin, the resolved client address and the forwarding headers of the caller's own request, and logs nothing. Set it only while a proxy setup is being checked. | The frontend server, at each request | The route answers 404                                    | Task environment, `value` (`false` on AWS) |

## Identity provider

[Bank authentication](/developers-guide/contestant-app/bank-authentication) describes the flow, and [`docs/key-generation.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/key-generation.md) explains how to make the keys. The `PUBLIC_` and private variables are read by the frontend server, the `PUBLIC_` ones by browsers too, and the un-prefixed twins by `identity-callback` from its secrets.

- `PUBLIC_IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_TYPE`: `signicat-ftn` or `idura-ftn`. Unset, the frontend falls back to `signicat-ftn`.
- `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_CLIENT_ID`: the client id at the provider. `identity-callback` checks it as the token's audience.
- `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`: the private decryption keys, the provider's key-set URL and its issuer. Both providers use them, so change them when you switch providers.
- For Signicat: `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`, `IDENTITY_PROVIDER_TOKEN_ENDPOINT`, `IDENTITY_PROVIDER_CLIENT_SECRET`.
- For Idura: `IDURA_DOMAIN`, `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`.
- `IDENTITY_CALLBACK_SERVER_SECRET`: the secret the frontend server sends to `identity-callback` in the `x-identity-callback-secret` header. The function refuses every request without it. Generate one random value of at least 32 bytes per deployment (for example `openssl rand -hex 32`) and set the same value for the frontend server and as a secret of the function; locally, in the root `.env` and in the functions' `.env`. It is not a `PUBLIC_` variable and never reaches a browser. Without it, bank authentication ends on the error screen with `configuration_error`. The E2E wrapper generates its own for each run.

On the AWS path these are off until the AWS root sets `identity_provider_type` and the Supabase root sets `identity_provider`; [Deployment](/developers-guide/deployment#the-aws-root-and-its-image) gives the steps. The task then receives the selected provider's variables: the private keys, `IDENTITY_CALLBACK_SERVER_SECRET` and the client secret as `parameter` entries, the rest as `value` entries, and `PUBLIC_IDENTITY_PROVIDER_TYPE` from `identity_provider_type`. The Supabase module sends `identity-callback` its six: `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`, `IDENTITY_PROVIDER_DECRYPTION_JWKS` and `IDENTITY_CALLBACK_SERVER_SECRET`.

## Edge Functions

The functions read these from the secrets of the Supabase project, which the Supabase Terraform module writes, and locally from their own `.env`. The root `.env` carries them too, for serving a function directly against the root file, as the comments in `.env.example` describe.

- `SITE_URL`: the site origin of the sign-in links `account-access` mails. There is no fallback. The module sets it to the deployment's public origin.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`: the mail server and sender that `send-email` and `account-access` use (the local email testing server in the template). Each is required; a function without one refuses to send.
- `SMTP_USER`, `SMTP_PASS`: the mail server's user name and password, sent when set.
- `PUBLIC_PROJECT_ID`: read by `account-access` and `send-email`; see [`PUBLIC_PROJECT_ID`](#public_project_id).

## Bootstrap

`infra/scripts/bootstrap.sql` writes the rows a deployment needs that no migration can write: the account, the project and its settings row, the storage configuration and the deployment settings. The operator runs it with `psql` from a shell that exports these variables; it connects through the libpq variables `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE` and `PGPASSWORD`, and no value is given on the command line. A value that is empty or holds only whitespace counts as not set, and a required one that is not set ends the run with status 3 before anything is written.

| Variable                                 | Required | When unset        | What it does                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------- | -------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_PROJECT_ID`                      | yes      | The run stops     | The project's id, the same value the frontend is scoped to.                                                                                                                                                                                                                                                                                              |
| `BOOTSTRAP_STORAGE_URL`                  | yes      | The run stops     | The address the database uses to reach the Storage API: on a hosted project the project's own URL, on a local stack the gateway's address inside Docker.                                                                                                                                                                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`              | yes      | The run stops     | The key the storage cleanup triggers send to the Storage API.                                                                                                                                                                                                                                                                                            |
| `BOOTSTRAP_BEHIND_CLOUDFLARE`            | yes      | The run stops     | `true` when every request reaches the API through Cloudflare, otherwise `false`. A hosted Supabase project sets `true`.                                                                                                                                                                                                                                  |
| `BOOTSTRAP_ACCOUNT_NAME`                 | no       | `Default Account` | The account's name.                                                                                                                                                                                                                                                                                                                                      |
| `BOOTSTRAP_PROJECT_NAME`                 | no       | `Default Project` | The project's name.                                                                                                                                                                                                                                                                                                                                      |
| `BOOTSTRAP_DEFAULT_LOCALE`               | no       | `en`              | The project's default locale.                                                                                                                                                                                                                                                                                                                            |
| `BOOTSTRAP_OPEN_FOR_VOTERS`              | no       | `false`           | Whether the project opens for voters when it is created. A project that exists already keeps its value.                                                                                                                                                                                                                                                  |
| `BOOTSTRAP_CANDIDATE_REGISTRATION_MODES` | no       | none              | A comma-separated list of the modes by which a candidate may claim an invitation: any of `identity_provider`, `email` and `code`. With none, no candidate invitation can be claimed until an administrator allows a mode. Written only when the settings row is created.                                                                                 |
| `BOOTSTRAP_ACCESS_CALLER_MAX`            | no       | The current value | The requests one caller may make per project per ten minutes to `check-code`, `request-link` and `request-recovery` together, a whole number from 1 to 999999999; 30 on a new database. A malformed value ends the run with status 3. See [The per-caller limit of account-access](/developers-guide/deployment#the-per-caller-limit-of-account-access). |

`SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security. It belongs to the bootstrap run and the Supabase project only: never set it on the frontend service or in its task environment, where `taskEnvironment.test.ts` refuses any name containing `SERVICE_ROLE`. Nothing in the frontend reads it, and it has no `PUBLIC_` twin. Locally the seed tool, the E2E wrapper script and the bank-auth E2E specs read it from the root `.env`.

## Admin app

- `LLM_OPENAI_API_KEY`: the API key for the [Admin app](/developers-guide/admin-app)'s LLM features, read by the frontend server. They throw without it. It is not in the AWS task environment.

## Local only

These are read by the development tooling and set in the root `.env`; no deployment sets them.

- `FRONTEND_PORT`: the dev server port (5173 in the template).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: the un-prefixed twins, which the local Edge runtime sets for the functions itself. The seed tool uses `SUPABASE_URL`, falling back to `PUBLIC_SUPABASE_URL`.
- `E2E_PROJECT_ID`: commented out in the template. The E2E harness reads it to override the project its suite owns, `00000000-0000-0000-0000-0000000000e2`. Keep it commented out, as the template says.
- `LOCAL_DATA_DIR`: the directory of JSON files for the `local` data adapter, read by the frontend server. It is used only when `dataAdapter.type` in the [static settings](/developers-guide/configuration/static-settings) is `local`.

For the local stack, `yarn workspace @openvaa/supabase supabase status -o env` prints the keys (see [Quick start](/developers-guide/quick-start)).

## Settings that are not environment variables

The feedback rate limit's Cloudflare trust, `private.deployment_settings.behind_cloudflare`, is a database setting, which the bootstrap script writes from `BOOTSTRAP_BEHIND_CLOUDFLARE`. See [Feedback rate limit and Cloudflare](/developers-guide/deployment#feedback-rate-limit-and-cloudflare). The per-caller limit of `account-access`, `private.deployment_settings.access_caller_max`, is one too, which the bootstrap script writes from `BOOTSTRAP_ACCESS_CALLER_MAX` when it is set.
