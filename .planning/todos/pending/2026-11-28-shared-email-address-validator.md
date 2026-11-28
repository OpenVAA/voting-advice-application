---
created: 2026-11-28
title: Share one email address validator across apps and functions
area: frontend
tags: [contestant, admin, frontend, supabase, app-shared, improvement]
keywords: [email-validation, tld, app-shared, account-access, email-field]
source: "GitHub issue #762"
github_issues: [762]
files:
  - apps/frontend/src/lib/components/emailField/EmailField.svelte
  - apps/frontend/src/lib/components/emailEntry/EmailEntry.svelte
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/supabase/supabase/functions/account-access/contract.ts
  - packages/app-shared/src/utils
---

# Share one email address validator across apps and functions

## Origin

Converted from GitHub issue [#762 feat: more restrictive email validation](https://github.com/openvaa/voting-advice-application/issues/762) on 2026-11-28.

## Problem

Email addresses are validated in three different ways: the sign-in `EmailField`/`EmailEntry` use the browser's `checkValidity()` (accepts addresses without a TLD such as `aa@aa`), `Input` type `email` uses its own `EMAIL_REGEX`, and the `account-access` Edge Function's request contract only checks length and the presence of '@'. Password rules, by contrast, have one shared implementation.

## Solution

Add an `isValidEmail` (requiring a dotted domain, no whitespace, sensible length, possibly restricted characters) to `@openvaa/app-shared`, use it in EmailField/EmailEntry/Input, and restate or import it in the Edge Function (Edge Functions cannot import workspace packages; mirror it in `functions/_shared` with a parity test). Related: GitHub issue #822 on restricted characters in addresses.
