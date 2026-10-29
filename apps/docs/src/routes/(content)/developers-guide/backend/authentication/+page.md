# Authentication and authorisation

Users sign in with Supabase Auth. What a signed-in user may then do is decided in the database:

1. Every privilege is a row in `public.grants`.
2. Row-level security (RLS) policies, storage policies and the Edge Functions ask `user_can` whether the caller's rows of `public.grants` allow the operation. A grant counts from the moment it is written, and a deleted grant is refused at once, even to a session whose access token was issued before the deletion.
3. When Supabase Auth issues an access token, the access-token hook also copies the user's grants into the token's `grants` claim. Only the frontend's app-entry gates read the claim, to decide which app a signed-in user is shown.

The schema files are [`300-auth-tables.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/300-auth-tables.sql) (the grants table), [`301-auth-functions.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/301-auth-functions.sql) (the hook, `user_can` and their helpers), [`302-rls.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/302-rls.sql) (table policies), [`303-column-grants.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/303-column-grants.sql) (column grants) and [`400-storage.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/400-storage.sql) (storage policies).

## Sessions

The frontend uses the `@supabase/ssr` package, and both of its clients are built from `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` only:

- On the server, `hooks.server.ts` creates one client per request with `createSupabaseServerClient` from [`$lib/supabase/server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/supabase/server.ts) and puts it on `event.locals.supabase`. The client reads the auth session from the request's cookies and writes refreshed session cookies back to the response. The cookies are set with `httpOnly: false`, because two server layouts forward them into the page data.
- In the browser, `createSupabaseBrowserClient` from [`$lib/supabase/browser.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/supabase/browser.ts) returns a single shared client.

On the server, read the session through `event.locals.safeGetSession()` ([`$lib/supabase/safeGetSession.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/supabase/safeGetSession.ts)). It reads the session from the cookies with `getSession()` and then verifies the access token with `getUser()`, which asks Supabase Auth. The verification is done once per access token within a request.

Mailed links (the recovery link, the sign-in link of an invitation or of a returning user, and the link that confirms an identity-provider account's address) open the confirm page, `/<locale>/auth/confirm` ([`+page.server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/auth/confirm/+page.server.ts)). The page belongs to neither application, so no application's gate stands in front of it. Its load reads the link's `token_hash`, `type` and `next` into a form and verifies nothing, so fetching the link spends no token. When the browser is already signed in, the page says that continuing signs that account out, and offers Cancel, which leads to that account's app.

The token is spent only when the person presses Continue, which posts the form. The action runs five steps in order, the last four in `verifyMailedLink` ([`$lib/server/auth/mailedLink.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/server/auth/mailedLink.ts)):

1. When the request holds a session, it signs that session out.
2. It passes the posted `token_hash` and `type` to `verifyOtp`, which creates the session on the server and stores it in cookies.
3. It claims the user's invitations, with the data writer's `claimInvitations()` on the request's own client (see [Invitations](#invitations)).
4. When the claim wrote a grant, it refreshes the session, so that the access token lists the grant for the app-entry gates, which read the token's `grants` claim.
5. It redirects by link type. A `recovery` link goes to the password reset page. A `magiclink` link, the type of every sign-in link, goes to the `next` path when it is a safe relative app path and to the Contestant App otherwise, whether or not the user has a password: the Contestant App's protected layout then asks a user with none to set one (see [The set-password gate](/developers-guide/contestant-app/registration#the-set-password-gate)). An `email_change` link goes to the Contestant App.

The page accepts the three types the `account-access` function mails, `magiclink`, `recovery` and `email_change`. A link of any other type, or with no token, goes to the login page with the auth error, as a failed verification does. Nothing issues an `invite`, `signup` or `email` link, and verifying one for an invited account would store a password nobody chose. The type a link names is a landing hint and not an authority: the auth service accepts a sign-in token presented as `recovery`, so whoever holds a link can change it, and the reset page decides by the session alone. SvelteKit's origin check of a form action refuses a post another site makes, so a form on another site cannot spend a link in a visitor's browser.

The `/api/auth/callback` route verifies nothing: a link that names it is redirected to the confirm page with the same `token_hash`, `type` and `next`, or to the login page with the auth error when it is refused.

In `config.toml`, `site_url` and `additional_redirect_urls` list where the local auth server may redirect to. The allowlist admits the confirm page, `/auth/confirm` and `/*/auth/confirm`.

`hooks.server.ts` also gates the Contestant App and the Admin App on the session alone: a signed-in user is sent away from the application's entry routes (`entryRoutes` in [`appGates.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/appGates.ts): the Contestant App's login, sign-in, registration, code and "email sent" screens, and the Admin App's login page), and a user without a session away from the `(protected)` routes. Whether a signed-in user may act is decided by the grants, as described below.

## Who can create an account

Accounts are created by the service role only: by an Edge Function, or by local tooling such as the E2E test harness. Nobody creates one by asking for it. Public sign-up is off and email confirmation is on, so the auth service refuses the two requests an unauthenticated caller could otherwise use. `POST /auth/v1/signup`, and `POST /auth/v1/otp` with `create_user: true`, each answer `422` with the error code `signup_disabled`, and no user is created.

A confirmed address (`auth.users.email_confirmed_at`) therefore means one of two things: a link mailed to the address was opened, or a service-side call vouched for the address when it created the user (`email_confirm: true`). A function that grants authority to a confirmed address relies on that meaning, because it cannot tell how an address came to be confirmed.

Two keys of `config.toml` hold this for the local stack:

| Table          | Key                    | Value   | Effect                                                                  |
| -------------- | ---------------------- | ------- | ----------------------------------------------------------------------- |
| `[auth]`       | `enable_signup`        | `false` | no unauthenticated caller can create a user                             |
| `[auth.email]` | `enable_confirmations` | `true`  | an address a user supplies is unconfirmed until a mailed link is opened |

`[auth.email] enable_signup` stays `true`. Despite its name it switches on the email provider itself, and password sign-in and password recovery depend on it.

The same file pins four more settings of the auth service:

| Table                    | Key                       | Value                                                    | Effect                                                                                                 |
| ------------------------ | ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `[auth]`                 | `minimum_password_length` | `8`                                                      | the length the Contestant App's password rule asks for, so a direct call cannot set a shorter password |
| `[auth.email]`           | `otp_length`              | `10`                                                     | the length of the one-time code the auth service mints beside every mailed link, its maximum           |
| `[auth.email]`           | `otp_expiry`              | `3600`                                                   | the life of a mailed sign-in or recovery link, in seconds                                              |
| `[auth.hook.send_email]` | `enabled`, `uri`          | `true`, `pg-functions://postgres/public/send_email_hook` | the auth service hands every mail it would send to `public.send_email_hook`, which sends none          |

The length binds the setting of a password: a user's own `updateUser`, the reset page's and an administrator's `createUser` are refused `422 weak_password` below eight characters, while an account whose shorter password predates the setting still signs in. The application's mails are sent by the `account-access` Edge Function alone (see [Email](/developers-guide/backend/email)); the hook stops the auth service's own mails and nothing else, so what its endpoints answer is unchanged. Under the hook a change of address asked through the auth service gets no confirmation mail.

Two checks keep the keys in place:

- `yarn assert:auth-signup-closed`, a link of `yarn lint:check`, reads `config.toml` and fails when any of the eight keys above holds another value.
- The E2E project `auth-service-contract` sends both requests to the running auth service and fails unless each is refused and no user exists afterwards.

The auth service reads `config.toml` only when the stack starts, so a change to these keys takes effect after `yarn db:stop` and `yarn db:start`; `yarn db:reset` does not serve it. `config.toml` configures the local stack only: a hosted project's settings are set in its dashboard; see [Auth settings of a hosted project](/developers-guide/deployment#auth-settings-of-a-hosted-project).

## Grants

Each row of `public.grants` gives one user one role on one target:

| Column        | Meaning                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `user_id`     | the auth user (`auth.users`); the user's grants are deleted with the user                                  |
| `scope`       | `global`, `account`, `project` or `entity`                                                                 |
| `target_type` | the entity type (`candidate`, `organization`, `faction` or `alliance`) for an entity grant, otherwise null |
| `target_id`   | the account, project or entity; null for a global grant                                                    |
| `role`        | `admin` or `editor`                                                                                        |

A grant is deleted when its target is deleted. The `anon` and `authenticated` roles have no access to the table at all; `user_can` and `user_has_account_grant` read the caller's own rows, as `SECURITY DEFINER` functions keyed on `auth.uid()`, so revoking a grant takes effect on the user's next read or write, without waiting for the user's token to be refreshed. Grants are written by `seed.sql`, by the `identity-callback` Edge Function with the service role, by `claim_invitations` for the caller's own invitations (see [Invitations](#invitations)) and, in the E2E suite, by the test harness.

`grant_role_permissions(scope, role, target_type)` is the role and permission matrix, and the only place it is written down. The permissions are the members of the `public.grant_permission` enum, such as `project.edit_entities` or `entity.edit_answers`.

| Grant                                               | Permissions                                                                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| global `admin`                                      | every permission                                                                                                                                         |
| account `admin`                                     | every permission, within the account                                                                                                                     |
| project `admin`                                     | every permission except the three `account.*` ones, within the project                                                                                   |
| project `editor`                                    | as project `admin`, except `project.manage_editors`, `project.edit_project_settings` and `nomination.confirm`                                            |
| entity `editor` of an organization                  | `project.read_structure`, editing and reading its own answers, `entity.invite_children`, editing and reading its nominations, `nomination.create_parent` |
| entity `editor` of a candidate, faction or alliance | `project.read_structure`, editing and reading its own answers, editing and reading its nominations, `nomination.create_parent`                           |

Any other combination, such as an entity `admin` grant, gives no permission.

### The access-token hook

`public.custom_access_token_hook` runs every time Supabase Auth issues or refreshes an access token. It adds a `grants` claim holding one `{ scope, target_type, target_id, role }` object per grant row of the user, or an empty array for a user with no grants. The hook is enabled for the local stack in `config.toml`:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

No row-level-security decision reads the claim: the database reads `public.grants` itself. The claim is read by the frontend's app-entry gates ([`$lib/auth/roles.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/auth/roles.ts)), which decide whether the Admin App or the Contestant App opens for a signed-in user. Without the hook, those gates admit no one; the data a user may read and write is unchanged.

### `user_can`

`public.user_can(p_scope, p_target_id, p_permission, p_target_type)` answers "may the caller apply this permission to this object". It reads the caller's rows of `public.grants`, found by `auth.uid()`, and never the token's `grants` claim, so a grant deleted while the user is signed in denies their next read and their next write. A grant answers yes when its role has the permission in `grant_role_permissions` and its target is, or contains, the object: an account grant reaches the account's projects, a project grant reaches the project's entities, and an entity grant reaches that entity. Two narrow exceptions let an entity grant reach further: `project.read_structure` on the entity's own project, and `nomination.read` on entities nominated under the entity's own nominations. At entity scope the object is the pair of `p_target_type` and `p_target_id`.

The RLS policies delegate their authority decisions to `user_can`; the one exception is reading an account, which asks `user_has_account_grant`. The two policies on `terms_of_use_acceptances` ask no grant at all (see [Terms-of-use acceptances](#terms-of-use-acceptances)). The storage policies ask it through `storage_path_can()`, and the Edge Functions over RPC with the caller's own token (see [Edge Functions](/developers-guide/backend/edge-functions)).

## Invitations

An invitation is a row of `public.invitations` that promises one grant, stated in the four columns of `public.grants`. Creating an invitation creates no account and writes no grant: neither exists until the invited person asks for a sign-in link and signs in.

`public.claim_invitations(p_project_id)` then writes the promised grants. It reads the caller's own confirmed address from `auth.users` and takes no address, user id or invitation id, so a caller can claim only the invitations addressed to them. It relies on the meaning of a confirmed address described under [Who can create an account](#who-can-create-an-account): an address counts as proven only when `auth.users.email_confirmed_at` is set, and that is sound only while the auth service refuses public sign-up and confirms an address by a mailed link alone.

An open invitation for a candidate or an organization is honoured only under a registration mode the project allows for that type; the database judges it (see [The registration modes](/developers-guide/contestant-app/pre-registration-and-invitation#the-registration-modes)).

A grant reaches a token only when one is issued, and the app-entry gates read the token's claim, so the session is refreshed after a claim and before a gate is asked. The database itself serves the grant at once. The confirm page's action and the sign-in actions therefore run in one order: session, claim, refresh, then gates.

See [Invitation](/developers-guide/contestant-app/pre-registration-and-invitation) for the table, who may promise which grant, the code, the link request, the claim, the order of the entry points and the limits.

### The address of an identity-provider account

An account the `identity-callback` Edge Function creates holds a placeholder address that nobody receives mail at, and it claims no invitation (`claim_invitations` reads no address for an account whose `app_metadata` names an identity provider). Its holder proves an address of their own by the confirmation link: the `confirm-address` operation of `account-access`, called with the account's own access token, leaves the typed address awaiting confirmation on the account and mails it a link of `type=email_change`. Opening that link makes the typed address the account's confirmed address; until then the account's address is still the placeholder, and the typed address is pending. The auth service's own answer to a user's address change tells an address another account holds; that is an accepted residual. See [The confirmation mail](/developers-guide/contestant-app/bank-authentication#the-confirmation-mail) and [The address confirmation](/developers-guide/backend/edge-functions#the-address-confirmation).

## Security of the invitation model

Each control of the invitation model, where it is enforced, and the test that holds it. The pgTAP sections are those of [`39-invitations.test.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/tests/database/39-invitations.test.sql); the E2E project `invitation-contract` runs against the local stack.

| Control                                                                                                                                                                                                                           | Enforced in                                                                                                      | Held by                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The authority map.** A creator promises only a grant below their own level, on a target of the row's project.                                                                                                                   | the `INSERT` policy `admin_insert_invitations`; the table's `CHECK` constraints for the service role             | pgTAP "the authority map, through the function and through the table"; the enforcement census of `25-matrix-conformance.test.sql`                 |
| **A row is immutable.** Its promise, address and code cannot be changed, and a claimed row cannot be deleted.                                                                                                                     | no `UPDATE` privilege and no `UPDATE` policy for any API role; the `DELETE` policy admits unclaimed rows only    | pgTAP "no rewrite" and "who reads a row, who deletes one, and what a row outlives"                                                                |
| **The code is the server's.** 60 bits, generated in the database, stored as a hash no API role can read.                                                                                                                          | the trigger `prepare_invitation`; the column privileges of `public.invitations`                                  | pgTAP "the code"                                                                                                                                  |
| **Only a confirmed address claims, and only its own invitations.**                                                                                                                                                                | `claim_invitations`, which reads `auth.uid()` and the caller's row of `auth.users` and takes no address          | pgTAP "exactly the promised grants", "nobody else" and "the pending address"; E2E `invitation-contract` and `invitation-landing`                  |
| **Public sign-up is closed**, so a confirmed address was confirmed by a mailed link or by the service role.                                                                                                                       | the auth service, from `config.toml` locally and from the dashboard on a hosted project                          | `yarn assert:auth-signup-closed` for the local file; the E2E project `auth-service-contract` for the running local service                        |
| **The answers are uniform.** A link or recovery request is answered before any work, alike for every address and code.                                                                                                            | `account-access`; the service-role database functions behind it, which no API role can execute                   | `flowConformance.test.ts` on the function's source; E2E `invitation-contract`; pgTAP "exposure"; the definer census of `07-rpc-security.test.sql` |
| **The link's origin is the deployment's.** It is `SITE_URL`, and nothing of the request reaches it.                                                                                                                               | `account-access`, which also asks the auth service whether the confirm page's URL is an admitted redirect target | `signInLink.test.ts`, `deploymentChecks.test.ts`; E2E "request headers that name another site do not move the mailed link"                        |
| **The limits.** One mail per address per minute in a project and twenty a day in all projects together, one binding per code per minute and five bindings to another address per code a day, ten password look-ups per used code. | `invitation_link_request` and `invitation_code_claimant_email`, over `private.invitation_throttle`               | pgTAP "the limits"; E2E "a second request for one address inside the interval is answered alike and sends no second mail"                         |
| **A slot is given back when no mail went out**, so a failed send does not lock an address out.                                                                                                                                    | `linkIssue.ts`, which calls `invitation_link_release`                                                            | `linkIssue.test.ts`, with an injected transport that fails; pgTAP "the slot is given back" for the database function                              |
| **A misconfigured deployment gets no link.** Open sign-up, or a redirect allowlist that refuses the confirm page.                                                                                                                 | `account-access`, before the database is asked about the address; each refusal is one log line                   | `linkIssue.test.ts` and `deploymentChecks.test.ts`, with injected answers                                                                         |

Two rows of the table are held by unit tests alone. No test makes the running function's SMTP transport fail, and no test runs the function against an auth service that allows sign-up or refuses the confirm page's URL, so the release of a slot and both refusals are shown for the function's modules with injected dependencies and not for the served function.

### What this does not protect against

Each item is a property of the system as it is. None is enforced anywhere in the repository.

- **Anonymous code checks are unlimited.** `check-code`, and a link request or a code sign-in that names a code no claimed row holds, are not counted against any limit. Each costs one indexed look-up and writes nothing. The exposure is load on the database, not disclosure: a guessed code meets 60 bits. A deployment that needs a bound puts a rate limit in front of the Edge Function, at its gateway.
- **Twenty sign-in or recovery mails a day to any eligible address, and the cap stays as it is.** Anyone who knows an address that has an open invitation, or that belongs to a user holding a grant in a project, can make the deployment mail that address a link once a minute, up to twenty a day in all projects together. The limit cannot tell the owner of the address from anyone else, so a caller who spends an address's twenty also leaves its owner without a mailed link until the next day; a user with a password still signs in with it.
- **A new link makes the unopened one before it stop working.** On the local stack, verifying the earlier of two `magiclink` tokens issued for one address answers `403` with `otp_expired`. Combined with the item above, a third party who knows the address can make a link the user has not yet opened stop working, once a minute, within the same twenty a day. The user's remedy is to ask again and open the newest mail.
- **An open code can have mail sent to addresses its holder chooses.** Whoever holds an open code can bind it to an address and have that address mailed, once a minute, to at most five different addresses a day, each still within that address's own limits. For an address with no account the function creates one, without a password, before it mails the link.
- **No limit uses the caller's identity.** The function reads no request header to tell callers apart, because none is known to be outside the caller's influence. On the local stack every caller reaches the function with the same forwarded address, that of the container network's gateway. Which headers a hosted gateway sets, and whether one of them identifies the caller, is unmeasured. A project-wide cap is deliberately absent: any visitor could use it to deny the answer to everyone.
- **A claim honours a promise whose creator has since lost the authority to make it.** The authority map is asked when the row is written and not again. An administrator withdraws a promise by deleting the unclaimed invitation; a claimed one has already become a grant, and is revoked as a grant.
- **`claim_invitations` has no guard on the auth service's sign-up setting.** The database sees that an address is confirmed and not how it came to be. On a hosted project whose dashboard still allows public sign-up, a visitor can obtain a confirmed account for an address they do not control and claim that address's invitations, whatever `account-access` does: its refusal to issue links stops the legitimate flow and makes the mistake visible in its log, and it does not stand between that visitor and the claim. The two dashboard switches are the control; see [Auth settings of a hosted project](/developers-guide/deployment#auth-settings-of-a-hosted-project).

The residuals of the sign-in, registration and recovery flow are listed under [Known residuals](#known-residuals).

## Known residuals

Each item is a property of the system as it is, stated with what was measured on the local stack where something was. None is closed by anything in the repository. An item kept by choice says why; one that must be settled before a deployment goes live is marked a pre-launch risk.

### Sign-in and mailed links

- **The auth service's own one-time-password endpoint tells a registered address from an unregistered one.** `POST /auth/v1/otp` with the anon key and `create_user: false` answers `200` for an address that has an account and `422` with `otp_disabled` for an address that has none; the mail hook stops the mail and does not change that answer (measured with the hook enabled). That path goes around the uniform answer and the limits of `account-access`. What it discloses is that an address has an account, not that it was invited.
- **A mail scanner that runs scripts and submits forms can still spend a mailed link on the confirm page.** The link opens the confirm page, whose load verifies nothing, so a scanner or a prefetcher that only fetches the link spends nothing: the token is spent only by the page's form, when Continue is pressed. A scanner that also runs the page's script and submits its form spends the token as a person would. The token works once (measured: a spent token and a superseded one are both answered `403` with `otp_expired`), so the addressee's own Continue then fails verification and lands on the login screen with the notice that the link could not be used. The addressee's remedy is to ask for a new link.
- **An address-change link confirmed in a signed-in browser signs the browser out first.** Continue signs out whatever session the browser holds before the token is verified, so a link never replaces a signed-in account unless the person presses Continue after the page has said so. A failed confirmation of an `email_change` link therefore lands on the login page with its notice, that the address is now another account's or the auth error, and not in the app of the account that was signed in.
- **A signed-in session can set a new password without the current one.** The reset page and the set-password gate call `updateUser({ password })` on the session as it is, and `secure_password_change` is off, so whoever holds a session, including one a mailed link created, can choose the account's password. Measured: a password set with `updateUser` on a session a mailed link created is accepted, and the session serves every later load.
- **Pre-launch risk: the server-side password sign-ins likely share one sign-in budget per server.** The auth service limits sign-ins per address of origin (`[auth.rate_limit] sign_in_sign_ups`, 30 in five minutes in `config.toml`). The code sign-in reaches it from the `account-access` function, and the email sign-in from the frontend server, so on a hosted project each likely counts every user's attempts against the address of the one server that makes them. A caller who sends wrong passwords, with a few used codes or with any addresses, could then use the budget up and refuse every user's sign-in until the window ends. The per-code budget of the code sign-in does not prevent that. Which address a hosted project's auth service counts these requests under is not measured. It is to be measured on the first hosted project before it goes live, and if the budget is shared, the client's address is to be forwarded to the auth service through a header the auth service trusts.
- **The auth service's password sign-in takes measurably different time for an unknown address, a wrong password and an account with no password.** All three are answered `400` with `invalid_credentials`, so the answer's status and body tell nothing, but the timings did not overlap. Measured on the loopback interface of one host, nine sign-ins a case, interleaved: an address with no account 5.3 ms least, 6.1 ms median, 8.0 ms greatest; an account with a password and a wrong password 62.7, 65.1 and 67.9 ms; an account with no password 11.7, 13.0 and 15.3 ms. That the difference survives a network between a caller and the service was not measured. It is reachable with the anon key, whatever the sign-in screen does.
- **About ninety-five link verifications per full E2E run.** A full run of the E2E suite makes about ninety-five token verifications, unpaced. The local stack does not enforce the auth service's limit of thirty verifications in five minutes (`[auth.rate_limit] token_verifications`), so the run passes there. A stack that enforces it would fail the run; the identity-provider specs are then to be paced or split.

### Identity-provider accounts

- **The in-use answer of the address confirmation tells an identity-provider account that a typed address holds an open invitation.** An account the identity provider made claims no invitation, so `confirm-address` answers `in-use` for an address an open invitation of the project holds, as it does for an address another account holds, and the invited person signs in by email instead. The answer therefore discloses that the address has an open invitation in that project. It is bounded as the other in-use answer is: the caller is authenticated by their own access token; only an identity-provider account whose address is still the placeholder is answered, and only for a project it registered in; and the database gives one account ten such requests per quarter hour and one address one per minute, whatever project they name, before the address is looked at. See [The address confirmation](/developers-guide/backend/edge-functions#the-address-confirmation).
- **The find-or-create's write of the account's record in `auth.users`.** `identity_entity_find_or_create`, the `SECURITY DEFINER` function owned by `postgres` that `identity-callback` calls with the service role, finds the entity an identity registered or creates one. When it creates one, it writes the editor grant and records the entity on the account, in `auth.users.raw_app_meta_data`, in the same transaction. On the local stack `postgres` may update `auth.users`; on a hosted project that is assumed allowed and not measured.

### Terms of use and saves

- **Any signed-in user may record a terms acceptance for any project.** The insert policy of `terms_of_use_acceptances` asks only that the row is the caller's own, so a signed-in user may insert an acceptance for any project id, and the answer tells whether that project exists. It is kept: project ids are public, as the public configuration carries them, and a user must be able to accept a project's terms before being invited to it.
- **Terms of use are enforced by the Contestant App's layout alone.** Only the protected layout asks whether the editor has accepted. With the session cookie, another client can write an entity's answers, profile fields, images and nominations without accepting, and that content is public as soon as the entity is (see [Row-level security and column grants](#row-level-security-and-column-grants)). This is an owned risk: an administrator may prefill a profile before its editor is invited to make optional changes, and the terms cover what the editor inserts, not the entity's data in general. See [Terms-of-use acceptances](#terms-of-use-acceptances).
- **A partly stored profile save says that the save failed.** When some of a profile save was stored and the rest was not, the profile page shows the save failure, not a partial success. It is kept, because saving again completes the save without uploading the image again.

## What the set-password gate does not cover

The set-password gate is a view of the Contestant App's protected layout, decided on the server by the user-level data: it is shown when `passwordSet` is `false` and the account's address is proved (`addressState` is `proved`). An account the identity provider created has no password and only a placeholder address, so it is first asked for an address of its own by the identity provider's view, and meets the set-password gate once that address is proved. It is not a database control and not a gate of the session.

- **The data API.** A session with no password can still call the data API with its own token, as one that has not accepted the terms of use can. Row-level security and the grants decide what the token may read and write; having a password adds no authority.
- **The Admin App.** It does not ask whether the account has a password. Its protected pages, its form actions and its job endpoints admit a verified identity with the admin role, so a project-scope invitation claimed through a mailed link acts there before any password is chosen. The session was obtained by proving the address, and no authority depends on having a password.
- **Other routes of the Contestant App.** The pages outside `(protected)`, the reset page among them, are not behind the gate.

## Which entity a user is

The `(entity, <type>, <id>, editor)` row in `public.grants` is the only link from an auth user to the candidate or organization they are. The entity tables have no user column.

- `public.get_user_entities(p_project_id)` lists the entities the caller edits in one project. It returns one JSON object whose `entities` array holds one entry per candidate and per organization, with the fields a card shows, and whose `password_set` says whether the caller's own account holds a password, as `private.caller_password_set()` answers it, and whose `pending_email_taken` says whether the address awaiting confirmation on the caller's own account is now another account's address, as `private.caller_pending_email_taken()` answers it. A user with no entity still gets the object, with an empty array. One user may edit several entities in a project, and all of them are listed.
- `public.get_entity_user_data(p_project_id, p_entity_type, p_entity_id)` returns the editable row of one of those entities. For an entity the caller does not edit, a type that does not match the id, an entity of another project and an id that does not exist it returns no row. Neither function raises an error, so neither reveals whether an entity exists.
- `public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)` returns the nominations of one of those entities, confirmed or not, as a JSON array of objects with the keys `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, `custom_data` and `parent`. `parent` is `null` or an object of `entity_type`, `entity_id`, `name` and `short_name` of the entity the nomination stands under. An entity with no nomination gets an empty array. For an entity the caller does not edit, a type other than candidate or organization, an entity of another project and an id that does not exist it returns `NULL`, which is a different answer from the empty array. It is a `SECURITY DEFINER` function, because the parent may be a row the caller's own policies refuse, and only `authenticated` may execute it.
- `public.get_nomination_parent_options(p_project_id, p_entity_type, p_entity_id, p_contests)` returns the entities one of those entities may stand under; see [Nominations an entity defines](#nominations-an-entity-defines).
- The first two find the caller's entities through `private.caller_entity_ids`, which reads the caller's `editor` grants from `public.grants` itself rather than from the token, and both then read the entity tables under the caller's own row-level security. The third and the fourth ask the same lookup as their gate and read with the definer's rights. An admin grant lists nothing: only the editor grant makes an entity the user's. An entity is listed exactly when the one-entity read returns it.
- A candidate has at most one editor: the unique index `idx_grants_one_candidate_editor` refuses a second user's editor grant on the same candidate. An organization may have several editors.

The Contestant App loads its entity through the Supabase data writer, which calls `get_user_entities`, then `get_entity_user_data` and, for the entity's nominations, `get_entity_nominations`, each with the deployment's `PUBLIC_PROJECT_ID`. A grant written after the user's token was issued is served, readable and writable at once, because row-level security reads the grant table and not the token. A grant that was removed stops being served at once, and the next write to its entity is refused. `identity-callback`, the Edge Function that creates a candidate or a party for an identity the provider verified, writes the editor grant itself; see [Edge Functions](/developers-guide/backend/edge-functions). The grant of an invitation is written by `claim_invitations`.

## Nominations an entity defines

A nomination is a row of `public.nominations`: one entity, in one election, one constituency and one round, optionally under a parent nomination. An entity's own editor may write its nominations; an administrator confirms each before voters see it. The rules below bind every writer unless one says otherwise. The Contestant App's side is in [Defining nominations](/developers-guide/contestant-app/defining-nominations).

### The election type

`elections.election_type` is a member of the enum `public.nomination_shape` and says which entity types the election admits as nominees. The column defaults to `organization_list_and_independents`.

| Election type                        | Candidate                                | Organization | Faction  | Alliance |
| ------------------------------------ | ---------------------------------------- | ------------ | -------- | -------- |
| `organization_list`                  | admitted; needs a parent or a typed name | admitted     | admitted | admitted |
| `organization_list_and_independents` | admitted                                 | admitted     | admitted | admitted |
| `candidate_only`                     | admitted                                 | refused      | refused  | refused  |
| `organization_only`                  | refused                                  | admitted     | refused  | admitted |

The matrix is stated twice, once for each side, and nowhere else:

- **In SQL**, `public.nomination_shape_rule(p_shape, p_entity_type)` in [`011-validation-functions.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/011-validation-functions.sql) answers `admitted`, `parent_required` or `refused`. It reads no table. A pair it does not name answers `NULL`, which every caller treats as a refusal.
- **In TypeScript**, `isNominableInShape` and `allowedParentTypes` in [`nominationShape.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/data/src/objects/election/nominationShape.ts) of `@openvaa/data`, asked with `Election.nominationShape`. They tell the application what to offer; the database is what refuses.

The two are held together by a grid over the same sixteen cells on each side: `nominationShape.test.ts` in the data package and the section on the election-type rule in `08-triggers.test.sql`. The `@openvaa/data` README compares every nomination rule of the data model with the database's, under "Nomination rules: the data model and the database".

Two triggers on `nominations` enforce the matrix:

- **The row rule.** `validate_nomination`, before every insert and update, refuses a row whose entity type its election's type does not admit, with a message that begins `Nomination shape refused: ` and SQLSTATE `23514`. It binds every writer, the service role and `bulk_import` included. It is asked when a nomination is written: changing an election's type re-checks nothing, and a later write of a row the new type refuses is refused.
- **The end-of-transaction rule.** The constraint trigger `nominations_parent_required` is `DEFERRABLE INITIALLY DEFERRED`. Where the matrix answers `parent_required`, a candidate's nomination must, when the transaction ends, have a parent nomination or carry `requestedParentOrganization` in its `custom_data` as a string that is not blank. A refusal begins `Nomination parent required: `, SQLSTATE `23514`. It is deferred so that a writer may insert the candidate's row, then its party's row, and then point the first at the second.

### Writing an entity's nominations

`public.set_entity_nominations(p_entity_type, p_entity_id, p_nominations, p_expected_reach)` writes the whole set of nominations of one candidate or organization in one call: it inserts the nominations the set adds, updates the ones whose values differ, deletes the ones the set leaves out, and creates the nomination of a named party or alliance that has none at the contest. Either all of it is stored or none of it.

It is `SECURITY INVOKER`: every statement runs as the caller, so the policies, the column grants and the triggers of `public.nominations` stay the only gate, and a direct write of the same rows meets the same refusals. Only `authenticated` may execute it.

`p_expected_reach` is the read the set was computed from: a JSON object mapping the id of every nomination in the function's reach to its `updated_at`, as `get_entity_nominations` states both, and `{}` for an entity with none. Before it checks the set, the function compares it with the reach as stored. A nomination the expectation does not name, an id that is no longer in reach and an `updated_at` that differs each refuse the call with `40001`, so a set computed from an older read never deletes a nomination created since, and never writes back one moved, edited or confirmed since. The comparison is made against the rows as the call reads them, without a lock.

`p_nominations` is a JSON array of objects, and an empty array is a valid set:

| Key               | Value                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | A uuid: the object describes that stored nomination. Left out for a new one; a JSON null is refused.                                                                                       |
| `election_id`     | A uuid, required. With `id` it must be the stored row's.                                                                                                                                   |
| `constituency_id` | A uuid of a constituency of the election, required. With `id`, a value other than the stored one moves the nomination: the stored row is deleted and a new one inserted.                   |
| `election_symbol` | A string or null. Trimmed; a blank one is stored as `NULL`, and one longer than 50 characters is refused.                                                                                  |
| `parent`          | `{"kind":"none"}`, `{"kind":"entity","entity_type":…,"entity_id":…}`, `{"kind":"other","name":…}` or `{"kind":"keep"}`. A candidate names an organization and an organization an alliance. |

- `entity` places the nomination under that entity's nomination at the same contest. Where the entity has none there, one is created for it, unconfirmed, for an administrator to resolve.
- `other` links nothing and stores the typed name, trimmed and at most 100 characters, in `custom_data.requestedParentOrganization`. A nomination that carries that key cannot be confirmed.
- `keep` leaves the stored parent and the stored typed name as they are. It is admitted only with an `id` and not on a move.
- An object without an `id` must be the only object of its election.

The function writes only the nominations in its reach: those of the entity that the caller can read, at their election's current round, in an election whose type admits the entity's type. A round that is not stored, on either side, is round 1, as the application reads it. A nomination in reach that the set does not name is deleted; every other nomination of the entity is left as it is. A new nomination is written at its election's current round.

It answers `{"inserted", "updated", "deleted", "unchanged", "parents_created"}`, each a count. A move counts once under `deleted` and once under `inserted`. A nomination whose values did not change is not written, so it keeps its confirmation; every row an entity's editor does write has its confirmation turned off.

| Refusal                                                                                           | SQLSTATE | Message                                                                          |
| ------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| A malformed argument or object                                                                    | `22023`  | begins `set_entity_nominations: `, naming the object as `p_nominations[<index>]` |
| A constituency that is not one of its election's constituencies                                   | `22023`  | begins `set_entity_nominations: `, naming the object as `p_nominations[<index>]` |
| The reach as stored is not the reach the caller read                                              | `40001`  | `set_entity_nominations: the nominations have changed since they were read`      |
| The caller does not hold `nomination.edit` on the entity                                          | `42501`  | begins `set_entity_nominations: `                                                |
| A row could not be written: nominations are locked, or the rows are no longer the caller's        | `42501`  | begins `set_entity_nominations: a nomination could not be written`               |
| A nomination that is removed or moved has nominations listed under it                             | `23503`  | the foreign key on `parent_nomination_id`                                        |
| The call would create a parent's nomination while the caller has originated ten unconfirmed ones  | `P0001`  | begins `A caller may originate at most `                                         |
| A candidate is left with neither a parent nor a typed name where the election's type requires one | `23514`  | begins `Nomination parent required: `                                            |
| An entity type the election's type refuses                                                        | `23514`  | begins `Nomination shape refused: `                                              |

Row-level security refuses an `UPDATE` and a `DELETE` without an error, by hiding the row. The function therefore counts the rows each statement affected and raises on a shortfall, so a caller is never answered that a locked or vanished row was saved. The frontend's data writer maps the `40001` refusal, the `23503` and the cap's `P0001` to the named refusals `changed`, `hasCandidates` and `tooManyPending`, and rejects for every other error.

The function forces the end-of-transaction parent rule and sets it back to deferred before it returns. PostgreSQL offers no way to read a constraint's mode, so a caller that had set `nominations_parent_required` immediate finds it deferred after the call.

The function does not hold a named parent to the options the next function lists: it checks the parent's type and that the id is a uuid. It does not read `access.answersLocked` either; only the nominations lock is enforced here.

### The parent options

`public.get_nomination_parent_options(p_project_id, p_entity_type, p_entity_id, p_contests)` returns the entities a candidate or an organization the caller edits may stand under: for a candidate every confirmed organization of the project, for an organization every alliance of the project, confirmed or not. Each element holds exactly `id`, `entity_type`, `name`, `short_name`, `color`, `image` and `nominated`, the last being those of the asked contests at which the option holds a nomination at the election's current round. `p_contests` is a JSON array of at most 1000 `{election_id, constituency_id}` objects; a longer one is answered with `NULL`, as a malformed one is.

It is `SECURITY DEFINER`, because an entity's editor cannot read the project's organizations and alliances through its own policies, and only `authenticated` may execute it. Its gate is the caller's own editor grant on the named entity, read through `private.caller_entity_ids`; `user_can` is not asked, so a project admin is refused. It returns `NULL`, and never raises, for a refused caller and for a malformed argument; an empty array says that the project lists nothing the entity may name.

### The policies

Beside the admin policies, which ask `project.edit_nominations`, an entity's own users write through four policies, each of which refuses while `access.nominationsLocked` is on:

- `entity_insert_nominations` and `entity_update_nominations`: the entity's own nomination, with `nomination.edit` on the entity.
- `entity_delete_nominations`: the entity's own nomination, confirmed or not, with `nomination.edit` on the entity. A placeholder the caller created for another entity is not the caller's own and cannot be deleted by it. The foreign key on `parent_nomination_id` takes no action on a delete, so the delete is refused while a nomination is listed under the row.
- `entity_insert_parent_nominations`: the unconfirmed nomination of a parent that has none at the contest. It asks `nomination.create_parent` and pairs the row with the caller: the caller must already hold a nomination at that contest whose entity is of a type that stands under the row's entity, a candidate or a faction for an organization's row and an organization for an alliance's. A caller may have originated at most ten unconfirmed organization and alliance nominations; the count is by user and includes those the caller inserted for an organization or an alliance it edits itself.

`private.nomination_id_in_contest` answers which nomination an entity holds at a contest, for a writer that cannot read the row: the one with no parent first, then the oldest, then the lowest id.

## Row-level security and column grants

RLS is enabled on every table in the `public` schema, with separate policies for each operation. The full set is in [`302-rls.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/302-rls.sql). In outline:

- **Anonymous readers** see an entity only when its project is open for voters (`project_open_for_voters`), the entity is `confirmed`, and it has a confirmed nomination in that project. These three conditions are the whole rule, and they are the same for candidates, organizations, factions and alliances. Whether anyone has registered for the entity, signed in or accepted the terms of use plays no part, so confirming an entity is what makes it public.
- **An entity editor** may update its own row: for example, `entity_update_own_candidates` asks `user_can('entity', id, 'entity.edit_answers', 'candidate')`.
- **Project admins and editors** insert, update and delete entities in their project with `project.edit_entities`.

Column grants in [`303-column-grants.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/303-column-grants.sql) narrow what the `authenticated` role may update, because a policy cannot admit a row while withholding a column. For candidates the updatable columns are `short_name`, `info`, `color`, `image`, `subtype`, `custom_data`, `first_name`, `last_name`, `answers` and `confirmed`. Structural columns such as `project_id`, `external_id` and `sort_order` are not updatable by any signed-in user.

Rules that depend on the row's state are enforced by the trigger function `enforce_entity_immutability()`, which is registered on all four entity tables:

- **Who may confirm.** A change to `confirmed`, in either direction, needs `entity.confirm` on the entity.
- **What confirmation freezes.** Once an entity is confirmed, its name columns and its `short_name` cannot be changed by its own editor: `first_name`, `last_name` and `short_name` on `candidates`, and `name` and `short_name` on `organizations`, `factions` and `alliances`. A holder of `entity.edit_immutable` on the entity, such as a project admin, may still correct any of them. While the entity is unconfirmed its editor may set them.

Both rules bind the `authenticated` role; a service-role client is not bound by them.

An entity's `color` is checked by a second trigger function, `validate_entity_color()`, whoever writes it: the value is null or an object whose only members are `normal` and `dark`, each absent, null or a hex colour written as `#` and three or six hexadecimal digits. The frontend paints a stored colour into a `style` attribute, so nothing that is not a colour is stored.

### Terms-of-use acceptances

One table is outside the grant model. `public.terms_of_use_acceptances`, in [`304-terms-of-use-acceptances.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql), holds one row for each user and project: the row says that the user has accepted the terms of use of that project. No entity table has a terms-of-use column.

- Its two policies ask only who the caller is. A signed-in user may read and insert rows whose `user_id` is their own (`user_id = (SELECT auth.uid())`); no grant is asked, because accepting is a statement a user makes about themself.
- The `authenticated` role may insert `project_id` only. The database fills in `user_id` and `accepted_at`, so a caller can state neither whose acceptance it is nor when it was given.
- There is no update or delete policy, so a user cannot change or withdraw an acceptance. The row is deleted with the auth user or with the project. The `anon` role has no access to the table.
- Nothing reads the table to decide access: no policy, no function and no storage policy. The pgTAP file [`37-terms-of-use-acceptances.test.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql) fails if one starts to.

The Contestant App records and reads the acceptance through the Supabase data writer; see [Registration](/developers-guide/contestant-app/registration#terms-of-use). That any project's terms can be accepted, and that only the app's layout asks for an acceptance, are listed under [Known residuals](#terms-of-use-and-saves).

## Storage

`config.toml` defines two buckets: `public-assets`, which is public, and `private-assets`, which is not. An entity's objects are stored under `{project_id}/{entity_type}/{entity_id}/`. The policies on `storage.objects` delegate the authority decision to `storage_path_can()`, which asks `user_can` about the project or entity the path names. Anonymous reads from `public-assets` follow `storage_path_is_public()`, the same visibility rule as the tables.

## The service-role key

The service-role key bypasses RLS, so it never reaches the browser:

- It has no `PUBLIC_` variable. Nothing under `apps/frontend/src` reads it.
- The Edge Functions get it as `SUPABASE_SERVICE_ROLE_KEY` from the Edge runtime, which sets it automatically. `send-email` uses it only after checking the caller with `user_can`, and `identity-callback` only after verifying the identity provider's token. `account-access` is anonymous: it uses the key to ask the database functions that decide its answers, and it creates a user and mints a sign-in link only for an address those functions return.
- In development, `SUPABASE_SERVICE_ROLE_KEY` in the repo-root `.env` is read by local tooling only: `yarn db:seed` and the E2E test harness.
- The storage cleanup triggers read the Storage API URL and key from the `storage_config` table, which only the service role and `postgres` can read.

Never weaken a policy or a grant to make a frontend call work. Add the permission to the right grant, or move the operation into an Edge Function that checks the caller with `user_can` first.
