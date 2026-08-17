---
phase: 128-svelte-check-0-long-tail-tests-docs
plan: 04
subsystem: frontend-a11y
tags: [a11y, svelte-check, wcag, tooltip, carousel]
requires: [128-01, 128-02, 128-03]
provides: [svelte-check-zero-warnings-frontend, svelte-check-zero-docs]
affects: [apps/frontend, apps/docs]
tech-stack:
  added: []
  patterns: [w3c-apg-tooltip-trigger, aria-role-group-carousel]
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/term/Term.svelte
    - apps/docs/src/routes/+page.svelte
decisions:
  - "Term.svelte trigger reworked from noninteractive role=term to interactive role=button (W3C APG tooltip pattern) — the honest, lint-clean way to justify tabindex=0 for focus-on-focusin tooltip UX (Assumption A3)."
  - "Docs carousel <section> annotated with role=group (not role=region) — region is the implicit role of <section> and would trigger a11y_no_redundant_roles."
metrics:
  duration: ~3m
  completed: 2026-07-16
  tasks: 2
  files: 2
requirements: [TYPE-09]
status: complete
---

# Phase 128 Plan 04: Long-tail a11y svelte-check warnings Summary

Fixed the two remaining a11y svelte-check warnings at the markup source (D-06, no acceptance comments), driving both `apps/frontend` and `apps/docs` to exactly 0 errors / 0 warnings ahead of the Phase 132 gate flip (TYPE-09).

## What Was Built

Two source-level accessibility fixes:

1. **Term.svelte** — the inline definition-tooltip trigger paired a noninteractive `role="term"` with `tabindex="0"`, which svelte-check flags as `a11y_no_noninteractive_tabindex` (a noninteractive element must not be keyboard-focusable). Reworked the trigger to `role="button"`, the W3C APG tooltip-trigger pattern: an interactive role legitimately owns `tabindex="0"`, its accessible name comes from the rendered term text (children), and `aria-describedby` links the definition popup while shown. Focusability, the `data-testid="voter-questions-term-trigger"` E2E selector, and the whitespace-FLUSH inline markup are all preserved. The component doc comment was updated from the stale "Uses the `term` and `definition` roles" to describe the button/tooltip semantics.

2. **apps/docs +page.svelte** — the hero swipe-carousel `<section>` carries `ontouchstart`/`ontouchend` handlers, which svelte-check flags as `a11y_no_static_element_interactions` (a `<section>` with touch handlers needs an ARIA role). Added `role="group"` + `aria-label="OpenVAA screenshot showcase"` to declare the region semantics. The touch handlers remain progressive enhancement; the existing accessible prev/next and per-screenshot `<button>`s are untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] role=region on `<section>` triggered a11y_no_redundant_roles**
- **Found during:** Task 2
- **Issue:** The plan suggested `role="group"` *or* `role="region"`. The initial `role="region"` cleared the static-element-interactions warning but immediately introduced a new `a11y_no_redundant_roles` warning at 93:3 — because a `<section>` with an accessible name already has an implicit `region` role.
- **Fix:** Switched to `role="group"`, which is not the implicit `<section>` role and is semantically appropriate for a carousel grouping. Docs svelte-check then reported 0/0.
- **Files modified:** apps/docs/src/routes/+page.svelte
- **Commit:** 2dd5f42e5

## Design Decisions (Assumption A3 resolution)

- **Term.svelte role choice:** chose `role="button"` over "drop the role entirely." A bare focusable `<span>` carrying focus/mouse handlers risks tripping `a11y_no_static_element_interactions` (the same rule fixed in Task 2), and `role="button"` is the canonical APG pattern for a tooltip trigger — it honestly declares the element as an operable, focus-revealing control. The accessible name is supplied by the term text content, so no redundant `aria-label` was added. The invariant held: focusable + testid + whitespace-FLUSH preserved, no acceptance comment.

## Verification

- `cd apps/frontend && yarn check`: **0 ERRORS / 0 WARNINGS** (Term.svelte 91:1 warning cleared; was 0/1).
- `cd apps/docs && yarn check`: **0 ERRORS / 0 WARNINGS** (+page.svelte 91:1 warning cleared; was 0/1).
- No net-new errors or warnings anywhere.
- Full E2E run (Plan 05) plus an advisory keyboard/visual sanity check are the remaining safety net for the Term.svelte DOM change (shared voter/candidate component).

## Known Stubs

None.

## Self-Check: PASSED
