---
created: 2026-10-16T00:00:00.000Z
title: Read the sign-in screen, the set-password view, the reset page and the code sign-in with two browsers and one password manager
area: apps/frontend - contestant entry flow (manual check)
severity: minor
source: Phase 178 (plan 178-23; the UI contract's backstop row on password managers and item N-6)
files:
  - apps/frontend/src/routes/contestant/login/email/+page.svelte
  - apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte
  - apps/frontend/src/routes/contestant/password-reset/+page.svelte
  - apps/frontend/src/routes/contestant/register/sign-in/+page.svelte
  - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte
---

## What to do

A person, in two browsers (for example Chrome and Safari or Firefox) and with one password manager (a browser's own or a separate one), on a local stack or a deployment:

1. On the sign-in screen (`/contestant/login/email`), sign in from a saved account.
2. Register through a mailed link and save the new password on the set-password view; then, from a recovery link, save another on the reset page.
3. On the code sign-in screen (`/contestant/register/sign-in`, reached by entering a used code on the registration screen), fill the password from an earlier save.
4. On the registration screen's code field, check that nothing is offered.

## What to look for

- The saved entry is stored under the account's address: `PasswordSetter` holds the address in a read-only field that is not rendered (no space, no tab stop, not in the accessibility tree), the form Chromium documents. Which managers pair a `display: none` user-name field is item N-6 and was never tried; the visible-field fallback is located in `PasswordSetter.svelte` alone.
- A save made without a full navigation (the gate and the reset page rerun the loads client-side) is still offered for saving.
- The code sign-in has no address field by design; check what the manager does with a password field alone.
- Nothing is offered on the code field.

Record each browser, manager and version with what it did. No automated test covers this.
