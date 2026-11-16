# Edge Functions

The backend has three Edge Functions, Deno programs in [`apps/supabase/supabase/functions/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/functions). They do the work that needs the service-role key: creating auth users, writing grants, issuing sign-in links and sending email.

| Function            | Called by                                                                 | Caller check                                                           | Writes                                                                   |
| ------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `account-access`    | an anonymous visitor, with the anon key                                   | none: it is anonymous by design, and the database decides every answer | an auth user without a password for a first-time invitee; it sends email |
| `identity-callback` | the `/api/contestant/preregister` server route, after bank authentication | none on the caller; the identity provider's token is verified          | an auth user, a candidate and its editor grant                           |
| `send-email`        | the Supabase admin writer's `sendEmail` method                            | `user_can` with `project.edit_entities` on the project                 | nothing; it sends email                                                  |

Supabase deploys each function directory on its own, so a helper that more than one function needs is kept as a byte-identical copy in each directory. `envConfig.ts` is the one such helper: every function directory holds a copy, and `yarn assert:edge-env-defaults`, part of `yarn lint:check`, fails when the copies differ.

## Configuration

A function reads every variable it needs through `requireEnv` (`envConfig.ts`), which throws when the variable is unset or empty. The function then answers HTTP 500 with a fixed message, and the variable's name appears only in the function's log. There are no fallback values.

The `request-link` and `request-recovery` operations of `account-access` differ in both respects. Each has answered before it reads `SITE_URL` or an SMTP variable, so the caller's answer is unchanged and no link is mailed. Its log line holds the error code `ERR_ENV_UNCONFIGURED` and not the variable's name; see [The two deployment checks](#the-two-deployment-checks).

A local Edge runtime started with `supabase functions serve --env-file <file>` takes its function environment from that file alone, for every function it serves. A file written for one function must therefore hold the variables of the others too, or those functions run without them.

The Edge runtime sets `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` itself. Everything else comes from the function environment:

| Variable                                                                                                                                               | Read by                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_ISSUER` | `identity-callback`                   |
| `PUBLIC_PROJECT_ID`                                                                                                                                    | `identity-callback`, `send-email`     |
| `SITE_URL`                                                                                                                                             | `identity-callback`, `account-access` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optionally `SMTP_USER` and `SMTP_PASS`                                                                      | `send-email`, `account-access`        |

The template is [`apps/supabase/supabase/functions/.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/.env.example). The local Edge runtime does not read the repo-root `.env`, so copy the template next to it and restart the stack:

```bash
cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env
yarn db:stop && yarn db:start
```

`config.toml` also passes `PUBLIC_PROJECT_ID` to the functions from the environment in which the stack is started, under `[edge_runtime.secrets]`. Four variables exist twice, once with a `PUBLIC_` prefix for the frontend and once without it for the functions, and the two must hold the same value: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IDENTITY_PROVIDER_CLIENT_ID` and `IDENTITY_PROVIDER_TYPE`. With both env files in place, `yarn check:env-local` compares the twins in the root `.env` with those in `functions/.env`, and checks that `functions/.env` declares every variable the functions require.

The functions start with the local stack (`yarn db:start`) and are served under `/functions/v1/<name>` on the API URL. In production, set the same variables as secrets of the hosted project; see [Deployment](/developers-guide/deployment).

## `account-access`

The endpoint through which an anonymous visitor reaches the invitation model. It answers whether an invitation code can be used, mails a sign-in link to an invited address, mails a recovery link to an account that holds a grant, and signs in the user who has claimed a code. See [Pre-registration and invitation](/developers-guide/contestant-app/pre-registration-and-invitation) for the model.

The function is anonymous by design: a request carries the anon key as `apikey` and no user token. It decides no authority itself. With the service role it asks the database functions in [`506-invitation-rpcs.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/506-invitation-rpcs.sql), and their answers are the decisions.

It takes a `POST` request with a JSON body. Every body carries `operation` and `project_id`, a UUID. The function reads no project from its environment: one Edge runtime serves every project of a deployment, and the request names the project it is about.

| Operation          | Further fields                               | Answer                                                                                                                    |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `check-code`       | `code`                                       | HTTP 200 with `{ "status": "valid" }`, `{ "status": "used" }` or `{ "status": "unknown" }`                                |
| `request-link`     | `email`, `code` or both; optionally `locale` | HTTP 200 with `{ "accepted": true }`, always                                                                              |
| `request-recovery` | `email`; optionally `locale`                 | HTTP 200 with `{ "accepted": true }`, always                                                                              |
| `code-sign-in`     | `code` and `password`                        | HTTP 200 with `{ "result": "signed-in", "access_token": …, "refresh_token": … }` or `{ "result": "invalid-credentials" }` |

A malformed body gets HTTP 400 with `{ "error": "bad-request" }` (for `request-recovery`: no `email`, a malformed one, or a `locale` that is not a string), a method other than `POST` and `OPTIONS` HTTP 405, and a failed database call of `check-code` HTTP 500 with `{ "error": "internal" }`. Apart from the three words of `check-code`, no answer depends on whether an address, a code or an account exists.

`request-link` answers before it does any work, so its status, body and timing are the same for an invited address, an uninvited one and a repeated request. After the answer:

1. It asks the auth service two questions about the deployment, and issues no link unless both answers are yes (see [The two deployment checks](#the-two-deployment-checks)).
2. It asks `invitation_link_request` whom a mail may go to. The database returns an address only for an open invitation of the project or for the claimant of a used code, and at most once per address in 60 seconds. Without an address the function stops.
3. For an address that has no account it creates the user without a password. It then mints a one-time `magiclink` token for the address.
4. It mails the link, `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=magiclink`, as a fixed text in one of seven locales: `da`, `en`, `et`, `fi`, `fr`, `lb` and `sv`. Any other `locale`, or none, gives `en`. The caller supplies no text, subject, sender or origin.

When the address's slot was taken and no mail went out, the function gives the slot back with `invitation_link_release`.

`request-recovery` follows the same discipline: it answers before any work, so its status, body and timing are the same for every address, and then runs the same deployment checks. It asks `recovery_link_request` which mail the address earns. For `recovery` it mints a one-time `recovery` token for the account that exists and mails the recovery link, `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=recovery`, and creates no user. For `sign-in`, an address with an open invitation and no account, it does what `request-link` does. For no answer it stops. The two requests take one slot per address, under the same key, and a slot taken with no mail sent is given back with `invitation_link_release`. See [Email](/developers-guide/backend/email#the-recovery-link).

`code-sign-in` asks `invitation_code_claimant_email` for the claimant of a used code and signs that address in with the password. It has one failure answer for an unknown code, a wrong password and a claimant who has no password. It does not ask the registration-mode matrix or the answers lock; the code sign-in screen's form action asks whether the code mode is offered before it calls the operation.

The grant an invitation promises is not written here. `claim_invitations` writes it, in the database, for the signed-in user who calls it.

### The two deployment checks

Before `request-link` asks the database anything, it asks the auth service two questions. A deployment that fails either gets no link, takes no mail slot and creates no user. The caller's answer is unchanged, so the only trace of a refusal is one line in the function's log.

| Check                                                                                                                                         | How it is asked                                                                                                                                | Logged on refusal                                                                         | A yes is believed for |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------- |
| Public sign-up is closed and addresses are confirmed by mail: the served settings hold `disable_signup: true` and `mailer_autoconfirm: false` | `GET /auth/v1/settings` with the anon key; the two values must be those booleans                                                               | `account-access: public sign-up is not disabled on this deployment; no link issued`       | 60 seconds            |
| The redirect allowlist admits `<SITE_URL>/<locale>/api/auth/callback`                                                                         | a `GET /auth/v1/verify` with an invalid token and the callback URL as `redirect_to`; the URL is admitted when the answer's `Location` names it | `account-access: SITE_URL is not admitted by the auth redirect allowlist; no link issued` | ten minutes, per URL  |

A no is never remembered: the next request asks again. An unset `SITE_URL` is a third case with the same outcome: the work cannot start, and the log holds `account-access: the link issue could not start; no link issued`. An unset SMTP variable is found only when the mail is sent, after the user and the token exist: the log holds `account-access: a link could not be issued or mailed; its slot is given back` with the code `ERR_ENV_UNCONFIGURED`, and the function asks the database to release the address's slot.

The checks make a misconfigured deployment loud and stop its sign-in mails. They do not protect the claim: `claim_invitations` runs in the database and does not ask the function, so on a project that allows public sign-up it stays forgeable until the project's own setting is corrected. See [What this does not protect against](/developers-guide/backend/authentication#what-this-does-not-protect-against).

### Callers

The frontend reaches the function through the Supabase data writer, [`supabaseDataWriter.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts). One private method builds every request and adds `operation` and the deployment's `PUBLIC_PROJECT_ID` as `project_id`:

| Data writer method         | Operation          | Resolves to                                                                                                                    |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `checkInvitationCode`      | `check-code`       | `'valid'`, `'used'` or `'unknown'`                                                                                             |
| `requestSignInLink`        | `request-link`     | success, whatever the request named                                                                                            |
| `requestPasswordRecovery`  | `request-recovery` | success, whatever the request named                                                                                            |
| `signInWithInvitationCode` | `code-sign-in`     | success after setting the returned tokens on the writer's own client with `auth.setSession`; failure for `invalid-credentials` |

A fifth method, `claimInvitations`, calls no function: it is the `claim_invitations` RPC, made with the signed-in user's session. The auth callback and the sign-in actions call it; see [The order every entry point follows](/developers-guide/contestant-app/pre-registration-and-invitation#the-order-every-entry-point-follows). The registration screen calls `checkInvitationCode`; the entry screens reach the two link methods through the contestant context's `sendEntryLink`; the code sign-in screen's server action calls `signInWithInvitationCode` through `invitationCodeLogin`. Each method throws when the answer does not have its expected shape, with a message that holds no value of the answer.

A `request-link` or `request-recovery` body may also carry `witness`, the id of a record the service role opened with `invitation_link_witness_open`. The function then records whether a mail was handed to the SMTP server, which lets a test assert that nothing was sent once the request's background work is over. An anonymous caller cannot open a record, and naming one that does not exist changes nothing.

## `identity-callback`

Completes a bank authentication. The [`/api/contestant/preregister`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/api/contestant/preregister/+server.ts) route posts the identity provider's `id_token` to it; see [Bank authentication](/developers-guide/contestant-app/bank-authentication) for the flow around it.

1. The provider comes from `IDENTITY_PROVIDER_TYPE` (`signicat-ftn` or `idura-ftn`), and the project from `PUBLIC_PROJECT_ID`. A `project_id` in the request body is accepted only when it names that same project.
2. An encrypted token (JWE) is decrypted with a key from `IDENTITY_PROVIDER_DECRYPTION_JWKS`. The token's signature is then verified against the provider's key set at `IDENTITY_PROVIDER_JWKS_URI`, with `IDENTITY_PROVIDER_CLIENT_ID` as the expected audience and `IDENTITY_PROVIDER_ISSUER` as the expected issuer.
3. The identity claims are read with the provider's claim mapping (`claimConfig.ts`).
4. The function finds the auth user whose `app_metadata.identity_match_value` matches the identity, or creates one with a placeholder email address.
5. It looks for the user's candidate through the user's `(entity, candidate, editor)` grants, limited to the configured project. If there is none, it creates the candidate, already confirmed.
6. It writes the editor grant. When the grant exists already this changes nothing. If the write fails for a candidate it has just created, the function deletes that candidate and fails, so no candidate is left without a grant.
7. It returns a one-time login link, and the preregister route exchanges the link's token for a session with `verifyOtp`.

A rejected token gets HTTP 401 and a configuration error HTTP 500. Neither response says why; the reason is in the function's log.

## `send-email`

Sends one templated message to a list of users. The request body carries `templates` (a subject and body per locale), `recipient_user_ids`, `project_id` and, optionally, `from` and `dry_run`. In the frontend it is invoked by the Supabase admin writer's `sendEmail` method.

1. The caller must send their own access token. The function verifies it with Supabase Auth, then asks `user_can` through the caller's token whether they hold `project.edit_entities` on `project_id`; if not, it answers HTTP 403. In addition, `project_id` must be the configured `PUBLIC_PROJECT_ID`, and a `from` address is accepted only when it is the configured `SMTP_FROM`.
2. With the service role, it calls the `resolve_email_variables` database function, which returns each recipient's email address, preferred locale and template variables.
3. It picks the template for each recipient's locale, falling back to the first one, and fills in its `{{ key }}` placeholders. Values are HTML-escaped in the HTML part.
4. With `dry_run: true` it returns the rendered messages without sending them. Otherwise it sends them over SMTP and returns a result per recipient.

See [Email](/developers-guide/backend/email) for the template variables and for SMTP.

## Tests

The pure helpers of the functions (`envConfig.ts`, `claimConfig.ts`, `candidateRecord.ts`, `entityGrant.ts`, `templateVars.ts`, `linkIssue.ts` and the others) have Vitest tests next to them, run by `yarn workspace @openvaa/supabase test:unit`. Vitest cannot import the `index.ts` files, because they import remote modules, so each function's `flowConformance.test.ts` checks the source text of its `index.ts` instead. The E2E project `invitation-contract` calls `account-access` on the running stack, and the opt-in bank-authentication E2E specs call `identity-callback` end to end.
