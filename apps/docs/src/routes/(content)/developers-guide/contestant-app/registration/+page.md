# Registration

There are three ways to register in the Contestant App, and the registration screen, `/contestant/register`, is the one tree they all start from. Each is a registration mode the project allows per entity type:

- **`email`.** The user proves an email address that an invitation names, signs in by the link mailed to it and chooses a password. The account and its grant come from the invitation: an administrator creates it, and the claim writes the grant when its addressee signs in (see [Invitation](/developers-guide/contestant-app/pre-registration-and-invitation)).
- **`code`.** The same, starting from a registration code the invitation holds.
- **`identity_provider`.** The user identifies with a bank identity, and the `identity-callback` Edge Function creates the account and the entity it registers, a candidate or a party, with its grant. The user then gives the address they will sign in with. See [Bank authentication (OIDC)](/developers-guide/contestant-app/bank-authentication).

## The entry screens

| Address                                        | Route key                            | What it is                                                                                                                          |
| ---------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/contestant/login`                            | `ContestantAppLogin`                 | the login screen: "Sign in with email" and, when a registration mode is listed, "Register"                                          |
| `/contestant/login/email`                      | `ContestantAppSignIn`                | the sign-in screen: an address and a password, and a button that mails a sign-in link                                               |
| `/contestant/register`                         | `ContestantAppRegister`              | the registration screen: the mode selector                                                                                          |
| `/contestant/register/email`                   | `ContestantAppRegisterEmail`         | the address for a registration code nobody has claimed                                                                              |
| `/contestant/register/sign-in`                 | `ContestantAppRegisterSignIn`        | the sign-in of the holder of a claimed registration code                                                                            |
| `/contestant/email-sent`                       | `ContestantAppEmailSent`             | the "email sent" screen, after any of them asked for a link                                                                         |
| `/contestant/register/identity-provider/error` | `ContestantAppIdentityProviderError` | the identity provider's error screen; see [The error screen](/developers-guide/contestant-app/bank-authentication#the-error-screen) |
| `/contestant/forgot-password`                  | `ContestantAppForgotPassword`        | a recovery link asked for; see [Login and password reset](/developers-guide/contestant-app/login-and-password-reset)                |
| `/contestant/password-reset`                   | `ContestantAppResetPassword`         | the reset page, for a signed-in user                                                                                                |

The first seven are the Contestant App's entry routes, listed in `entryRoutes` of its row in [`appGates.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/appGates.ts): the server hook sends a caller who already has a session from any of them to the app root. The forgot-password and reset pages are not in the list, because a signed-in user may use both.

## The login screen

The login screen holds no field. "Sign in with email" leads to the sign-in screen and passes on the `redirectTo` path the protected routes sent the visitor here with. "Register" leads to the registration screen and is rendered only when at least one registration mode is listed. Both are links, so the screen works before its script has loaded. A notice under the title says why a visitor was sent here, for the three reasons it knows: the user was signed out because their account's data could not be read (`errorMessage=loginFailed`), a mailed link could not be used (`errorMessage=authError`), or a link that confirms a new address was opened with no session after another account took that address (`errorMessage=emailTaken`). Any other value shows nothing.

## What lists a registration mode

`contestantApp.registrationModes` is a matrix: a list of modes for each of `candidate` and `organization`. One function reads it, `listedRegistrationModes(settings)` in [`$lib/contestant/utils/registrationOffer.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/registrationOffer.ts), and every surface that offers registration asks it: the login screen's "Register", the registration screen's options, the menu's Register item and the guard of the registration routes. None of them can therefore lead to another that refuses.

- The modes are listed in a fixed order: `identity_provider`, `email`, `code`.
- `identity_provider` is listed when any entity type the project serves allows it, because registering through the provider creates the entity of the type the user chooses. `identityProviderEntityTypes(settings)` in the same module lists those types, candidate first; the registration screen asks the user to choose among them when there are several, and the server routes of the provider's flow accept only a type from that list.
- `email` and `code` are listed when any entity type the project serves allows them, because the invitation they redeem names its own entity.
- While `access.answersLocked` is on, nothing is listed: the login screen shows the locked sentence and no "Register".

The database applies the same matrix to the invitation itself: an open invitation for a candidate or an organization is honoured only under a mode its project allows for that type (see [Invitation](/developers-guide/contestant-app/pre-registration-and-invitation#the-registration-modes)).

## The guard of the registration routes

The registration screen and the two screens a code leads to are served only where the project offers what they are for. The identity provider's error screen is not guarded: it is reached by a redirect at the end of a flow the project offered when it began. Each page's server load calls `refuseUnlessRegistrationOffered(event, need)` from [`$lib/server/contestant/registrationGuard.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/server/contestant/registrationGuard.ts): the registration screen needs at least one listed mode (`'any'`), and the two code screens need the code mode (`'code'`). A refusal redirects to the login screen with no parameter. The guard reads the settings itself, on every request, through an anonymous client, and a failed read lists no mode, so it fails closed.

The form action of the code sign-in asks `isRegistrationOffered({ fetch }, 'code')` before anything else and answers a refusal with the status alone, as it answers a wrong password. A layout or page load does not run before a form action, so the action asks for itself.

The code sign-in is one of the two code screens, so it is refused while `access.answersLocked` is on and while the code mode is off, although it signs a user in rather than registering one. A user who registered with a code is not locked out by this: they sign in on the email sign-in screen with the address the code was claimed with and the same password, and the sign-in screen's link, which ignores the answers lock, also reaches them where the email or the identity-provider mode is allowed.

## Registering by email

1. **The registration screen.** The visitor chooses the email option, where several modes are listed, and types the address the invitation names. With one listed mode its panel is shown directly.
2. **The link request.** Continue asks the [`account-access`](/developers-guide/backend/edge-functions#account-access) function for a sign-in link to the address, through the contestant context's `sendEntryLink`. The function answers alike for every address, and the screen reads nothing of the answer.
3. **The "email sent" screen.** It opens when the request has settled, or ten seconds after it was made, whichever is first.
4. **The mail.** It is sent only when the database finds an open invitation for the address, or a grant its account already holds, and the address's mail slot is free.
5. **The link.** The auth callback verifies it, claims the invitations and lands the user in the Contestant App (see [The auth callback](/developers-guide/contestant-app/login-and-password-reset#the-auth-callback)).
6. **The set-password gate.** A user who has no password is asked to choose one before any protected page is shown (see [The set-password gate](#the-set-password-gate)).
7. **The terms of use**, and then the app.

The forgot-password page, which both sign-in screens link to, starts the same sequence from step 2 for an address that has an open invitation and no account.

## Registering with a code

1. **The registration screen.** The visitor chooses the code option and types the code. Continue checks it with the contestant context's `checkInvitationCode`, which asks `account-access` for its status.
2. **A code nobody has claimed** (`valid`) is held in the entry flow and leads to `/contestant/register/email`. That screen takes the address twice and asks for a link with the address and the held code; the "email sent" screen and the steps of the email registration follow. Binding the address to the code means that the code's promise is fulfilled only for the user who opens the link.
3. **A claimed code** (`used`) is held the same way and leads to `/contestant/register/sign-in`. The holder signs in with the code and their password, posted to the screen's server action, which calls `invitationCodeLogin`. The screen asks for no address and shows none. Its links to the forgot-password page, Forgot password and, where `signInLinkOffered` allows it, "I have not set a password yet", carry no address: there the holder types the address they registered with.
4. **Any other answer**, and a check that failed, is one sentence at the field, so the screen says nothing of why a code was not confirmed.

The code is in no address: it is held in memory, and the code sign-in sends it in the body of its post.

## Registering with a bank identity

1. **The registration screen.** The visitor chooses the identity provider's option, where several modes are listed, and the entity type to register, where several types allow the mode. Continue starts the provider's flow at `/api/oidc/authorize`.
2. **The provider.** The visitor identifies with their bank identity and is sent back to `/api/oidc/callback`.
3. **The account and the entity.** The callback asks `identity-callback` to find or create the account and the entity of the chosen type, establishes the session and lands the user at the app root. A failure lands on the identity provider's error screen instead.
4. **The success view.** A gate of the protected layout asks for the address the user will sign in with, and for a party with no name, its name. The address's confirmation link is mailed, and the user goes on at once.
5. **The terms of use**, and then the app. Until the user opens the mailed link, they sign in with the identity provider; once the link has made the address theirs, the set-password gate asks for a password.

[Bank authentication (OIDC)](/developers-guide/contestant-app/bank-authentication) describes each step, the success view's variants, the confirmation mail and the error screen's codes.

## The "email sent" screen

The screen shows the one link request the entry flow holds, in wording that follows the screen the request was made on: its first sentence names the address the user typed in bold, which is HTML-escaped before it is written into the sentence and sanitised with it. A request made with a code alone names no address. Below the sentences, a support sentence carries its own link to the support section of the Help page, and "Send again" follows it. Nothing of a request's answer is read, so the screen is the same whatever became of the request.

- "Send again" repeats the held request. It becomes available 65 seconds after the request settled, counted on the tab's own clock: the server sends one mail to an address in 60 seconds and takes the address's slot after it has answered, and the five seconds are the margin. While the count runs the button stays a tab stop, and its label ends with how long is left, "Send again (in 12s)".
- A request that repeats the held one inside the count, for the same address or with the same code, is made all the same, and the screen says that no new mail may come yet. It is judged on the tab's own clock from the two requests alone.
- "Use another email address" leads back to the screen the address was typed on.
- The mails say that only the newest link works: a later link of either kind makes an earlier unopened one stop working.

## The entry flow's state

What the entry screens share is held by the contestant context in a private field, read through its `entryFlow` accessor: a checked registration code, the one link request that can be repeated, both, or nothing. It is written through `holdEntryCode`, `sendEntryLink`, `resendEntryLink` and `clearEntryFlow`, and is replaced whole on every write.

- It is in memory only: never in storage, a cookie, an address, a search parameter or history state. A reload empties it.
- The code screens and the "email sent" screen render nothing while the flow does not hold what they need, as after a reload or a visit by address, and lead to the registration screen or the login screen in place of their history entry.
- It is cleared when the user signs in on the sign-in screen or the code sign-in, and when they sign out.

## The set-password gate

A user who signed in by a mailed link, and a user an identity provider registered, has no password. The protected layout's server load reads the user-level data with `getBasicUserData` and passes it, with the identity provider's arrival cookie and whether answers are locked, to the gate list in [`gates.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/gates/gates.ts). The gates are asked in order, and the first needed one is shown:

1. `setPassword`, needed when `passwordSet` is `false` and the account's address is proved (`addressState` is `proved`);
2. `identityProvider`, the identity provider's success view, needed while an identity-provider account has no address or its own party has no name, and once after the provider found an existing account (see [The success view](/developers-guide/contestant-app/bank-authentication#the-success-view));
3. `termsOfUse`, needed until the terms of use are accepted.

`passwordSet` is read on every call from the `password_set` key of `get_user_entities`. `addressState` is told from the verified user: `proved` for every account an identity provider did not make, and for an identity-provider account only once the address it gave has been confirmed. So an identity-provider account is asked for an address before it is asked for a password, and only an address of its own leads to the password. When a gate is needed, the load returns the gate and the user-level data only, and the layout renders the gate's view in place of the page.

The view, [`SetPasswordGate.svelte`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte), shows the account's address and the [`PasswordSetter`](/developers-guide/contestant-app/password-validation). Saving calls the contestant context's `setPassword` and reruns the loads, so the next gate or the requested page replaces the view. The view offers no way past it other than a password, and Log Out is always available.

The gate is the Contestant App's and is decided on the server; [What the set-password gate does not cover](/developers-guide/backend/authentication#what-the-set-password-gate-does-not-cover) states its limits.

## Terms of use

Acceptance of the terms of use belongs to the user and the project. It is not stored on the candidate, and no entity has a terms-of-use field.

- **Where it is recorded.** The `terms_of_use_acceptances` table holds one row for each user and project. The database stamps who accepted and when: the app sends neither. See [Authentication and authorisation](/developers-guide/backend/authentication#terms-of-use-acceptances) for the table's policies and privileges.
- **When it is asked.** The server load of the protected layout, [`+layout.server.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/+layout.server.ts>), reads the user-level data first (`getBasicUserData`, whose `termsOfUseAccepted` is the time of acceptance or `null`) and passes it to the gate list. The entity is read by the load of the `[entityType]/[entityId]` routes below it, and not until every gate has passed.
- **How often.** Once per project. A user who has accepted is not asked again after signing out, resetting their password or signing in again. A user who edits more than one entity in the project accepts once.
- **How it is recorded.** The view calls the candidate context's `acceptTermsOfUse`, which calls the data writer's method of the same name. The Supabase data writer upserts a row with duplicates ignored, so accepting twice is not an error. The layout's loads then run again and the requested page replaces the view. If the write fails, the view stays and shows an error.
- **What it does not decide.** Whether voters can see a candidate does not depend on acceptance; see [Row-level security and column grants](/developers-guide/backend/authentication#row-level-security-and-column-grants).

## Data writer methods

The Supabase data writer, [`supabaseDataWriter.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts), implements the methods the entry flow calls like this:

| Method                       | Supabase implementation                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkInvitationCode`        | the `check-code` operation of `account-access`                                                                                                                                                                                                                                                                              |
| `requestSignInLink`          | the `request-link` operation of `account-access`                                                                                                                                                                                                                                                                            |
| `requestPasswordRecovery`    | the `request-recovery` operation of `account-access`                                                                                                                                                                                                                                                                        |
| `signInWithInvitationCode`   | the `code-sign-in` operation, then `auth.setSession` with the returned tokens                                                                                                                                                                                                                                               |
| `setPassword`                | `supabase.auth.updateUser({ password })` on the current session                                                                                                                                                                                                                                                             |
| `getBasicUserData`           | `auth.getUser()` and `get_user_entities`: its `password_set` fills `passwordSet`, its `pending_email_taken` and the verified user's address, pending address and `app_metadata` fill `addressState`, `pendingEmail` and `pendingEmailTaken`, and the account's record and the listed entities fill `ownOrganizationUnnamed` |
| `requestAddressConfirmation` | the `confirm-address` operation of `account-access`, with the session's access token; called by the identity provider's server endpoint                                                                                                                                                                                     |

The contestant context forwards the first three, and a screen calls `sendEntryLink` rather than the two link methods, so that the request is held for the "email sent" screen.
