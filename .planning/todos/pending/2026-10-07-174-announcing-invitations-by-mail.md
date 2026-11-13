---
created: 2026-10-07T12:53:29.000Z
title: Announcing invitations by mail - seeding an invitation sends nothing, and nothing tells the invited person
area: Admin app / email
severity: major
source: Phase 174 (174-CONTEXT.md decision D-12, 174-C4, obligation O-10; the roadmap assigns the todo to Phase 174; filed by 174-10)
owner: the Admin App's seeding screens
files:
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/supabase/supabase/schema/502-email-helpers.sql
---

## Problem

`create_invitations` creates rows and sends nothing. The invited person learns that they are invited, or what their code is, only if the administrator tells them by a channel outside the application. No part of the product can do it for them:

- `send-email` takes `recipient_user_ids`, and `resolve_email_variables` returns only users who hold a grant in the project. An invited person has no account until they ask for a link, and no grant until they claim.
- `account-access` mails a sign-in link only when somebody asks for one, and the link expires within the hour (`otp_expiry = 3600` locally) and stops working when a later one is issued. A mail sent at seed time that carried such a link would be dead before most recipients opened it.

The Publishers' Guide says so on the candidates-and-parties page, and tells the publisher to inform the candidates themselves.

## Solution

Belongs beside the Admin App's screens for seeding invitations:

- A mail that announces the invitation without a sign-in token: it names the application and the page where the invited person asks for their own link (or enters their code), in the recipient's locale.
- It is sent to an address that has no account, so it cannot go through `send-email` as that function stands. Either a new operation of `account-access` callable with an administrator's token and gated by `user_can`, or a seeding-side function that reads the just-created rows.
- A reminder to invited people who have not claimed is the same mail, selected by `claimed_at IS NULL`.
- Texts in all seven locales (`da`, `en`, `et`, `fi`, `fr`, `lb`, `sv`), as the sign-in mail has them.
