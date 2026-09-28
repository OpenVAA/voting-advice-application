---
quick_id: 260531-vdn
slug: tou-fixture-fail-fast-on-disabled-submit
date: 2026-05-31
---

# Quick Task: ToU fixture — fail fast on stuck-disabled submit

## Problem

`candidateTermsOfUsePage.acceptAndAdvance()` clicks the terms checkbox then
immediately calls `getSubmit().click()`. The submit button is `disabled` until
the checkbox toggle propagates. Playwright's `.click()` auto-waits for the
element to become actionable (enabled), retrying against the **90s per-test
timeout** (no `actionTimeout` is set in `playwright.config.ts`). A genuinely
stuck-disabled button therefore produces a ~346× "retrying click action /
element is not enabled" dump before failing — burning the full test timeout
and obscuring the real cause.

Reported trace:
```
- locator resolved to <button disabled ... data-testid="terms-of-use-submit">
- attempting click action
  346 × waiting for element to be visible, enabled and stable
    - element is not enabled
  - retrying click action
    - waiting 500ms
  at fixtures/candidate/candidateTermsOfUsePage.fixture.ts:59
```

## Fix

In `acceptAndAdvance()`, assert `expect(getSubmit()).toBeEnabled()` before
clicking. The assertion polls against the **bounded expect timeout** (5s
default — no `expect.timeout` override) instead of the 90s action/test
timeout, so a stuck-disabled button fails fast with a clear
"expected enabled, received disabled" message rather than a click-retry dump.

This mirrors the disabled→enabled spec flow already documented in the file
header (lines 13–17) and is fully compliant with the Phase 88 rigidity
contract (hard assertion — no `expect.soft`, no `try/catch`, no `.catch()`).

## Files

- `tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts`
  - Add `expect` import.
  - Add `await expect(this.getSubmit()).toBeEnabled()` before the click in
    `acceptAndAdvance()`.

## Verification

- `npx eslint` on the changed file → clean.
