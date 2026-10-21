# Authentication and authorisation

Users sign in with Supabase Auth. What a signed-in user may then do is decided in the database:

1. Every privilege is a row in `public.grants`.
2. When Supabase Auth issues an access token, the access-token hook copies the user's grants into the token's `grants` claim.
3. Row-level security (RLS) policies, storage policies and the Edge Functions ask `user_can` whether that claim allows the operation.

The schema files are [`300-auth-tables.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/300-auth-tables.sql) (the grants table), [`301-auth-functions.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/301-auth-functions.sql) (the hook, `user_can` and their helpers), [`302-rls.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/302-rls.sql) (table policies), [`303-column-grants.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/303-column-grants.sql) (column grants) and [`400-storage.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/400-storage.sql) (storage policies).

## Sessions

The frontend uses the `@supabase/ssr` package, and both of its clients are built from `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` only:

- On the server, `hooks.server.ts` creates one client per request with `createSupabaseServerClient` from [`$lib/supabase/server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/supabase/server.ts) and puts it on `event.locals.supabase`. The client reads the auth session from the request's cookies and writes refreshed session cookies back to the response. The cookies are set with `httpOnly: false`, because two server layouts forward them into the page data.
- In the browser, `createSupabaseBrowserClient` from [`$lib/supabase/browser.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/supabase/browser.ts) returns a single shared client.

On the server, read the session through `event.locals.safeGetSession()` ([`$lib/supabase/safeGetSession.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/supabase/safeGetSession.ts)). It reads the session from the cookies with `getSession()` and then verifies the access token with `getUser()`, which asks Supabase Auth. The verification is done once per access token within a request.

Mailed links (the recovery link, and the sign-in link of an invitation or of a returning user) come back to the `/api/auth/callback` route, which verifies the link's token hash. The route runs four steps in order:

1. It passes the link's `token_hash` and `type` to `verifyOtp`, which creates the session on the server and stores it in cookies.
2. It claims the user's invitations, with the data writer's `claimInvitations()` on the request's own client (see [Invitations](#invitations)).
3. When the claim wrote a grant, it refreshes the session, so that the access token lists the grant.
4. It redirects by link type. A `recovery` link goes to the password reset page. A `magiclink` link, the type of every sign-in link, goes to the `next` path when it is a safe relative app path and to the Contestant App otherwise, whether or not the user has a password: the Contestant App's protected layout then asks a user with none to set one (see [The set-password gate](/developers-guide/contestant-app/registration#the-set-password-gate)).

A link of the type `invite`, `signup` or `email` is refused before step 1: nothing issues one, and verifying one for an invited account would store a password nobody chose. It is redirected to the login page with the auth error, as a missing parameter and a failed verification are. The type a link names is a landing hint and not an authority: the auth service accepts a sign-in token presented as `recovery`, so whoever holds a link can change it, and the reset page decides by the session alone. [The auth callback](/developers-guide/contestant-app/login-and-password-reset#the-auth-callback) lists each arm and what a failed claim does.

In `config.toml`, `site_url` and `additional_redirect_urls` list where the local auth server may redirect to.

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

The same file pins three more settings of the auth service:

| Table                    | Key                       | Value                                                    | Effect                                                                                                 |
| ------------------------ | ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `[auth]`                 | `minimum_password_length` | `8`                                                      | the length the Contestant App's password rule asks for, so a direct call cannot set a shorter password |
| `[auth.email]`           | `otp_expiry`              | `3600`                                                   | the life of a mailed sign-in or recovery link, in seconds                                              |
| `[auth.hook.send_email]` | `enabled`, `uri`          | `true`, `pg-functions://postgres/public/send_email_hook` | the auth service hands every mail it would send to `public.send_email_hook`, which sends none          |

The length binds the setting of a password: a user's own `updateUser`, the reset page's and an administrator's `createUser` are refused `422 weak_password` below eight characters, while an account whose shorter password predates the setting still signs in. The application's mails are sent by the `account-access` Edge Function alone (see [Email](/developers-guide/backend/email)); the hook stops the auth service's own mails and nothing else, so what its endpoints answer is unchanged. Under the hook a change of address asked through the auth service gets no confirmation mail.

Two checks keep the keys in place:

- `yarn assert:auth-signup-closed`, a link of `yarn lint:check`, reads `config.toml` and fails when any of the seven keys above holds another value.
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

A grant is deleted when its target is deleted. The `anon` and `authenticated` roles have no access to the table at all. Grants are written by `seed.sql`, by the `identity-callback` Edge Function with the service role, by `claim_invitations` for the caller's own invitations (see [Invitations](#invitations)) and, in the E2E suite, by the test harness.

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

A user with no grants can do nothing. Without the hook, no token carries any authority.

### `user_can`

`public.user_can(p_scope, p_target_id, p_permission, p_target_type)` answers "may the caller apply this permission to this object". It reads only the `grants` claim of the caller's token. A grant answers yes when its role has the permission in `grant_role_permissions` and its target is, or contains, the object: an account grant reaches the account's projects, a project grant reaches the project's entities, and an entity grant reaches that entity. Two narrow exceptions let an entity grant reach further: `project.read_structure` on the entity's own project, and `nomination.read` on entities nominated under the entity's own nominations. At entity scope the object is the pair of `p_target_type` and `p_target_id`.

The RLS policies delegate their authority decisions to `user_can`; the one exception is reading an account, which asks `user_has_account_grant`. The two policies on `terms_of_use_acceptances` ask no grant at all (see [Terms-of-use acceptances](#terms-of-use-acceptances)). The storage policies ask it through `storage_path_can()`, and the Edge Functions over RPC with the caller's own token (see [Edge Functions](/developers-guide/backend/edge-functions)).

## Invitations

An invitation is a row of `public.invitations` that promises one grant, stated in the four columns of `public.grants`. Creating an invitation creates no account and writes no grant: neither exists until the invited person asks for a sign-in link and signs in.

`public.claim_invitations(p_project_id)` then writes the promised grants. It reads the caller's own confirmed address from `auth.users` and takes no address, user id or invitation id, so a caller can claim only the invitations addressed to them. It relies on the meaning of a confirmed address described under [Who can create an account](#who-can-create-an-account): an address counts as proven only when `auth.users.email_confirmed_at` is set, and that is sound only while the auth service refuses public sign-up and confirms an address by a mailed link alone.

An open invitation for a candidate or an organization is honoured only under a registration mode the project allows for that type; the database judges it (see [The registration modes](/developers-guide/contestant-app/pre-registration-and-invitation#the-registration-modes)).

A grant reaches a token only when one is issued, so the session is refreshed after a claim and before anything the grant opens is read. The auth callback and the sign-in actions therefore run in one order: session, claim, refresh, then gates.

See [Pre-registration and invitation](/developers-guide/contestant-app/pre-registration-and-invitation) for the table, who may promise which grant, the code, the link request, the claim, the order of the entry points and the limits.

## Security of the invitation model

Each control of the invitation model, where it is enforced, and the test that holds it. The pgTAP sections are those of [`39-invitations.test.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/tests/database/39-invitations.test.sql); the E2E project `invitation-contract` runs against the local stack.

| Control                                                                                                                | Enforced in                                                                                                   | Held by                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The authority map.** A creator promises only a grant below their own level, on a target of the row's project.        | the `INSERT` policy `admin_insert_invitations`; the table's `CHECK` constraints for the service role          | pgTAP "the authority map, through the function and through the table"; the enforcement census of `25-matrix-conformance.test.sql`                 |
| **A row is immutable.** Its promise, address and code cannot be changed, and a claimed row cannot be deleted.          | no `UPDATE` privilege and no `UPDATE` policy for any API role; the `DELETE` policy admits unclaimed rows only | pgTAP "no rewrite" and "who reads a row, who deletes one, and what a row outlives"                                                                |
| **The code is the server's.** 60 bits, generated in the database, stored as a hash no API role can read.               | the trigger `prepare_invitation`; the column privileges of `public.invitations`                               | pgTAP "the code"                                                                                                                                  |
| **Only a confirmed address claims, and only its own invitations.**                                                     | `claim_invitations`, which reads `auth.uid()` and the caller's row of `auth.users` and takes no address       | pgTAP "exactly the promised grants", "nobody else" and "the pending address"; E2E `invitation-contract` and `invitation-landing`                  |
| **Public sign-up is closed**, so a confirmed address was confirmed by a mailed link or by the service role.            | the auth service, from `config.toml` locally and from the dashboard on a hosted project                       | `yarn assert:auth-signup-closed` for the local file; the E2E project `auth-service-contract` for the running local service                        |
| **The answers are uniform.** A link or recovery request is answered before any work, alike for every address and code. | `account-access`; the service-role database functions behind it, which no API role can execute                | `flowConformance.test.ts` on the function's source; E2E `invitation-contract`; pgTAP "exposure"; the definer census of `07-rpc-security.test.sql` |
| **The link's origin is the deployment's.** It is `SITE_URL`, and nothing of the request reaches it.                    | `account-access`, which also asks the auth service whether the callback URL is an admitted redirect target    | `signInLink.test.ts`, `deploymentChecks.test.ts`; E2E "request headers that name another site do not move the mailed link"                        |
| **The limits.** One mail per address per minute, one binding per code per minute, ten look-ups per used code.          | `invitation_link_request` and `invitation_code_claimant_email`, over `private.invitation_throttle`            | pgTAP "the limits"; E2E "a second request for one address inside the interval is answered alike and sends no second mail"                         |
| **A slot is given back when no mail went out**, so a failed send does not lock an address out.                         | `linkIssue.ts`, which calls `invitation_link_release`                                                         | `linkIssue.test.ts`, with an injected transport that fails; pgTAP "the slot is given back" for the database function                              |
| **A misconfigured deployment gets no link.** Open sign-up, or a redirect allowlist that refuses the callback.          | `account-access`, before the database is asked about the address; each refusal is one log line                | `linkIssue.test.ts` and `deploymentChecks.test.ts`, with injected answers                                                                         |

Two rows of the table are held by unit tests alone. No test makes the running function's SMTP transport fail, and no test runs the function against an auth service that allows sign-up or refuses the callback URL, so the release of a slot and both refusals are shown for the function's modules with injected dependencies and not for the served function.

### What this does not protect against

Each item is a property of the system as it is. None is enforced anywhere in the repository.

- **Anonymous code checks are unlimited.** `check-code`, and a link request or a code sign-in that names a code no claimed row holds, are not counted against any limit. Each costs one indexed look-up and writes nothing. The exposure is load on the database, not disclosure: a guessed code meets 60 bits. A deployment that needs a bound puts a rate limit in front of the Edge Function, at its gateway.
- **One sign-in mail per minute to any eligible address, indefinitely.** Anyone who knows an address that has an open invitation, or that belongs to a user holding a grant in the project, can make the deployment mail that address a sign-in link once every 60 seconds for as long as they keep asking. The limit bounds the rate and not the duration, and it cannot tell the owner of the address from anyone else.
- **A new link makes the unopened one before it stop working.** On the local stack, verifying the earlier of two `magiclink` tokens issued for one address answers `403` with `otp_expired`. Combined with the item above, a third party who knows the address can make a link the user has not yet opened stop working, once a minute. The user's remedy is to ask again and open the newest mail.
- **No limit uses the caller's identity.** The function reads no request header to tell callers apart, because none is known to be outside the caller's influence. On the local stack every caller reaches the function with the same forwarded address, that of the container network's gateway. Which headers a hosted gateway sets, and whether one of them identifies the caller, is unmeasured. A project-wide cap is deliberately absent: any visitor could use it to deny the answer to everyone.
- **A claim honours a promise whose creator has since lost the authority to make it.** The authority map is asked when the row is written and not again. An administrator withdraws a promise by deleting the unclaimed invitation; a claimed one has already become a grant, and is revoked as a grant.
- **`claim_invitations` has no guard on the auth service's sign-up setting.** The database sees that an address is confirmed and not how it came to be. On a hosted project whose dashboard still allows public sign-up, a visitor can obtain a confirmed account for an address they do not control and claim that address's invitations, whatever `account-access` does: its refusal to issue links stops the legitimate flow and makes the mistake visible in its log, and it does not stand between that visitor and the claim. The two dashboard switches are the control; see [Auth settings of a hosted project](/developers-guide/deployment#auth-settings-of-a-hosted-project).
- **An account created by `identity-callback` reads as having a password.** The auth service stores the hash of a generated password for a user created through the admin API, so `password_set` is true for such a user although they never chose one, and the set-password gate is not shown to them.

The residuals of the sign-in, registration and recovery flow are listed under [Known residuals](#known-residuals).

## Known residuals

Each item is a property of the system as it is, stated with what was measured on the local stack. None is closed by anything in the repository.

- **The auth service's own one-time-password endpoint tells a registered address from an unregistered one.** `POST /auth/v1/otp` with the anon key and `create_user: false` answers `200` for an address that has an account and `422` with `otp_disabled` for an address that has none; the mail hook stops the mail and does not change that answer (measured with the hook enabled). That path goes around the uniform answer and the limits of `account-access`. What it discloses is that an address has an account, not that it was invited.
- **A mailed link is verified when it is opened, so a mail scanner that follows links can spend it.** The token works once (measured: a spent token and a superseded one are both answered `403` with `otp_expired`), and the callback verifies it on the `GET` that opens the link. A scanner that opens the link before its addressee is signed in by it, and the addressee's own click then fails verification and lands on the login screen with the notice that the link could not be used. The addressee's remedy is to ask for a new link. No confirmation page stands between the link and its verification.
- **A signed-in session can set a new password without the current one.** The reset page and the set-password gate call `updateUser({ password })` on the session as it is, and `secure_password_change` is off, so whoever holds a session, including one a mailed link created, can choose the account's password. Measured: a password set with `updateUser` on a session a mailed link created is accepted, and the session serves every later load.
- **The auth service's password sign-in takes measurably different time for an unknown address, a wrong password and an account with no password.** All three are answered `400` with `invalid_credentials`, so the answer's status and body tell nothing, but the timings did not overlap. Measured on the loopback interface of one host, nine sign-ins a case, interleaved: an address with no account 5.3 ms least, 6.1 ms median, 8.0 ms greatest; an account with a password and a wrong password 62.7, 65.1 and 67.9 ms; an account with no password 11.7, 13.0 and 15.3 ms. That the difference survives a network between a caller and the service was not measured. It is reachable with the anon key, whatever the sign-in screen does.

## What the set-password gate does not cover

The set-password gate is a view of the Contestant App's protected layout, decided on the server by the user-level data's `passwordSet`. It is not a database control and not a gate of the session.

- **The data API.** A session with no password can still call the data API with its own token, as one that has not accepted the terms of use can. Row-level security and the grants decide what the token may read and write; having a password adds no authority.
- **The Admin App.** It does not ask whether the account has a password. Its protected pages, its form actions and its job endpoints admit a verified identity with the admin role, so a project-scope invitation claimed through a mailed link acts there before any password is chosen. The session was obtained by proving the address, and no authority depends on having a password.
- **Other routes of the Contestant App.** The pages outside `(protected)`, the reset page among them, are not behind the gate.

## Which entity a user is

The `(entity, <type>, <id>, editor)` row in `public.grants` is the only link from an auth user to the candidate or organization they are. The entity tables have no user column.

- `public.get_user_entities(p_project_id)` lists the entities the caller edits in one project. It returns one JSON object whose `entities` array holds one entry per candidate and per organization, with the fields a card shows, and whose `password_set` says whether the caller's own account holds a password, as `private.caller_password_set()` answers it. A user with no entity still gets the object, with an empty array. One user may edit several entities in a project, and all of them are listed.
- `public.get_entity_user_data(p_project_id, p_entity_type, p_entity_id)` returns the editable row of one of those entities. For an entity the caller does not edit, a type that does not match the id, an entity of another project and an id that does not exist it returns no row. Neither function raises an error, so neither reveals whether an entity exists.
- `public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)` returns the nominations of one of those entities, confirmed or not, as a JSON array of objects with the keys `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, `custom_data` and `parent`. `parent` is `null` or an object of `entity_type`, `entity_id`, `name` and `short_name` of the entity the nomination stands under. An entity with no nomination gets an empty array. For an entity the caller does not edit, a type other than candidate or organization, an entity of another project and an id that does not exist it returns `NULL`, which is a different answer from the empty array. It is a `SECURITY DEFINER` function, because the parent may be a row the caller's own policies refuse, and only `authenticated` may execute it.
- `public.get_nomination_parent_options(p_project_id, p_entity_type, p_entity_id, p_contests)` returns the entities one of those entities may stand under; see [Nominations an entity defines](#nominations-an-entity-defines).
- The first two find the caller's entities through `private.caller_entity_ids`, which reads the caller's `editor` grants from `public.grants` itself rather than from the token, and both then read the entity tables under the caller's own row-level security. The third and the fourth ask the same lookup as their gate and read with the definer's rights. An admin grant lists nothing: only the editor grant makes an entity the user's. An entity is listed exactly when the one-entity read returns it.
- A candidate has at most one editor: the unique index `idx_grants_one_candidate_editor` refuses a second user's editor grant on the same candidate. An organization may have several editors.

The Contestant App loads its entity through the Supabase data writer, which calls `get_user_entities`, then `get_entity_user_data` and, for the entity's nominations, `get_entity_nominations`, each with the deployment's `PUBLIC_PROJECT_ID`. A grant written after the user's token was issued is served once the token is refreshed, because row-level security reads the token; until then only a publicly visible entity is listed, and it cannot be edited. A grant that was removed stops being served at once. `identity-callback`, the Edge Function that creates a candidate, writes the editor grant itself; see [Edge Functions](/developers-guide/backend/edge-functions). The grant of an invitation is written by `claim_invitations`.

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
- **The end-of-transaction rule.** The constraint trigger `nominations_parent_required` is `DEFERRABLE INITIALLY DEFERRED`. Where the matrix answers `parent_required`, a candidate's nomination must, when the transaction ends, have a parent nomination or carry `requestedParentOrganization` in its `custom_data`. A refusal begins `Nomination parent required: `, SQLSTATE `23514`. It is deferred so that a writer may insert the candidate's row, then its party's row, and then point the first at the second.

### Writing an entity's nominations

`public.set_entity_nominations(p_entity_type, p_entity_id, p_nominations)` writes the whole set of nominations of one candidate or organization in one call: it inserts the nominations the set adds, updates the ones whose values differ, deletes the ones the set leaves out, and creates the nomination of a named party or alliance that has none at the contest. Either all of it is stored or none of it.

It is `SECURITY INVOKER`: every statement runs as the caller, so the policies, the column grants and the triggers of `public.nominations` stay the only gate, and a direct write of the same rows meets the same refusals. Only `authenticated` may execute it.

`p_nominations` is a JSON array of objects, and an empty array is a valid set:

| Key               | Value                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | A uuid: the object describes that stored nomination. Left out for a new one; a JSON null is refused.                                                                                       |
| `election_id`     | A uuid, required. With `id` it must be the stored row's.                                                                                                                                   |
| `constituency_id` | A uuid, required. With `id`, a value other than the stored one moves the nomination: the stored row is deleted and a new one inserted.                                                     |
| `election_symbol` | A string or null. Trimmed; a blank one is stored as `NULL`, and one longer than 50 characters is refused.                                                                                  |
| `parent`          | `{"kind":"none"}`, `{"kind":"entity","entity_type":…,"entity_id":…}`, `{"kind":"other","name":…}` or `{"kind":"keep"}`. A candidate names an organization and an organization an alliance. |

- `entity` places the nomination under that entity's nomination at the same contest. Where the entity has none there, one is created for it, unconfirmed, for an administrator to resolve.
- `other` links nothing and stores the typed name, trimmed and at most 100 characters, in `custom_data.requestedParentOrganization`. A nomination that carries that key cannot be confirmed.
- `keep` leaves the stored parent and the stored typed name as they are. It is admitted only with an `id` and not on a move.
- An object without an `id` must be the only object of its election.

The function writes only the nominations in its reach: those of the entity that the caller can read, at their election's current round, in an election whose type admits the entity's type. A nomination in reach that the set does not name is deleted; every other nomination of the entity is left as it is. A new nomination is written at its election's current round.

It answers `{"inserted", "updated", "deleted", "unchanged", "parents_created"}`, each a count. A move counts once under `deleted` and once under `inserted`. A nomination whose values did not change is not written, so it keeps its confirmation; every row an entity's editor does write has its confirmation turned off.

| Refusal                                                                                           | SQLSTATE | Message                                                                          |
| ------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| A malformed argument or object                                                                    | `22023`  | begins `set_entity_nominations: `, naming the object as `p_nominations[<index>]` |
| The caller does not hold `nomination.edit` on the entity                                          | `42501`  | begins `set_entity_nominations: `                                                |
| A row could not be written: nominations are locked, or the rows are no longer the caller's        | `42501`  | begins `set_entity_nominations: a nomination could not be written`               |
| A nomination that is removed or moved has nominations listed under it                             | `23503`  | the foreign key on `parent_nomination_id`                                        |
| The call would create a parent's nomination while the caller has originated ten unconfirmed ones  | `P0001`  | begins `A caller may originate at most `                                         |
| A candidate is left with neither a parent nor a typed name where the election's type requires one | `23514`  | begins `Nomination parent required: `                                            |
| An entity type the election's type refuses                                                        | `23514`  | begins `Nomination shape refused: `                                              |

Row-level security refuses an `UPDATE` and a `DELETE` without an error, by hiding the row. The function therefore counts the rows each statement affected and raises on a shortfall, so a caller is never answered that a locked or vanished row was saved. The frontend's data writer maps the `23503` and the cap's `P0001` to the named refusals `hasCandidates` and `tooManyPending`, and rejects for every other error.

The function does not hold a named parent to the options the next function lists: it checks the parent's type and that the id is a uuid. It does not read `access.answersLocked` either; only the nominations lock is enforced here.

### The parent options

`public.get_nomination_parent_options(p_project_id, p_entity_type, p_entity_id, p_contests)` returns the entities a candidate or an organization the caller edits may stand under: for a candidate every confirmed organization of the project, for an organization every alliance of the project, confirmed or not. Each element holds exactly `id`, `entity_type`, `name`, `short_name`, `color`, `image` and `nominated`, the last being those of the asked contests at which the option holds a nomination at the election's current round. `p_contests` is a JSON array of `{election_id, constituency_id}` objects.

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

The Contestant App records and reads the acceptance through the Supabase data writer; see [Registration](/developers-guide/contestant-app/registration#terms-of-use).

## Storage

`config.toml` defines two buckets: `public-assets`, which is public, and `private-assets`, which is not. An entity's objects are stored under `{project_id}/{entity_type}/{entity_id}/`. The policies on `storage.objects` delegate the authority decision to `storage_path_can()`, which asks `user_can` about the project or entity the path names. Anonymous reads from `public-assets` follow `storage_path_is_public()`, the same visibility rule as the tables.

## The service-role key

The service-role key bypasses RLS, so it never reaches the browser:

- It has no `PUBLIC_` variable. Nothing under `apps/frontend/src` reads it.
- The Edge Functions get it as `SUPABASE_SERVICE_ROLE_KEY` from the Edge runtime, which sets it automatically. `send-email` uses it only after checking the caller with `user_can`, and `identity-callback` only after verifying the identity provider's token. `account-access` is anonymous: it uses the key to ask the database functions that decide its answers, and it creates a user and mints a sign-in link only for an address those functions return.
- In development, `SUPABASE_SERVICE_ROLE_KEY` in the repo-root `.env` is read by local tooling only: `yarn db:seed` and the E2E test harness.
- The storage cleanup triggers read the Storage API URL and key from the `storage_config` table, which only the service role and `postgres` can read.

Never weaken a policy or a grant to make a frontend call work. Add the permission to the right grant, or move the operation into an Edge Function that checks the caller with `user_can` first.
