# Edge Functions

The backend has three Edge Functions, Deno programs in [`apps/supabase/supabase/functions/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/functions). They do the work that needs the service-role key: creating auth users, writing grants and sending email.

| Function            | Called by                                                                | Caller check                                                  | Writes                                          |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------- |
| `identity-callback` | the `/api/candidate/preregister` server route, after bank authentication | none on the caller; the identity provider's token is verified | an auth user, a candidate and its editor grant  |
| `invite-candidate`  | the Supabase data writer's pre-registration method                       | `user_can` with `project.edit_entities` on the project        | a candidate, an invitation and its editor grant |
| `send-email`        | the Supabase admin writer's `sendEmail` method                           | `user_can` with `project.edit_entities` on the project        | nothing; it sends email                         |

Supabase deploys each function directory on its own, so the helpers that more than one function needs are kept as byte-identical copies in each directory. `yarn assert:edge-env-defaults`, part of `yarn lint:check`, fails when the copies of `envConfig.ts`, `jwtSegment.ts` or `callerAuthority.ts` differ.

## Configuration

A function reads every variable it needs through `requireEnv` (`envConfig.ts`), which throws when the variable is unset or empty. The function then answers HTTP 500 with a fixed message, and the variable's name appears only in the function's log. There are no fallback values.

The Edge runtime sets `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` itself. Everything else comes from the function environment:

| Variable                                                                                                                                               | Read by                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_ISSUER` | `identity-callback`                     |
| `PUBLIC_PROJECT_ID`                                                                                                                                    | `identity-callback`, `send-email`       |
| `SITE_URL`                                                                                                                                             | `identity-callback`, `invite-candidate` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optionally `SMTP_USER` and `SMTP_PASS`                                                                      | `send-email`                            |

The template is [`apps/supabase/supabase/functions/.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/.env.example). The local Edge runtime does not read the repo-root `.env`, so copy the template next to it and restart the stack:

```bash
cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env
yarn db:stop && yarn db:start
```

`config.toml` also passes `PUBLIC_PROJECT_ID` to the functions from the environment in which the stack is started, under `[edge_runtime.secrets]`. Four variables exist twice, once with a `PUBLIC_` prefix for the frontend and once without it for the functions, and the two must hold the same value: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IDENTITY_PROVIDER_CLIENT_ID` and `IDENTITY_PROVIDER_TYPE`. With both env files in place, `yarn check:env-local` compares the twins in the root `.env` with those in `functions/.env`, and checks that `functions/.env` declares every variable the functions require.

The functions start with the local stack (`yarn db:start`) and are served under `/functions/v1/<name>` on the API URL. In production, set the same variables as secrets of the hosted project; see [Deployment](/developers-guide/deployment).

## `identity-callback`

Completes a bank authentication. The [`/api/candidate/preregister`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/api/candidate/preregister/+server.ts) route posts the identity provider's `id_token` to it; see [Bank authentication](/developers-guide/candidate-app/bank-authentication) for the flow around it.

1. The provider comes from `IDENTITY_PROVIDER_TYPE` (`signicat-ftn` or `idura-ftn`), and the project from `PUBLIC_PROJECT_ID`. A `project_id` in the request body is accepted only when it names that same project.
2. An encrypted token (JWE) is decrypted with a key from `IDENTITY_PROVIDER_DECRYPTION_JWKS`. The token's signature is then verified against the provider's key set at `IDENTITY_PROVIDER_JWKS_URI`, with `IDENTITY_PROVIDER_CLIENT_ID` as the expected audience and `IDENTITY_PROVIDER_ISSUER` as the expected issuer.
3. The identity claims are read with the provider's claim mapping (`claimConfig.ts`).
4. The function finds the auth user whose `app_metadata.identity_match_value` matches the identity, or creates one with a placeholder email address.
5. It looks for the user's candidate through the user's `(entity, candidate, editor)` grants, limited to the configured project. If there is none, it creates the candidate, already confirmed.
6. It writes the editor grant. When the grant exists already this changes nothing. If the write fails for a candidate it has just created, the function deletes that candidate and fails, so no candidate is left without a grant.
7. It returns a one-time login link, and the preregister route exchanges the link's token for a session with `verifyOtp`.

A rejected token gets HTTP 401 and a configuration error HTTP 500. Neither response says why; the reason is in the function's log.

## `invite-candidate`

Creates a candidate and invites them by email. The request body carries `firstName`, `lastName`, `email` and `projectId`. In the frontend it is invoked by the Supabase data writer's pre-registration method.

1. The caller must send their own access token. The function verifies it with Supabase Auth, then asks `user_can` through the caller's token whether they hold `project.edit_entities` on `projectId`; if not, it answers HTTP 403.
2. With the service role, it inserts the candidate into the project.
3. It sends the invitation with Supabase Auth's `inviteUserByEmail`, with `/candidate/complete-registration` under `SITE_URL` as the redirect target (the frontend has no page at that path at the time of writing). If the invitation fails, it deletes the candidate.
4. It writes the `(entity, candidate, editor)` grant for the invited user. This grant is the only link between the user and the candidate. If the write fails, the function deletes both the invited auth user, whose grants go with it, and the candidate.

On success it answers HTTP 201 with `candidateId` and `userId`.

## `send-email`

Sends one templated message to a list of users. The request body carries `templates` (a subject and body per locale), `recipient_user_ids`, `project_id` and, optionally, `from` and `dry_run`. In the frontend it is invoked by the Supabase admin writer's `sendEmail` method.

1. The caller check is the same as in `invite-candidate`: the caller's own token and `project.edit_entities` on `project_id`. In addition, `project_id` must be the configured `PUBLIC_PROJECT_ID`, and a `from` address is accepted only when it is the configured `SMTP_FROM`.
2. With the service role, it calls the `resolve_email_variables` database function, which returns each recipient's email address, preferred locale and template variables.
3. It picks the template for each recipient's locale, falling back to the first one, and fills in its `{{ key }}` placeholders. Values are HTML-escaped in the HTML part.
4. With `dry_run: true` it returns the rendered messages without sending them. Otherwise it sends them over SMTP and returns a result per recipient.

See [Email](/developers-guide/backend/email) for the template variables and for SMTP.

## Tests

The pure helpers of the functions (`envConfig.ts`, `claimConfig.ts`, `candidateRecord.ts`, `entityGrant.ts`, `templateVars.ts` and the others) have Vitest tests next to them, run by `yarn workspace @openvaa/supabase test:unit`. Vitest cannot import the `index.ts` files, because they import remote modules, so each function's `flowConformance.test.ts` checks the source text of its `index.ts` instead. The opt-in bank-authentication E2E specs call `identity-callback` end to end.
