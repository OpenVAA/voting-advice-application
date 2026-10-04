# Login and password reset

Candidates sign in to Supabase Auth with an email address and a password. The session is kept in cookies that the SvelteKit server sets, so the server-side loaders of the Candidate App see the same session as the browser (see [Sessions](/developers-guide/backend/authentication#sessions)).

## Login

The login page, `/candidate/login`, posts its form to the page's own server action, [`login/+page.server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/candidate/login/+page.server.ts). The action calls the shared `passwordLogin` helper with the request's own Supabase client, so that the session cookies are set on this response:

1. It signs in with `signInWithPassword`. Wrong credentials give `400`.
2. It reads the new session back. A missing session gives `500`.
3. It checks the grants in the access token against `CANDIDATE_GRANTS`, which admits only an `editor` grant on a `candidate` entity. Any other user is signed out again and gets `403`.
4. It redirects to the `redirectTo` path from the form, if that is a safe relative app path, or to the Candidate App home page.

The pages under `/candidate` that need a candidate live in the `(protected)` route group. Its server loader redirects to the login page when there is no session. It then loads the candidate's own data and checks it. When the data cannot be loaded, the user is not a candidate, the user has no candidate row or the candidate has no nomination, the loader signs the user out and redirects to the login page with an `errorMessage` search parameter (`loginFailed`, `userNotAuthorized`, `userNoCandidate` or `candidateNoNomination`), which the login page shows.

## Password reset

A forgotten password is reset with a recovery email. Supabase Auth sends the email; the frontend sets the new password on the session that the email link creates.

1. **Request.** On `/candidate/forgot-password`, the candidate enters their email address. The page calls the candidate context's `requestForgotPasswordEmail`, which runs the Supabase data writer's `_requestForgotPasswordEmail` in the browser. It calls Supabase Auth's `resetPasswordForEmail` with `redirectTo` set to the auth callback, `/api/candidate/auth/callback` on the current origin. The callback path carries the reader's locale prefix, so the candidate returns to the language they asked in.
2. **Email.** Supabase Auth sends the recovery email with its own template (see [Email](/developers-guide/backend/email)).
3. **Callback.** The email link returns to the server route [`/api/candidate/auth/callback`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/api/candidate/auth/callback/+server.ts). The route calls `verifyOtp` with the link's `token_hash` and `type` on the server, which stores a session in cookies, and for `type=recovery` redirects to `/candidate/password-reset`. A missing parameter or a failed verification redirects to the login page with `errorMessage=authError`.
4. **New password.** The reset page finds a session and calls the candidate context's `setPassword`, which calls Supabase Auth's `updateUser({ password })`. On success it loads the Candidate App home page with a full page load, so the server-side loader receives the session cookies. If the page finds no session, it redirects to the login page.

The local auth server redirects only to `site_url` and the URLs in `additional_redirect_urls`, both in the `[auth]` section of [`config.toml`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/config.toml). The list admits the callback path with and without one locale segment in front of it. A hosted project needs the same entries in its Auth URL configuration.

A signed-in candidate changes their password on the settings page, which also calls `setPassword`. [Password validation](/developers-guide/candidate-app/password-validation) describes the checks all three password pages run.

## Logout

The logout button calls the candidate context's `logout`, which runs the Supabase data writer's `_logout`:

1. In the browser, it posts to the server route `/api/candidate/auth/logout`, which signs out on the server with `signOut({ scope: 'local' })` and so clears the session cookies on its response.
2. It then signs out the browser's own client the same way.

The candidate context then goes to the login page and clears the candidate's data from memory.
