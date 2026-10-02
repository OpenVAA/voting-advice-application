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

Links in auth emails (password recovery, invitation, email confirmation) come back to the `/api/candidate/auth/callback` route, the callback for the PKCE exchange. The route passes the link's `token_hash` to `verifyOtp`, which creates the session on the server and stores it in cookies, and then redirects by link type: a recovery link goes to the password reset page, an invitation to the set-password page. In `config.toml`, `site_url` and `additional_redirect_urls` list where the local auth server may redirect to.

`hooks.server.ts` also gates the Candidate App and the Admin App on the session alone: a signed-in user is sent away from the login page, and a user without a session away from the `(protected)` routes. Whether a signed-in user may act is decided by the grants, as described below.

## Grants

Each row of `public.grants` gives one user one role on one target:

| Column        | Meaning                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `user_id`     | the auth user (`auth.users`); the user's grants are deleted with the user                                  |
| `scope`       | `global`, `account`, `project` or `entity`                                                                 |
| `target_type` | the entity type (`candidate`, `organization`, `faction` or `alliance`) for an entity grant, otherwise null |
| `target_id`   | the account, project or entity; null for a global grant                                                    |
| `role`        | `admin` or `editor`                                                                                        |

A grant is deleted when its target is deleted. The `anon` and `authenticated` roles have no access to the table at all: grants are written with the service role: by `seed.sql`, by the Edge Functions and, in the E2E suite, by the test harness.

`grant_role_permissions(scope, role, target_type)` is the role and permission matrix, and the only place it is written down. The permissions are the members of the `public.grant_permission` enum, such as `project.edit_entities` or `entity.edit_answers`.

| Grant                                               | Permissions                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| global `admin`                                      | every permission                                                                                                               |
| account `admin`                                     | every permission, within the account                                                                                           |
| project `admin`                                     | every permission except the three `account.*` ones, within the project                                                         |
| project `editor`                                    | as project `admin`, except `project.manage_editors`, `project.edit_project_settings` and `nomination.confirm`                  |
| entity `editor` of an organization                  | `project.read_structure`, editing and reading its own answers, `entity.invite_children`, editing and reading its nominations   |
| entity `editor` of a candidate, faction or alliance | `project.read_structure`, editing and reading its own answers, editing and reading its nominations, `nomination.create_parent` |

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

The RLS policies delegate their authority decisions to `user_can`; the one exception is reading an account, which asks `user_has_account_grant`. The storage policies ask it through `storage_path_can()`, and the Edge Functions over RPC with the caller's own token (see [Edge Functions](/developers-guide/backend/edge-functions)).

## Which entity a user is

The `(entity, <type>, <id>, editor)` row in `public.grants` is the only link from an auth user to the candidate or organization they are. The entity tables have no user column.

- `public.get_candidate_user_data(p_project_id, p_entity_type)` returns the caller's own entity row in one project. It finds the entity through `private.caller_entity_ids`, which reads the caller's `editor` grants of that entity type from `public.grants` itself rather than from the token. An admin grant resolves to no row: only the editor grant makes the user that entity.
- If the caller holds editor grants on more than one entity of the type in the project, the function raises an error with the hint `ERR_ENTITY_IDENTITY_AMBIGUOUS` instead of picking one.
- A candidate has at most one editor: the unique index `idx_grants_one_candidate_editor` refuses a second user's editor grant on the same candidate. An organization may have several editors.

The Candidate App loads its candidate through the Supabase data writer, which calls `get_candidate_user_data` with the deployment's `PUBLIC_PROJECT_ID`. The two Edge Functions that create candidates write the editor grant themselves; see [Edge Functions](/developers-guide/backend/edge-functions).

## Row-level security and column grants

RLS is enabled on every table in the `public` schema, with separate policies for each operation. The full set is in [`302-rls.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/302-rls.sql). In outline:

- **Anonymous readers** see an entity only when its project is open for voters (`project_open_for_voters`), the entity is `confirmed`, and it has a confirmed nomination in that project. A candidate must also have accepted the terms of use.
- **An entity editor** may update its own row: for example, `entity_update_own_candidates` asks `user_can('entity', id, 'entity.edit_answers', 'candidate')`.
- **Project admins and editors** insert, update and delete entities in their project with `project.edit_entities`.

Column grants in [`303-column-grants.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/303-column-grants.sql) narrow what the `authenticated` role may update, because a policy cannot admit a row while withholding a column. For candidates the updatable columns are `short_name`, `info`, `color`, `image`, `subtype`, `custom_data`, `first_name`, `last_name`, `answers`, `terms_of_use_accepted` and `confirmed`. Structural columns such as `project_id`, `external_id` and `sort_order` are not updatable by any signed-in user. Rules that depend on the row's state, such as who may change `confirmed`, are enforced by the trigger function `enforce_entity_immutability()`.

## Storage

`config.toml` defines two buckets: `public-assets`, which is public, and `private-assets`, which is not. An entity's objects are stored under `{project_id}/{entity_type}/{entity_id}/`. The policies on `storage.objects` delegate the authority decision to `storage_path_can()`, which asks `user_can` about the project or entity the path names. Anonymous reads from `public-assets` follow `storage_path_is_public()`, the same visibility rule as the tables.

## The service-role key

The service-role key bypasses RLS, so it never reaches the browser:

- It has no `PUBLIC_` variable. Nothing under `apps/frontend/src` reads it.
- The Edge Functions get it as `SUPABASE_SERVICE_ROLE_KEY` from the Edge runtime, which sets it automatically. `invite-candidate` and `send-email` use it only after checking the caller with `user_can`, and `identity-callback` only after verifying the identity provider's token.
- In development, `SUPABASE_SERVICE_ROLE_KEY` in the repo-root `.env` is read by local tooling only: `yarn db:seed` and the E2E test harness.
- The storage cleanup triggers read the Storage API URL and key from the `storage_config` table, which only the service role and `postgres` can read.

Never weaken a policy or a grant to make a frontend call work. Add the permission to the right grant, or move the operation into an Edge Function that checks the caller with `user_can` first.
