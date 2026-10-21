# Login and password reset

Candidates sign in to Supabase Auth with an email address and a password. The session is kept in cookies that the SvelteKit server sets, so the server-side loaders of the Contestant App see the same session as the browser (see [Sessions](/developers-guide/backend/authentication#sessions)).

## Login

The login screen, `/contestant/login`, holds no form: "Sign in with email" leads to the sign-in screen, `/contestant/login/email`, and "Register" to the registration screen (see [Registration](/developers-guide/contestant-app/registration)). The sign-in screen posts its form to its own server action, [`login/email/+page.server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/login/email/+page.server.ts). The action calls the shared `passwordLogin` helper with the request's own Supabase client, so that the session cookies are set on this response:

1. It signs in with `signInWithPassword`. Wrong credentials give `400`, and nothing else runs.
2. It claims the user's invitations: the data writer's `claimInvitations()`, on the request's own client, calls `claim_invitations` as the user just signed in.
3. When the claim wrote a grant, it refreshes the session with `refreshSession()`, so that the access token lists the grant.
4. It reads the session back. A missing session gives `500`.
5. It checks the grants in that session's access token against `CONTESTANT_GRANTS`, which admits an `editor` grant on a `candidate` or an `organization` entity. Any other user, the editor of a faction or an alliance included, is signed out again and gets `403`. This is an entry gate only: whether the project serves the editor's entity type is decided after sign-in, and the database's policies decide what the user may read or write.
6. It redirects to the `redirectTo` path from the form, if that is a safe relative app path, or to the Contestant App home page.

The screen shows one sentence for a refusal, chosen by its status alone: `400`, which a wrong address, a wrong password and an account with no password all answer, shares one sentence; `403` says the user has nothing to edit; anything else is the unknown error. A press with a field empty posts nothing, and the empty field says what to enter. The form works before the page's script has loaded; a refusal posted without the script shows the same sentence, with the address field empty.

The screen's link button mails a sign-in link to the typed address, for a user who has no password yet or does not remember it. It is rendered when the `email` or the `identity_provider` registration mode is allowed for a served entity type (`signInLinkOffered`), whatever the answers lock says, and leads to the "email sent" screen as the registration screen does. A user who signs in on the screen leaves the entry flow empty.

Steps 2 to 5 are the shared `admitSession` helper ([`$lib/auth/sessionAdmission.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/auth/sessionAdmission.ts)). The claim comes before the gate because the gate reads the token: an invited person who signs in with a password for the first time holds no grant until the claim writes it and the refresh puts it into the token. A claim that fails is logged, no refresh is made, and the gate reads the token as the sign-in issued it. The Admin App's login action runs the same steps and gates on `ADMIN_GRANTS`. See [The order every entry point follows](/developers-guide/contestant-app/pre-registration-and-invitation#the-order-every-entry-point-follows).

`invitationCodeLogin`, in the same directory, is the same sequence for a sign-in with an invitation code and a password: it calls the data writer's `signInWithInvitationCode` in place of step 1 and then `admitSession`. The code sign-in screen's server action, [`register/sign-in/+page.server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts), calls it after asking whether the code mode is offered.

The pages under `/contestant` that need a candidate live in the `(protected)` route group. Its server loader redirects to the login page when there is no session, and then reads the user-level data and the list of the entities the user edits. The pages that show an entity live below it, under the two route params `[entityType]/[entityId]`, so the URL names the entity: `/contestant/candidate/<id>/profile`. Their own server loader checks that entity against the list and then reads it. A URL that names an entity the user does not edit is redirected to the app root, `/contestant`. The root redirects a user who edits exactly one entity to that entity's home, lets a user who edits several choose one, and shows a signed-in user with nothing to edit a screen that says so, with the email address they are signed in with, the support block and a logout button, instead of signing them out. A protected path that names no entity, such as `/contestant/profile`, is redirected to the same page under the user's one entity, and to the root otherwise. When the data cannot be loaded, the loader that found it signs the user out and redirects to the login page with the `errorMessage` search parameter `loginFailed`, which the login page shows. An entity with no nomination is not signed out: it reaches its home, and its profile, questions and preview stay closed until it has one (see [The home, the tasks and the nominations view](/developers-guide/contestant-app/home-and-tasks)). No loader looks at the kind of grant the user signed in with: the list of the entities the user edits decides.

## Password reset

A forgotten password is reset through a recovery link that the [`account-access`](/developers-guide/backend/edge-functions#account-access) Edge Function mails. The frontend sets the new password on the session the link creates.

1. **Request.** On `/contestant/forgot-password` the user types their email address. The page asks for a recovery link through the contestant context's `sendEntryLink`, which calls the data writer's `requestPasswordRecovery`: the `request-recovery` operation, with the address and the reader's locale. The function answers `{ "accepted": true }` before any work, so the page shows the same "email sent" screen to every visitor, whether or not the address has an account. The page is open to a signed-in user too.
2. **Mail.** After its answer the function asks the database which mail the address earns. An account that holds a grant in the project is sent the recovery mail; an address that has an open invitation and no account yet is sent the sign-in mail instead, because it has no password to recover; anyone else is sent nothing. The recovery request and the sign-in request share one mail slot per address (see [Email](/developers-guide/backend/email#the-recovery-link)).
3. **Callback.** The recovery link is `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=recovery`. The callback verifies it, claims the user's invitations and redirects to `/contestant/password-reset`.
4. **New password.** The reset page's server load decides by the session alone: a visitor with no session is redirected to the login screen before any of the page is rendered, and every signed-in user is shown the page, however they arrived. It returns the verified user's address, which the page shows and hands to the password form. Saving calls the contestant context's `setPassword` and leads to the app root with the loads rerun. The page asks for no current password.

A link's `type` is a landing hint and nothing more. The auth service accepts a sign-in token presented as `recovery`, so whoever holds a link can change the type it names; the callback lands by the type, and the reset page therefore does not read "arrived with `type=recovery`" as "asked for a recovery".

The local auth server redirects only to `site_url` and the URLs in `additional_redirect_urls`, both in the `[auth]` section of [`config.toml`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/config.toml). The list admits the callback path with and without one locale segment in front of it. A hosted project needs the same entries in its Auth URL configuration.

A signed-in candidate changes their password on the settings page, which also calls `setPassword`. [Password validation](/developers-guide/contestant-app/password-validation) describes the checks the set-password gate, the reset page and the settings page run.

## The auth callback

Every mailed link returns to the server route [`/api/auth/callback`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/api/auth/callback/+server.ts): the recovery link, and the sign-in link of an invitation or of a returning user. The route runs four steps in order: it verifies the token with `verifyOtp`, claims the user's invitations with the data writer's `claimInvitations()`, refreshes the session when the claim wrote a grant, and only then chooses where the user lands, by the link's `type`:

| `type`                      | Lands on                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `recovery`                  | the password reset page                                                                                            |
| `magiclink`                 | the `next` path if it is a safe relative app path, or the Contestant App root; the login page after a failed claim |
| `invite`, `signup`, `email` | the login page with `errorMessage=authError`; the token is not verified                                            |
| any other type              | the Contestant App root                                                                                            |

The sign-in link is of the type `magiclink` for a first-time and for a returning user alike, and the route does not tell the two apart: a user with no password meets the set-password gate on the first protected page (see [The set-password gate](/developers-guide/contestant-app/registration#the-set-password-gate)). When the claim fails on the `magiclink` arm, the route signs the session out and redirects to the login page with `errorMessage=authError`; on the other arms a failed claim is logged and the landing goes ahead. Nothing issues a link of the types `invite`, `signup` or `email`, and verifying one for an invited account would store a password nobody chose, so the route refuses them before verifying.

The route applies no grant gate. A user who lands on the Contestant App root with nothing to edit there, such as the holder of a project grant only, sees the screen that says so.

## Logout

The logout button calls the candidate context's `logout`, which runs the Supabase data writer's `_logout`:

1. In the browser, it posts to the server route `/api/auth/logout`, which signs out on the server with `signOut({ scope: 'local' })` and so clears the session cookies on its response.
2. It then signs out the browser's own client the same way.

The candidate context then goes to the login page and clears the candidate's data from memory.
