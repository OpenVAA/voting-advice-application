# Email

Two parts of the backend send email:

| Email                                 | Sent by                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| Candidate invitation                  | Supabase Auth, when the `invite-candidate` Edge Function calls `inviteUserByEmail` |
| Password recovery                     | Supabase Auth, when the Candidate App calls `resetPasswordForEmail`                |
| Templated messages to a list of users | the `send-email` Edge Function, over SMTP                                          |

## Supabase Auth email

Supabase Auth sends the invitation and recovery messages with its own templates and its own mail settings.

- **Templates.** In `config.toml` the `[auth.email.template.*]` sections are commented out, so the local stack uses Supabase Auth's default templates. To customise one locally, uncomment its section and point `content_path` at an HTML file. For a hosted project, see Supabase's [email templates guide](https://supabase.com/docs/guides/auth/auth-email-templates).
- **Links.** The links in these messages return to the `/api/candidate/auth/callback` route, which creates the session and redirects by link type (see [Authentication and authorisation](/developers-guide/backend/authentication#sessions)). The Candidate App passes that route as the redirect target of a recovery email. The auth server redirects only to `site_url` and the URLs in `additional_redirect_urls`, both set in the `[auth]` section of `config.toml` for the local stack.
- **Confirmation.** `[auth.email]` sets `enable_confirmations = false`, so locally a user does not have to confirm an email address before signing in.
- **SMTP.** `[auth.email.smtp]` is commented out in `config.toml`, so locally Supabase Auth delivers its email to the email testing server described below. A hosted project needs its own SMTP server for Auth email; see Supabase's [custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp).

## The `send-email` function

[`send-email`](/developers-guide/backend/edge-functions#send-email) renders one message per recipient from templates the caller sends, and sends it over SMTP. The `resolve_email_variables` database function, in [`502-email-helpers.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/502-email-helpers.sql), returns each recipient's email address, preferred locale and variables. Only the service role may call it, because it reads `auth.users`.

- A recipient is included only when they hold a grant in the project (on the project, on its account, or on an entity in it); other user ids are skipped.
- The preferred locale comes from the user's `preferred_locale` metadata and defaults to `en`.
- The variables come from the recipient's candidate or organization grant. For a candidate with several nominations, one of them is used:

| Placeholder                          | Value                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `{{ candidate.first_name }}`         | the candidate's first name                                                     |
| `{{ candidate.last_name }}`          | the candidate's last name                                                      |
| `{{ organization.name }}`            | the organization's name; for a candidate, the organization that nominated them |
| `{{ nomination.constituency.name }}` | the constituency of the candidate's nomination in the project                  |
| `{{ nomination.election.name }}`     | the election of the candidate's nomination in the project                      |

A placeholder with no value for a recipient is left in the message as written.

`send-email` reads its SMTP settings from the function environment (see [Edge Functions](/developers-guide/backend/edge-functions#configuration)):

| Variable                 | Use                                                     |
| ------------------------ | ------------------------------------------------------- |
| `SMTP_HOST`, `SMTP_PORT` | the SMTP server; required                               |
| `SMTP_FROM`              | the sender address of every message; required           |
| `SMTP_USER`, `SMTP_PASS` | the SMTP credentials; set both for any real SMTP server |

The values in [`functions/.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/.env.example) point at the local email testing server and need no credentials:

```bash
SMTP_HOST=inbucket
SMTP_PORT=2500
SMTP_FROM=noreply@openvaa.org
```

Without `SMTP_USER` and `SMTP_PASS` the function also accepts a server certificate it cannot verify, which is meant only for the local testing server.

## Reading email locally

The local stack does not deliver email to real inboxes. Everything it sends, from Supabase Auth and from `send-email`, is caught by the email testing server configured in the `[inbucket]` section of `config.toml`. Read it in the server's web interface at [http://127.0.0.1:54324](http://127.0.0.1:54324) while the stack is running.
