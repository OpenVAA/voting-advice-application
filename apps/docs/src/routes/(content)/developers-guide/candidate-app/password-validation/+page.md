# Password validation

Password validation is a frontend feature. It checks a new password in the browser before the password is sent to Supabase Auth, which applies its own server-side policy.

### Where the password is set

A candidate sets a password on three pages:

- [`register/password/+page.svelte`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/candidate/register/password/+page.svelte) (new user)
- [`password-reset/+page.svelte`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/candidate/password-reset/+page.svelte) (forgotten password)
- [`settings/+page.svelte`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte>) (change an existing password)

Each page renders the [`PasswordSetter`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte) component: a [`PasswordValidator`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte), a password field and a confirmation field.

### Validation functions

The rules live in [`passwordValidation.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/password-validation/passwordValidation.ts), which exports:

- `validatePasswordDetails(password, username = '')`  
  Returns `{ status, details }`: `status` is `true` if every enforced requirement is met, and `details` holds a `ValidationDetail` for each requirement. The validation UI renders these details.
- `minPasswordLength`  
  The minimum length, passed to the length message as a translation parameter.

### Flow

1. `PasswordValidator` calls `validatePasswordDetails` 200 ms after the user stops typing, shows the state of each requirement and exposes the verdict through its bindable `validPassword` prop. The component's documentation describes how each requirement is shown.
2. `PasswordSetter` treats the password as valid only when `validPassword` is `true` and the confirmation matches. It reports `{ valid, errorMessage }` to the page through `onValidityChange`.
3. The page disables its submit button while the password is not valid, and its submit handler returns without sending anything in that state.
4. On submit, the page calls the candidate context's `register`, `resetPassword` or `setPassword`. Each goes through the Supabase data writer ([`supabaseDataWriter.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts)) to `supabase.auth.updateUser({ password })`.

The frontend check is advisory. Supabase Auth enforces its own password policy: `minimum_password_length` and `password_requirements` under `[auth]` in [`config.toml`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/config.toml) for the local stack, and the project's Auth settings for a hosted project. Keep that policy no stricter than the frontend rules, or a password the UI accepts will be rejected on submit.

### Password requirements

Each requirement is a `ValidationDetail`:

```ts
export interface ValidationDetail {
  status: boolean;
  message: string;
  negative?: boolean;
  enforced?: boolean;
}
```

- status:
  - whether the requirement is met
- message:
  - a translation key for the text shown in the validation UI
- negative:
  - requirements are either positive or negative
  - positive requirements are always enforced and must be met for the password to be valid
  - negative requirements guard against bad password practices; the validation UI shows them only when they are violated
- enforced:
  - a negative requirement is enforced only if this is `true`
  - an enforced requirement must be met for the password to be valid

No requirement uses a hardcoded list of allowed characters. The letter checks support any script with separate uppercase and lowercase letters; other scripts may need new rules.

#### Changing and creating requirements

All requirements are defined in the `passwordValidation` function in `passwordValidation.ts`. Add or change a requirement by editing the `ValidationDetail` objects it returns, and add a helper function to the same file if a rule needs one.

Within each group (positive, negative enforced, negative non-enforced), requirements are shown in the order they are defined.

Example 1.  
A positive requirement that the password is at least `minPasswordLength` characters long:

```ts
length: {
  status: password.length >= minPasswordLength,
  message: 'candidateApp.register.passwordValidation.length'
}
```

Example 2.  
A negative, non-enforced requirement against repeated characters. `checkRepetition` returns `true` if the password contains repetition, so the status is its negation. `negative` is `true` and `enforced` is absent, so a violation is shown but does not make the password invalid:

```ts
repetition: {
  status: !checkRepetition(password),
  message: 'candidateApp.register.passwordValidation.repetition',
  negative: true
}
```
