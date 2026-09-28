---
plan_id: 260531-t1d
title: Fix undefined login-password testId in candidateLoginPage fixture
status: complete
type: quick
created: 2026-05-31
completed: 2026-05-31
---

# Quick Task: Fix undefined login-password testId in candidateLoginPage fixture

## Description

The candidate mega-journey E2E spec failed at step "9. login: submit-disabled
empty + wrong password + correct password" with:

```
TypeError: Cannot read properties of undefined (reading 'unicode')
  at candidateLoginPage.fixture.ts:41   (enterPassword → page.getByTestId(...).fill(password))
  at candidateLoginPage.fixture.ts:50   (login → enterPassword)
  at candidate-mega-journey.spec.ts:395  (step 9: candidateLoginPage.login(EMAIL, PASSWORD_1))
```

### Root cause

Not a timing/race condition. The reported "logout dialog still visible in the
screencap but gone in the rendered view" was a misread of the trace — the page
snapshot shows the login page fully rendered with an empty, present password
field and a disabled submit button. The failure is a synchronous TypeError.

`candidateLoginPage.fixture.ts:41` called
`page.getByTestId(testIds.candidate.login.password)`, but **`testIds.candidate.login`
has no `password` key** (`tests/tests/utils/testIds.ts:13-23` defines only
`email`, `submit`, `errorMessage`, `answersLockedInfo`). So the argument was
`undefined`.

`getByTestId(undefined)` is the trigger: Playwright's `escapeForAttributeSelector`
sees a non-string and routes to `escapeRegexForSelector(undefined)`, which reads
`.unicode` on the value → `Cannot read properties of undefined (reading 'unicode')`.
(The `password` fill-argument itself, `PASSWORD_1 = 'OldPass!Word123'`, is a valid
string and is NOT the undefined value.)

The login form's password input is `<PasswordField>`
(`apps/frontend/src/routes/candidate/login/+page.svelte:173`), which hardcodes
`data-testid="password-field"` (`PasswordField.svelte:71`) — i.e.
`testIds.candidate.password.field`. The spec's own helper
`loginIfRedirectedToLoginPage` (spec line 226) already uses that correct path.
The fixture referenced a non-existent `login.password` key.

## Plan

- [x] Point `enterPassword` at the existing canonical testId
      (`testIds.candidate.login.password` → `testIds.candidate.password.field`)

## Files

- tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts
