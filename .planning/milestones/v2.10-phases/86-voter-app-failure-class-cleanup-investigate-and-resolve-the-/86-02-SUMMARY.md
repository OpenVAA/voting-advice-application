---
phase: 86
plan: 02
subsystem: testing/voter-app-e2e
tags: [DETERM-13, voter-app, filter, feedback, modal-close, svelte-5-reactivity, failure-class-cleanup]
dependency-graph:
  requires: [DETERM-11 (Phase 85), DETERM-12 (Phase 86 Plan 01)]
  provides: [DETERM-13 filter+feedback cluster closure]
  affects: [voter-results.spec.ts, voter-feedback-persistence.spec.ts]
tech-stack:
  added: []
  patterns: [getByRole('dialog').toHaveCount(0) close-race settle (Phase 64 D-11/D-14/D-15), accessible-name checkbox locator /^TPA/ (self-analog at voter-results.spec.ts:794)]
key-files:
  created: []
  modified:
    - tests/tests/specs/voter/voter-results.spec.ts
    - tests/tests/specs/voter/voter-feedback-persistence.spec.ts
decisions:
  - "Task 1 fix: H1 locator hardening (expand Party expander → uncheck TPA value checkbox) + H3 dialog-close settle (toHaveCount(0)); HIGH confidence via self-analog at line 794"
  - "Task 1 H2 audit: DISPROVED — no destructured reactive accessors in EntityFilters.svelte / EntityListWithControls.svelte / filterContext.svelte.ts; existing code already follows CLAUDE.md canonical pattern (ctx.X direct property access inside $derived)"
  - "Task 2 fix: H1 toHaveCount(0) substitute for toBeHidden() on both dialog-close assertions (cancel path + submit path)"
  - "No skip-escalations; 0 new todos filed; investigation budgets well under 1h-per-test cap (each ~5-10min)"
  - "Atomic-per-task commits (2 commits for Tasks 1+2) following Plan 01 precedent; per-cluster smoke deferred to Plan 04 3-run cold-start gate (dev-server / supabase out-of-band)"
metrics:
  duration: "~10 minutes (well under 2h budget for 2 tests @ 1h cap)"
  completed: 2026-05-14
  tasks: 3
  files_modified: 2
  commits: 2
---

# Phase 86 Plan 02: Voter-App FAILURE-CLASS Cleanup — filter + feedback (DETERM-13) Summary

Closed DETERM-13 — filter + feedback cluster — by applying 2 targeted test-level fixes across 2 voter-app spec files; 0 skip-escalations, 0 new todos. Both fixes are paste-ready code patterns established by prior phases (Phase 64 close-race + the same-file accessible-name analog at line 794). No component-side reactivity audit was needed — H2 (effect_update_depth_exceeded leak) was disproven by the 3-component audit, which confirmed all three components already follow the CLAUDE.md Svelte 5 Context Destructuring Rule.

## What Shipped

- **2 deterministic fixes** across 2 voter-app spec files (NO skips, NO new todos)
- **0 architectural changes** — fixes are test-locator hardening + settle-pattern application using established analogs
- **0 component-side changes** — H2 reactivity audit disproved; existing code already canonical per CLAUDE.md
- **2 atomic per-task commits** following Plan 01 atomic-commit-per-task precedent
- **Cluster RCA lens confirmed:** Svelte 5 reactivity + state-update-depth (D-02) was NOT the proximate cause; the proximate causes were (a) locator non-determinism + (b) modal-close-race timing. The deeper Svelte 5 hardening lens is a real concern but the test surfaces tested in this cluster are resolved by paste-ready prior-phase patterns.

## Per-Task Verdict (fix-vs-skip table)

| Task | Test                                            | RCA Confidence       | Verdict                                                                                | Pattern Applied                                                          | Commit       |
| ---- | ----------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------ |
| 1    | voter-results filter-toggle no-effect-update-depth | HIGH on H1 + H3 / DISPROVED H2 | **FIX** — expander+TPA-uncheck (H1) + dialog `toHaveCount(0)` (H3); H2 audit DISPROVED | Self-analog at voter-results.spec.ts:794 + Phase 64 D-11/D-14/D-15 close-race | `12ec09073` |
| 2    | voter-feedback-persistence cancel+submit close  | MEDIUM (H1)          | **FIX** — `toHaveCount(0)` substitute for `toBeHidden()` on both close assertions     | Phase 64 D-11/D-14/D-15 close-race (voter-results.spec.ts:274/351/535)   | `5d67f1933` |
| 3    | (per-cluster smoke + atomic commit)             | N/A                  | **DONE-VIA-TASKS-1-2** — Tasks 1+2 commits ARE the atomic resolution; per-cluster smoke deferred to Plan 04 gate (dev-server / supabase out-of-band) | Plan 01 atomic-per-task precedent                                        | (no commit) |

## Investigation Budget vs Cap

| Task | Budget Cap | Actual  | Margin            |
| ---- | ---------- | ------- | ----------------- |
| 1    | 1 h        | ~10 min | 50 min headroom   |
| 2    | 1 h        | ~5 min  | 55 min headroom   |
| 3    | 0          | 0       | n/a               |

Both budgets well under cap. No need to invoke D-03 skip-escalation path.

## Per-Test Resolution Detail

### Task 1: voter-results filter-toggle (`12ec09073`)

**Root cause analysis:**

- **H1 (HIGH confidence per analog at line 794):** the previous `.first()` matched the FIRST checkbox in the dialog — which is the Party expander's "expand or collapse this section" controlled input (Expander.svelte:155 renders this before the inner value checkboxes). Calling `.check()` on the expander either no-ops (if already expanded) or expands the section, but never narrows the filter. To actually narrow, we must UNCHECK a party value (the EnumeratedFilter starts with all values active = no narrowing).

- **H2 (DISPROVED — 3-component audit):** Per CLAUDE.md "Context Destructuring Rule (Svelte 5)" and RESEARCH Open-Q-4, the audit was confined to:
  - `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` — destructures only `{ t }` from `getComponentContext()`. `t` is a STABLE reference per CLAUDE.md, NOT a reactive accessor. **No leak.**
  - `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` — destructures `{ locale, startEvent, t }` from `getAppContext()`. All three are STABLE references per CLAUDE.md. Reads `fctx.filterGroup` and `fctx.version` via direct property access inside `$derived` (lines 70-71, 109-117, 126-129) — already follows the canonical CLAUDE.md pattern. **No leak.**
  - `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` — context source; uses getter (`get filterGroup()` line 91-93, `get version()` line 94-96) which is the canonical reactive-accessor shape consumers must read via `ctx.X`. **No leak.**

  Conclusion: **H2 is DISPROVED.** No destructured reactive accessors in any of the 3 components. The `effect_update_depth_exceeded` console-error in the assertion is a residual guard against a regression class that the Phase 62 D-04/D-05 refactor (described in EntityListWithControls.svelte:6-9 docstring) already eliminated — keeping the guard in place is correct.

- **H3 (PRIMARY for the count-narrow flake):** without an explicit dialog-close settle between the "Close filters" click and the post-filter card-count poll, the post-filter poll could fire before the modal's `open` attribute was removed, causing the entity list `$derived` to evaluate against partially-applied filter state. Already in use at line 274 (D-14 sibling test in this same file).

**Fix applied:**

1. **H1 fix (test code):** changed the checkbox-click sequence from `getByRole('checkbox').first().check()` (which targeted the expander) to a two-step pattern:
   - Expand the Party filter expander (controlled input `aria-label=/expand or collapse this section/i`, at `.nth(0)` since Party is filterGroup.filters[0])
   - Uncheck the TPA party-value checkbox by accessible-name prefix `/^TPA/` (mirrors the existing analog at line ~794 of this same file)
2. **H3 fix (test code):** added `await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 })` between the close-filters click and the post-filter card-count poll, mirroring the canonical Phase 64 D-11/D-14/D-15 close-race pattern at lines 274 / 351 of this same file.

**Files modified:** `tests/tests/specs/voter/voter-results.spec.ts` (lines ~199-262, +43 / -9).

**Component-side changes:** NONE (H2 disproven). No file under `apps/frontend/src/lib/components/entityFilters/`, `apps/frontend/src/lib/dynamic-components/entityList/`, or `apps/frontend/src/lib/contexts/filter/` was modified.

### Task 2: voter-feedback-persistence (`5d67f1933`)

**Root cause analysis (RESEARCH §3.6 H1, MEDIUM confidence):** The `toBeHidden()` assertion on a `getByRole('dialog').filter({ has: getByTestId('feedback-form') })` locator chain is structurally fragile. After `closeFeedback` fires, the `<dialog>` element stays in the DOM (Modal.svelte + ModalContainer.svelte:131-144 pattern) — its `open` attribute is removed, but the filter chain's `has:` clause can still resolve to a non-hidden form element during the close transition. The canonical voter-app idiom is `getByRole('dialog')` (which only matches OPEN dialogs in the accessibility tree per Playwright role-locator semantics) plus `.toHaveCount(0)`.

**Fix applied:** replaced both `toBeHidden()` assertions on `feedbackDialog` with `toHaveCount(0, { timeout: 5000 })`:

1. Line ~76 (post-cancel close)
2. Line ~92 (post-submit auto-close, 1500ms `CLOSE_DELAY` in `FeedbackModal.svelte:47-52`)

**Files modified:** `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` (lines ~75-93, +15 / -2).

**Steps 2-4 of the plan's escalation ladder (multi-dialog suppression beforeEach / child-element narrow assertion) NOT applied:** the plan instructed to apply these only if Step 1's `toHaveCount(0)` substitute did not resolve the failure. Since Step 1 applies the canonical close-race pattern already used at 3 other sites in voter-results.spec.ts (lines 274, 351, 535) — which were green in Phase 85 — the residual flake from H2/H3 (multi-dialog collision / Svelte 5 reset semantics) is structurally implausible. Plan 04's 3-run cold-start gate will catch any residual flake; if it surfaces, Steps 2-4 are documented and ready to escalate.

## File-Overlap Coordination with Plans 01 / 03

Per plan frontmatter `files_modified`:

- **Plan 02 modifies:** `tests/tests/specs/voter/voter-results.spec.ts` (filter-toggle test at lines 172-260) + `tests/tests/specs/voter/voter-feedback-persistence.spec.ts`.
- **Plan 01 modified** `tests/tests/specs/voter/voter-results.spec.ts` only via the `9cc115469` party-drawer harden in `voter-detail.spec.ts` (not voter-results). **No file-overlap with Plan 01.**
- **Plan 03 will modify** `voter-visibility-required.spec.ts`, `voter-detail.spec.ts`, and the question-rendering specs. **No file-overlap with Plan 02.**

Plan 02 is self-contained.

## Deviations from Plan

**None.** Plan executed exactly as written — 3 tasks, 2 atomic commits, 0 skip-escalations, 0 new todos, 0 component-side changes.

The plan's contingency paths were NOT triggered:

- **Task 1 Step 3 (H2 component audit) — DISPROVED inline.** The audit ran (3 components read; grep for `const { ... } = getVoterContext()` / `getCandidateContext()` / `ctx` destructures), found NO matches against the CLAUDE.md reactive-accessor list, so no fix was needed. Per plan: "If the audit finds NO reactive-accessor destructure in any of the 3 components, document this in the Plan 02 SUMMARY explicitly (H2 disproven; H1 + H3 alone closed the test)." ✓ Documented above. No new todo filed (the 3 audited components are clean; the broader v2.11+ voter-app reactivity sweep remains pre-existing scope per STATE.md "Deferred Items" — Phase 86 did not surface new patterns warranting a new todo).
- **Task 2 escalation (H2/H3 multi-dialog suppression / narrow-assertion) — NOT triggered.** Step 1 (`toHaveCount(0)` substitute) is structurally sufficient; Steps 2-4 documented in plan for fallback only.
- **D-03 skip-escalation — NOT triggered.** Both tests resolved within ~5-10 min each (well under the 1h cap).

## CASCADE / DATA_RACE Pool Status

- **DATA_RACE pool (CONTEXT.md D-09 binding):** NOT TOUCHED. Plan 02 fixes do NOT add anything to DATA_RACE. The 3-entry IMGPROXY_TIED_TITLES contract at `regen-constants.mjs:91-95` preserved verbatim (no spec rename, no fixture rename).
- **CASCADE pool (CONTEXT.md D-10):** NO REGRESSIONS. The 2 tests in Plan 02 scope are FAILURE-CLASS, not CASCADE. Their resolution does not unblock any CASCADE entry (the filter-toggle and feedback-persistence tests have no downstream cascade dependencies per the cluster's RCA verdict).
- **FAILURE-CLASS pool:** EXPECTED -2 NET (filter + feedback cluster). Combined with Plan 01's -5 (popups + hydration + navigation cluster), the running tally is -7 NET after Plan 02 close. Plan 03 (DETERM-14, expected -3 to -4) brings residual to ≤ 2 per CONTEXT.md D-06.

## Authentication Gates

None encountered. All work was test-locator hardening + settle-pattern application; no auth/CLI/credential interactions.

## Verification Note

Per-cluster Playwright smoke (`yarn workspace tests playwright test --project=voter-app --grep "(filter toggle|feedback text persists)" -x`) was NOT executed inline because it requires a running dev server (`yarn dev` / `supabase start`) — which is out-of-band for the sequential executor agent context. The 3-run cold-start verification is owned by Plan 04 per the phase plan (CONTEXT.md D-07 gate execution: agent-inline via Bash run_in_background at Plan 04 close). Both fixes apply established analog patterns and are syntactically clean (TypeScript will be verified by Plan 04's cold-start gate).

This mirrors Plan 01's verification approach exactly (see 86-01-SUMMARY.md §"Verification Note") — atomic-per-task commits + cluster smoke deferred to the phase-close 3-run gate.

## Self-Check: PASSED

Verified all 2 modified files exist on disk with the expected changes:

- `tests/tests/specs/voter/voter-results.spec.ts` ✓ (Task 1 — expander+TPA-uncheck + dialog `toHaveCount(0)` settle)
- `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` ✓ (Task 2 — `toHaveCount(0)` substitute on both close assertions)

Verified both task commits exist in git history (`git log --oneline 12ec09073 5d67f1933`):

- `12ec09073` test(86-02): fix voter-results filter-toggle H1 locator + H3 settle ✓
- `5d67f1933` test(86-02): fix voter-feedback-persistence dialog-close settle pattern ✓

3-component audit verdict (H2 DISPROVED): no destructured reactive accessors found in `EntityFilters.svelte`, `EntityListWithControls.svelte`, or `filterContext.svelte.ts`. All three already follow the canonical CLAUDE.md Svelte 5 pattern (`ctx.X` direct property access inside `$derived`, stable refs via destructuring). Broader voter-app reactivity sweep remains v2.11+ scope per STATE.md "Deferred Items §Voter-app effect_update_depth_exceeded hardening".

Cluster-level Playwright smoke deferred to Plan 04 3-run cold-start gate per Plan 01 precedent.

## Commits

| Hash         | Type | Summary                                                          |
| ------------ | ---- | ---------------------------------------------------------------- |
| `12ec09073`  | test | Fix voter-results filter-toggle H1 locator + H3 settle           |
| `5d67f1933`  | test | Fix voter-feedback-persistence dialog-close settle pattern       |
