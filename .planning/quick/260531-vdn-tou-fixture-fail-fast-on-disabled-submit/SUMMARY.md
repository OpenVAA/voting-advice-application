---
quick_id: 260531-vdn
slug: tou-fixture-fail-fast-on-disabled-submit
date: 2026-05-31
status: complete
---

# Summary

Replaced the bare `getSubmit().click()` in `acceptAndAdvance()` with a
`toBeEnabled()` assertion + click. A stuck-disabled submit button now fails at
the bounded 5s expect timeout with a clear message, instead of burning the 90s
per-test timeout in a ~346× click-retry loop.

## Changed

- `tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts`
  - Added `import { expect } from '@playwright/test'`.
  - `acceptAndAdvance()`: `await expect(this.getSubmit()).toBeEnabled()` before click.

## Verification

- `npx eslint` on changed file → exit 0, clean.

## Notes

- Root cause of a stuck-disabled button (if it recurs) is upstream reactive
  lag between the checkbox toggle and the submit's `disabled` binding — this
  task only makes the failure fast and legible, not the underlying race.
- Did not lower `actionTimeout` globally; the targeted assertion is narrower
  and preserves the documented disabled→enabled contract.
