---
created: 2026-10-16T00:00:00.000Z
title: Walk the whole entry flow by keyboard alone and with a screen reader, in en
area: apps/frontend - contestant entry flow (manual a11y check)
severity: minor
source: Phase 178 (plan 178-23; the UI contract's backstop row on keyboard and screen-reader use)
files:
  - apps/frontend/src/routes/contestant/login/+page.svelte
  - apps/frontend/src/routes/contestant/register/+page.svelte
  - apps/frontend/src/routes/contestant/email-sent/+page.svelte
  - apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte
---

## What to do

A person, in `en`, with the keyboard alone and then with a screen reader (VoiceOver with Safari, or NVDA with Firefox or Chrome):

1. From the login screen, register with a code: choose the code option, type a valid code, enter the address twice with a mismatch, correct it, and continue.
2. On the "email sent" screen, wait for the count and use "Send again"; open the mailed link.
3. Set a password on the set-password view, accept the terms, reach the home, log out.
4. Sign in again on the sign-in screen.

## What to look for

- Every control is reached in a sensible order and operated without a pointer; focus moves to each screen's heading after a navigation and is not lost.
- The mode selector's radios are one tab stop, moved and chosen with the arrow keys; only the chosen panel is in the document.
- Each field's error is announced (`role="alert"`) and the field is described by it; the first field in error takes focus.
- "Send again" stays a tab stop while unavailable, is announced as unavailable, and the countdown that describes it is read.
- The set-password view's address is announced with its label, and a failed save is announced.

axe scans every entry screen in both themes (`contestant-entry-scan`, `contestant-a11y-scan`); this check is what axe cannot do. Record the reader, browser and versions.
