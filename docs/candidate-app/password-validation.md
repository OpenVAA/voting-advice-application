# Password Validation

## Frontend

Setting the password is done in two components:

- [`PasswordSetPage.svelte`](/frontend/src/routes/candidate/register/PasswordSetPage.svelte) (new user)
- [`PasswordResetPage.svelte`](/frontend/src/routes/candidate/password-reset/PasswordResetPage.svelte) (forgotten password)

The password is validated using [`passwordValidation.ts`](/frontend/src/lib/utils/passwordValidation.ts).

The file provides two main functions for validating a password

- `validatePassword`  
  Returns a boolean indicating whether the password is valid
- `validatePasswordDetails`  
  Returns both the password validity status boolean as well as details and state for each password requirement. These details are used for the validation UI.

On both password set pages, a password validation UI is shown to the user.
This functionality is provided by the [`PasswordValidator.svelte`](/frontend/src/lib/components/passwordValidator/PasswordValidator.svelte) component.
The component provides real-time password validation checks and shows the state of each password requirement.
More details on how the different requirements are shown to the user can be found in the documentation of the component.

The UI validation is done using debounced validation, i.e. the validation status is checked and updated once the user stops typing for a moment.

The password validation UI provides a variable indicating the password validation status, which can be used to enable/disable the password submit button. This way frontend allows the password to be submitted only if it is valid.

However, due to the use of debounced validation, the validity of the password is also checked by the password set page itself before sending the request to the backend.

If the validity check passes, a POST request is sent to the backend to either

- `api/auth/candidate/register`
- `api/auth/reset-password`

## Backend

Before accepting the password, the backend also validates the password.
This is done in the [`candidate.ts`](/backend/vaa-strapi/src/extensions/users-permissions/controllers/candidate.ts) file using the same `validatePassword` function from [`passwordValidationCopy.ts`](/backend/vaa-strapi/src/util/passwordValidationCopy.ts).
Currently, the backend uses a copy of the original validation file.

## Password requirements

The password requirements are defined in the [`passwordValidation.ts`](/frontend/src/lib/utils/passwordValidation.ts) file.

Each requirement is defined by the `ValidationDetail` interface:

```ts
export interface ValidationDetail {
  status: boolean;
  message: string;
  negative?: boolean;
  enforced?: boolean;
}
```

- status:
  - indicates the state of the requirement, i.e. if it is valid
- message:
  - describes the requirement
  - shown to the user in the validation UI
  - due to localization, the message string contains the key to the `i18n` localization file, where the actual texts are located
- negative:
  - requirements are either positive or negative
  - positive rules are the main requirements that are always enforced and must be met for the password to be valid
  - negative rules are rules that are used to prevent bad password practises
  - in the validation UI, negative rules are shown if they are violated
- enforced:
  - negative rules can be either enforced or non-enforced
  - enforced requirements need to be valid for a password to be valid

Currently, all requirements are done without hardcoded lists of allowed characters and support languages that have separate uppercase and lowercase letters. Localization to other languages may need new validation rules.

The file also contains help functions for checking different aspects of the password string.

### Changing and creating new requirements

All validation rules are defined in the `passwordValidation` function. New requirements can be added and existing ones changed by modifying `ValidationDetail` objects of the result.
The order of one group of requirements (positive, negative enforced, negative non-enforced) is the same order they are shown to the user in the validation UI.
Below are examples of both types of requirements that can be used as a guide to creating new requirements. If necessary, new help functions can be defined in the file to help with validating a specific aspect of the password.

Example 1.  
Positive requirement that checks that the length of the password is at least the required length

```ts
length: {
  status: password.length >= minPasswordLength,
  message: 'candidateApp.passwordValidation.length'
}
```

Example 2.  
Negative requirement that checks if the password contains repetition using the `checkRepetition` function. This function returns `true` if a string contains repetition and therefore the status of the requirement is the negative of that as the requirement passes if it does not contain repetition.
As the requirement is negative, it has the `negative` property set to true, and as the `enforced` property is missing, this negative requirement is not enforced.

```ts
repetition: {
  status: !checkRepetition(password),
  message: 'candidateApp.passwordValidation.repetition',
  negative: true
}
```
