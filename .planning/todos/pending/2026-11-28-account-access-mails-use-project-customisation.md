---
created: 2026-11-28
title: Use project customisation in account-access mail texts
area: supabase
tags: [contestant, admin, supabase, translations, improvement]
keywords: [email-templates, app-name, translation-overrides, account-access, edge-function]
source: "GitHub issue #758"
github_issues: [758]
files:
  - apps/supabase/supabase/functions/account-access/mailTemplates.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/schema/502-email-helpers.sql
  - packages/app-shared/src/data/schemas/storedCustomization.schema.ts
---

# Use project customisation in account-access mail texts

## Origin

Converted from GitHub issue [#758 feat[backend]: refactor email templates](https://github.com/openvaa/voting-advice-application/issues/758) on 2026-11-28.

## Problem

The `account-access` Edge Function's sign-in, recovery and address-confirmation mails are fixed texts in seven locales in `apps/supabase/supabase/functions/account-access/mailTemplates.ts`, because an Edge Function cannot import the frontend's Paraglide catalogues. They use generic product words; a publisher cannot put the VAA's name (`appName`) in them or override their wording the way `app_customization.translationOverrides` overrides frontend strings. The file carries a TODO about this. Mail locale comes from the request, not from a stored user preference.

## Solution

Expose `appName` (and possibly mail-specific overrides) in a place the function can read (e.g. `app_settings`/customization via a security-definer RPC), substitute it into the templates, and let translation overrides for mail keys replace the fixed sentences. Consider falling back to the user's stored preferred locale when the request names none. Keep the 'text and html from the same sentences' builder; update mailTemplates.test.ts.
