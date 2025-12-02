# Candidate User Management

## Mock Data

See [Mock users](#mock-users) for automatically generated users you can use to test the Candidate App.

## Creating a New Candidate

A candidate can log in to the candidate app either by having the admin give them a registration key, registering an account for them, or using pre-registration.

### Using Registration Key

To use the registration code, you need to navigate to the Strapi's admin area (http://localhost:1337), select the "Content Manager" tab, and choose the "Candidates" tab from the dropdown. If a candidate you want to log in as doesn't exist yet, you can use the "Create new entry" button to create one.

Afterward, edit the desired candidate and choose a secure and random value for the registrationKey field. Then, save the change by clicking the "Save" button. The chosen registrationKey should be shared, and then the candidate can navigate to http://localhost:5173/candidate/register to create their account.

### Manually

To create the user manually, you need to navigate to the Strapi's admin area (http://localhost:1337), select the "Content Manager" tab, and choose the "User" tab from the dropdown.

You can create a new user using the "Create new entry" button. The following fields should be set:

- username (any desired username)
- email (any desired email, it'll be used for logging in)
- password (any strong password)
- confirmed => True
- blocked => False
- role => Authenticated
- candidate => the desired candidate the user is linked to

Then, use the "Save" button and you should be able to log in as the candidate at http://localhost:5173/candidate.

### Pre-Registration

In the pre-registration process, anyone can use their bank identity to register as a candidate. When the Voter App is published, those registered users who can be matched to actual candidates in the election can be confirmed to be shown in the app.

This requires a subscription to an identity service provider to work. It is enabled with the `preRegistration.enabled` static setting.

The feature is partially supported.

The documentation is TBA but one can read the notes from the two PRs in which was built:

- [Initial PR 687](https://github.com/OpenVAA/voting-advice-application/pull/687)
- [Enhancement PR 703](https://github.com/OpenVAA/voting-advice-application/pull/703)

## Resetting the Password

The user gets an email with a link to reset their password using the forgot password functionality on the login page. The frontend URL in the emails is configured in `.env` with the PUBLIC_BROWSER_FRONTEND_URL variable, and the email service (AWS SES) can be configured using the following variables:

- `AWS_SES_ACCESS_KEY_ID`: AWS SES user access key
- `AWS_SES_SECRET_ACCESS_KEY`: AWS SES user secret access key
- `AWS_SES_REGION`: AWS SES region
- `MAIL_FROM`: the email address the emails are sent from
- `MAIL_FROM_NAME`: the name of the sender
- `MAIL_REPLY_TO`: the email address replies should be sent to

The emails are sent by `user-permissions` Strapi plugin and can be configured separately via Strapi UI in `Settings > Users & Permissions plugin > Email Templates`.

You can use a local instance of AWS SES via [LocalStack](https://docs.localstack.cloud/user-guide/aws/ses/) for development. To enforce the use of LocalStack set `LOCALSTACK_ENDPOINT` to `http://localhost.localstack.cloud:4566` in `.env` file. You could use the project's Docker compose setup to spin up `awslocal` service or install and run it [yourself](https://docs.localstack.cloud/getting-started/installation/). The LocalStack's AWS SES mailbox can be checked at [http://localhost:4566/\_aws/ses](http://localhost:4566/_aws/ses), where you'll find any emails sent by Strapi.

## Registration Process in Strapi

The user registration process is primarily handled by the `users-permissions` plugin bundled by Strapi so that we can rely on Strapi's existing security mechanisms (rate-limiting and being battle-tested). The only exception is that the plugin is extended with registration code support (POST /api/auth/local/register endpoint) that is implemented in the [`candidate.ts`](/backend/vaa-strapi/src/extensions/users-permissions/controllers/candidate.ts) file. The user is also not logged in automatically by this endpoint to prevent bypassing 2FA in case we want to implement it in the future, in scenarios where the user already exists but is not explicitly linked to a candidate yet.

The existing content-type of `User` is used to identify the users that can log in, but extended with the `candidate` field so a logged-in user could be associated to a specific candidate. Similarly, the candidate schema also has a belong-to relation back to the user if any exists. This makes it possible to rely on the logic provided by `users-permissions` plugin instead of implementing all the login logic manually. You can find the schema definition for user in the [`schema.json`](/backend/vaa-strapi/src/extensions/users-permissions/content-types/user/schema.json).

See [password-validation.md](#password-validation) on additional information on how password validation is handled.

For logging in and logging out, the frontend stores the session JWT token returned by Strapi in the local storage of the browser. The primary logic for this is handled in [`authenticationStore.ts`](/frontend/src/lib/utils/authenticationStore.ts). Log out is handled simply by resetting the state to being logged out and discarding the saved JWT token inside local storage.

### Email Templates

You can modify the default email templates in the [email-templates](/backend/vaa-strapi/config/email-templates) folder.

#### Using Variables

Strapi uses [EJS](https://ejs.co/) as its template engine, thus the email templates support the functionality EJS provides.

Though the most important functionality you'll need is variables. They can be used by wrapping the variable with `<%=` and `%>`, e.g. `<%= URL %>` would be replaced with the URL variable's contents in the email when it gets sent.

### Templates

#### Reset Password

The reset password (reset-password.html) template supports the following variables (https://github.com/strapi/strapi/blob/2a2faea1d49c0d84077f66a57b3b73021a4c3ba7/packages/plugins/users-permissions/server/controllers/auth.js#L230-L236):

- URL: The public frontend URL to the password reset path (e.g. `http://localhost:5173/candidate/password-reset`)
- SERVER_URL: The Strapi's base URL
- ADMIN_URL: The Strapi's admin area URL
- USER: The user object the email is being sent to, specifically having the user's content-type properties that can be accessed like `USER.PROPERTY_NAME` (e.g. `USER.email`)
- TOKEN: The password reset token needed to reset the user's password

## Password Validation

### Frontend

Setting the password is done in three components:

- [`PasswordSetPage.svelte`](/frontend/src/routes/candidate/register/PasswordSetPage.svelte) (new user)
- [`PasswordResetPage.svelte`](/frontend/src/routes/candidate/password-reset/PasswordResetPage.svelte) (forgotten password)
- [`settings/+page.svelte`](</frontend/src/routes/candidate/(protected)/settings/+page.svelte>) (update existing password)

The password is validated using [`passwordValidation.ts`](/packages/app-shared/utils/passwordValidation.ts).

The file provides two main functions for validating a password

- `validatePassword`  
  Returns a boolean indicating whether the password is valid
- `validatePasswordDetails`  
  Returns both the password validity status boolean as well as details and state for each password requirement. These details are used for the validation UI.

On all password set pages, a password validation UI is shown to the user.
This functionality is provided by the [`PasswordValidator.svelte`](/frontend/src/lib/components/passwordValidator/PasswordValidator.svelte) component.
The component provides real-time password validation checks and shows the state of each password requirement.
More details on how the different requirements are shown to the user can be found in the documentation of the component.

The UI validation is done using debounced validation, i.e. the validation status is checked and updated once the user stops typing for a moment.

The password validation UI provides a variable indicating the password validation status, which can be used to enable/disable the password submit button. This way frontend allows the password to be submitted only if it is valid.

However, due to the use of debounced validation, the validity of the password is also checked by the password set page itself before sending the request to the backend.

If the validity check passes, a POST request is sent to the backend to either

- `api/auth/candidate/register`
- `api/auth/reset-password`

### Backend

- `/api/auth/candidate/register` endpoint is implemented by [`candidate.ts`](/backend/vaa-strapi/src/extensions/users-permissions/controllers/candidate.ts) using the registration key
  - the backend also validates the password using the same `validatePassword` function
- `/api/auth/reset-password` is fully handled by Strapi's users-permissions plugin

### Password requirements

The password requirements are defined in the [`passwordValidation.ts`](/packages/app-shared/utils/passwordValidation.ts) file.

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

#### Changing and creating new requirements

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
