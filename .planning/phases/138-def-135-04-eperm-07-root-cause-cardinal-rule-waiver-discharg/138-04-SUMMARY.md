---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
plan: 04
subsystem: e2e-harness
tags: [e2e, navigation, diagnosis, negative-control, sveltekit, defect-fix]
status: complete

requires:
  - "138-03: the named root cause and the frozen forcing configuration"
  - "138-FORCED-REPRO.md §B.8/§C.8: the adversary and the isolated-construction instruction"
provides:
  - "138-NEGATIVE-CONTROL.md: the criterion-2 pair (pre-fix 5/5 fail, post-fix 5/5 pass, one adversary)"
  - "settleAfterClientNavigation + readNavigationLandmarkText: the shared DOM-settle for in-app navigations"
  - "138-DIAGNOSIS.md § Fix: the tier, the changed lines, and the mechanism link closed"
  - "The separate open item for the unlocalised ~4 s excursion, for plan 06's waiver discharge"
affects:
  - "138-05: the 16-run determinism batch now runs against the fixed settle"
  - "138-06: the waiver discharge must carry the mechanism-established/amplifier-not qualification"

tech-stack:
  added: []
  patterns:
    - "Settle on the DOM, not the URL (RESEARCH Pattern 1) — now shared by the walk and the instrument"
    - "Fixed-interval polling for predicates that must observe a busy renderer"

key-files:
  created:
    - .planning/phases/138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg/138-NEGATIVE-CONTROL.md
  modified:
    - tests/tests/helpers/navigation.ts
    - tests/tests/helpers/index.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/specs/voter/eperm07-term-trigger.spec.ts
    - .planning/phases/138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg/138-DIAGNOSIS.md

decisions:
  - "Fix tier: TEST-SIDE, chosen by the operator at a blocking checkpoint (D-06), not by the executor"
  - "The settle lives in a SHARED helper so the instrument witnesses the production path instead of holding a private copy of the defect"
  - "Stage 2 compares landmark TEXT, not attachment — the stale state is sometimes a surviving node with the previous question's content"
  - "Stage 2 does not settle on focus: measured, focus lands only after the View Transition finishes, making it a measurement of the animation"
  - "Stage 2 uses fixed-interval polling; rAF polling is starved exactly while the browser commits the swap"
  - "The ~4 s field excursion is recorded as a separate open item, NOT closed by this phase"

metrics:
  duration: ~75 min
  completed: 2026-08-13

actuals:
  tokens: 41000
  tasks: 3
  commits: 3
---

# Phase 138 Plan 04: Fix-Tier Decision, the Authorised Fix, and the Criterion-2 Pair Summary

The operator authorised a test-side fix at a blocking checkpoint; the walk's navigation settle now
waits for the destination DOM instead of the URL, and the criterion-2 negative-control pair is on the
record — pre-fix 5/5 failing, post-fix 5/5 passing, one adversary printed identically in both halves.

## What was built

**The decision (task 1).** The plan is `autonomous: false` because CONTEXT.md D-06 reserves the
test-side tier for the operator. The executor stopped at the checkpoint, presented the named mechanism
with its `file:line` chain, the forcing configuration and its run counts, the eliminations, and the two
different answers to "could a real user observe this?" — and did **not** select a tier. The operator
selected **test-side** with a recorded finding sentence, which is quoted verbatim in both
`138-NEGATIVE-CONTROL.md` § 7 and `138-DIAGNOSIS.md` § Fix.

**The pre-fix half (task 2).** Captured **before any edit existed in the tree**, at HEAD `360927495`
with `git status --porcelain tests/ apps/ packages/` empty — so the failing half cannot be a
reconstruction. 5 consecutive runs, 5 failures, every one non-degenerate (`element(s) not found` on the
term-trigger locator, with an `eperm07-state` annotation proving the walk reached the hop).

**The fix (task 3).** One shared settle in `tests/tests/helpers/navigation.ts`, consumed by both
`voter-journey.spec.ts` and the `eperm07-term-trigger` instrument:

1. The URL wait **no longer swallows its timeout** (`waitForURL(...).catch(() => null)` is gone), so a
   navigation that never happens fails at the settle, where it reads as a navigation problem.
2. A second stage waits for the page's navigation landmark — `[data-focus-on-nav] ?? h1`, mirroring the
   app's own `afterNavigate` focus target at `+layout.svelte:178-180` — to carry **different text** than
   the one navigated away from. That cannot be true until SvelteKit has run `root.$set(...)` at
   `client.js:1824`.

**The post-fix half (task 3).** 5 consecutive runs, 5 passes, at committed HEAD `e96e24a44`, under an
invocation block that is character-identical to the pre-fix one.

## Why this is a fix and not a widened window

The strongest objection to a test-side remedy is that it might just be a timeout bump wearing a
disguise — which D-07 rejects outright. Three facts answer it:

- **No budget value was edited.** `git diff --stat` over `tests/tests/helpers/timeouts.ts` between the
  two HEADs is empty, and `element: 2_000` is still present exactly once.
- **The tri-state inverts at the same probe point.** The forensic probe runs immediately after the
  settle and *before* the assertion, in both halves. Pre-fix it read
  `headingCount: 0, headingText: null, triggerCount: 0` in 5/5. Post-fix it reads `headingCount: 1`,
  Base-3's heading text, and `triggerCount: 1` in 5/5. The oracle did not become more patient — the
  observation moved to the other side of the DOM swap.
- **A stall now fails where it is explainable.** Pre-fix, a navigation that never happened was
  indistinguishable downstream from one that completed. It now fails at the settle.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The first two settle implementations measured the wrong thing**

- **Found during:** Task 3, while capturing the post-fix half.
- **Issue:** Settling on `document.activeElement` (the app's afterNavigate focus target — the stronger
  fact) timed out under the adversary, because the app's `onNavigate` resolves inside
  `startViewTransition`, so focus lands only after the View Transition **finishes**. The replacement
  text comparison then timed out in 4/5 runs because `waitForFunction`'s default `polling: 'raf'` is
  starved precisely while the browser is busy committing the swap.
- **Fix:** Stage 2 compares landmark text with fixed-interval polling (50 ms) in the `page` timeout
  bucket — the bucket whose own definition (`timeouts.ts:12`) is "URL-change / route-transition wait".
- **Why it matters:** both failures were in the *observation method*, not the app. Reported as such
  rather than as evidence about the defect.
- **Recorded at:** `138-NEGATIVE-CONTROL.md` § 5.6, following the § B.12 / § C.9 precedent of recording
  discarded blocks rather than dropping them.

**2. [Rule 2 — Missing critical functionality] The instrument would not have witnessed the fix**

- **Found during:** Task 3, before writing any code.
- **Issue:** `eperm07-term-trigger.spec.ts` held its **own local copy** of the defective settle,
  deliberately (its docblock carve-out). Fixing only `voter-journey.spec.ts` would have left the
  instrument failing after the fix landed and — worse — permanently unable to catch a revert of the
  production settle.
- **Fix:** the settle was extracted to `helpers/navigation.ts` and both call it. The instrument's
  carve-out is marked discharged in its docblock.

### Deviation from the plan's `files_modified` list

The plan listed four files a fix *could* touch under the three candidate mechanisms. The authorised
tier implicated none of the app-side ones, so `apps/frontend/src/routes/+layout.svelte`,
`viewTransition.ts` and `QuestionHeading.svelte` are **untouched**, as the plan intended. Two files not
on the list were modified: `tests/tests/helpers/navigation.ts` and `tests/tests/helpers/index.ts` — the
shared-helper extraction described above.

## Verification

| Gate | Result |
|---|---|
| `yarn typecheck:tests` | exit 0 |
| `npx eslint --flag v10_config_lookup_from_file tests` | 0 errors (2 pre-existing warnings in unrelated files, out of scope) |
| `--project=eperm07-term-trigger`, no env prefix | exit 0, 3 passed (incl. setup/teardown) |
| `--project=voter-journey`, no env prefix | exit 0, 4 passed (incl. setup/teardown) |
| **Full suite** `yarn test:e2e` | **135 passed / 0 failed / 0 skipped / 0 flaky (11.5 m)** |
| `git diff --stat … timeouts.ts` | empty; `grep -c 'element: 2_000'` returns 1 |
| skip/quarantine/`.only`/retry scan over `tests/tests` | no match |
| `git status --porcelain tests/ apps/ packages/` | empty |

The full suite is the trusted signal per the project's E2E hard rule, and it is green at production
budgets with no forcing — so the cardinal rule is satisfied at the end of this plan, not only at the
phase gate.

## Known Stubs

None.

## Deferred / open items

**The ~4 s field excursion is NOT fixed and is carried forward** (recorded in
`138-NEGATIVE-CONTROL.md` § 7 and `138-DIAGNOSIS.md` § Fix). The mechanism is established; the
**amplifier is not**. The recorded DEF-135-04 occurrence needed roughly 36× the median window, and this
phase reached at most ~5.4× by CPU amplification and <2× by worker contention. A four-second interval
in which the address bar says Base-3 while the page still shows Base-2 **is** user-visible, and no
test-side change can address it. Plan 06's waiver discharge must carry this qualification verbatim
rather than read as a full explanation of the field failure. The instrument that would localise it
(plan 01's forensic capture) now exists, which is waiver condition 3.

## Threat Flags

None. The authorised tier touched no application code, no network surface, no auth path and no schema;
`git diff --stat` over the fix commit contains nothing under `apps/`.

## Self-Check: PASSED

All created/modified files verified present on disk; all three task commits (`42b95d575`,
`e96e24a44`, `a81a780d2`) verified present in git history; `138-DIAGNOSIS.md` § Fix verified present.
