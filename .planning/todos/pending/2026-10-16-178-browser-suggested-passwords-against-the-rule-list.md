---
created: 2026-10-16T00:00:00.000Z
title: Check that the password each of three browsers suggests on the set-password view passes the rule list as suggested
area: apps/frontend - contestant entry flow (manual check)
severity: minor
source: Phase 178 (plan 178-23; item N-7 and the UI contract's backstop row on a browser's suggested password)
files:
  - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte
  - apps/frontend/src/lib/utils/password-validation/passwordValidation.ts
---

## What to do

In three browsers (Chrome, Safari and Firefox), open the set-password view (a mailed sign-in link for an account with no password) and accept the browser's suggested password in the new-password field. Do the same on the reset page.

## What to look for

- The suggestion passes the rule list as suggested: at least 8 characters, an upper-case letter, a lower-case letter, a number and a symbol, and not containing the account's address.
- The field states the rules to the browser through `passwordrules` (`PasswordSetter`); check whether each browser honours it and what it suggests when it does not.
- The auth service requires 8 characters as well; a suggestion the rule list accepts is never refused by it.

Record each browser's version and one suggested password's shape (not the password itself). No automated test covers this.
