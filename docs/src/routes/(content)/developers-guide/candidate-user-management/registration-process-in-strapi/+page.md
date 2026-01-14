# Registration Process in Strapi

The user registration process is primarily handled by the `users-permissions` plugin bundled by Strapi so that we can rely on Strapi's existing security mechanisms (rate-limiting and being battle-tested). The only exception is that the plugin is extended with registration code support (POST /api/auth/local/register endpoint) that is implemented in the [`candidate.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/extensions/users-permissions/controllers/candidate.ts) file. The user is also not logged in automatically by this endpoint to prevent bypassing 2FA in case we want to implement it in the future, in scenarios where the user already exists but is not explicitly linked to a candidate yet.

The existing content-type of `User` is used to identify the users that can log in, but extended with the `candidate` field so a logged-in user could be associated to a specific candidate. Similarly, the candidate schema also has a belong-to relation back to the user if any exists. This makes it possible to rely on the logic provided by `users-permissions` plugin instead of implementing all the login logic manually. You can find the schema definition for user in the [`schema.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/extensions/users-permissions/content-types/user/schema.json).

See [password-validation.md](/developers-guide/candidate-user-management/password-validation) on additional information on how password validation is handled.

For logging in and logging out, the frontend stores the session JWT token returned by Strapi in the local storage of the browser. The primary logic for this is handled in [`authenticationStore.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/utils/authenticationStore.ts). Log out is handled simply by resetting the state to being logged out and discarding the saved JWT token inside local storage.

### Email Templates

You can modify the default email templates in the [email-templates](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/config/email-templates) folder.

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
