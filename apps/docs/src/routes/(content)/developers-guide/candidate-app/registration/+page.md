# Registration

Registration completes a candidate account that already exists. The account, the candidate row and the grant between them are created first, by an invitation or by bank-authentication pre-registration (see [Pre-registration and invitation](/developers-guide/candidate-app/pre-registration-and-invitation)). Registration then gives the account a password and records the candidate's acceptance of the terms of use.

## The invitation path

1. **The email link.** The invitation link returns to the server route `/api/candidate/auth/callback`, which verifies the link, stores the session in cookies and redirects to the set-password page, `/candidate/register/password?email=…`.
2. **The password.** The page renders [`PasswordSetter`](/developers-guide/candidate-app/password-validation). Because the candidate has a session, an email address and no registration key, the page takes its invite branch and calls the candidate context's `setPassword`, which calls Supabase Auth's `updateUser({ password })` through the Supabase data writer.
3. **Back to login.** The page then opens the login page with the email address filled in, instead of going straight into the app, because the session from the email link may not survive the client-side navigation to the protected pages. The candidate logs in with the new password (see [Login and password reset](/developers-guide/candidate-app/login-and-password-reset)).
4. **Terms of use.** The protected layout of the Candidate App shows the terms-of-use form until the candidate has accepted it. Accepting saves the time of acceptance in the candidate row's `terms_of_use_accepted` column.
5. **The app.** After that, the candidate reaches the Candidate App home page, provided they have at least one nomination.

While the `access.answersLocked` app setting is on, the layout of the `/candidate/register` pages shows a "registration locked" message instead of the pages.

## The registration-key contract

The data writer interface, [`dataWriter.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/base/dataWriter.type.ts), declares two methods for registering with a registration key:

- `checkRegistrationKey({ registrationKey })`: checks the key and returns the candidate's name and email address.
- `register({ registrationKey, password })`: activates the user with the key and a password.

The frontend still calls this contract:

- The login page links to `/candidate/register` ("Do you have a registration code?" in English).
- That page reads a key from a form field or the `registrationKey` search parameter and calls `checkRegistrationKey`.
- The set-password page has a branch that calls `register` when it is given a `registrationKey`.

The Supabase data writer, which is the adapter the app uses, does not implement the contract. Its `_checkRegistrationKey` throws `checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration.`, so the register page reports every key as wrong. Its `_register` ignores the key and sets the password on the current session, as `setPassword` does. With the Supabase adapter, the invitation and pre-registration are the ways to create an account.

## Data writer methods

The Supabase data writer, [`supabaseDataWriter.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts), implements the registration methods like this:

| Method                    | Supabase implementation                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `setPassword`             | `supabase.auth.updateUser({ password })` on the current session                                                                                                                |
| `register`                | the same call; the registration key is not read                                                                                                                                |
| `checkRegistrationKey`    | throws                                                                                                                                                                         |
| `preregisterWithApiToken` | invokes the `invite-candidate` Edge Function (see [Pre-registration and invitation](/developers-guide/candidate-app/pre-registration-and-invitation#calling-invite-candidate)) |
