---
created: 2026-10-06T19:00:27.000Z
title: The terms-of-use view overflows a phone viewport with its checkbox off-screen, and passing the gate leaves focus on the body
area: Contestant app / accessibility
severity: major
source: Phase 173 plan 10 browser probe (deferred-items.md items 1 and 2); the view is Phase 172's; filed by 173-13
scheduled: "Phase 174.1 (inserted 2026-10-07, operator decisions D1 (a) and D2 (a)): both defects, plus one E2E check of the gate at phone width, after Phase 174 and before Phase 175"
files:
  - apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte
  - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.svelte
  - apps/frontend/src/lib/components/expander
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
resolves_phase: 174.1
---

## 1. The checkbox cannot be reached at a phone width (a blocker for phone users)

Measured at 390 x 844 on the gate view at `/contestant`: `document.documentElement.scrollWidth` 483 against `clientWidth` 390; the four widest elements under `<main>` are 576px wide (the form's `section`, its `div.mb-lg`, the `collapse` expander and the expander's `input.min-h-0`); `[data-testid="terms-checkbox"]` has its left edge at x = -93, stable over six reads. Content left of the viewport cannot be scrolled to, so a user on a phone cannot tick the box the gate requires and cannot enter the app. At 1280px there is no overflow.

Not established: which element forces the 576px width (the expander and its input are the candidates); whether it predates Phase 172's move of the form into a gate view; whether the registration page's use of the same form shares it. No E2E project runs the Contestant App at a phone width, and the axe scan of the view (`contestant-terms-gate`) runs at 1280 x 720, so the suite cannot see it.

## 2. Passing the gate leaves focus on `<body>`

The gate continues with `invalidateAll()`, which is not a navigation, so the root layout's `afterNavigate` focus move does not run: after Continue the page that replaces the gate (the selection screen, the "nothing to edit" view, or an entity page for a user who entered through an entity URL) has `document.activeElement` = `BODY`. A user with one entity at the root is redirected after the gate, which is a navigation, and is not affected.

## Solution

- Find the element that forces the width and fix it in the component; add an assertion of no horizontal overflow and a visible checkbox at 320px and 390px (a component case, or a phone-viewport entry in the scan).
- Call `focusNavigationTarget()` after the gate's `invalidateAll()`, with a component case.

Both before the milestone ships.

## Resolution

**Closed 2026-10-07 by Phase 174.1 (Terms-of-Use Gate — Phone Width & Focus), plans 174.1-01 (both fixes, each behind a check that was red first) and 174.1-02 (the browser reads, the closing gate, this closure).**

**What forced the width.** The consent label of `TermsOfUseForm.svelte`, by DaisyUI 5.7.46's rule `.label { white-space: nowrap }` — not the expander and not its input, the two candidates this todo named. A label that cannot wrap has a `min-content` width of its whole line (576.11 px in English), and as a flex item it cannot shrink below it. The form's `section`, its `div.mb-lg`, the expander and the expander's input were 576 px wide only because they filled a section as wide as that label: with the expander removed from the page the document overflowed by the same 93 px, and with the label alone allowed to wrap it fitted (`174.1-RESEARCH.md` § M2, nineteen single overrides at two widths).

**Why the checkbox was left of the viewport.** The section is a centred flex item of `MainContent`'s content column (`items-center`), so its overflow is shared between both sides: (350 − 576.11) / 2 + 20 = −93 at 390 px. Half of the label lies left of the column, where a document cannot scroll.

**It predates Phase 172**, by reading the history and not by rendering an old tree: the label's class string and every other ingredient were in place before the form moved into a gate view.

**The overflow fix:** `whitespace-normal` on that label, commit `cd07e083a` — one line of one component, the wrap at every width (operator decision D-05). Read in a browser on the fixed tree: the label computes `white-space: normal` by Tailwind's own rule in the `utilities` layer, and `nowrap` again with the class taken off; overflow 0 and the checkbox inside the viewport in all seven locales at 320, 390, 640, 740 and 1280 px. At 1280 px in English the sentence now wraps to two lines inside its column and what is above it sits 8.25 px higher; Continue, the checkbox and the page height did not move; in Finnish nothing moved at all.

**The focus fix:** the protected layout (`routes/contestant/(protected)/+layout.svelte`) requests `focusNavigationTarget()` when the view it renders is replaced without a navigation, commit `f4b93f872`. It sits in the layout and not in the gate's handler because the layout is the one place that knows a view was replaced by a rerun load: a handler knows only that it asked for a rerun, and every gate Phase 178 puts ahead of this one would have had to repeat the call, failing silently if it forgot. It requests nothing on first render and nothing while a navigation is in flight, whose own focus reset follows. Twelve component cases in `gateFocus.svelte.test.ts`, seven of them red before the layout changed. Read in a browser: at an entity URL nothing navigates, one focus call is made and focus stays on the page's `H1` "Basic Information"; at the root the user is redirected and exactly one focus call is made, on the entity home's heading.

**What now holds the view at phone width:** the spec `tests/tests/specs/contestant/contestant-terms-gate-phone.spec.ts`, two tests (320 and 390 px, the suite's phone descriptor), in its own leaf project `contestant-terms-gate-phone` of the default suite. It asserts no horizontal overflow against `documentElement.clientWidth`, the checkbox wholly inside the viewport, and that ticking it enables Continue. The control `174.1-01-control-unfixed` showed it red on the tree without the fix, received overflow 128 and 94.

**What this todo's own § Solution got wrong.** It offered "a component case, or a phone-viewport entry in the scan" for the overflow. Neither can see this defect. A component case runs in jsdom, which lays nothing out: every rectangle is zero and nothing overflows. And an axe scan of the unfixed view at 390 × 844 and at 320 × 568 reports 0 violations (`174.1-RESEARCH.md` § M10): axe has no rule for a document wider than its viewport. A check that compares against `window.innerWidth` is green on the defect too, because under a mobile descriptor the layout viewport grows to the content. Only a geometric assertion in a real browser fails on it. The second bullet, the focus call with a component case, was right in substance; the call went to the layout for the reason above.

**Not verified, and where each is filed or recorded:**

- The real pre-registration email page, the form's second consumer, was not opened: it needs the identity-provider flow. Its nesting was rebuilt around the live form and fits with the class and overflows without it. Filed: `2026-10-07-174.1-pre-registration-email-page-terms-form-not-opened-at-phone-width.md`.
- The selection screen and the "nothing to edit" view after the gate were shown by component cases with the real views mounted, not in a browser (settled by the orchestrator: one E2E check was ruled). On the redirect path the count of focus calls is observed; that the one request is the root layout's and not the protected layout's is inferred from the code. Recorded in `174.1-EVIDENCE.md` § *Reads*.
- How a production build lays the view out: the built stylesheet carries `.whitespace-normal{white-space:normal}`, and every browser observation drove the dev server. Recorded in `174.1-EVIDENCE.md` § *Closing gate*.
- Every other free-text `.label` is one long string away from the same overflow: `2026-10-07-174.1-daisyui-label-nowrap-is-a-latent-overflow-in-other-label-users.md`. A separate 5 px overflow found beside it: `2026-10-07-174.1-nominations-page-overflows-by-5px-at-320.md`.

**Closing runs, as judged** (none needed a later attempt, so no label carries an `-rN` suffix): the read session `174.1-02-reads` (six steps and its teardown at status 0, 18 relations hold); the gate set `174.1-02-close` (typecheck, lint, unit, check-frontend, build, format, all 0); the full default E2E run `174.1-02-close` — 220 passed, 0 failed, 0 flaky, 0 did not run, in 107 projects, every project of the last full run before the phase (`174-10-final-r3`, 218 in 106) at its total there and the new project at 2. All three on one tree, equal outside `.planning/` to `1c5d2896d`. No run was void.

Evidence: `.planning/phases/174.1-terms-of-use-gate-phone-width-focus/174.1-EVIDENCE.md`, `174.1-01-SUMMARY.md`, `174.1-02-SUMMARY.md`, `174.1-RESEARCH.md`.
