---
phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
reviewed: 2026-07-22T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - tests/tests/utils/voterNavigation.ts
  - tests/tests/specs/perm/perm-show-feedback-survey.spec.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 131: Code Review Report

**Reviewed:** 2026-07-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Phase 131 makes two narrow E2E-hardening edits: (1) `voterNavigation.ts` appends a
terminal answer-option `waitFor({ state: 'visible' })` after the existing `waitForURL`
in `navigateToFirstQuestion` to close a post-redirect navigation-timing race; (2)
`perm-show-feedback-survey.spec.ts` adds a new hard-assertion test (1b) for
feedback-text persistence across cancel→reopen.

Both changes are functionally sound and correctly avoid softening patterns (no
`expect.soft`, no try-catch, no `test.skip`). No correctness bug, security issue, or
data-loss risk was found (these are test-only files with no production/security
surface). Two quality/robustness concerns surfaced: a timeout-budget bucket that is
arguably under-provisioned for the very re-mount it guards, and a small deviation from
the file's own testid-registry rigidity contract. Neither blocks shipping.

## Warnings

### WR-01: Terminal settle uses the 2s `element` budget for a post-redirect re-mount

**File:** `tests/tests/utils/voterNavigation.ts:295-304`
**Issue:** The new settle waits for the answer option with `TIMEOUTS.element` (2_000ms).
Per `helpers/timeouts.ts:8-9`, the `element` bucket is explicitly defined as a wait
that "does NOT change the URL (e.g. an option mounts, a button enables)." But the
`// reason:` block on this very line documents that the wait exists precisely because
the `/questions → /questions/__first__` onMount redirect **detaches and re-mounts** the
answer option — i.e. this settle must absorb a route-transition + question-page first
render, not a pure element toggle. The immediately-preceding `waitForURL` deliberately
uses `TIMEOUTS.slowPage` (10s) because that redirect is cold-start-sensitive; capping
the subsequent re-mount settle at 2s risks re-introducing the same Phase-127 flake on
cold-start / loaded-CI runs, where the question page's first data-render can exceed 2s.
The budget is a semantic mismatch: a re-mount/render boundary is a `page`-class wait,
not an `element`-class one.
**Fix:**
```ts
// The answer option re-mounts after the /questions → /questions/<id> redirect,
// so budget for a route-transition/render boundary, not a pure element toggle.
await answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
```
If 2s is genuinely sufficient in practice, keep `element` but update the `// reason:`
annotation to justify the tight budget against cold-start render cost rather than
asserting "no URL change" (the redirect it guards is a URL change).

### WR-02: Test 1b introduces new raw testid string literals, bypassing the `testIds` registry

**File:** `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:85,89,95,96,100`
**Issue:** Test 1b locates elements with raw string literals `'feedback-description'`,
`'feedback-cancel'`, and `'feedback-form'`. None of these exist in
`tests/tests/utils/testIds.ts` (verified). The file's own rigidity contract states
"testid-only via `testIds`" (docstring line 38), and the surrounding tests reference
centralized keys (`testIds.shared.header.feedback`, `testIds.shared.feedbackPopup`,
etc.). `feedback-description` and `feedback-cancel` are net-new uncentralized anchors —
if the component testids drift, these silently break with no single registry to update,
and the contract violation is now duplicated (test 1 already used raw `'feedback-form'`,
which this test propagates and extends).
**Fix:** Add the anchors to `testIds.ts` (e.g. under a `shared.feedback` group:
`form: 'feedback-form'`, `description: 'feedback-description'`, `cancel:
'feedback-cancel'`) and reference `testIds.shared.feedback.description` etc. Or, if
raw literals are an accepted carve-out for this component, add a `// reason:` annotation
documenting the exemption (per the phase's `// reason:`-for-accepted-patterns convention).

## Info

### IN-01: Reopen click races the modal-close transition without an explicit settle

**File:** `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:96-100`
**Issue:** After asserting `feedback-form` is hidden, the test immediately re-clicks
`feedbackBtn`. If the modal dismiss animates a scrim/overlay that briefly outlives the
`toBeHidden()` pass, the reopen click could be transiently intercepted. Playwright's
click actionability auto-retries so this is unlikely to flake in practice, but the
pattern relies on implicit retry rather than an explicit post-dismiss settle. Low risk;
noted for consistency with the phase's flake-hardening intent.
**Fix:** Optional — no change required if the header button is never scrim-covered.
If a dismiss transition exists, await a brief stability signal (e.g. the scrim testid
hidden) before the reopen click.

---

_Reviewed: 2026-07-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
