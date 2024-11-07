# Email Templates

You can modify the default email templates in the [email-templates](/backend/vaa-strapi/config/email-templates) folder.

## Using Variables

Strapi uses [EJS](https://ejs.co/) as its template engine, thus the email templates support the functionality EJS provides.

Though the most important functionality you'll need is variables. They can be used by wrapping the variable with `<%=` and `%>`, e.g. `<%= URL %>` would be replaced with the URL variable's contents in the email when it gets sent.

## Templates

### Reset Password

The reset password (reset-password.html) template supports the following variables (https://github.com/strapi/strapi/blob/2a2faea1d49c0d84077f66a57b3b73021a4c3ba7/packages/plugins/users-permissions/server/controllers/auth.js#L230-L236):

- URL: The public frontend URL to the password reset path (e.g. `http://localhost:5173/candidate/password-reset`)
- SERVER_URL: The Strapi's base URL
- ADMIN_URL: The Strapi's admin area URL
- USER: The user object the email is being sent to, specifically having the user's content-type properties that can be accessed like `USER.PROPERTY_NAME` (e.g. `USER.email`)
- TOKEN: The password reset token needed to reset the user's password
