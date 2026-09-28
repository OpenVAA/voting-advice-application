---
plan_id: 260531-t1d
status: complete
type: quick
created: 2026-05-31
completed: 2026-05-31
---

# Summary: Fix undefined login-password testId in candidateLoginPage fixture

## What changed

`tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts:41` — `enterPassword`
now locates the password input via `testIds.candidate.password.field` (value
`'password-field'`) instead of the non-existent `testIds.candidate.login.password`.

## Why

`testIds.candidate.login` has no `password` member, so the old reference was
`undefined`. `page.getByTestId(undefined)` makes Playwright treat the value as a
RegExp inside `escapeForAttributeSelector` → `escapeRegexForSelector(undefined)`,
which reads `.unicode` and throws `Cannot read properties of undefined (reading
'unicode')` — the exact error seen at candidate-mega step 9. The login form's
password input carries `data-testid="password-field"` (PasswordField.svelte:71),
the canonical `testIds.candidate.password.field`, already used by the spec helper
`loginIfRedirectedToLoginPage`.

This was a static missing-testId-key bug, deterministic — not the suspected
logout-dialog timing race.

## Verification

- Post-edit Read confirms line 41 references `testIds.candidate.password.field`
  and the file has zero remaining `login.password` references.
- Full E2E re-run of the candidate mega-journey still requires a live `yarn dev`
  stack and was not executed in this session.

## Follow-ups

- Re-run `yarn test:e2e` (candidate mega-journey) against a live stack to confirm
  step 9 logs in successfully end-to-end.
- Optional hardening: the same crash class recurs for any fixture that references
  a missing `testIds.*` key. A typed accessor or a unit test asserting every
  fixture testId path resolves to a string would catch these at lint time.
