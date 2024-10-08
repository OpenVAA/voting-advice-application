# Candidates

## Mock Data
By default, mock data includes the user `first.last@example.com` with the password `password` that can be used to test the candidate app.

## Creating a New Candidate
A candidate can log in to the candidate app either by having the admin give them a registration key or registering an account for them.

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

## Resetting Password
The user gets an email with a link to reset their password using the forgot password functionality on the login page. The frontend URL in the emails is configured in `.env` with the PUBLIC_FRONTEND_URL variable, and the email service (AWS SES) can be configured using the following variables:
- `AWS_ACCESS_KEY_ID`: AWS SES user access key
- `AWS_SECRET_ACCESS_KEY`: AWS SES user secret access key
- `AWS_REGION`: AWS SES region
- `MAIL_FROM`: the email address the emails are sent from
- `MAIL_REPLY_TO`: the email address replies should be sent to

`MAIL_FROM` and `MAIL_REPLY_TO` variables will not take effect for emails sent by `user-permissions` Strapi plugin (f.e. reset password emails) as they are configured separately via Strapi UI in `Settings > Email Templates`.

You can use a local instance of AWS SES via [LocalStack](https://docs.localstack.cloud/user-guide/aws/ses/) for development. To enforce the use of LocalStack set `LOCALSTACK_ENDPOINT` to `http://localhost.localstack.cloud:4566` in `.env` file. You could use the project's Docker compose setup to spin up `awslocal` service or install and run it [yourself](https://docs.localstack.cloud/getting-started/installation/). The LocalStack's AWS SES mailbox can be checked at [http://localhost:4566/_aws/ses](http://localhost:4566/_aws/ses), where you'll find any emails sent by Strapi.

## Technical Documentation

The user registration process is primarily handled by the `users-permissions` plugin bundled by Strapi so that we can rely on Strapi's existing security mechanisms (rate-limiting and being battle-tested). The only exception is that the plugin is extended with registration code support (POST /api/auth/local/register endpoint) that is implemented in the [`candidate.ts`](/backend/vaa-strapi/src/extensions/users-permissions/controllers/candidate.ts) file. The user is also not logged in automatically by this endpoint to prevent bypassing 2FA in case we want to implement it in the future, in scenarios where the user already exists but is not explicitly linked to a candidate yet.

The existing content-type of `User` is used to identify the users that can log in, but extended with the `candidate` field so a logged-in user could be associated to a specific candidate. Similarly, the candidate schema also has a belong-to relation back to the user if any exists. This makes it possible to rely on the logic provided by `users-permissions` plugin instead of implementing all the login logic manually. You can find the schema definition for user in the [`schema.json`](/backend/vaa-strapi/src/extensions/users-permissions/content-types/user/schema.json).

See [password-validation.md](./password-validation.md) on additional information on how password validation is handled.

For logging in and logging out, the frontend stores the session JWT token returned by Strapi in the local storage of the browser. The primary logic for this is handled in [`authenticationStore.ts`](/frontend/src/lib/utils/authenticationStore.ts). Log out is handled simply by resetting the state to being logged out and discarding the saved JWT token inside local storage.
