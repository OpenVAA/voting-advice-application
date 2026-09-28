---
created: 2026-06-07T05:47:27.876Z
title: Hide forgot-password email input after submitting
area: frontend
files:
  - apps/frontend/src/routes/candidate/forgot-password/+page.svelte
---

## Problem

On the candidate "forgot password" page, after the user submits the form and the
reset email request succeeds, the email input field stays visible alongside the
success message. Once the request has been sent there's nothing more for the user
to do on this form, so leaving the input (and submit button) visible is confusing
and invites a redundant re-submit.

Expected: after a successful submission, hide the email input (and likely the
submit button) and show only the success/confirmation message.

Current behaviour: the form uses `let status = $state<ActionStatus>('idle')` and
flips to `'success'`/`'loading'` etc., but the `<input>` is not gated on that
status — it renders regardless of state.

## Solution

Gate the email input (and submit button) on `status`: render the input only while
`status !== 'success'`, and show the `SuccessMessage` in its place once the request
succeeds. Confirm focus management / a11y (move focus to the success message;
keep WCAG 2.1 AA). Mirror the same pattern on any sibling auth forms if they share
the issue.
