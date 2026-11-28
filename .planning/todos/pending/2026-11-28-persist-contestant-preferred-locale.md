---
created: 2026-11-28
title: Persist contestant's preferred locale in user metadata
area: frontend
tags: [contestant, frontend, supabase, translations, bug]
keywords: [preferred-locale, user-metadata, send-email, user-settings, language]
source: "GitHub issue #569"
github_issues: [569]
files:
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/supabase/supabase/schema/502-email-helpers.sql
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte
---

# Persist contestant's preferred locale in user metadata

## Origin

Converted from GitHub issue [#569 refactor: make appLanguage property of User not Candidate](https://github.com/openvaa/voting-advice-application/issues/569) on 2026-11-28.

## Problem

A signed-in user's language is meant to live on the auth user, not on the entity, but the two readers disagree and no writer exists:

- `SupabaseDataWriter.getBasicUserData` reads `user.user_metadata.language` (default `'en'`) into `BasicUserData.language`.
- `resolve_email_variables` (`apps/supabase/supabase/schema/502-email-helpers.sql`) returns `COALESCE(raw_user_meta_data->>'preferred_locale','en')`, which the `send-email` Edge Function uses to pick a template per recipient.
- Nothing writes either key; `updateUserSettings` in `dataWriter.type.ts` is a commented-out TODO, and the Contestant App settings page has no language control.

Result: admin-sent bulk emails ignore the recipient's language. (Original issue #569 also allowed simply dropping a language setting and relying on the browser locale; the mail path is the part that cannot rely on the browser.)

## Solution

Pick one metadata key (e.g. `preferred_locale`) and use it in both readers. Write it automatically when a contestant signs in / changes UI language (from the Paraglide locale), or via an explicit setting in the Contestant App settings page through a new `updateUserSettings` writer method. Validate against supported locales.
