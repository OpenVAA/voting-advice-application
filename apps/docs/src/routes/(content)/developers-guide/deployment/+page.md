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
   - Set the site URL to the frontend's origin, and allow two redirect URLs: `<frontend origin>/api/auth/callback` and `<frontend origin>/*/api/auth/callback`. The second admits the callback behind one locale segment, which every mailed sign-in link carries; see [The sign-in link of an invitation](#the-sign-in-link-of-an-invitation).
   - Configure an SMTP server for Auth email. The local stack delivers mail to its email testing server instead; see [Email](/developers-guide/backend/email).
   - Turn public sign-up off and email confirmation on; see [Auth settings of a hosted project](#auth-settings-of-a-hosted-project).
4. **API row limit.** Make the API's maximum rows setting equal `dataAdapter.pageSize` in the static settings. Locally both are set to 50000.
5. **Account and project.** `apps/supabase/supabase/seed.sql` is local-development data. It creates two test users with a known password, so do not run it on a production database. Instead, create one row in `accounts` and one in `projects` in the SQL editor, modelled on the default account and project in `seed.sql`. A project is closed to voters by default (`open_for_voters` is `false`); set it to `true` when the voter app should open. The project's id becomes `PUBLIC_PROJECT_ID`.
6. **Storage cleanup.** Triggers delete stored files when the rows that own them are deleted or replaced. They read the Storage URL and the service-role key from the `public.storage_config` table, which only `service_role` and `postgres` can read. `seed.sql` fills it with local values; insert the hosted project's `supabase_url` and `service_role_key` instead.
7. **Feedback rate limit.** Set `behind_cloudflare`; see [below](#feedback-rate-limit-and-cloudflare).
8. **Edge Functions.** Deploy the three functions in [`apps/supabase/supabase/functions/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/functions) and set their variables as secrets of the project (see Supabase's [Edge Functions guide](https://supabase.com/docs/guides/functions)):
   - `PUBLIC_PROJECT_ID` and `SITE_URL` (the frontend's origin)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and `SMTP_USER` and `SMTP_PASS` for a server that needs a login
   - for bank authentication: `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI` and `IDENTITY_PROVIDER_ISSUER`

   Supabase sets `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` for the functions itself. `identity-callback` is called by the browser without a Supabase session, so it runs without JWT verification (`--no-verify-jwt`), as it does locally. `account-access` is called with the anon key and no user token. The local gateway accepts such a call; whether a hosted project's gateway does is unverified, so check it with one `check-code` request after deploying. [Edge Functions](/developers-guide/backend/edge-functions) describes each function.

   `account-access` mails sign-in links, and it refuses to until the project's auth settings and these variables are right; see [The sign-in link of an invitation](#the-sign-in-link-of-an-invitation).

## 3. Deploy the frontend on Render

1. Copy `render.example.yaml` to `render.yaml` and replace its placeholders (`<INSTANCE_NAME>`, `<INSTANCE_BRANCH>`, `<INSTANCE_DOMAIN>`), as its header comment lists. Check the values marked `# Check`, such as the plan and whether to deploy automatically.
2. Create the service in Render from the Blueprint. It is a Docker web service built from `./apps/frontend/Dockerfile` with the repository root as the build context. The image builds the shared packages and the frontend and runs `node ./apps/frontend/build/index.js` on port 3000.
3. Set the variables. The template declares:
   - `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`, which you enter in Render (`sync: false`)
   - `PUBLIC_DEBUG` and `PUBLIC_LOG_LEVEL`
   - `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL`
   - a commented-out environment group, `IDENTITY PROVIDER - PRODUCTION CLIENT`, for registration with bank authentication

   Also add **`PUBLIC_PROJECT_ID`**, which the template does not list: the frontend's Supabase adapter throws without it. For bank authentication, the frontend needs the identity-provider variables listed under [Environment variables](/developers-guide/configuration/environmental-variables#bank-authentication-identity-provider), and for the Admin app's LLM features, `LLM_OPENAI_API_KEY`.

   **Never set `SUPABASE_SERVICE_ROLE_KEY` on the frontend service.** The key bypasses row-level security. The frontend never reads it; it belongs only to the Supabase project and to local tooling.

4. To use your own domain, list it under `domains` in `render.yaml` (or add it in the service's settings in Render). Then create a `CNAME` record at your DNS provider that points the domain to the service's Render URL, and verify the domain in Render.

### Upgrading an older Render service

Services created from an older version of the template may still mount a persistent disk at `/var/data/cache` and carry variables for a response cache (`CACHE_*`, `PUBLIC_CACHE_*`), for backend URLs (`PUBLIC_*_BACKEND_URL`) and for a backend API token. The current frontend uses none of them. Detach the disk and delete those variables; any left in place have no effect.

## Auth settings of a hosted project

Each setting below must hold the value the repository's `config.toml` holds for the local stack. `apps/supabase/supabase/config.toml` configures the local stack only: **the repository cannot set or enforce any of these on a hosted project**, and `yarn assert:auth-signup-closed` checks the local file, not your project. Set each by hand in the hosted project's dashboard, in its Authentication settings:

| Dashboard setting                         | `config.toml` key                         | Value here                                                          |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| **Allow new users to sign up**            | `[auth] enable_signup`                    | **off** (`false`)                                                   |
| **Confirm email**                         | `[auth.email] enable_confirmations`       | **on** (`true`)                                                     |
| **Minimum password length**               | `[auth] minimum_password_length`          | **8**                                                               |
| **Email OTP Length**                      | `[auth.email] otp_length`                 | **10** digits, the maximum                                          |
| **Email OTP Expiration**                  | `[auth.email] otp_expiry`                 | **3600** seconds: the lifetime of a mailed sign-in or recovery link |
| **Send Email hook**, of the Postgres type | `[auth.hook.send_email]` `enabled`, `uri` | **enabled**, the function `public.send_email_hook`                  |
| **Secure email change**                   | `[auth.email] double_confirm_changes`     | **on** (`true`)                                                     |

- **The password length** is the length the Contestant App's password rule asks for. On the local stack it binds the setting of a password: a user's own `updateUser` and an administrator's `createUser` with fewer than eight characters are refused `422 weak_password`, and an account whose shorter password was set before the setting still signs in with it. A smaller value on a hosted project lets a direct call to the auth service set a password the screens would refuse.
- **The lifetime of a mailed link** is the second bound on a link, beside its single use: whoever holds a link is signed in by it, so how long it can be used is bounded. The repository's gate pins 3600 seconds for the local file.
- **The one-time code's length.** Every link the `account-access` function has the auth service mint also stores a one-time code for the address, and the auth service accepts that code in the link's place for as long as the link lives. The application never uses it, but anyone can have a link sent to an invited address, so with six digits the code could be guessed within the link's hour. Ten digits, the auth service's maximum, put it out of reach. `yarn assert:auth-signup-closed` pins the local file and `yarn assert:hosted-settings-parity` holds the Terraform module's `mailer_otp_length` equal to it.
- **Secure email change** is required by the address confirmation of an identity-provider account. The `confirm-address` operation confirms the placeholder's side of the change itself and mails only the typed address's link, which relies on the auth service asking for both confirmations. With the setting off, confirming the placeholder's side completes the change at once, without the typed address being proved; the operation then puts the placeholder back, mails nothing and answers `refused`, so no identity-provider account can prove an address on that project. `yarn assert:hosted-settings-parity` holds the Terraform module's `mailer_secure_email_change_enabled` equal to the local value.
- **The Send Email hook** is where it is adopted: with it the auth service sends no mail of its own, and the application's mails go out through the `account-access` function alone. Without it the auth service's own one-time-code and recovery endpoints mail its default English text to any address a caller names. The function is created by the schema, executable by `supabase_auth_admin` alone; the dashboard's hook is pointed at it. See [Email](/developers-guide/backend/email#supabase-auth-sends-no-mail).

To read what a project serves, request its auth settings with the project's anon key:

```bash
curl -s -H "apikey: <anon key>" "<project url>/auth/v1/settings"
```

The answer must hold `"disable_signup": true` and `"mailer_autoconfirm": false`.

**The database has no guard of its own.** A function that grants authority to a confirmed address reads `auth.users.email_confirmed_at`, and cannot tell how the address came to be confirmed. On a project that allows public sign-up, anyone can obtain a confirmed address they do not control:

- with email confirmation off, by signing up with the address: it is confirmed at once, and no mail is sent;
- with email confirmation on, by signing up with the address and a password of their own first. When the owner of the address later opens any link mailed to it, the address is confirmed and the password still signs in.

Turning sign-up off closes both. Confirmation stays on as well, so that a sign-up switched back on by mistake does not confirm addresses without a mail.

The names of the dashboard settings above are unverified against a hosted project's dashboard. The request above does not depend on a label: whatever the dashboard calls the two sign-up switches, the served settings must hold those two values. The other three settings are not in that answer; read them in the dashboard.

### The sign-in link of an invitation

The `account-access` Edge Function mails the sign-in link of an invitation. Four things outside the repository decide whether it does, and where the link leads:

| What an operator sets                                                                   | Where                                         | Required value                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| the two switches above                                                                  | the project's dashboard                       | public sign-up off, email confirmation on                                                                   |
| the redirect allowlist of the auth service                                              | the project's Auth URL configuration          | an entry that admits `<SITE_URL>/*/api/auth/callback`, the callback behind one locale segment               |
| `SITE_URL`                                                                              | a secret of the project, read by the function | the frontend's public origin, with no path. It is the origin of every mailed link; no request can change it |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and `SMTP_USER` and `SMTP_PASS` where they apply | secrets of the project, read by the function  | the mail server the link is sent through                                                                    |

Before it issues a link the function asks the auth service whether public sign-up is closed and whether `<SITE_URL>/<locale>/api/auth/callback` is an admitted redirect target. When either answer is no it issues no link, mails nothing and logs one line that says which: `account-access: public sign-up is not disabled on this deployment; no link issued`, or `account-access: SITE_URL is not admitted by the auth redirect allowlist; no link issued`. The caller's answer does not change, so an invited person on a misconfigured deployment simply receives no mail. Read the function's log after the first link request of a new deployment. [The two deployment checks](/developers-guide/backend/edge-functions#the-two-deployment-checks) describes both.

**The function's refusal does not protect the claim.** It stops the legitimate flow on a misconfigured project and makes the mistake visible. `claim_invitations` runs in the database, has no guard on the auth service's sign-up setting and does not ask the function, so on a project whose dashboard still allows public sign-up a visitor can sign up with an invited address and claim its invitations. Only the dashboard setting prevents that.

Both refusals are held by unit tests of the function's modules, with injected answers; no test runs the served function against an auth service that fails either check, and the local stack is configured to pass both. [What this does not protect against](/developers-guide/backend/authentication#what-this-does-not-protect-against) lists what else an operator accepts with the invitation model: unlimited anonymous code checks, one sign-in mail per minute to any eligible address, and limits that do not use the caller's identity. A deployment that needs a bound on either puts a rate limit in front of the function at its gateway.

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
