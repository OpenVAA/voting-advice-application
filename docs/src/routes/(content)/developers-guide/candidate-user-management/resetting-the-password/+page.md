# Resetting the Password

The user gets an email with a link to reset their password using the forgot password functionality on the login page. The frontend URL in the emails is configured in `.env` with the PUBLIC_BROWSER_FRONTEND_URL variable, and the email service (AWS SES) can be configured using the following variables:

- `AWS_SES_ACCESS_KEY_ID`: AWS SES user access key
- `AWS_SES_SECRET_ACCESS_KEY`: AWS SES user secret access key
- `AWS_SES_REGION`: AWS SES region
- `MAIL_FROM`: the email address the emails are sent from
- `MAIL_FROM_NAME`: the name of the sender
- `MAIL_REPLY_TO`: the email address replies should be sent to

The emails are sent by `user-permissions` Strapi plugin and can be configured separately via Strapi UI in `Settings > Users & Permissions plugin > Email Templates`.

You can use a local instance of AWS SES via [LocalStack](https://docs.localstack.cloud/user-guide/aws/ses/) for development. To enforce the use of LocalStack set `LOCALSTACK_ENDPOINT` to `http://localhost.localstack.cloud:4566` in `.env` file. You could use the project's Docker compose setup to spin up `awslocal` service or install and run it [yourself](https://docs.localstack.cloud/getting-started/installation/). The LocalStack's AWS SES mailbox can be checked at [http://localhost:4566/\_aws/ses](http://localhost:4566/_aws/ses), where you'll find any emails sent by Strapi.
