# Pre-registration and invitation

A candidate account is a Supabase Auth user that holds an `(entity, candidate, <id>, editor)` grant on a candidate row. The Candidate App finds the candidate through that grant and nothing else (see [Which entity a user is](/developers-guide/backend/authentication#which-entity-a-user-is)).

A candidate account comes into being in one of two ways:

- **Invitation.** An administrator invites the candidate by email through the `invite-candidate` Edge Function.
- **Pre-registration.** The candidate identifies themselves with bank authentication, and the `identity-callback` Edge Function creates the account. See [Bank authentication (OIDC)](/developers-guide/candidate-app/bank-authentication).

For local development, `seed.sql` already creates a candidate user with its grant; see [Seed data](/developers-guide/development/seed-data#the-baseline-seedsql).

## Invitation

Every step below runs on the server: the candidate row, the invitation and the grant are written by the `invite-candidate` Edge Function with the service-role key, and the email link is verified by a SvelteKit server route. The browser only sends the request and follows redirects.

### Calling `invite-candidate`

The function takes a `POST` request whose JSON body has four required fields: `firstName`, `lastName`, `email` and `projectId`. It runs as the caller, so the request carries the administrator's access token in the `Authorization` header.

In the frontend, the Supabase data writer's `_preregister` method calls it with `supabase.functions.invoke('invite-candidate', …)` and fills in `projectId` from the deployment's `PUBLIC_PROJECT_ID`. That method is reached through `preregisterWithApiToken`. At the time of writing, no route or component calls `preregisterWithApiToken`, so invitations are sent by calling the function directly.

### Who may invite

The function refuses the request unless the caller may create entities in the project:

1. A missing `Authorization` header, or a token that `auth.getUser()` rejects, gives `401`.
2. The function asks the database whether the caller holds the `project.edit_entities` permission on `projectId`. It calls `user_can` through a client that carries the caller's own token, so the answer comes from the caller's grants and not from the service role ([`callerAuthority.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts)). A denial, an RPC error or a blank project id gives `403`.

Project admins and editors hold `project.edit_entities`; see [Grants](/developers-guide/backend/authentication#grants).

### What the function does

[`invite-candidate/index.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/invite-candidate/index.ts) numbers its steps. After the body and caller checks above:

1. **Candidate row.** It inserts a candidate with `first_name`, `last_name` and `project_id`. The candidate has no nominations yet.
2. **Invitation.** It calls Supabase Auth's `inviteUserByEmail` for the email address. The invited user's metadata carries `candidate_id` and `project_id`, and the redirect target is `/candidate/complete-registration` under `SITE_URL`. `SITE_URL` is required: when it is unset, the function fails instead of falling back to another origin. If the invitation fails, the function deletes the candidate row and returns `500`.
3. **Grant.** It writes the `(entity, candidate, <candidate id>, editor)` grant for the invited user with `writeEntityGrant` ([`entityGrant.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/invite-candidate/entityGrant.ts)). A grant that already exists counts as written. A user without a grant can do nothing, so a failed write aborts the request even though the email has been sent: `rollbackInvite` deletes the invited auth user, whose grants go with it, and the candidate row, and the function returns `500`.
4. **Response.** It returns `201` with `candidateId` and `userId`.

Any other error is logged and answered with a generic `500`.

The candidate cannot use the Candidate App until they are nominated: the app's protected layout signs out a candidate without a nomination and shows the `candidateNoNomination` error. Nominations are added like any other data, for example with [`bulk_import`](/developers-guide/backend/data-import-and-deletion#bulk_import).

### The invitation email

Supabase Auth sends the invitation with its own invite template (see [Email](/developers-guide/backend/email)). The link returns to the frontend's auth callback, the server route [`/api/candidate/auth/callback`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/api/candidate/auth/callback/+server.ts):

1. The route reads the `token_hash` and `type` search parameters and calls `verifyOtp` on the request's own Supabase client, which stores the session in cookies on the response.
2. For `type=invite`, it reads the new user's email address from the session and redirects to the set-password page, `/candidate/register/password?email=…` (route `CandAppSetPassword`).
3. A missing parameter or a failed verification redirects to `/candidate/login` with `errorMessage=authError`.

The frontend has no page at `/candidate/complete-registration`, the redirect target `invite-candidate` passes. The E2E tests do not follow the email link through the auth server: they open the callback directly with the link's token as `token_hash` (`toCallbackUrl` in [`emailBucket.fixture.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/tests/fixtures/shared/emailBucket.fixture.ts)).

### Setting the password

On the set-password page, the invited candidate has a session, an email address and no registration key, so the page runs its invite branch: it calls the candidate context's `setPassword`, which calls Supabase Auth's `updateUser({ password })`. The page then sends the candidate to the login page with their email address filled in. [Registration](/developers-guide/candidate-app/registration) describes the rest of the first sign-in, and [Password validation](/developers-guide/candidate-app/password-validation) the password rules.

## Pre-registration with bank authentication

When the `preRegistration.enabled` app setting is on, the login page offers pre-registration at `/candidate/preregister`. The candidate identifies with a bank identity provider, and the server route `/api/oidc/callback` checks the result and keeps the provider's ID token in an `httpOnly` cookie. The candidate then chooses elections, constituencies and an email address, and the server route `/api/candidate/preregister` sends the ID token to the `identity-callback` Edge Function. The function verifies the token, finds or creates the auth user, finds the user's candidate through the editor grant or creates the candidate and the grant, and returns a sign-in link that the server route redeems for a session. [Bank authentication (OIDC)](/developers-guide/candidate-app/bank-authentication) describes each step and its configuration.
