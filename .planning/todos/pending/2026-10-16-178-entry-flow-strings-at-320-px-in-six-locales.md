---
created: 2026-10-16T00:00:00.000Z
title: Look at the entry flow's new sentences and its two long button labels at 320 px in da, et, fi, fr, lb and sv
area: apps/frontend - contestant entry flow (manual check)
severity: minor
source: Phase 178 (plan 178-23; the UI contract's two long-text backstop rows and item N-2; 178-22-SUMMARY.md § For a person)
files:
  - apps/frontend/messages
  - tests/tests/specs/contestant/contestant-entry-phone.spec.ts
---

## What to do

At 320 px wide (a phone, or a desktop browser's device mode), in each of `da`, `et`, `fi`, `fr`, `lb` and `sv`, open every screen of the entry flow: the login screen, the sign-in screen, the registration screen with each option open, the screen that asks for the address of a valid code, the code sign-in, the "email sent" screen (with a long address), forgot-password, the set-password view and the reset page.

## What to look for

- Every sentence, label, option name and button label renders without clipping or overlap, and the page does not widen.
- The long text buttons, "I have not set a password yet" and "Use another email address" in each locale, wrap inside the button (item N-2: `Button` is `flex-nowrap` and DaisyUI's `.btn` sets no `white-space`).
- The set-password form's main button while the password is not valid reads the whole sentence "The password does not meet the requirements above." (50 characters in English, more in French): does it wrap inside the button?
- Also seen by nobody yet: `ErrorMessage inline` centred under start-aligned labels; the forgot-password link announced as a button (`Button` with an `href` renders `role="button"`); the code sign-in's long refusal sentence; the login screen's footer placed last in its actions; the reset page's support button under the main button.

`contestant-entry-phone` measures these screens for overflow at 320 and 390 px in `en` only; the identity-provider panel at phone width is not measured (the base dataset does not allow that mode).
