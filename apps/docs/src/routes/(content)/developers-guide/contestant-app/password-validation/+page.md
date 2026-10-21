# Password validation

Password validation is a frontend feature. It checks a new password in the browser before the password is sent to Supabase Auth, which applies its own server-side policy.

### Where the password is set

A candidate sets a password in three places:

- [`SetPasswordGate.svelte`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte) (a signed-in user whose account has no password yet, shown in place of every protected page)
- [`password-reset/+page.svelte`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/password-reset/+page.svelte) (forgotten password)
- [`settings/+page.svelte`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte>) (change an existing password)

Each page renders the [`PasswordSetter`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte) component: a [`PasswordValidator`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordValidator/PasswordValidator.svelte), a password field and a confirmation field.

### Validation functions

The rules live in [`passwordValidation.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/password-validation/passwordValidation.ts), which exports:

- `validatePasswordDetails(password, username = '')`  
  Returns `{ status, details }`: `status` is `true` if every enforced requirement is met, and `details` holds a `ValidationDetail` for each requirement. The validation UI renders these details.
- `minPasswordLength`  
  The minimum length, passed to the length message as a translation parameter.

### Flow

1. `PasswordValidator` calls `validatePasswordDetails` 200 ms after the user stops typing, shows the state of each requirement and exposes the verdict through its bindable `validPassword` prop. The component's documentation describes how each requirement is shown.
2. `PasswordSetter` treats the password as valid only when `validPassword` is `true` and the confirmation matches. It reports `{ valid, errorMessage }` to the page through `onValidityChange`, and it exposes `validate()`, which judges the password as typed without the delay, shows what is wrong at the field it concerns, moves focus there and returns the verdict. It reports one field at a time: the password first, then the confirmation.
3. The set-password gate and the reset page keep their main button pressable and call `validate()` in their submit handler, which sends nothing when it returns `false`. The settings page disables its submit button while `onValidityChange` reports the password not valid.
4. On submit, the page calls the candidate context's `setPassword`, which goes through the Supabase data writer ([`supabaseDataWriter.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts)) to `supabase.auth.updateUser({ password })`.

The frontend check is advisory. Supabase Auth enforces its own password policy: `minimum_password_length` and `password_requirements` under `[auth]` in [`config.toml`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/config.toml) for the local stack (8 characters and no required character classes), and the project's Auth settings for a hosted project (see [Auth settings of a hosted project](/developers-guide/deployment#auth-settings-of-a-hosted-project)). The length binds the setting of a password, by the user and by the service role, and not a sign-in with an older, shorter one. Keep that policy no stricter than the frontend rules, or a password the UI accepts will be rejected on submit.

### Password requirements

`passwordValidation.ts` defines these requirements:

| Requirement  | Met when                                                                      | Kind                   |
| ------------ | ----------------------------------------------------------------------------- | ---------------------- |
| `length`     | the password has at least `minPasswordLength` (8) characters                  | positive               |
| `uppercase`  | it contains an uppercase letter                                               | positive               |
| `lowercase`  | it contains a lowercase letter                                                | positive               |
| `number`     | it contains a digit 0–9                                                       | positive               |
| `symbol`     | it contains a character that is neither a letter nor a digit                  | positive               |
| `username`   | the username is empty, or the password does not contain it (case-insensitive) | negative, enforced     |
| `repetition` | no character is repeated 4 times in a row                                     | negative, not enforced |

The three places pass the account's address to `PasswordSetter` as `username`, which hands it to the rule list, so a password that contains the address is refused. The setter also holds the address in a hidden read-only field, for a password manager to pair with the new password.

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
  message: 'contestantApp.register.passwordValidation.length'
}
```

Example 2.  
A negative, non-enforced requirement against repeated characters. `checkRepetition` returns `true` if the password contains repetition, so the status is its negation. `negative` is `true` and `enforced` is absent, so a violation is shown but does not make the password invalid:

```ts
repetition: {
  status: !checkRepetition(password),
  message: 'contestantApp.register.passwordValidation.repetition',
  negative: true
}
```
