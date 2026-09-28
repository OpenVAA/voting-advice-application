---
quick_id: 260922-dd5
slug: audit-reactive-popup-queueing-candidate-lay
title: Audit reactive popup queueing across the frontend
type: quick
batch: 260922-dd4
status: complete
date: 2026-09-22
subsystem: frontend/contexts/app
tags: [popup-queue, user-preferences, svelte5-runes, audit, tdd]

requires:
  - PopupQueueItem.onClose (apps/frontend/src/lib/contexts/app/popup/popupComponent.type.ts)
  - the root layout popup renderer's onClose-before-shift order (apps/frontend/src/routes/+layout.svelte)
provides:
  - survey-popup dismissal persisted through userPreferences.survey.status
  - a headless behaviour spec for both popup countdowns
affects:
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts

tech-stack:
  added: []
  patterns:
    - "persisted-status guard in the timeout callback + onClose that writes the status — the pair that makes a deliberately re-arming countdown safe"
    - "live (not inert) persisted-state stub in headless context tests, so status round-trips are observable rather than vacuous"

key-files:
  created:
    - apps/frontend/src/lib/contexts/app/appContext.popupCountdown.svelte.test.ts
  modified:
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts

decisions:
  - "The survey countdown was made to match the feedback countdown exactly rather than inventing a new mechanism: widen the status guard to include `dismissed`, and give the pushed item an `onClose` that writes `dismissed` unless the status is already `received`."
  - "No conforming site was rewritten. The candidate and voter layouts keep their `onMount` pushes, the preregister page keeps its untracked one-shot `$effect`, and the two results-layout arming effects stay reactive."
  - "The GREEN commit is typed `fix(...)` rather than `feat(...)`: the change is a defect fix, and the repo's own commit history uses `fix` for this shape. See TDD Gate Compliance below."

metrics:
  duration: ~35 min
  completed: 2026-09-22
  tasks: 2

actuals:
  tokens: 9500
  tasks: 2
  commits: 2
plan_head_before: aa1756a84
---

# Quick 260922-dd5: Audit reactive popup queueing across the frontend — Summary

Audited every popup-enqueue site in the frontend against the one-shot rule stated in `apps/frontend/src/routes/candidate/+layout.svelte`, found one non-conforming path — the survey countdown, which persisted nothing on close and therefore re-queued a dismissed popup on the next arming — and closed it with the same guard + `onClose` pair the feedback countdown already had, locked by an 11-case headless spec.

## What Was Built

**Task 1 (tracer, TDD) — survey-popup dismissal now persists.** Two edits inside `startSurveyPopupCountdown` in `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`:

1. The timeout's status guard was widened. It read `if (this.#userPreferences.current.survey?.status !== 'received')` — a `dismissed` status did not stop the push, so any later arming of the countdown re-queued a popup the user had closed. It now declines on `received` **or** `dismissed`, exactly as the feedback countdown does.
2. The pushed queue item now carries an `onClose` that calls `setSurveyStatus('dismissed')`. Without it nothing ever wrote `dismissed`, so widening the guard alone would have changed nothing. The write is guarded on the status not already being `received`: `SurveyButton.svelte` sets `received` in its click handler and `SurveyPopup` then closes itself on a 1500 ms timeout, so the close handler **always** runs after a successful click-through and would otherwise downgrade `received` to `dismissed`. That guard is load-bearing, not symmetry.

A comment above the countdown records why repeated arming is safe: the results-layout arming effects re-run deliberately on every app-settings change, and it is this status guard — not the arming site — that stops a re-arm from re-queueing something the user closed.

`apps/frontend/src/lib/contexts/app/appContext.popupCountdown.svelte.test.ts` (11 cases) locks the behaviour. It follows the mock preamble and `$effect.root` + `flushSync` construction idiom of `appContext.spread.svelte.test.ts`, with the two deviations the plan called for, both load-bearing:

- The user-preferences stub is **live**: `update` applies the updater to a mutable holder that the `current` getter reads back. An inert stub would make every status assertion pass vacuously, because the countdown guard could never observe what the close handler wrote.
- The popup-queue stub **records** pushed items, so a case can both count pushes and reach into a recorded item to invoke its close handler.

Timers are vitest fake timers advanced past the configured delay; real timers are restored in teardown.

**Task 2 — the classification.** Below.

## TDD Cycle

- **RED** (`d5343cd72`): spec written first. Two target cases failed on behaviour assertions — `persists a dismissed survey status when the queued item is closed` (`expected 'undefined' to be 'function'` — the pushed survey item carried no `onClose`) and `does not enqueue again after the survey popup was dismissed` (`expected undefined to be 'dismissed'`). 11 tests discovered, 9 passed, including the entire untouched feedback path. No load/fixture crash, no zero-discovery.
- **GREEN** (`15c5ef68d`): the two edits above. 31/31 pass in `src/lib/contexts/app/`.
- **REFACTOR**: none. The implementation is minimal and is a direct mirror of the adjacent feedback countdown; there was nothing to clean up.

### RED evidence verification

`gsd_run check tdd-red-evidence` returned **`RED_EVIDENCE_OK` / `target_test_failed`** (`tests: 11, pass: 9, fail: 2`).

One honest caveat about how that verdict was obtained. The checker's TAP parser is written for **node:test**'s dialect: it reads the `# tests / # pass / # fail` summary trailer. Vitest's `--reporter=tap-flat` emits the plan line (`1..11`) and per-test `ok` / `not ok` lines but no such trailer, so the first check returned `INVALID_RED (zero_tests_discovered)` — a parser/framework mismatch, not a defect in the RED phase (the same run's `failing_tests` array was populated correctly with both target names). The counts were then **derived from that same real TAP output** (`ok` and `not ok` line counts: 11 / 9 / 2, matching vitest's own reported totals exactly) and appended as the trailer the parser expects. No count was invented; the transcription is mechanical and reproducible from `red.tap`.

## Task 2 — Enqueue-site classification

### Derivation (reproducible, run at execution time, not trusted from the plan)

```
grep -rn "popupQueue.push" apps/frontend/src
```
```
grep -rn "startFeedbackPopupCountdown(\|startSurveyPopupCountdown(" apps/frontend/src/routes
```

The first finds direct enqueue sites; the second finds the sibling queue API, which enqueues **indirectly** through a timer and so never matches the first grep. Sites are cited by file and enclosing scope — never by line number, which goes stale.

The re-derivation agreed with the plan's `<prior_findings>` table exactly: same six files, same enclosing scopes, same verdicts.

### Direct enqueue sites — `grep -rn "popupQueue.push" apps/frontend/src`

| File | Enclosing scope | Verdict | Reasoning |
|---|---|---|---|
| `apps/frontend/src/routes/candidate/+layout.svelte` | `onMount(() => { … })` | **one-shot** | The reference pattern, and the source of the rule this audit applies. Runs once per mount; no reactive dependency can re-fire it. Left unchanged. |
| `apps/frontend/src/routes/(voters)/+layout.svelte` | `onMount(() => { … })` — two pushes: the voter-app notification and `DataConsentPopup` | **one-shot** | Both pushes sit in the same `onMount` body, behind settings/consent conditions read once at mount. Its own comment states the rule. Left unchanged. |
| `apps/frontend/src/routes/candidate/preregister/+page.svelte` | `$effect(() => { … })` with `untrack(() => popupQueue.push(…))` behind a plain `notified` latch | **one-shot** | Already fixed in `303c52fbf`; **correctly left alone**. It cannot become a bare `onMount`: its condition reads `candCtx.isPreregistered` and `candCtx.idTokenClaims`, both live context accessors that are unresolved at mount, so a mount-time read would be false and the notification would never show. The `$effect` is required; `untrack` (keeping `PopupState.push`'s read-before-write out of the dependency set, so `popupQueue.shift()` cannot re-trigger it) plus the `notified` latch (so a later change to either accessor cannot re-push) are what make it safe. |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — `startFeedbackPopupCountdown` | `setTimeout` callback | **guarded** | The push can run on every arming, but the callback declines when the persisted feedback status is `received` or `dismissed`, and the pushed item's `onClose` persists `dismissed`. Repeat arming is therefore a no-op once the user has responded. Untouched by this item; covered by four regression cases in the new spec. |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — `startSurveyPopupCountdown` | `setTimeout` callback | **guarded** (was **the finding**) | Before Task 1 this was the one non-conforming site: the guard checked only `received` and the pushed item carried **no** `onClose`, so a closed survey popup persisted nothing and came back on the next arming. Task 1 widened the guard and added the `onClose`. Now guarded, matching the feedback path. |
| `apps/frontend/src/lib/candidate/components/preregisteredNotification/PreregisteredNotification.svelte` | inside the `@component` doc block's `### Usage` example | **not-a-call-site** | The text matches inside a fenced usage example in the component's documentation comment. No code executes. Left unchanged. |

### Indirect (timer-backed) enqueue — `grep -rn "startFeedbackPopupCountdown(\|startSurveyPopupCountdown(" apps/frontend/src/routes`

| File | Enclosing scope | Verdict | Reasoning |
|---|---|---|---|
| `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | two sibling `$effect(() => { … })` blocks — one arming the feedback countdown, one arming the survey countdown | **intended-repeat** | The effects re-arm on **every** app-settings change, and the file's own comment says so deliberately: settings may arrive after mount via async data load, and the countdown functions clear the prior timeout, so a late-arriving setting still starts a countdown. Leaving them reactive is correct — converting them to `onMount` would drop the countdown entirely whenever settings land after mount. The self-retrigger that bit the preregister page does not apply here: the `popupQueue.push` happens in the **timer callback**, outside the effect's tracking scope, so the queue read never enters the effect's dependency set. This repetition is only *safe* because the timeout's persisted-status guard refuses to push a popup the user already answered — true of the feedback path already, and true of the survey path as of Task 1. |

### Outcome

- **6 files** matched the two derivation greps, carrying **7 enqueue sites** (the voter layout has two pushes; `appContext.svelte.ts` has two countdowns) plus one documentation match.
- **0 sites needed conversion** to a one-shot. The literal task in the batch item — converting `$effect`-wrapped `popupQueue.push` sites to `onMount` — has **zero work items**: the only `$effect`-wrapped push is the preregister page, already fixed in `303c52fbf`, and it cannot become a bare `onMount` for the reason recorded above. The operator authorised this scope substitution.
- **1 site was changed**: `startSurveyPopupCountdown` in `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`, by Task 1. It was not a missing one-shot but a missing *guard* — the other half of the same rule.

## Follow-up finding (recorded, not acted on)

**The shared Playwright popup fixture cannot detect the defect this item fixed.** `tests/tests/fixtures/shared/popupNotice.fixture.ts` → `dismissAndReload(kind)` does:

```
await dismiss(kind);
await page.reload();
await expect(popupFor(kind)).toBeHidden();
```

`toBeHidden()` resolves on its **first** check — immediately after reload, long before the reloaded page's countdown (a multi-minute default, seconds under seeded settings) could fire. The assertion therefore cannot distinguish a genuinely persisted dismissal from one that is merely about to reappear. That is why the survey defect survived a spec (`perm-show-feedback-survey.spec.ts`) that reads as if it covered it.

**What would make it non-vacuous:** assert the popup is *still* absent after the seeded countdown window has elapsed — i.e. wait out the configured `showSurveyPopup` / `showFeedbackPopup` delay and re-assert, rather than asserting once at t≈0.

**Why it is out of scope here:** those `perm-*` specs run as an ordered chain that mutates an `app_settings` singleton, so hardening the fixture changes the timing of a shared, order-dependent suite and calls for a full-suite E2E run to validate — not a quick edit appended to this item.

## Deviations from Plan

**None affecting scope or mechanism.** Two notes:

1. **GREEN commit type.** The canonical TDD reference names `feat(...)` for the GREEN gate. This change is a defect fix, so the commit is `fix(260922-dd5): …`, matching the repo's own convention for this shape (`303c52fbf` is `fix(candidate): …`). Recorded under TDD Gate Compliance below rather than silently.
2. **RED-evidence tooling.** Described in full under *RED evidence verification* above — a node:test-vs-vitest TAP dialect mismatch, resolved by transcribing vitest's own counts into the trailer the parser reads.

No auto-fixes (Rules 1–3) were needed; no architectural decisions (Rule 4) arose.

## TDD Gate Compliance

| Gate | Commit | Present | Note |
|---|---|---|---|
| RED | `d5343cd72` `test(260922-dd5): …` | yes | `RED_EVIDENCE_OK` — target test failed on its behaviour assertion; 11 discovered / 9 passed / 2 failed. |
| GREEN | `15c5ef68d` `fix(260922-dd5): …` | yes | Typed `fix` rather than `feat` — the change is a defect fix (see Deviations). The RED commit precedes it, so the discipline is intact. |
| REFACTOR | — | n/a (optional) | Implementation is minimal and mirrors the adjacent feedback countdown; no cleanup warranted. |

## Verification

All gates run **unpiped**, exit status read directly.

| Gate | Command | Exit | Result |
|---|---|---|---|
| Unit (app context) | `yarn workspace @openvaa/frontend test:unit src/lib/contexts/app/` | **0** | 5 files, **31/31 passed** (new countdown spec 11, spread 4, popupState 4, survey 4, trackingService 8). |
| Lint | `yarn lint:check` | **0** | **0 errors.** Warnings are pre-existing and in files this item did not touch (14 `dev-seed` generator `ctx` warnings, 1 `candidateContext.svelte.test.ts`, 2 in `tests/`). Included `typecheck`: svelte-check **0 errors, 0 warnings** for both `@openvaa/frontend` and `@openvaa/docs`. All repo guards (comment hygiene, i18n namespace, a11y wiring, project-scoped query, grant enum, …) reported 0 violations. |
| Build | `yarn build` | **0** | 14/14 tasks successful. |
| Task 2 classification gate | the plan's `<verify><automated>` bash loop over both `grep -rl` populations | **0** | `every enqueue site is classified` — all 6 files named in this SUMMARY. |

**E2E: not run.** The plan's `<verification>` states E2E is not required by this change set, and the reasoning holds after the fact: the survey banner (`SurveyBanner.svelte`) gates only on a `received` status, so persisting `dismissed` removes no banner surface, and `perm-show-feedback-survey.spec.ts`'s dismiss-and-reload assertion is made strictly *more* likely to pass by the fix. No E2E run was attempted, so no E2E result is claimed either way.

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/app/appContext.popupCountdown.svelte.test.ts` — FOUND
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — FOUND
- commit `d5343cd72` — FOUND
- commit `15c5ef68d` — FOUND
