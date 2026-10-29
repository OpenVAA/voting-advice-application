# Invitation

A Contestant App account is a Supabase Auth user that holds an `(entity, <type>, <id>, editor)` grant on a candidate or a party. The Contestant App finds the user's entities through those grants and nothing else (see [Which entity a user is](/developers-guide/backend/authentication#which-entity-a-user-is)).

A user comes to hold such a grant in one of two ways:

- **Invitation.** An administrator creates an invitation, a row that promises a grant. The invited person asks for a sign-in link, signs in and claims the invitation, and the claim writes the grant. This page describes the invitation; [Registration](/developers-guide/contestant-app/registration) describes the screens of the `email` and `code` modes that redeem it.
- **Registration with a bank identity.** The user identifies with bank authentication, and the `identity-callback` Edge Function creates the account, the candidate or the party it registers, and the grant. No invitation is involved. See [Bank authentication (OIDC)](/developers-guide/contestant-app/bank-authentication).

For local development, `seed.sql` already creates a candidate user with its grant; see [Seed data](/developers-guide/development/seed-data#the-baseline-seedsql).

## The invitation model

Creating an invitation creates no account and writes no grant. Both come into being only when the invited person has asked for a sign-in link, opened it and claimed the invitation. Until then the invitation is one row, and deleting the row withdraws it.

The model has four parts, described in this order below: the row and who may write it, the link request, the claim, and the order in which every sign-in path runs them. [Security of the invitation model](/developers-guide/backend/authentication#security-of-the-invitation-model) lists the controls and what they do not cover.

### The invitation row

`public.invitations`, in [`305-invitations.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/305-invitations.sql), holds one row per invitation. A row belongs to one project and promises one grant, stated in the four columns of `public.grants`:

| Column                                      | Meaning                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `project_id`                                | the project the invitation belongs to                              |
| `scope`, `target_type`, `target_id`, `role` | the promised grant, as `public.grants` states it                   |
| `email`                                     | the invited address, trimmed and lower-cased; null on a code row   |
| `expires_at`                                | when the invitation expires; null means it does not                |
| `claimed_by`, `claimed_at`                  | who claimed it and when; a row is claimed when `claimed_at` is set |

A row is bound to exactly one of two things: an email address, or the hash of a code. The table's constraints hold the rest:

- An invitation promises an entity `editor` grant, a project `editor` grant or a project `admin` grant, and nothing else.
- A duplicate invitation is refused and the first is left unchanged: a second invitation in the project carrying the same email for the same grant target `(scope, target type, target id)`, whatever role it promises, or carrying a code the project already holds, whatever its target.
- A row cannot be updated. An invitation is changed by deleting an unclaimed one and creating another, and a claimed row cannot be deleted through the API.
- An invitation is deleted with its project, and an entity's invitations with the entity.

### The code

The server generates every code; an API caller has no privilege to supply one or its hash.

- A code is twelve symbols of Crockford's base-32 alphabet, `0123456789ABCDEFGHJKMNPQRSTVWXYZ`, which is 60 bits. It is shown in three groups, as `XXXX-XXXX-XXXX`.
- It is returned once, in the answer of the `create_invitations` call that created the row.
- Only its SHA-256 hash is stored, and no API role can read the hash. A lost code is replaced by deleting the unclaimed invitation and creating another.
- On input the look-alikes are folded: letter case, spaces and hyphens are ignored, `O` is read as `0`, and `I` and `L` are read as `1`. Every comparison of a code goes through that one normalisation.

### Who may promise which grant

The row-level security policies of the table are the authority map. Each arm asks `user_can`:

| Promised grant   | Permission the creator needs                     | Condition on the row                         |
| ---------------- | ------------------------------------------------ | -------------------------------------------- |
| entity `editor`  | `project.edit_entities` on the project           | the target is an entity of the row's project |
| project `editor` | `project.manage_editors` on the project          | the target is the row's project              |
| project `admin`  | `account.manage_admins` on the project's account | the target is the row's project              |

The rule is the `INSERT` policy of the table, `admin_insert_invitations`. A direct insert into the table therefore meets the same refusals as `create_invitations`, which inserts as its caller and holds no authority rule of its own. Any other shape matches no arm of the policy and is refused. The service role bypasses the policies, and the table's `CHECK` constraints refuse the same shapes for it.

A creator cannot promise the level they hold themselves: a project editor cannot promise a project editor's or a project admin's grant, and a project admin cannot promise a project admin's. [Grants](/developers-guide/backend/authentication#grants) lists which role holds which permission.

Reading asks the same map, with `project.read_entities` for an entity grant, so a caller reads the invitations they could create. Entity editors and anonymous callers read none. Deleting asks the creating map of an unclaimed row.

The map is asked when the row is written and not again. A claim honours a row that exists, whether or not its creator still holds the permission, and an administrator withdraws a promise by deleting the unclaimed row.

### Creating invitations

`public.create_invitations(p_project_id, p_invitations, p_confirm_entity)`, in [`506-invitation-rpcs.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/506-invitation-rpcs.sql), creates a batch of invitations in one project. `p_invitations` is a JSON array with one object per invitation:

| Field                        | Meaning                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `scope`                      | `entity`, the default, or `project`                                                                                        |
| `role`                       | `editor`, the default, or `admin`                                                                                          |
| `target_type`                | the entity type; required on an entity-scope item                                                                          |
| `target_id` or `external_id` | the entity, named by exactly one of the two; an `external_id` is looked up in the project                                  |
| `email`                      | the invited address; an item without one gets a generated code                                                             |
| `expires_at`                 | optional                                                                                                                   |
| `nominations`                | optional, and only on an entity-scope item for a candidate or an organization: the invited entity's nominations, see below |

The function runs as its caller, so the policies above decide what the caller may promise, exactly as they do for a direct insert. It returns one object per item, in order: the invitation's `id`, its promise, `email`, `expires_at`, `code`, which is the generated code or null on an email item, and `entity_confirmed`, the invited entity's confirmation after the item as the caller reads it, null on a project-scope item. An item that states `nominations` also returns `nominations`, with four counts: `inserted`, `updated`, `unchanged` and `parents_created`. The whole batch is one transaction. A refused item, a duplicate or an unknown `external_id` raises an error, and no row of the batch is written.

Creating an invitation sends nothing, and creates no entity and no user. What else it writes, the call states: whether the invited entities are confirmed, and which nominations they hold.

#### The confirmation

`p_confirm_entity` is required and has no default: a call without it finds no function, and `null` is refused. With `true` the call confirms each named entity of the batch (`confirmed = true`), in the same transaction and as the caller. A candidate has a name when its first and last name are both non-blank, the other entity types when their `name` has text; an entity without a name stays unconfirmed. With `false` the call confirms no one. No call unconfirms an entity, no item overrides the call's value, a project-scope item confirms nothing, and deleting the invitation later leaves the entity confirmed. Confirming is the function's act: a direct insert into the table confirms nothing.

`SupabaseAdminClient.createInvitations` of `@openvaa/dev-seed` passes `true` unless told otherwise; `createInvitations(items, { confirmEntity: false })` confirms no one.

A confirmed entity with a confirmed nomination is visible to voters once the project is open, whether or not anyone has signed in for it, so an invitation changes what voters see only through what its call states. Confirmation also freezes the entity's name columns and its `short_name` for its own editor, so the person who signs in for an invited entity finds those fields read-only from the first sign-in, and only a holder of `entity.edit_immutable` can change them; see [Row-level security and column grants](/developers-guide/backend/authentication#row-level-security-and-column-grants).

#### The nominations

An entity-scope item for a candidate or an organization may state the invited entity's nominations under `nominations`, a JSON array of at most 1000 objects, one per nomination. The key is refused on a project-scope item and on an item for a faction or an alliance, and a batch may state one entity's nominations on one item only. An object takes the keys of [`set_entity_nominations`](/developers-guide/backend/authentication#writing-an-entitys-nominations) and `confirmed`, `id` and `election_round`:

| Key                                                                                    | Meaning                                                                                                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `election_id`                                                                          | required: an election of the project the caller can read                                                                                                      |
| `constituency_id`                                                                      | required                                                                                                                                                      |
| `election_symbol`                                                                      | a string or null; trimmed, a blank one stored as null, at most 50 characters                                                                                  |
| `parent`                                                                               | `{"kind":"none"}`, `{"kind":"entity","entity_type":…,"entity_id":…}`, `{"kind":"other","name":…}` or `{"kind":"keep"}`; `keep` only on an object with an `id` |
| `confirmed`                                                                            | `true` or `false`, required on every object                                                                                                                   |
| `id`                                                                                   | optional: a nomination of the invited entity, which the object updates; without it the object creates a nomination                                            |
| `election_round`                                                                       | optional; a new nomination without one is written at its election's current round                                                                             |
| `custom_data`                                                                          | optional, a JSON object written over the stored one key by key; it may not carry `requestedParentOrganization`                                                |
| `name`, `short_name`, `info`, `color`, `image`, `sort_order`, `subtype`, `external_id` | optional, the nomination's other writable columns                                                                                                             |

Every id is a uuid: an object names its election, its constituency, its parent and its nomination by uuid, never by external id. On an object with an `id`, the election, the constituency and a stated round must be the stored row's, since an invitation moves no nomination, and a column the object does not state keeps its stored value.

The nominations are created or updated, never deleted, in the call's transaction and as the caller, after the invitation and the entity's confirmation. They pass the same checks as a write through `set_entity_nominations`, which asks the same private functions for the array's bound, the shape of each object and the parent step, and the policies, the column grants and the triggers of `public.nominations` decide each write. A caller without the authority to write a nomination is refused, and no row of the batch is written. Each nomination's confirmation is read back, and one that could not be written as stated raises SQLSTATE `42501`.

For a parent of kind `entity`, the parent's nomination at the contest is found, or created when the parent has none; a parent that is no entity of the project is refused. A parent's nomination the call creates is unconfirmed, whatever the child's `confirmed` says, and an administrator confirms it as a separate act. A confirmed nomination under an unconfirmed parent nomination is therefore a state an administrator can produce.

### The registration modes

An open invitation for a candidate or an organization is honoured only under the registration mode its binding names, for its target's entity type, as the project's `contestantApp.registrationModes` matrix allows it: a row bound to an address is an `email` invitation and a row that holds a code is a `code` invitation. The database enforces this, in `private.invitation_mode_allowed` ([`506-invitation-rpcs.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/506-invitation-rpcs.sql)), which reads the project's settings row through `private.registration_mode_allowed`. The four functions that read an open invitation ask it, and each treats a row it refuses as absent:

- `invitation_code_status` answers `unknown` for the code;
- `invitation_link_request` and `recovery_link_request` return no address for it;
- `claim_invitations` neither claims nor skips it, and it stays open.

Which rows are judged:

- **A project-scope promise, and a promise for a faction or an alliance**, is not judged: the matrix has no row for them.
- **A claimed row** is not judged: a finished registration stays as it is, whatever the matrix says later.
- **`create_invitations` does not ask**, so an invitation can be created while its mode is off and is honoured once the mode is on.
- **A project that stores no matrix** honours no candidate or organization invitation: a project with no settings row, or whose row declares no registration modes, allows nothing.

The Contestant App's screens list the modes through `listedRegistrationModes`, which reads the same matrix (see [Registration](/developers-guide/contestant-app/registration#what-lists-a-registration-mode)); the parity test `registrationModeMatrixParity.test.ts` of `@openvaa/dev-seed` holds the client's rule to the database's truth table. The `code-sign-in` operation, for the holder of a claimed code, does not ask the matrix: the code sign-in screen's form action asks whether the code mode is offered before it calls it.

### Asking for a sign-in link

The invited person asks the [`account-access`](/developers-guide/backend/edge-functions#account-access) Edge Function for a sign-in link: its `request-link` operation, with their email address, an invitation code, or both.

The function answers `{ "accepted": true }` in every case, so its answer does not say whether an address is invited. A mail goes out only when the database function `invitation_link_request` returns an address for the request, and it returns one in these cases only:

| The request carries      | An address is returned when                                                                                                                                                                                               | The address                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| an address and no code   | the project holds an open invitation for the address whose registration mode is allowed, or a user with that confirmed address holds a project-scope grant on the project or an entity grant on one of its entities       | the address as typed, trimmed and lower-cased  |
| an open code, an address | its registration mode is allowed, unless the code was bound to an address less than 60 seconds ago, or the address is another than the one the code is bound to and the code was already bound to five addresses that day | the typed address, which is bound to the code  |
| a used code              | the user who claimed it still exists                                                                                                                                                                                      | the claimant's own address, whatever was typed |
| anything else            | never                                                                                                                                                                                                                     |                                                |

In every case the address must also have its mail slots free: one mail per address per project in 60 seconds, and twenty per address a day in all projects together (see [Limits](#limits)). With an open code, the code is bound to the typed address and its 60-second wait starts before those slots are asked, so whether the typed address already has an invitation or a grant changes nothing the code's holder can see. The second arm of the first row is what lets a user who already holds a grant sign in the same way. A global or an account grant alone does not make an address eligible. Binding an address to an open code means the code's promise is fulfilled only for the user who proves control of that address.

For an address that has no account the function creates the user, without a password, before it issues the link.

### The mail

The function mails a fixed text in one of seven locales: `da`, `en`, `et`, `fi`, `fr`, `lb` and `sv`. The request's `locale` chooses among them, and any other value, or none, gives `en`. The caller supplies no text, subject or sender.

The link is `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=magiclink`. Its origin is the function's `SITE_URL` and nothing from the request. The type is `magiclink` for a first-time and for a returning user alike. The token works once, and issuing a later link for the same address makes an earlier unopened one stop working. [Email](/developers-guide/backend/email#the-sign-in-link) describes the message.

### Claiming

`public.claim_invitations(p_project_id)` turns the caller's open invitations in the project into grants. It is called with the signed-in user's own session:

- It trusts one thing: the caller's own confirmed address, read from the caller's row of `auth.users`. It takes no address, user id or invitation id, so it cannot be pointed at another person's invitation.
- An account whose `app_metadata` names an `identity_provider` claims nothing, whatever address it has confirmed: the identity provider created it, and the address it gave later does not decide who the person is.
- It claims the unclaimed, unexpired rows whose `email` is that address, and the code rows that address is bound to. For each it writes one row of `public.grants`, copying the invitation's four columns, and marks the invitation claimed.
- It returns `{ "claimed": […], "skipped": […], "password_set": <boolean> }`. Each element holds `scope`, `target_type`, `target_id` and `role`. A skipped element also holds a `reason`: `candidate_has_editor` when another user already edits that candidate, or `target_not_in_project` when the entity is not an entity of the project. A skipped invitation stays open, and is returned in `skipped` again by every later call.
- `password_set` says whether the caller's account holds a password, and is present whatever was claimed. A user created by a sign-in link has none.
- A second call claims nothing.

The claim relies on the auth service refusing public sign-up and confirming addresses by mail only, because the database sees that an address is confirmed and not how it came to be; see [Who can create an account](/developers-guide/backend/authentication#who-can-create-an-account).

### The order every entry point follows

Every path that can sign an invited person in runs the same four steps in the same order: **session, claim, refresh, then gates.**

1. **Session.** The user is signed in: a mailed token is verified, a password is accepted, or the tokens of a code sign-in are set on the request's client.
2. **Claim.** `claimInvitations()` of the Supabase data writer calls `claim_invitations` on the request's own client, as the user just signed in.
3. **Refresh.** When the claim wrote a grant (`claimed` is not empty), the session is refreshed with `refreshSession()`.
4. **Gates.** Only then is the access token read for an entry gate, or a landing page chosen.

The order matters because a grant reaches the access token only when a token is issued, and both the entry gates and row-level security read the token. A token issued before the claim does not list the claimed grant: the login gate refuses a first-time invitee whose token carried no grant, and an entity the grant opens is neither listed nor writable (see [Which entity a user is](/developers-guide/backend/authentication#which-entity-a-user-is)). Nothing reads or writes entity data between the claim and the refresh.

| Entry point                              | Step 1                                       | Steps 2 to 4                                                         |
| ---------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| the auth callback, `/api/auth/callback`  | `verifyOtp` on the mailed `token_hash`       | claims, refreshes, then lands the user by link type                  |
| the Contestant App's sign-in action      | `signInWithPassword`                         | `admitSession`: claims, refreshes, then gates on `CONTESTANT_GRANTS` |
| the Admin App's login action             | `signInWithPassword`                         | `admitSession`: claims, refreshes, then gates on `ADMIN_GRANTS`      |
| the Contestant App's code sign-in action | the data writer's `signInWithInvitationCode` | `admitSession` through `invitationCodeLogin`, on `CONTESTANT_GRANTS` |

`admitSession`, and `claimAndRefresh` for an entry point that lands the user without a grant gate, are in [`$lib/auth/sessionAdmission.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/auth/sessionAdmission.ts); the callback calls `claimAndRefresh`. [Login and password reset](/developers-guide/contestant-app/login-and-password-reset) describes the login action and where the callback lands each link type.

A claim that fails is logged. In a login the gate then reads the token as the sign-in issued it, so a user who already held a grant is admitted and a user with none is refused. In the callback's `magiclink` arm, where the landing depends on the claim's answer, the session is dropped and the user returns to the login page with the auth error. A refresh that fails after a claim is logged as well: the grant is written, and the token lists it the next time the session is reissued.

### A used code

A claimed code stays on record. `check-code` answers one of three words:

- `valid`: the code names an unclaimed, unexpired row of the project. A code whose row was skipped at the claim stays `valid`.
- `used`: the code names a claimed row. This stays so after the claimant is deleted.
- `unknown`: anything else, which includes an expired unclaimed code, an open code whose registration mode the project does not allow, and the code of another project.

A used code grants nothing a second time. A link request that presents it is answered like any other, and a mail goes to the claimant's own address and to no other; an address typed with it is ignored. The claimant's address is never returned to the caller.

The `code-sign-in` operation signs in the user who claimed a code with that code and their password. The function looks up the claimant's address, asks the auth service for a password sign-in inside the function, and returns the session's two tokens. The data writer's `signInWithInvitationCode` sets them on the request's own client with `auth.setSession`, so the session cookies land on the response of the server action that called it. The operation has one failure answer for an unknown code, a wrong password, a claimant who has no password and a spent look-up budget.

### Limits

| Limit                                                    | Keyed on                                                                 | Enforced by                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| one sign-in or recovery mail per 60 seconds              | the project and the SHA-256 of the address a mail would go to            | `invitation_link_request`, `recovery_link_request` |
| twenty sign-in or recovery mails a day                   | the SHA-256 of the address a mail would go to, in every project together | `invitation_link_request`, `recovery_link_request` |
| one binding of an address to an open code per 60 seconds | the code's row                                                           | `invitation_link_request`                          |
| five bindings of an open code to another address a day   | the code's row                                                           | `invitation_link_request`                          |
| ten claimant look-ups per fifteen minutes                | the project and the hash of a used code; code sign-ins alone take it     | `invitation_code_claimant_email`                   |

No limit is keyed on the caller, and no key is derived from a request header. A slot is taken only for an address a mail would go to, and the addresses an open code can be bound to are bounded by the code's own daily count, so a caller cannot fill the table with keys of its own making. When a slot was taken and no mail was handed to the SMTP server, the function gives the minute slot and one take of the day's back with `invitation_link_release`, so a failed send does not lock the address out. Deleting an invitation deletes the key of its code, its binding count and the minute keys of the addresses its row holds; an address's day key counts its mails in every project and is not deleted with any one row.

The keys are rows of `private.invitation_throttle`, which no API role can read or write. [What this does not protect against](/developers-guide/backend/authentication#what-this-does-not-protect-against) states what the limits leave open.

### What this does not do

- **Registration with a bank identity claims no invitation.** `identity-callback` creates its own account and its own entity, and `claim_invitations` claims nothing for an account the identity provider created. A person an administrator invited who registers with a bank identity instead gets a second entity that is not linked to the invited one, and an administrator resolves the duplicate by hand.
- **Creating an invitation announces nothing.** `create_invitations` sends no mail. The invited person learns of the invitation, or of the code, from the administrator, and asks for the sign-in link themselves.

### Tests

The pgTAP file [`39-invitations.test.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/tests/database/39-invitations.test.sql) holds the model in the database, one section per rule, and [`47-invitation-nominations.test.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/tests/database/47-invitation-nominations.test.sql) the confirmation and the nominations a call states. [`45-registration-mode-matrix.test.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/tests/database/45-registration-mode-matrix.test.sql) holds the matrix rule's truth table. On the running stack, the E2E project `invitation-contract` ([`invitation-contract.spec.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/tests/specs/contestant/invitation-contract.spec.ts)) creates invitations, asks for links, verifies the mailed tokens and claims; `invitation-landing` opens a mailed link in a browser; `contestant-email-registration` and `contestant-code-registration` register through the selector by email and by code; `contestant-password-recovery` walks the recovery link; and `contestant-journey` registers its candidate through an invitation.

A candidate or a party with no nomination can sign in and stays signed in. It reaches its home, which shows "Define your nomination" as the first task, and it cannot open its profile, its questions or its preview until it has a nomination (see [The home, the tasks and the nominations view](/developers-guide/contestant-app/home-and-tasks)). From there the user defines the entity's nominations in the nomination editor, while nominations can be edited and an election admits the entity's type (see [Defining nominations](/developers-guide/contestant-app/defining-nominations)). An administrator can also add nominations like any other data, for example with [`bulk_import`](/developers-guide/backend/data-import-and-deletion#bulk_import).

## Registration with a bank identity

When the project's `contestantApp.registrationModes` allows `identity_provider` for a served entity type, the registration screen lists the identity provider. The user chooses the type to register, identifies with a bank identity, and the server route `/api/oidc/callback` asks the `identity-callback` Edge Function to find or create the account and the entity, with its grant, before it signs the user in. The user then gives the address they will sign in with, which becomes the account's when the link mailed to it is opened. [Bank authentication (OIDC)](/developers-guide/contestant-app/bank-authentication) describes each step and its configuration.
