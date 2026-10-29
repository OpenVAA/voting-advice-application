# Edge Functions

The backend has three Edge Functions, Deno programs in [`apps/supabase/supabase/functions/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/functions). They do the work that needs the service-role key: creating auth users, writing grants, issuing sign-in links and sending email.

| Function            | Called by                                                                                                                       | Caller check                                                                                                             | Writes                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `account-access`    | an anonymous visitor, with the anon key; for `confirm-address`, a signed-in identity-provider account with its own access token | none for the anonymous operations, where the database decides every answer; the caller's own token for `confirm-address` | an auth user without a password for a first-time invitee; it sends email              |
| `identity-callback` | the `/api/oidc/callback` server route, after bank authentication                                                                | the server's secret in the `x-identity-callback-secret` header; then the identity provider's token is verified           | an auth user, a candidate or a party, its editor grant and the account's record of it |
| `send-email`        | the Supabase admin writer's `sendEmail` method                                                                                  | `user_can` with `project.edit_entities` on the project                                                                   | nothing; it sends email                                                               |

Supabase deploys each function directory on its own, so a helper that more than one function needs is kept as a byte-identical copy in each directory. `envConfig.ts` is the one such helper: every function directory holds a copy, and `yarn assert:edge-env-defaults`, part of `yarn lint:check`, fails when the copies differ.

## Configuration

A function reads every variable it needs through `requireEnv` (`envConfig.ts`), which throws when the variable is unset or empty. The function then answers HTTP 500 with a fixed message, and the variable's name appears only in the function's log. There are no fallback values.

The `request-link` and `request-recovery` operations of `account-access` differ in both respects. Each has answered before it reads `SITE_URL` or an SMTP variable, so the caller's answer is unchanged and no link is mailed. Its log line holds the error code `ERR_ENV_UNCONFIGURED` and not the variable's name; see [The two deployment checks](#the-two-deployment-checks).

A local Edge runtime started with `supabase functions serve --env-file <file>` takes its function environment from that file alone, for every function it serves. A file written for one function must therefore hold the variables of the others too, or those functions run without them.

The Edge runtime sets `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` itself. Everything else comes from the function environment:

| Variable                                                                                                                                               | Read by                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_ISSUER` | `identity-callback`                          |
| `IDENTITY_CALLBACK_SERVER_SECRET`                                                                                                                      | `identity-callback`, and the frontend server |
| `PUBLIC_PROJECT_ID`                                                                                                                                    | `send-email`                                 |
| `SITE_URL`                                                                                                                                             | `account-access`                             |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optionally `SMTP_USER` and `SMTP_PASS`                                                                      | `send-email`, `account-access`               |

The template is [`apps/supabase/supabase/functions/.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/.env.example). The local Edge runtime does not read the repo-root `.env`, so copy the template next to it and restart the stack:

```bash
cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env
yarn db:stop && yarn db:start
```

`config.toml` also passes `PUBLIC_PROJECT_ID` to the functions from the environment in which the stack is started, under `[edge_runtime.secrets]`; `send-email` is the one function that reads it. `IDENTITY_CALLBACK_SERVER_SECRET` must hold the same value in the function environment and in the frontend server's environment (the root `.env` locally), and is not a `PUBLIC_` variable. Four variables exist twice, once with a `PUBLIC_` prefix for the frontend and once without it for the functions, and the two must hold the same value: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IDENTITY_PROVIDER_CLIENT_ID` and `IDENTITY_PROVIDER_TYPE`. With both env files in place, `yarn check:env-local` compares the twins in the root `.env` with those in `functions/.env`, and checks that `functions/.env` declares every variable the functions require.

The functions start with the local stack (`yarn db:start`) and are served under `/functions/v1/<name>` on the API URL. In production, set the same variables as secrets of the hosted project; see [Deployment](/developers-guide/deployment).

## `account-access`

The endpoint through which an anonymous visitor reaches the invitation model, and through which an account the identity provider created proves the address it gave. It answers whether an invitation code can be used, mails a sign-in link to an invited address, mails a recovery link to an account that holds a grant, signs in the user who has claimed a code, and mails the link that confirms an address. See [Invitation](/developers-guide/contestant-app/pre-registration-and-invitation) for the model.

Four of its operations are anonymous by design: a request carries the anon key as `apikey` and no user token. The fifth, `confirm-address`, takes the caller's own access token in `Authorization` and acts for that account alone. The function decides no authority itself. With the service role it asks the database functions in [`506-invitation-rpcs.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/506-invitation-rpcs.sql), and their answers are the decisions.

It takes a `POST` request with a JSON body. Every body carries `operation` and `project_id`, a UUID. The function reads no project from its environment: one Edge runtime serves every project of a deployment, and the request names the project it is about.

| Operation          | Further fields                                                             | Answer                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `check-code`       | `code`                                                                     | HTTP 200 with `{ "status": "valid" }`, `{ "status": "used" }` or `{ "status": "unknown" }`                                                                                           |
| `request-link`     | `email`, `code` or both; optionally `locale`                               | HTTP 200 with `{ "accepted": true }`, always                                                                                                                                         |
| `request-recovery` | `email`; optionally `locale`                                               | HTTP 200 with `{ "accepted": true }`, always                                                                                                                                         |
| `code-sign-in`     | `code` and `password`                                                      | HTTP 200 with `{ "result": "signed-in", "access_token": …, "refresh_token": … }` or `{ "result": "invalid-credentials" }`                                                            |
| `confirm-address`  | `email`; optionally `locale`; the caller's access token in `Authorization` | HTTP 200 with `{ "result": "sent" }`, `{ "result": "in-use" }` or `{ "result": "refused" }`; HTTP 401 with `{ "error": "unauthenticated" }` without a token the auth service accepts |

A malformed body gets HTTP 400 with `{ "error": "bad-request" }` (for `request-recovery`: no `email`, a malformed one, or a `locale` that is not a string), a method other than `POST` and `OPTIONS` HTTP 405, and a failed database call of `check-code` HTTP 500 with `{ "error": "internal" }`. Apart from the three words of `check-code` and the `in-use` answer of `confirm-address`, no answer depends on whether an address, a code or an account exists.

`request-link` answers before it does any work, so its status, body and timing are the same for an invited address, an uninvited one and a repeated request. After the answer:

1. It asks the auth service two questions about the deployment, and issues no link unless both answers are yes (see [The two deployment checks](#the-two-deployment-checks)).
2. It asks `invitation_link_request` whom a mail may go to. The database returns an address only for an open invitation of the project or for the claimant of a used code, at most once per address and project in 60 seconds and twenty times per address a day. Without an address the function stops.
3. For an address that has no account it creates the user without a password. It then mints a one-time `magiclink` token for the address.
4. It mails the link, `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=magiclink`, as a fixed text in one of seven locales: `da`, `en`, `et`, `fi`, `fr`, `lb` and `sv`. Any other `locale`, or none, gives `en`. The caller supplies no text, subject, sender or origin.

When the address's slot was taken and no mail went out, the function gives the slot back with `invitation_link_release`.

`request-recovery` follows the same discipline: it answers before any work, so its status, body and timing are the same for every address, and then runs the same deployment checks. It asks `recovery_link_request` which mail the address earns. For `recovery` it mints a one-time `recovery` token for the account that exists and mails the recovery link, `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=recovery`, and creates no user. For `sign-in`, an address with an open invitation and no account, it does what `request-link` does. For no answer it stops. The two requests take the same two slots per address, under the same keys, and a slot taken with no mail sent is given back with `invitation_link_release`. See [Email](/developers-guide/backend/email#the-recovery-link).

`code-sign-in` asks `invitation_code_claimant_email` for the claimant of a used code and signs that address in with the password. It has one failure answer for an unknown code, a wrong password and a claimant who has no password. It does not ask the registration-mode matrix or the answers lock; the code sign-in screen's form action asks whether the code mode is offered before it calls the operation.

`confirm-address` is described under [The address confirmation](#the-address-confirmation).

The grant an invitation promises is not written here. `claim_invitations` writes it, in the database, for the signed-in user who calls it.

### The two deployment checks

Before `request-link` asks the database anything, it asks the auth service two questions. A deployment that fails either gets no link, takes no mail slot and creates no user. The caller's answer is unchanged, so the only trace of a refusal is one line in the function's log.

| Check                                                                                                                                         | How it is asked                                                                                                                                | Logged on refusal                                                                         | A yes is believed for |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------- |
| Public sign-up is closed and addresses are confirmed by mail: the served settings hold `disable_signup: true` and `mailer_autoconfirm: false` | `GET /auth/v1/settings` with the anon key; the two values must be those booleans                                                               | `account-access: public sign-up is not disabled on this deployment; no link issued`       | 60 seconds            |
| The redirect allowlist admits `<SITE_URL>/<locale>/api/auth/callback`                                                                         | a `GET /auth/v1/verify` with an invalid token and the callback URL as `redirect_to`; the URL is admitted when the answer's `Location` names it | `account-access: SITE_URL is not admitted by the auth redirect allowlist; no link issued` | ten minutes, per URL  |

A no is never remembered: the next request asks again. An unset `SITE_URL` is a third case with the same outcome: the work cannot start, and the log holds `account-access: the link issue could not start; no link issued`. An unset SMTP variable is found only when the mail is sent, after the user and the token exist: the log holds `account-access: a link could not be issued or mailed; its slot is given back` with the code `ERR_ENV_UNCONFIGURED`, and the function asks the database to release the address's slot.

The checks make a misconfigured deployment loud and stop its sign-in mails. They do not protect the claim: `claim_invitations` runs in the database and does not ask the function, so on a project that allows public sign-up it stays forgeable until the project's own setting is corrected. See [What this does not protect against](/developers-guide/backend/authentication#what-this-does-not-protect-against).

### The address confirmation

`confirm-address` proves an address for an account the identity provider created, which holds only its placeholder address (see [Bank authentication](/developers-guide/contestant-app/bank-authentication#the-confirmation-mail)). It does its work before it answers:

1. It reads the account from the caller's access token. Without a token the auth service accepts, it answers `unauthenticated`.
2. It answers `refused`, taking no slot, for an account whose `app_metadata` names no identity provider, for one whose address is no longer the placeholder, for a `project_id` the account's `registered_entities` record does not name, and for an address on the placeholder domain.
3. It asks `address_confirmation_request` for two slots, neither of them per project: the account's, ten requests in fifteen minutes, and the address's, one mail in 60 seconds. The address's slot is not the one the sign-in and recovery mails take. Without both it answers `refused`.
4. It asks `address_holds_open_invitation` whether an open invitation of the project, unclaimed and unexpired, holds the typed address. One that does answers `in-use`, and the address's slot is given back: an account the identity provider created claims no invitation, so the invited person signs in by email instead.
5. It asks the auth service for the two links of a change of address, from the placeholder to the typed address. An address another account holds answers `in-use`, and the address's slot is given back.
6. It verifies the placeholder's link itself, which leaves the typed address awaiting confirmation on the account and changes nothing else, and mails the typed address's link, `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=email_change`, as a fixed text in one of the seven locales. It answers `sent`. Any failure after the slots were taken gives the address's slot back and answers `refused`.

The typed address becomes the account's only when that link is opened; it is never written to the account. The one admin update that carries an address puts the account's own placeholder back: when verifying the placeholder's link answers with a session, the auth service has completed the change without the typed address being proved, which happens only with its "Secure email change" setting off. The operation then mails nothing and answers `refused`. That setting is therefore required; see [Auth settings of a hosted project](/developers-guide/deployment#auth-settings-of-a-hosted-project). Each request repeats every step, so only the newest link works. The `in-use` answer tells a signed-in caller whether the address they typed for their own account is another account's or an open invitation's, and the account's slot keeps the operation from being a bulk address or invitation oracle. The auth service answers the same question, outside these slots, to a signed-in account that asks to change its own address directly; that is accepted as a residual risk, because an account is needed first, nothing can be taken over, and a hosted project limits `/auth/v1/user` requests by address of origin.

### Callers

The frontend reaches the function through the Supabase data writer, [`supabaseDataWriter.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts). One private method builds every request and adds `operation` and the deployment's `PUBLIC_PROJECT_ID` as `project_id`:

| Data writer method           | Operation          | Resolves to                                                                                                                    |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `checkInvitationCode`        | `check-code`       | `'valid'`, `'used'` or `'unknown'`                                                                                             |
| `requestSignInLink`          | `request-link`     | success, whatever the request named                                                                                            |
| `requestPasswordRecovery`    | `request-recovery` | success, whatever the request named                                                                                            |
| `signInWithInvitationCode`   | `code-sign-in`     | success after setting the returned tokens on the writer's own client with `auth.setSession`; failure for `invalid-credentials` |
| `requestAddressConfirmation` | `confirm-address`  | `'sent'`, `'in-use'` or `'refused'`; sent with the session's access token                                                      |

`requestAddressConfirmation` is called on the server, by the identity provider's endpoint `/api/contestant/identity-provider`. One more method, `claimInvitations`, calls no function: it is the `claim_invitations` RPC, made with the signed-in user's session. The auth callback and the sign-in actions call it; see [The order every entry point follows](/developers-guide/contestant-app/pre-registration-and-invitation#the-order-every-entry-point-follows). The registration screen calls `checkInvitationCode`; the entry screens reach the two link methods through the contestant context's `sendEntryLink`; the code sign-in screen's server action calls `signInWithInvitationCode` through `invitationCodeLogin`. Each method throws when the answer does not have its expected shape, with a message that holds no value of the answer.

A `request-link` or `request-recovery` body may also carry `witness`, the id of a record the service role opened with `invitation_link_witness_open`. The function then records whether a mail was handed to the SMTP server, which lets a test assert that nothing was sent once the request's background work is over. An anonymous caller cannot open a record, and naming one that does not exist changes nothing.

## `identity-callback`

Completes a bank authentication. The [`/api/oidc/callback`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/api/oidc/callback/+server.ts) route posts the identity provider's `id_token`, the project and the entity type to it; see [Bank authentication](/developers-guide/contestant-app/bank-authentication) for the flow around it. It takes a `POST` request with the body `{ "id_token": …, "project_id": <uuid>, "entity_type": "candidate" | "organization" }`; `entity_type` may be left out when exactly one served type allows the identity provider.

1. **The caller.** The function answers the frontend server alone. A request without the `x-identity-callback-secret` header, or with a value other than `IDENTITY_CALLBACK_SERVER_SECRET`, is refused before the function reads its body, its configuration or the token. So a stolen or replayed ID token presented to the function directly gets nothing.
2. **The request.** The provider comes from `IDENTITY_PROVIDER_TYPE` (`signicat-ftn` or `idura-ftn`), and the project from the request: the function reads no project from its environment, and a request without a valid `project_id` is refused.
3. **The token.** An encrypted token (JWE) is decrypted with a key from `IDENTITY_PROVIDER_DECRYPTION_JWKS`. The token's signature is then verified against the provider's key set at `IDENTITY_PROVIDER_JWKS_URI`, with `IDENTITY_PROVIDER_CLIENT_ID` as the expected audience and `IDENTITY_PROVIDER_ISSUER` as the expected issuer. The function reads the subject identifier and the two name parts, and no other claim.
4. **The type.** It reads the project's settings and decides the entity type by the registration matrix, before it touches any account or row. Its decision is the authority; the frontend's own checks only select.
5. **The account.** It finds the auth user whose `app_metadata.identity_match_value` is the identity's subject identifier, or creates one by invitation, with no password, on a placeholder address. When the invitation fails because another request for the same identity has just created the account, it goes on with that account.
6. **The entity.** One call of the database function `identity_entity_find_or_create` finds the identity's own entity of the type in the project through the record in the account's `app_metadata` (`registered_entities`), confirmed by a live editor grant. With no record, it creates a confirmed candidate with the token's name or an unconfirmed party with no name, with its editor grant and the record, in one transaction. A record whose grant is gone creates nothing. The call takes a lock on the account, so first sign-ins of one identity that arrive together make one entity, and a failed write leaves none. The function then writes the rest of the account's `app_metadata`, and confirms the placeholder address of an account it has just created.
7. **The sign-in.** It generates a sign-in link for the account's current address and answers with the link's token, which the callback route exchanges for a session with `verifyOtp`. The grant is written first, so that session already carries it.

Every answer is one closed `result`: `created`, `found` and `no_entity` (HTTP 200) carry the sign-in token; `refused` (401), `invalid_token` (401), `bad_request` (400), `mode_not_allowed` (403), `configuration` (500) and `unavailable` (503) carry nothing else. No answer says why; the reason is in the function's log.

## `send-email`

Sends one templated message to a list of users. The request body carries `templates` (a subject and body per locale), `recipient_user_ids`, `project_id` and, optionally, `from` and `dry_run`. In the frontend it is invoked by the Supabase admin writer's `sendEmail` method.

1. The caller must send their own access token. The function verifies it with Supabase Auth, then asks `user_can` through the caller's token whether they hold `project.edit_entities` on `project_id`; if not, it answers HTTP 403. In addition, `project_id` must be the configured `PUBLIC_PROJECT_ID`, and a `from` address is accepted only when it is the configured `SMTP_FROM`.
2. With the service role, it calls the `resolve_email_variables` database function, which returns each recipient's email address, preferred locale and template variables.
3. It picks the template for each recipient's locale, falling back to the first one, and fills in its `{{ key }}` placeholders. Values are HTML-escaped in the HTML part.
4. With `dry_run: true` it returns the rendered messages without sending them. Otherwise it sends them over SMTP and returns a result per recipient.

See [Email](/developers-guide/backend/email) for the template variables and for SMTP.

## Tests

The pure helpers of the functions (`envConfig.ts`, `claimConfig.ts`, `ownEntity.ts`, `requestContract.ts`, `templateVars.ts`, `linkIssue.ts`, `addressConfirmation.ts` and the others) have Vitest tests next to them, run by `yarn workspace @openvaa/supabase test:unit`. Vitest cannot import the `index.ts` files, because they import remote modules, so each function's `flowConformance.test.ts` checks the source text of its `index.ts` instead. The E2E project `invitation-contract` calls `account-access` on the running stack. The `bank-auth` project calls `identity-callback` directly as the server does, and `contestant-identity-provider` walks the whole flow in a browser, the confirmation mail included; both run in every E2E run.
