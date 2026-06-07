---
created: 2026-06-07T05:47:27.876Z
title: Supabase email link not pointing to localhost in local dev
area: backend
files:
  - apps/supabase/supabase/config.toml:161-167
  - apps/supabase/supabase/templates/
---

## Problem

In local development, action links inside Supabase-generated auth emails (e.g.
forgot-password / password-reset, invite, confirmation) delivered to Inbucket
(http://127.0.0.1:54324) do not point at the local frontend
(http://127.0.0.1:5173). Clicking them lands on the wrong host, breaking the
local auth flow.

`config.toml` already sets:
- `site_url = "http://127.0.0.1:5173"`
- `additional_redirect_urls = ["https://127.0.0.1:3000", "http://127.0.0.1:5173/en/candidate/auth/callback"]`

so the discrepancy is somewhere between this config, the email templates, and the
`redirectTo` value the frontend passes when requesting the email. Possible causes
to check:
- the `redirectTo` argument passed by the adapter when calling
  `requestForgotPasswordEmail` / resetPasswordForEmail (may be hardcoded or use a
  prod/relative origin that doesn't resolve to localhost)
- custom email templates referencing `{{ .SiteURL }}` vs `{{ .RedirectTo }}` /
  `{{ .ConfirmationURL }}`
- `127.0.0.1` vs `localhost` mismatch causing the link host to differ from the
  dev server the user opens

## Solution

TBD — reproduce by triggering a reset email locally, inspect the actual link in
Inbucket, then trace which of (config `site_url`, frontend `redirectTo`, email
template) produces the wrong host and align them on the local frontend origin.
Confirm the chosen `127.0.0.1`/`localhost` form is used consistently.
