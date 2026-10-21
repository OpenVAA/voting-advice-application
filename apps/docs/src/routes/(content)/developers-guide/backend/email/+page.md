# Email

Two Edge Functions send email, and Supabase Auth sends none:

| Email                                 | Sent by                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| The sign-in link                      | the `account-access` Edge Function's `request-link` operation, over SMTP     |
| The recovery link                     | the `account-access` Edge Function's `request-recovery` operation, over SMTP |
| Templated messages to a list of users | the `send-email` Edge Function, over SMTP                                    |

Creating an invitation sends nothing. A link is mailed when somebody asks for one, and only to an address the database returns for the request; see [Pre-registration and invitation](/developers-guide/contestant-app/pre-registration-and-invitation#asking-for-a-sign-in-link).

## Supabase Auth sends no mail

The auth service hands every mail it would send to a hook instead of sending it. `[auth.hook.send_email]` in `config.toml` names `public.send_email_hook` ([`301-auth-functions.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/301-auth-functions.sql)), a function that takes the mail and sends none. Only `supabase_auth_admin` may execute it, because the event it receives holds an address and a token. The application's two mails are sent by `account-access` alone, behind the database's checks, its limits and its own texts.

- **What the hook stops.** The auth service's own one-time-code, recovery, invitation and change-of-address mails. Nothing in the application asks the auth service itself to mail a one-time code, a recovery link, an invitation, a reauthentication or a change of address, and a test that needs a mail gets it through the Edge Function.
- **What it does not change.** What the auth service's endpoints answer; see [Known residuals](/developers-guide/backend/authentication#known-residuals).
- **A change of address** asked through the auth service gets no confirmation mail, so a user cannot complete one.
- **Confirmation.** `[auth.email]` sets `enable_confirmations = true` and `[auth]` sets `enable_signup = false`, so an address is confirmed only by a mailed link, or by the service role when it creates the user; see [Who can create an account](/developers-guide/backend/authentication#who-can-create-an-account).
- **A hosted project** adopts the hook in its dashboard; see [Auth settings of a hosted project](/developers-guide/deployment#auth-settings-of-a-hosted-project).

## The sign-in link

[`account-access`](/developers-guide/backend/edge-functions#account-access) mails one message, the sign-in link, when its `request-link` operation finds an address the database lets it mail.

- **Text.** The subject and body are fixed in the function, in five parts (the subject, the sentence before the link, the link, the sentences that say the link works once, that only the newest link works and where to ask for a new one, and the sentence for a recipient who did not ask), in seven locales (`da`, `en`, `et`, `fi`, `fr`, `lb` and `sv`), in [`mailTemplates.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/account-access/mailTemplates.ts). The request's `locale` picks one, and any other value gives `en`. The caller supplies no text, subject or sender.
- **Link.** The message holds one link, `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=magiclink`. Its origin is the function's `SITE_URL` and never a header of the request. A later link for the same address stops an earlier unopened one from working.
- **Limit.** The database allows one mail per address and project in 60 seconds, a sign-in mail and a recovery mail together.

## The recovery link

The `request-recovery` operation of `account-access` mails one of two messages, or none, as the database function `recovery_link_request` decides for the address:

- **An account that holds a grant in the project** is sent the recovery mail. Its link is `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=recovery`, minted for the existing account; no user is created. Whether the account has a password is not asked: opening the link stores none, and the page it leads to sets one.
- **An address with an open invitation whose registration mode is allowed, and no account,** is sent the sign-in mail, because it has no password to recover. The function does for it what a sign-in request does, and creates the user without a password.
- **Any other address** is sent nothing, and the caller's answer is the same.

The recovery mail is fixed in [`mailTemplates.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/account-access/mailTemplates.ts) in the same seven locales and the same five parts as the sign-in mail. Each locale's text names the control that asks for a new link by the label its message catalogue gives `contestantApp.login.forgotPassword`; `mailTemplates.test.ts` reads that label from the seven catalogues. A recovery link and a sign-in link share one slot per address, so a later link of either kind stops an earlier unopened one of either kind, and both mails say that only the newest link works.

- **SMTP.** The function reads the same SMTP variables as `send-email`, described below, and `SMTP_FROM` is the sender.

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

`send-email` and `account-access` read their SMTP settings from the function environment (see [Edge Functions](/developers-guide/backend/edge-functions#configuration)):

| Variable                 | Use                                                     |
| ------------------------ | ------------------------------------------------------- |
| `SMTP_HOST`, `SMTP_PORT` | the SMTP server; required                               |
| `SMTP_FROM`              | the sender address of every message; required           |
| `SMTP_USER`, `SMTP_PASS` | the SMTP credentials; set both for any real SMTP server |

The values in [`functions/.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/.env.example) point at the local email testing server and need no credentials:

```bash
SMTP_HOST=inbucket
SMTP_PORT=1025
SMTP_FROM=noreply@openvaa.org
```

Without `SMTP_USER` and `SMTP_PASS` a function also accepts a server certificate it cannot verify, which is meant only for the local testing server.

## Reading email locally

The local stack does not deliver email to real inboxes. Everything it sends, from `send-email` and from `account-access`, is caught by the email testing server configured in the `[inbucket]` section of `config.toml`. Read it in the server's web interface at [http://127.0.0.1:54324](http://127.0.0.1:54324) while the stack is running.
