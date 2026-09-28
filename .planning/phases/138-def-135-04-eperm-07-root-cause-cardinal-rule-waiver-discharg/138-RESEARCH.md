# Phase 138: DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge — Research

**Researched:** 2026-08-13
**Domain:** E2E test forensics / SvelteKit client-router + View Transitions navigation timing / Playwright harness engineering
**Confidence:** HIGH on the repo-grounded mechanism map and harness mechanics; MEDIUM on the primary root-cause hypothesis (it is a hypothesis to be *proved by forcing*, not a finding); LOW on nothing that this document presents as fact.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Forcing the failure on demand (ROADMAP criterion 1)

- **D-01:** The forcing harness is **CDP CPU/network throttling on the Base-2 → Base-3 transition,
  combined with a temporarily shrunken `TIMEOUTS.element` budget** — amplifying the existing race
  without touching app code. The amplified budget doubles as the negative-control knob (pre-fix
  FAILS under the forced condition, post-fix PASSES).
  — **Reversibility:** reversible — the throttle and the shrunk budget are test-harness-local and
  must not be left in the committed default configuration.
- **D-02:** Fault injection **into the app path** (an artificial delay in `translateQuestionTerms` /
  `Term.svelte`) is NOT the chosen first mechanism, because the mechanism is not yet identified and
  injecting there presumes the answer. It remains available as a follow-on once throttling has
  localised the race.

#### Where a reproduction counts (repro scope)

- **D-03:** The hunt runs in an **isolated minimal spec** that drives only Base-1 → Base-2 → Base-3
  and asserts the term trigger — seconds per iteration instead of ~10.5 minutes, so dozens of forcing
  attempts are affordable.
- **D-04:** Known risk of D-03, to be stated in the plan: the isolated spec may not carry the
  full-suite's contention conditions. If the forced failure will not reproduce in isolation, that is
  itself a finding about the mechanism (contention-dependent) and redirects the hunt — it does not
  close the phase.

#### Fix shape (ROADMAP criterion 2)

- **D-05:** The accepted fix is a **fix to the app race** — if the mechanism is a real mount/parse
  race in `Term.svelte` / `translateQuestionTerms.ts`, it is fixed in the product, because a user
  could see the same flash.
  — **Reversibility:** costly — a change in the term-parsing/mount path affects every question
  heading that carries an in-text term, across all four locales.
- **D-06:** **Test-side fixes are NOT pre-authorised.** If the forced repro shows the mechanism is
  genuinely test-side (the locator resolves before the term-parsing pass, with no user-visible
  defect), the executor **stops and escalates to the operator as a checkpoint decision** with the
  evidence in hand. It does not apply a test-side remedy unilaterally. This keeps the app-only
  preference from silently expanding.
- **D-07:** A **bare timeout bump is not a fix** and is rejected as a non-diagnosis. Raising
  `TIMEOUTS.element` and declaring the defect resolved does not satisfy criterion 2 and must not
  appear as the phase outcome.
- **D-08:** The upstream `expect.soft` heading assertion at `voter-journey.spec.ts:858` is
  **promoted to a hard assertion** as a diagnostic improvement, so a mis-timed Base-3 arrival fails
  where it is explainable rather than surfacing at the (harder) term check downstream. This is done
  regardless of what the diagnosis finds — `deferred-items.md` § DEF-135-04 "Suggested follow-up"
  already recommends it.
  — **Reversibility:** reversible — single-assertion change in one spec.

#### Forensic capture, landing BEFORE the hunt (Plan 01)

Honours the waiver's condition 3 — "the next occurrence is data" — so every later v2.15 phase's
suite runs contribute evidence rather than discarding it.

- **D-09:** Add **video retention** on the term-trigger path. `trace: 'on'` already exists at
  `tests/playwright.config.ts:133`; no `video` setting exists, so a recurrence is currently traceable
  but not replayable.
- **D-10:** Add **dev-server log retention** alongside each run's artifacts, so a server-side stall
  (SSR, module transform) is observable rather than inferred.
- **D-11:** Add **browser console + network capture**, so a late-arriving fetch or a client error on
  the Base-2 → Base-3 transition is directly observable.
- **D-12:** A durable cross-phase per-run results ledger was offered and **not** selected. The 16-run
  gate still has to produce recorded evidence for criterion 3 — do that as a phase-local run log
  (per-run pass/fail, preflight verdict, timestamp) rather than building a milestone-wide accumulator.

#### The 16-run determinism gate (ROADMAP criterion 3)

- **D-13:** Execute as a **serial local unattended batch** — a scripted loop of 16 full-suite runs on
  the host, each gated by the Phase-137 served-app preflight, each result logged. ~3 h wall clock.
  This matches the environment in which the 1-in-8 was originally observed.
- **D-14:** Containerised runs are explicitly NOT the gate environment — proving it in a place the
  failure never happened is weaker evidence, not stronger.
- **D-15:** The 16 runs are **not** interleaved across Phases 139–150. The waiver is discharged
  inside Phase 138, per the ROADMAP's "138 second" sequencing rationale.

#### Standing v2.15 acceptance rule (inherited, applies here)

- **D-16:** Prove the guard fails before claiming it guards — negative control run twice: once
  against the pre-fix code to demonstrate the failure, once against the post-fix code to demonstrate
  the catch. A fix accepted on "it stopped happening" does not satisfy criterion 2.
- **D-17:** Every run used as evidence must be confirmed by the Phase-137 preflight (proof the page
  under test came from this checkout).

#### Waiver discharge (ROADMAP criterion 4)

- **D-18:** `.planning/v2.14-CARDINAL-RULE-WAIVER.md` is marked **discharged** with the diagnosis
  referenced. No successor waiver, no `test.skip`, no retry annotation, and no "could not reproduce"
  closure may exist anywhere in the record. The cardinal rule returns to force unwaived.
  — **Reversibility:** one-way — discharging the waiver removes the project's only recorded
  cardinal-rule exception; re-opening one would, by the waiver's own condition 4, be evidence that
  the rule needs rewriting rather than re-waiving.

### Claude's Discretion

- Exact throttle factors (CPU slowdown multiplier, network profile) and the shrunk `TIMEOUTS.element`
  value used by the forcing harness — tune empirically until the pre-fix failure is deterministic.
- The shape of the isolated minimal spec (fixture reuse, seed template) — reuse
  `tests/tests/fixtures/voter/questionInfo.fixture.ts` and the `e2e/base` template where they fit.
- Whether video retention is scoped to the term-trigger spec/project only or enabled more broadly —
  weigh artifact size against replay coverage.
- The plan-count and split for the phase (the ROADMAP records "Plans: TBD"), subject to the fixed
  ordering that forensic capture (D-09..D-11) lands before the hunt.

### Deferred Ideas (OUT OF SCOPE)

- **Durable cross-phase run-results ledger** — offered and declined for this phase (D-12). If later
  v2.15 phases want an accumulating failure-rate baseline, that is its own small phase.
- **DEF-135-05** (two concurrent turbo build graphs race on `packages/*/dist`) — a separate open
  deferred item in the same file; unrelated build-tooling hazard, not in this phase's scope.
- **Broadening video retention across the whole suite** — if artifact size proves acceptable during
  this phase, propose it as a suite-wide change in a later phase rather than expanding scope here.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTEG-01 | The intermittent `EPERM-07` term-trigger failure is diagnosed to a **named root cause**, not merely stopped from reproducing. `[VERIFIED: .planning/REQUIREMENTS.md:45]` | §R1 traces the full failing path with file:line and produces three ranked, falsifiable mechanism hypotheses (H1/H2/H3), each with a named discriminator experiment. §R2 gives the forcing mechanics that make each testable on demand. |
| INTEG-02 | The fix holds across a determinism run long enough to exercise the observed 1-in-8 failure rate. `[VERIFIED: .planning/REQUIREMENTS.md:46]` | §R5 gives the measured full-suite wall clock (648 s), the exact per-run precondition set grounded in prior-phase practice, and the machine-readable per-run ledger mechanism (`PLAYWRIGHT_JSON_OUTPUT_FILE`, verified in the installed Playwright). |
| INTEG-03 | `.planning/v2.14-CARDINAL-RULE-WAIVER.md` is discharged and recorded closed; the cardinal E2E rule is back in force unwaived, with no successor waiver opened. `[VERIFIED: .planning/REQUIREMENTS.md:47]` | §R7 enumerates every file carrying the waiver reference (grep-complete) and every place a forbidden artefact could hide, with the grep baselines that make "absence" a checkable criterion rather than a claim. |
</phase_requirements>

---

## Summary

The failing assertion at `tests/tests/specs/voter/voter-journey.spec.ts:862` is not reaching a
missing element — it is reaching a **stale DOM**. Tracing the path end to end produced a concrete,
in-repo, file:line-grounded race window that is present on *every* Q→Q navigation in the voter
journey and that no prior hypothesis named:

**SvelteKit pushes the new URL to `history` at `client.js:1760`, then `await`s the `onNavigate`
callbacks at `client.js:1782`, and only swaps the DOM at `client.js:1824`.** The root layout's
`onNavigate` (`apps/frontend/src/routes/+layout.svelte:161-172`) returns a Promise that resolves
inside `document.startViewTransition`'s update callback — i.e. **after the browser has captured the
outgoing snapshot**. Meanwhile the spec's own navigation settle,
`expectUrlChange` (`voter-journey.spec.ts:186-190`), waits *only* for the URL to change and
**swallows its own timeout with `.catch(() => null)` at line 189**. So the spec can enter the
EPERM-07 step with the URL already on Base-3 and the DOM still showing Base-2 — for as long as the
View-Transition snapshot capture takes. Base-2 (`base.ts:828-838`) carries **no** `customData.terms`,
so during that window `voter-questions-term-trigger` genuinely does not exist anywhere in the DOM,
which is exactly the recorded error text; and once the swap lands, Playwright's post-failure page
snapshot shows the Base-3 heading *with* the trigger — which is exactly the recorded evidence that
made the failure look paradoxical.

This hypothesis is corroborated by prior art **inside this repo**: `a11y-smoke.spec.ts:676-678`
already documents the View-Transition layer as a source of Q→Q assertion nondeterminism and works
around it with `?notr=1` so that assertions "never race the cross-fade". The voter journey does not
use that hatch. It is further corroborated externally: Chrome freezes the renderer while the view
transition's update callback runs and skips the transition after roughly 4 s
`[CITED: developer.chrome.com/blog/view-transitions-in-2025 · vtbag.dev/tips/view-transition-fails-and-fixes]`
— a ceiling that sits just above the spec's 2 s + 2 s exposure.

Two corrections to CONTEXT.md's stated suspects are load-bearing for planning. First,
**`apps/frontend/src/lib/api/utils/translateQuestionTerms.ts` is dead code** — a repo-wide grep
finds no caller anywhere outside planning documents; the live term-parsing pass is
`QuestionHeading.svelte:65-75 addTermsToTitle`, fed by `getCustomData(question)` at line 60. Second,
because the most probable mechanism is a *navigation-settle* race rather than a Term mount/parse
race, **D-05's "if" clause is unlikely to trigger and D-06's escalation checkpoint is likely to be
the live path.** The plan must budget for that checkpoint rather than assume an app-side landing.

**Primary recommendation:** Plan 01 lands forensic capture (video on the voter-journey project,
console/network via an auto-fixture, dev-server log via the run wrapper). Plan 02 builds an isolated
`eperm07-term-trigger` LEAF spec + project modelled on `cold-entry-dataroot`, drives Base-1→2→3, and
runs the three discriminators in order — (i) `page.emulateMedia({ reducedMotion: 'reduce' })` to
switch the View Transition off with zero app change, (ii) CDP `Emulation.setCPUThrottlingRate` to
amplify snapshot-capture cost, (iii) an explicit DOM-settle probe between URL change and assertion —
before any fix is written. Whichever discriminator flips the outcome names the mechanism.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Forcing harness (CPU/network throttle, shrunk budget) | E2E harness (`tests/`) | Browser (CDP) | D-01 is explicit that the harness must not touch app code; CDP is a browser-control surface driven from the test tier. |
| Forensic capture: video, trace | E2E harness config (`tests/playwright.config.ts`) | — | Playwright owns artifact retention; both are `use`-level options. |
| Forensic capture: console + network events | E2E fixture layer (`tests/tests/fixtures/`) | — | `page.on('console' \| 'requestfailed')` is per-`page`, so it belongs in a fixture that wraps the `page` fixture, not in config. |
| Forensic capture: dev-server log | Operator run wrapper (shell) | — | Playwright does **not** manage the frontend dev server in this repo — the only `webServer` entry is the `PLAYWRIGHT_BANK_AUTH`-gated mock OIDC issuer (`playwright.config.ts:1135-1147`). Redirection at spawn is the only mechanism available. |
| Navigation settle (URL vs DOM) | E2E spec/helper (`voter-journey.spec.ts:186-190`) | Frontend router (`@sveltejs/kit` client) | The race window is created by the router's ordering; the *exposure* is created by the spec settling on URL only. |
| View Transition orchestration | Frontend root layout (`+layout.svelte:161-172`) | Browser (View Transitions API) | The app opts into the transition; the browser owns snapshot capture and the ~4 s skip. |
| Term affordance render | Frontend dynamic component (`QuestionHeading.svelte:60-75, 96-99`) | Component (`Term.svelte:121-150`) | Terms are parsed out of `question.text` in QuestionHeading and rendered by Term; the popup mounts only on hover/focus. |
| 16-run determinism evidence | Operator run wrapper + Playwright JSON reporter | Preflight (`tests/global-setup.ts`) | The gate is a shell loop; per-run machine-readable verdicts come from the JSON reporter; identity comes from the existing preflight. |
| Waiver discharge record | `.planning/` documents | — | Documentation-tier change; no code. |

---

## Project Constraints (from CLAUDE.md)

Directives extracted from `./CLAUDE.md` that bind this phase. Treat with the same authority as
locked decisions.

| # | Directive | Source | Effect on this phase |
|---|-----------|--------|---------------------|
| C-1 | "Failing E2E tests are a CARDINAL FAILURE. No task may proceed, complete, or be marked done while any E2E test is failing." | CLAUDE.md §E2E Hard Rule | The phase's own intermediate states must not leave the suite red between plans. The forced-failure runs are **deliberate, scoped negative controls in an isolated spec**, not suite failures — the plan must say so explicitly and must not run a forced-failure configuration as part of a gate run. |
| C-2 | "No 'known-flaky' exemptions… not skipped, retried-until-green, or annotated as flaky." | CLAUDE.md §E2E Hard Rule | Forbids `test.skip`/`test.fixme`/retry annotations as an outcome (mirrors D-18 and ROADMAP criterion 4). |
| C-3 | "A 'did not run' E2E test counts as a failure." | CLAUDE.md §E2E Hard Rule | Each of the 16 runs must be validated on **executed count**, not just exit code. Baseline: 134 executed. |
| C-4 | "Prefer E2E for interim verification… run the whole suite." | CLAUDE.md §E2E Hard Rule | The isolated hunt spec is for the *hunt*; every acceptance claim still rests on full-suite runs. |
| C-5 | Preflight: the served app must echo this working tree's absolute path; `FRONTEND_PORT` is the only escape hatch; no flag or env skips the preflight. | CLAUDE.md §E2E preflight | Satisfies D-17 automatically. The run loop must **capture** the preflight verdict per run, not merely rely on it. |
| C-6 | "`yarn dev` now fails loudly (`Error: Port <port> is already in use`)"; wildcard shadow-bind is the residual case the preflight catches. | CLAUDE.md §E2E preflight | The 16-run loop must fail fast, not silently drift, if the dev server dies mid-batch. |
| C-7 | "Use TypeScript strictly — avoid `any`, prefer explicit types." | CLAUDE.md §Important Implementation Notes | CDP calls must be typed via `CDPSession.send<T extends keyof Protocol.CommandParameters>` (typed in the bundled protocol; see §R2.1) — no `as any`. |
| C-8 | "Always check your code against the Code review checklist (`/.agents/code-review-checklist.md`)." | CLAUDE.md §Code Review | Applies to any harness/app change this phase lands. |
| C-9 | Context Destructuring Rule + the `dataRoot` `#version`-bridge carve-out. | CLAUDE.md §Context Destructuring Rule | If any app-side fix is proposed inside `QuestionHeading.svelte` / `questions/+layout.svelte`, it must preserve `ctx.dataRoot.<prop>` direct reads (already correct at `QuestionHeading.svelte:50-57` and `questions/+layout.svelte:~120`). |
| C-10 | Svelte warning-accepted format `// svelte-warning: accepted — <rationale>`. | CLAUDE.md §Svelte Warning-Accepted Format | Applies if an app-side fix trips a compiler warning. |

---

## R1 — The failing path, traced end to end

### R1.1 The assertion and its immediate context

`[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:840-874]` — verbatim, lines 848-863:

```ts
    await test.step('EPERM-07 customData.terms: in-text affordance + definition popup on Base-3', async () => {
      // Advance Base-2 → Base-3 (answer Base-2 at polar-MAX as the walk requires).
      await expectQuestionAndAdvance({
        page,
        text: TEXT_RE.baseOpinion2Likert4,
        optionIndex: (n) => n - 1
      });
      // Settle on Base-3 by its heading.
      const questionHeading = page.getByTestId(testIds.voter.questions.heading);
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7, { timeout: TIMEOUTS.element });

      // The in-text term trigger renders inside the heading (the 'Likert' token).
      const termTrigger = page.getByTestId(testIds.voter.questions.termTrigger);
      await expect(termTrigger.first()).toBeVisible({ timeout: TIMEOUTS.element });
      await expect.soft(termTrigger.first()).toHaveText(/Likert/i, { timeout: TIMEOUTS.element });
```

Resolved values, each read from its source of truth this session:

| Symbol | Value | Source |
|---|---|---|
| `TIMEOUTS.element` | `2_000` | `[VERIFIED: tests/tests/helpers/timeouts.ts:25-27]` — verbatim: `export const TIMEOUTS = {` … `  /** Per-element visibility/enabled budget (no URL change). */` … `  element: 2_000,` |
| `TIMEOUTS.page` | `5_000` | `[VERIFIED: tests/tests/helpers/timeouts.ts:30-31]` — verbatim: `  /** URL-change / route-transition wait (single navigation). */` / `  page: 5_000,` |
| `testIds.voter.questions.termTrigger` | `'voter-questions-term-trigger'` | `[VERIFIED: tests/tests/utils/testIds.ts:243]` — verbatim: `      termTrigger: 'voter-questions-term-trigger',` |
| `testIds.voter.questions.termPopup` | `'voter-questions-term-popup'` | `[VERIFIED: tests/tests/utils/testIds.ts:244]` — verbatim: `      termPopup: 'voter-questions-term-popup'` |
| `testIds.voter.questions.heading` | `'voter-questions-heading'` | `[VERIFIED: tests/tests/utils/testIds.ts:182]` — verbatim: `      heading: 'voter-questions-heading',` |
| `TEXT_RE.baseOpinion3Likert7` | `/Base opinion 3 — Likert 7/i` | `[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:82]` — verbatim: `  baseOpinion3Likert7: /Base opinion 3 — Likert 7/i,` |
| `TEXT_RE.baseOpinion2Likert4` | `/Base opinion 2 — Likert 4/i` | `[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:81]` — verbatim: `  baseOpinion2Likert4: /Base opinion 2 — Likert 4/i,` |

> The `expect.soft` at 858 is the D-08 promotion target. The **exact current text** and the exact edit
> are given in §R6.

### R1.2 The navigation settle — where the exposure is created

`[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:186-190]` — verbatim:

```ts
async function expectUrlChange(page: Page, action: () => Promise<void>): Promise<void> {
  const urlBefore = page.url();
  await action();
  await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: TIMEOUTS.page }).catch(() => null);
}
```

Two properties of this helper are load-bearing for the diagnosis:

1. **It settles on URL only.** No DOM assertion, no `waitForLoadState`, no heading check.
2. **It swallows its own timeout** — `.catch(() => null)` at line 189. If the URL has *not* changed
   within 5 s, `expectQuestionAndAdvance` still returns normally and the caller proceeds. That means
   both "URL changed, DOM stale" and "URL never changed at all" flow into the EPERM-07 assertions
   identically.

`expectQuestionAndAdvance` (`[VERIFIED: voter-journey.spec.ts:234-281]`) wraps its body in
`expectUrlChange` and ends by clicking the answer option (line 279) or Next (line 278). It performs
**no** post-click DOM settle — the settle for the *next* question happens at the *next* call's
`toHaveText` (line 252). The EPERM-07 step is the one place in the walk that asserts something other
than the heading immediately after a hop, and it does so with a **soft** heading gate in front of a
**hard** element gate.

### R1.3 The router ordering — the race window, named

`@sveltejs/kit` **2.55.0** `[VERIFIED: node_modules/@sveltejs/kit/package.json "version": "2.55.0"]`.
Client router `navigate()`:

| Step | Line | Verbatim |
|---|---|---|
| Route/module load (Vite transform in dev) | `client.js:1642` | `let navigation_result = intent && (await load_route(intent));` |
| **URL is pushed to history** | `client.js:1760` | `		fn.call(history, entry, '', url);` |
| **`onNavigate` callbacks awaited** | `client.js:1779-1785` | `			await Promise.all(` / `				Array.from(on_navigate_callbacks, (fn) =>` / `					fn(/** @type {import('@sveltejs/kit').OnNavigate} */ (nav.navigation))` |
| **DOM swap** | `client.js:1824` | `				root.$set(navigation_result.props);` |
| Settle | `client.js:1831` | `				commit_promise = svelte.settled?.();` |

`[VERIFIED: node_modules/@sveltejs/kit/src/runtime/client/client.js:1642, 1760, 1779-1785, 1824, 1831]`

**Therefore: `page.url()` reports the destination while the DOM still renders the origin, for the
entire duration of the awaited `onNavigate` promise.** This is not a guess about SvelteKit — it is
the installed source.

### R1.4 What the app puts inside that awaited promise

`[VERIFIED: apps/frontend/src/routes/+layout.svelte:161-172]` — verbatim:

```ts
  onNavigate((navigation) => {
    submitAllEvents(); // preserve existing analytics flush
    // LANDMINE: read `navigation.to?.url` — NOT `page.url` (which is the SOURCE url during
    // onNavigate per spike-015). `shouldAnimate` also gates reduced-motion (VT-03) + ?notr=1 (D-02).
    if (!shouldAnimate(navigation.to?.url)) return;
    return new Promise<void>((resolve) => {
      startViewTransition(async () => {
        resolve(); // tells SvelteKit to apply the new DOM
        await navigation.complete; // SvelteKit swaps the DOM here
      });
    });
  });
```

The Promise resolves **inside** the view-transition update callback. Chrome only invokes that
callback *after* it has captured the outgoing snapshot. So the width of the race window in §R1.3 is
**the cost of the outgoing snapshot capture**, plus a frame.

The gate is `shouldAnimate` `[VERIFIED: apps/frontend/src/lib/utils/viewTransition.ts:25-31]` — verbatim:

```ts
export function shouldAnimate(destUrl: URL | undefined): boolean {
  if (typeof document === 'undefined') return false;
  if (!('startViewTransition' in document)) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  if (destUrl?.searchParams.get('notr') === '1') return false;
  return true;
}
```

Two elements carry `view-transition-name` on this route and therefore participate in the snapshot:
`[VERIFIED: apps/frontend/src/routes/MainContent.svelte:69]` — verbatim
`  style:view-transition-name="main-content"` — and
`[VERIFIED: apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:278]` — verbatim
`          style="view-transition-name: question-heading"`, plus the hero at line 265.
`Header.svelte:71` adds `persistent-header`.

In the Q→Q hop the in-app navigation is `goto(url, { noScroll })`
`[VERIFIED: apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:252]` — built from
`getRoute.current({ route: 'Question', questionId: newQuestion.id })` (line 247). **No `notr` query
is attached**, so every voter-journey Q→Q hop plays a View Transition. Playwright's default context
does not emulate `prefers-reduced-motion: reduce`, so the JS gate does not short-circuit either.

### R1.5 Prior art inside this repo — the corroboration

`[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:672-678]` — verbatim:

```
/**
 * NAVA11Y-02 — focus lands on the question heading after a Q→Q navigation. The
 * root-layout `afterNavigate` rAF focus reset targets `[data-focus-on-nav]`
 * (fallback first `<h1>`), placed on the QuestionHeading callsite (Plan 99-02).
 * The Q→Q hop is driven with `?notr=1` so the cross-fade is disabled and
 * `document.activeElement` is asserted against the settled DOM, not the
 * `::view-transition` pseudo-tree (D-02 determinism).
 */
```

and `[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:570-574]` — verbatim:

```
// These prove the navigation-a11y stack (Plan 99-01 mechanism + Plan 99-02
// surfaces) behaves correctly WITH the View-Transition layer active. They run
// under the same `a11y-smoke` project (PLAYWRIGHT_A11Y=1, depends:
// data-setup-base) and drive the transition deterministically via the `?notr=1`
// escape hatch (D-02) so assertions never race the cross-fade animation.
```

**The project already knows the View-Transition layer makes Q→Q assertions race, and already
mitigates it — in the one spec family that was written after the layer landed.** The voter journey
was not retrofitted. That asymmetry is the single strongest in-repo signal available.

### R1.6 The render chain for the term affordance

The seeded data. `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:839-861]` — verbatim
(question row for Base-3):

```ts
      {
        external_id: 'test-e2e-base-qu-opin-base-3-likert7',
        type: 'singleChoiceOrdinal',
        name: { en: '[qu-opin-base-3-likert7] Base opinion 3 — Likert 7.' },
        choices: LIKERT_7_EN,
        category: { external_id: 'test-e2e-base-qg-opin-base' },
        // EPERM-07 NOTE: additive customData.terms so the Phase-120 voter-journey
        // extension can assert the in-text term-trigger affordance + definition
        // popup. The trigger 'Likert' appears verbatim in this question's title
        // text above, so the in-text term affordance renders. customData (not a
        // new row) — additive, alters no rigid base count.
        custom_data: {
          terms: [
            {
              triggers: ['Likert'],
              title: 'Likert scale',
              content: 'An ordered rating scale measuring agreement, from strong disagreement to strong agreement.'
            }
          ]
        },
```

Base-2, by contrast, carries **no** `terms`:
`[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:828-838]` — verbatim `custom_data` line:
`        custom_data: { hero: { url: '/images/e2e-test-image-1.jpg', type: 'image' } },`.
**This is why a stale Base-2 DOM produces "element(s) not found" rather than a wrong-text failure.**

The parse pass. `[VERIFIED: apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte:60-75]` — verbatim:

```ts
  let customData = $derived(getCustomData(question));
  let titleParts: Array<TitlePart> = $derived(addTermsToTitle(customData.terms));
  let blockWithStats = $derived(questionBlocks?.getByQuestion(question));
  let numQuestions = $derived(questionBlocks?.questions.length);

  function addTermsToTitle(terms?: Array<TermDefinition>) {
    const triggers = terms
      ?.flatMap((t) => t.triggers ?? [])
      ?.sort((a, b) => b.length - a.length)
      .map(escapeRegExp);
    const parts = triggers ? question.text.split(new RegExp(`(${triggers.join('|')})`)) : [question.text];
    return parts.map<TitlePart>((part) => {
      const term = terms?.find((t) => t.triggers?.includes(part));
      return term ? { text: part, explanation: term.content, title: term.title } : { text: part };
    });
  }
```

The render. `[VERIFIED: apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte:95-100]` — verbatim:

```svelte
  <h1>
    {#each titleParts as { text, explanation, title }}
      {#if explanation}<Term definition={title ? `${title}: ${explanation}` : explanation}>{text}</Term
        >{:else}{text}{/if}
    {/each}
  </h1>
```

The trigger element. `[VERIFIED: apps/frontend/src/lib/components/term/Term.svelte:121-138]` —
verbatim (the testid line and its immediate neighbours):

```svelte
<span class="group relative" bind:this={triggerElement}
  ><button
    type="button"
    class="inline appearance-none"
    aria-describedby={visible ? definitionId : undefined}
    aria-expanded={visible}
    data-testid="voter-questions-term-trigger"
```

and the popup gate `[VERIFIED: apps/frontend/src/lib/components/term/Term.svelte:56-62]` — verbatim:

```ts
  let hovered = $state(false);
  let focused = $state(false);
  // `dismissed` overrides the hover/focus reveal so the popup can be closed in
  // place (Escape key or clicking the trigger) without moving the pointer or
  // focus — WCAG 2.1 AA SC 1.4.13 (Content on Hover or Focus) dismissibility.
  let dismissed = $state(false);
  const visible = $derived(!dismissed && (forceShow || hovered || focused));
```

**Correction to CONTEXT.md §canonical_refs.** `apps/frontend/src/lib/api/utils/translateQuestionTerms.ts`
is described there as "the term-parsing pass over the heading text; prime suspect surface for the
mount/parse race". It is **dead code**: a repo-wide grep excluding `node_modules`/`.git` returns the
function's own definition (`translateQuestionTerms.ts:4`) and six `.planning/` document mentions, and
**no call site anywhere in `apps/` or `packages/`**. `[VERIFIED: repo-wide grep, 2026-08-13]` The
live parse pass is `QuestionHeading.svelte:65-75` above; localized term objects reach the client as
raw JSONB `customData` through the Supabase data provider
(`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:566-607`). The
plan should not spend a task instrumenting a file that never executes.

### R1.7 Async/await, hydration and rune boundaries on the path — the candidate race sites

Enumerated, in execution order, from the click on Base-2's option to the term trigger existing:

| # | Boundary | Location | Race potential |
|---|---|---|---|
| B1 | `answerOption.click()` → app answer write → `handleJump()` | `voter-journey.spec.ts:279`; `questions/+layout.svelte:222-253` | Low. Synchronous in-app. |
| B2 | `goto(url, { noScroll })` → `_goto` → `navigate()` | `questions/+layout.svelte:252`; `client.js:472, 1596` | — |
| B3 | `await load_route(intent)` — route module import + `+layout.ts` load | `client.js:1642` | **Medium.** In dev this is a Vite transform; the disproved cold-start hypothesis lived here. Already eliminated (`deferred-items.md:203-210`), but B3 is *not* the same as B4 and the elimination does not transfer. |
| B4 | `history.pushState` — **URL becomes Base-3** | `client.js:1760` | **This is where `expectUrlChange` is satisfied.** |
| B5 | `await Promise.all(on_navigate_callbacks)` → `startViewTransition` outgoing-snapshot capture | `client.js:1779-1785`; `+layout.svelte:166-171` | **HIGH — primary suspect.** Requires a rendering frame; cost scales with page complexity and CPU/GPU contention. Browser skips the transition after ~4 s `[CITED: developer.chrome.com]`. |
| B6 | `root.$set(navigation_result.props)` — **DOM swap** | `client.js:1824` | — |
| B7 | Svelte settle (`svelte.settled?.()` + two `await svelte.tick()`) | `client.js:1831, 1841-1842` | Low-medium. Sub-frame under normal load. |
| B8 | `question` `$derived.by` re-computes from `page.params.questionId` | `questions/+layout.svelte:~99-110` | Low. Synchronous derived. |
| B9 | `{#if voterCtx.opinionQuestions.length > 0}` / `{#if question && questionBlock}` render gates | `questions/+layout.svelte:257-258` | **Medium.** If `selectedQuestionBlocks`/`opinionQuestions` is momentarily empty the whole question UI unmounts, taking the heading *and* the trigger with it. Would produce a *missing heading* too — testable, and distinguished by H2's discriminator. |
| B10 | `customData = $derived(getCustomData(question))` → `titleParts` → `<Term>` mount | `QuestionHeading.svelte:60-61, 96-99` | **Medium.** A state in which the heading text is correct but `terms` is absent renders the plain-text branch — heading passes, trigger absent. This is H3. |
| B11 | `afterNavigate` rAF focus reset | `+layout.svelte:175-186` | Low for this assertion; relevant to the later `.focus()` at spec line 869. |

### R1.8 The three hypotheses, ranked

**H1 — View-Transition snapshot capture stalls the DOM swap while the URL has already advanced.
(PRIMARY.)**
Mechanism: B4 → B5 → B6 above. Predicted signature: at assertion time `page.url()` is Base-3 and
`document.querySelector('[data-testid=voter-questions-heading]').textContent` still reads Base-2;
`document.startViewTransition` is in flight; the error snapshot (taken after both budgets expire,
≥4 s later, i.e. past Chrome's transition-skip ceiling) shows Base-3 complete. **This predicts the
soft assertion at line 858 ALSO failed in the original run.** See §Unverified U-1 — confirming that
from the original report is the single cheapest discriminator available and should be Plan 01 task 0.

**H2 — The render gate at `questions/+layout.svelte:257-258` transiently closes.**
Mechanism: `voterCtx.opinionQuestions` or `selectedQuestionBlocks` momentarily empty during the hop,
unmounting the whole question block. Predicted signature: `voter-questions-heading` itself absent
(count 0), not merely stale-texted. Distinguishable from H1 by a `toHaveCount` probe on the heading
testid at failure time.

**H3 — `customData.terms` arrives after the heading text.**
Mechanism: B10 — `titleParts` computes with `terms === undefined`, renders plain text, recomputes
later. Predicted signature: heading present **with the correct Base-3 text** and **no** `<button>`
child. This is the only hypothesis under which D-05's "real mount/parse race in Term.svelte /
translateQuestionTerms.ts" clause fires as written. Note it requires `customData` on the *same*
`question` object to change over time; `getCustomData` is a pure read of `question.customData`
(`packages/app-shared/src/data/getCustomData.ts:6`), so H3 additionally requires a `DataRoot.update()`
between the two reads. Least likely of the three, but cheap to falsify with the same probe.

**Already eliminated — do not re-test.** Cold-start Vite module compilation
`[VERIFIED: deferred-items.md:203-210]` — verbatim: *"That hypothesis was TESTED and NOT confirmed:
three subsequent runs, each also the first after a dev-server restart (the two negative-control runs
and the post-restore run), all passed this step."*

---

## R2 — Forcing harness mechanics (D-01)

### R2.1 Playwright version and CDP availability — verified in the installed tree

| Fact | Value | Source |
|---|---|---|
| `@playwright/test` installed | **1.58.2** | `[VERIFIED: node_modules/@playwright/test/package.json "version": "1.58.2"]` |
| `playwright-core` installed | **1.58.2** | `[VERIFIED: node_modules/playwright-core/package.json "version": "1.58.2"]` |
| Lockfile resolution | `playwright@npm:1.58.2` | `[VERIFIED: yarn.lock:8576]` |
| `newCDPSession` on `BrowserContext` | present | `[VERIFIED: node_modules/playwright-core/types/types.d.ts:9024]` — verbatim: `  newCDPSession(page: Page\|Frame): Promise<CDPSession>;` |
| `CDPSession.send` is protocol-typed | present | `[VERIFIED: node_modules/playwright-core/types/types.d.ts:15587-15590]` — verbatim: `  send<T extends keyof Protocol.CommandParameters>(` / `    method: T,` / `    params?: Protocol.CommandParameters[T]` / `  ): Promise<Protocol.CommandReturnValues[T]>;` |
| `Emulation.setCPUThrottlingRate` in bundled protocol | present | `[VERIFIED: node_modules/playwright-core/types/protocol.d.ts:22724]` — verbatim: `    "Emulation.setCPUThrottlingRate": Emulation.setCPUThrottlingRateParameters;` |
| `Network.emulateNetworkConditions` in bundled protocol | present, **marked deprecated** | `[VERIFIED: node_modules/playwright-core/types/protocol.d.ts:12293-12296]` — verbatim: `     * Activates emulation of network conditions. This command is deprecated in favor of the emulateNetworkConditionsByRule` |

**Planning consequence:** CPU throttling is the primary lever (typed, non-deprecated). If a network
lever is also wanted, prefer `page.route()` with an artificial delay over the deprecated CDP command —
it is browser-agnostic and needs no protocol-version reasoning. `Network.emulateNetworkConditionsByRule`
exists in the bundled protocol but is newer/less documented; treat it as `[ASSUMED]` until exercised.

### R2.2 CDP is Chromium-only — which projects the EPERM-07 spec runs under

Every project that could execute the EPERM-07 assertion is Chromium:

| Project | `use` descriptor | Source |
|---|---|---|
| `voter-journey` (owns the EPERM-07 step) | `{ ...devices['Desktop Chrome'] }` | `[VERIFIED: tests/playwright.config.ts:320-327]` — verbatim: `      name: 'voter-journey',` / `      testDir: './tests/specs/voter',` / `      testMatch: /voter-journey\.spec\.ts/,` / `      fullyParallel: false, // single-test serial journey` / `      use: { ...devices['Desktop Chrome'] },` / `      dependencies: ['data-setup-base']` |
| `voter-journey-mobile` | `devices['Desktop Chrome']` + 390×844 viewport | `[VERIFIED: tests/playwright.config.ts:361-373]` |
| `cold-entry-dataroot` (LEAF precedent) | `{ ...devices['Desktop Chrome'] }` | `[VERIFIED: tests/playwright.config.ts:335-341]` |
| `_probes` | `{ ...devices['Desktop Chrome'] }` | `[VERIFIED: tests/playwright.config.ts:442-448]` |

No Firefox or WebKit project exists in the config. **CDP is available on every project that matters
here** — no fallback path is required. `[VERIFIED: tests/playwright.config.ts, projects array 138-870]`

### R2.3 Scoping the shrunken element budget without touching the committed default

`TIMEOUTS` is a frozen literal with **no env override and no injection seam**:
`[VERIFIED: tests/tests/helpers/timeouts.ts:25-39]` — the object is declared
`export const TIMEOUTS = { … } as const;` with plain numeric literals. Re-exported by the barrel
`[VERIFIED: tests/tests/helpers/index.ts]`. It is imported by the spec at
`[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:30]` — verbatim:
`import { TIMEOUTS } from '../../helpers';`.

Its own docblock forbids raising it: `[VERIFIED: tests/tests/helpers/timeouts.ts:16-21]` — verbatim
excerpt: *"A per-test budget ABOVE this value is a NO-OP unless the spec calls `test.setTimeout(...)`,
and any value above 90s must stay inline at the call site as a named `// reason:` exception… Do NOT
raise this default."*

**Recommended seam (no config change, no shared-value change):** the isolated hunt spec declares its
own local constant and passes it explicitly, so nothing outside the file can be affected.

```ts
// tests/tests/specs/voter/eperm07-term-trigger.spec.ts
// FORCING BUDGET — file-local, deliberately BELOW TIMEOUTS.element (2000 ms).
// reason: D-01's negative-control knob. It is scoped to this hunt spec by
// construction; the shared TIMEOUTS.element default is NEVER modified (its own
// docblock, timeouts.ts:16-21, forbids moving it), so no other spec's budget
// can be perturbed by this phase.
const FORCED_ELEMENT_BUDGET = Number(process.env.EPERM07_FORCE_BUDGET_MS ?? TIMEOUTS.element);
```

Reading the value from an env var (defaulting to the real budget) means the *committed* file is
neutral — a plain run of the spec uses the production budget — while the hunt drives it with
`EPERM07_FORCE_BUDGET_MS=150`. That satisfies D-01's reversibility clause ("must not be left in the
committed default configuration") **structurally**, not by remembering to revert. `[ASSUMED — design
recommendation, not an existing repo pattern]`

Do **not** use `test.use({ actionTimeout })` or `expect.configure` for this: `actionTimeout` does not
govern `expect(locator).toBeVisible({ timeout })` when an explicit timeout is passed, and the spec
passes one at every site.

### R2.4 The three discriminator experiments, in the order they should be run

**Discriminator A — switch the View Transition off with zero app change (tests H1 directly).**

`shouldAnimate` short-circuits on `prefers-reduced-motion: reduce`
(`viewTransition.ts:28`). Playwright can emulate that at runtime:
`[VERIFIED: node_modules/playwright-core/types/types.d.ts:2601]` — verbatim:
`    reducedMotion?: null|"reduce"|"no-preference";` (on `page.emulateMedia` options), and the same
key exists on browser-context options at `types.d.ts:10022` and `15270`. Config-level usage is
documented as `contextOptions: { reducedMotion: 'reduce' }`
`[VERIFIED: node_modules/playwright/types/test.d.ts:7447-7453]`.

```ts
// A: VT OFF. If the forced failure DISAPPEARS here and reappears with the line
// removed, the View-Transition layer is the mechanism (H1) — named, not guessed.
await page.emulateMedia({ reducedMotion: 'reduce' });
```

This is the cheapest, highest-information experiment available and it costs zero app change. Run it
**first**.

**Discriminator B — amplify snapshot-capture cost with CDP CPU throttling (forces H1 on demand).**

```ts
import type { CDPSession } from '@playwright/test';

// B: amplify. Attach BEFORE the Base-2 → Base-3 hop, detach after, so the
// throttle is scoped to the transition under test rather than the whole walk.
const client: CDPSession = await page.context().newCDPSession(page);
await client.send('Emulation.setCPUThrottlingRate', { rate: 20 }); // tune empirically (D-01 discretion)
// … drive Base-2 → Base-3 and assert the trigger with FORCED_ELEMENT_BUDGET …
await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await client.detach();
```

`rate` is a slowdown multiplier (1 = no throttle). Start at 4, escalate to 20; the CONTEXT grants
tuning discretion. If the failure will not force at rate 20 with a 150 ms budget, that itself is
evidence against H1 and redirects to H2/H3.

**Discriminator C — a state probe at the moment of failure (separates H1 / H2 / H3).**

Regardless of which forcing lever is applied, capture the tri-state at the instant the assertion is
about to be made. This is what turns a reproduction into a *diagnosis*:

```ts
const forensic = await page.evaluate(() => ({
  url: location.pathname,
  headingCount: document.querySelectorAll('[data-testid="voter-questions-heading"]').length,
  headingText: document.querySelector('[data-testid="voter-questions-heading"]')?.textContent ?? null,
  triggerCount: document.querySelectorAll('[data-testid="voter-questions-term-trigger"]').length,
  // A live view transition parks the outgoing snapshot in the ::view-transition pseudo-tree.
  vtActive: !!document.documentElement.matches(':has(::view-transition)') || undefined
}));
```

| Observed | Verdict |
|---|---|
| url=Base-3, headingCount=1, headingText contains "Base opinion **2**", triggerCount=0 | **H1 confirmed** — stale DOM under an in-flight transition. |
| url=Base-3, headingCount=**0**, triggerCount=0 | **H2 confirmed** — render gate closed. |
| url=Base-3, headingText contains "Base opinion **3**", triggerCount=**0** | **H3 confirmed** — terms arrived late; D-05's app-fix clause fires. |

`[ASSUMED — the `:has(::view-transition)` probe is a convenience signal; if it does not evaluate,
drop it. The three counts are the load-bearing part.]`

### R2.5 What "the pre-fix code FAILS" means for D-16 / criterion 2

Criterion 2 requires a *pair*. Under H1 the "fix" will most plausibly be a settle change in the test
tier or a transition-scoping change in the app tier; either way the negative-control pair is:

| Half | Configuration | Expected |
|---|---|---|
| Pre-fix | forcing harness ON (throttle + shrunk budget), current spec/app | **FAILS**, with the §R2.4-C tri-state recorded |
| Post-fix | forcing harness ON, identical throttle + identical shrunk budget, fixed spec/app | **PASSES** |

The throttle rate and budget must be **byte-identical across the two halves** and recorded in the
evidence document, or the pair proves nothing. Follow the format of
`[VERIFIED: .planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md]`
— §1 "Why this run existed", §2 "Environment" (a full machine stamp: date, repo root, git HEAD, OS,
Node, Vite, SvelteKit, Playwright, Supabase), then the run halves. That file is 673 lines; the
sections to mirror are the environment stamp and the per-half verbatim output, not the length.

---

## R3 — Forensic capture wiring (D-09 · D-10 · D-11)

### R3.1 What exists today

| Setting | Value | Source |
|---|---|---|
| `trace` | `'on'` (all tests, all projects) | `[VERIFIED: tests/playwright.config.ts:132-133]` — verbatim: `    /* Collect trace for all tests. See https://playwright.dev/docs/trace-viewer */` / `    trace: 'on',` |
| `video` | **absent** | `[VERIFIED: tests/playwright.config.ts:131-136 — the entire `use` block is `trace`, `baseURL` only]` |
| `reporter` | html only | `[VERIFIED: tests/playwright.config.ts:120]` — verbatim: `  reporter: [['html', { outputFolder: path.join(TESTS_DIR, '../playwright-report') }]],` |
| `outputDir` | `tests/playwright-results` | `[VERIFIED: tests/playwright.config.ts:85]` |
| `retries` | `process.env.CI ? 3 : 0` | `[VERIFIED: tests/playwright.config.ts:115]` |
| `workers` | `process.env.CI ? 1 : 6` | `[VERIFIED: tests/playwright.config.ts:117]` |
| Artifacts git-ignored | yes | `[VERIFIED: .gitignore:36-37]` — verbatim: `playwright-report/` / `playwright-results/` |

**`workers: 6` locally is itself a finding.** The full local suite runs six concurrent Chromium
instances on one host. That is the contention environment in which the 1-in-8 was observed and the
isolated-spec environment in which it may refuse to reproduce (D-04's stated risk). It is also the
most plausible amplifier of B5's snapshot-capture cost. The plan should treat "run the hunt spec
alone" and "run the hunt spec while five burner workers churn" as **two different experiments**.

### R3.2 D-09 — video retention

`video` is a `use`-level option and is therefore settable per project:
`[VERIFIED: node_modules/playwright/types/test.d.ts:6931]` — verbatim:
`  video: VideoMode | /** deprecated */ 'retry-with-video' | { mode: VideoMode, size?: ViewportSize };`
and `[VERIFIED: node_modules/playwright/types/test.d.ts:6936]` — verbatim:
`export type VideoMode = 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';`

**Recommended scoping (CONTEXT grants the choice):** `retain-on-failure` on the `voter-journey`
project plus the new hunt project, not `'on'` suite-wide.

```ts
    {
      name: 'voter-journey',
      testDir: './tests/specs/voter',
      testMatch: /voter-journey\.spec\.ts/,
      fullyParallel: false, // single-test serial journey
      // D-09 (Phase 138): the EPERM-07 term-trigger intermittent is a LATENCY signal —
      // a trace shows what was asserted, a video shows what the page was doing.
      // `retain-on-failure` keeps the artifact bounded: this project runs ONE test.
      use: { ...devices['Desktop Chrome'], video: 'retain-on-failure' },
      dependencies: ['data-setup-base']
    },
```

**Artifact-size implications.** Measured today: `tests/playwright-results` 64 KB,
`tests/playwright-report` 1.9 MB `[VERIFIED: du -sh, 2026-08-13]` — but that reflects the last run,
which was the 8-test bank-auth invocation, not a 134-test suite. **No trustworthy size measurement
for a full run exists in the record.** With `trace: 'on'` on 134 tests the report is already the
dominant artifact. Recommendation: `retain-on-failure` for video means a green 16-run batch produces
**zero** video bytes, and the one run that matters produces exactly one video. `'on'` would multiply
a ~90 s WebM by 16 runs for no evidentiary gain. The plan should **measure** the post-change artifact
size on the first gate run and record it, rather than predicting it.

**Trade-off to state in the plan:** `retain-on-failure` cannot capture a *near-miss* (a run that
passed at 1.9 s of a 2 s budget). If near-misses are wanted as data, the alternative is `'on'` scoped
to the hunt project only — which is bounded because that project runs one short test.

### R3.3 D-11 — browser console + network capture

**Where it goes.** `page.on(...)` is per-`page` and therefore belongs in a fixture, not in config.
The suite has exactly one existing `page.on` usage
`[VERIFIED: tests/tests/specs/perf/performance-budget.spec.ts:110]` — verbatim:
`    page.on('request', (request) => {` — an inline, spec-local listener. There is **no** auto-fixture
anywhere in `tests/tests` `[VERIFIED: grep for `auto: true` across tests/tests returns nothing]`.

**The fixture layer.** Composition roots that `base.extend`:
`[VERIFIED: tests/tests/fixtures/voter/views.ts:56]`,
`tests/tests/fixtures/voter/voter-journey.fixture.ts`,
`tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`,
`tests/tests/fixtures/candidate/candidate-journey.ts`,
`tests/tests/fixtures/candidate/perm-l10n.ts`,
`tests/tests/fixtures/candidate/candidate-bank-auth-journey.ts`.

`views.ts` is the root the EPERM-07 spec imports
`[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:26]` — verbatim:
`import { expect, test } from '../../fixtures/voter/views';` — and its fixture registration shape is
`[VERIFIED: tests/tests/fixtures/voter/views.ts:56-81]`:

```ts
export const test = base.extend<ViewFixtures>({
  resultsPage: async ({ page }, use) => {
    await use(createResultsPage(page));
  },
  …
```

**Blast radius warning:** 16 files import `fixtures/voter/views`
`[VERIFIED: grep -rln "fixtures/voter/views" tests/tests | wc -l → 16]`, covering `voter-journey`,
`voter-nominations`, six `perm-*` specs and five `_probes`. An `auto: true` fixture added there
attaches listeners to **all** of them. That is acceptable for console/network capture (cheap, no
behaviour change) but must be a deliberate, stated decision — not a side effect.

**Recommended shape** (composes with the existing factory pattern; attaches to `page` and writes on
teardown so the artifact lands next to the trace):

```ts
// tests/tests/fixtures/shared/forensicCapture.fixture.ts
//
// D-11 (Phase 138). Console + failed-request capture for the EPERM-07 hunt.
// AUTO fixture: every spec importing the views root gets it with no opt-in, so a
// recurrence during ANY later v2.15 phase is data rather than noise (waiver
// condition 3). Costs two event listeners per page and changes no behaviour.
import type { ConsoleMessage, Page, Request, TestInfo } from '@playwright/test';

export type ForensicLog = { consoleLines: Array<string>; failedRequests: Array<string> };

export function attachForensicCapture(page: Page): ForensicLog {
  const log: ForensicLog = { consoleLines: [], failedRequests: [] };
  page.on('console', (msg: ConsoleMessage) => {
    log.consoleLines.push(`[${new Date().toISOString()}] ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    log.consoleLines.push(`[${new Date().toISOString()}] pageerror: ${err.message}`);
  });
  page.on('requestfailed', (req: Request) => {
    log.failedRequests.push(
      `[${new Date().toISOString()}] ${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`
    );
  });
  return log;
}

export async function flushForensicCapture(log: ForensicLog, testInfo: TestInfo): Promise<void> {
  await testInfo.attach('console.log', { body: log.consoleLines.join('\n'), contentType: 'text/plain' });
  await testInfo.attach('requestfailed.log', { body: log.failedRequests.join('\n'), contentType: 'text/plain' });
}
```

Registered in `views.ts` as an auto fixture:

```ts
  forensicCapture: [
    async ({ page }, use, testInfo) => {
      const log = attachForensicCapture(page);
      await use(log);
      await flushForensicCapture(log, testInfo);
    },
    { auto: true }
  ],
```

`testInfo.attach` puts the logs into the HTML report alongside the trace, which keeps D-10/D-11
artifacts co-located per run with no new directory convention. `[ASSUMED — attachment API shape is
standard Playwright; verify against `TestInfo` types at implementation time.]`

**Sharper alternative worth a line in the plan:** a `requestfinished` listener that records durations
would directly measure B3 (route module transform). If H1 is disproved and B3 resurfaces, that is the
instrument to add. Do not add it speculatively.

### R3.4 D-10 — dev-server log retention (the constraint the planner must respect)

**Playwright does not manage the frontend dev server in this repo.** The only `webServer` entry in
the config is `PLAYWRIGHT_BANK_AUTH`-gated and spawns the mock OIDC issuer:
`[VERIFIED: tests/playwright.config.ts:1135-1147]` — verbatim:

```ts
        webServer: {
          // Absolute path derived from TESTS_DIR (the `tests/tests` dir). The
          // Playwright `webServer.command` is resolved relative to the config
          // file's directory (`tests/`), so a bare `tests/tests/support/...`
          // relative path doubled into `tests/tests/tests/...` and failed to
          // resolve (ERR_MODULE_NOT_FOUND). Using the absolute entry path makes
          // the spawn cwd-independent.
          command: `npx tsx ${path.join(TESTS_DIR, 'support/mockOidcIssuerEntry.ts')}`,
          url: 'https://127.0.0.1:9443/.well-known/openid-configuration/jwks',
```

The frontend is started separately by the operator — `tests/README.md:7` — verbatim:
`# Prereqs: yarn install && (in another shell) yarn dev`. Confirmed by the Phase-137 gate record
`[VERIFIED: 137-05-TASK1-RESULT.md]` — verbatim table row: `| Dev server | one fresh
`FRONTEND_PORT=5273 yarn dev`, single listener `node` PID 84716 on `[::1]:5273` |`.

**Therefore the only available mechanism for D-10 is redirection at spawn time in the run wrapper:**

```bash
# The run wrapper owns the dev server, because Playwright does not.
FRONTEND_PORT="$PORT" yarn dev > "$RUN_DIR/devserver.log" 2>&1 &
DEV_PID=$!
```

**Do not propose adding a `webServer` entry for the frontend.** It would change the ownership model
the whole suite and the Phase-137 preflight are built around (the preflight *verifies* an
operator-started server rather than trusting a Playwright-started one — `global-setup.ts:18-22`,
verbatim: *"There is no bypass here by design (D-05, D-07): no environment variable skips the gate…
`FRONTEND_PORT` is the legitimate escape hatch — it points the suite at the operator's OWN server on
another port, which the gate then verifies rather than trusts."*), and `reuseExistingServer` would
reintroduce exactly the "something answered on the port" ambiguity Phase 137 eliminated.

Secondary consideration: `yarn dev` invokes `dev:clean` on every start
`[VERIFIED: package.json:8-9]` — verbatim: `    "_dev:concurrent": "yarn dev:clean && concurrently -n
watch,frontend -c blue,green --kill-others-on-fail \"yarn watch:shared\" \"yarn workspace
@openvaa/frontend dev\"",` / `    "dev": "yarn db:start && yarn _dev:concurrent",`. So **every dev-server
restart is a cold Vite cache** — which is why the cold-start hypothesis was so thoroughly exercised
and why restarting between the 16 runs is *not* free.

---

## R4 — The isolated minimal spec (D-03)

### R4.1 Probe precedent — read, and largely rejected as the shape

`_probes` is a real project `[VERIFIED: tests/playwright.config.ts:442-448]` — verbatim:

```ts
    {
      name: '_probes',
      testDir: './tests/specs/_probes',
      testMatch: PROBE_TEST_MATCH,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] }
    },
```

with `PROBE_TEST_MATCH` at `[VERIFIED: tests/playwright.config.ts:16]` — verbatim:
`const PROBE_TEST_MATCH = /(video|questionInfo|popupNotice|orgMatching|numberScale)\.probe\.spec\.ts$/;`
and a **hard orphan guard** that throws at config load if a `*.probe.spec.ts` file is not listed
`[VERIFIED: tests/playwright.config.ts:34-48]`.

Three properties make `_probes` the **wrong** home for the hunt spec:

1. **No `data-setup` dependency** — `[VERIFIED: tests/playwright.config.ts:407-414]`, verbatim:
   *"They are DELIBERATELY OUTSIDE the perm serial-DAG chain… seeded OUT-OF-BAND per the probe header
   (`yarn db:seed --template <perm>`)"*. The hunt needs the `e2e/base` dataset, which
   `data-setup-base` provides automatically.
2. **Excluded from the default suite** — `[VERIFIED: tests/playwright.config.ts:416-420]`, verbatim:
   *"the root `test:e2e` script runs `--grep-invert @probe`. …Every probe test is tagged `@probe`
   for this filter."* Confirmed at `[VERIFIED: package.json:27]` — verbatim:
   `    "test:e2e": "playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe",`.
   A `@probe`-tagged spec would be invisible to the 16-run gate.
3. `questionInfo.probe.spec.ts` seeds `perm-interactive-info`, not `e2e/base`
   `[VERIFIED: tests/tests/specs/_probes/questionInfo.probe.spec.ts:13-20]` — verbatim:
   *"## SEED (out-of-band pre-step) — `yarn db:seed --template perm-interactive-info`"* — and it does
   **not** assert the term trigger at all. It is a precedent for *documentation discipline*, not for
   this spec's wiring.

### R4.2 The right precedent — `cold-entry-dataroot`

`[VERIFIED: tests/playwright.config.ts:329-341]` — verbatim:

```ts
    // cold-entry-dataroot (Phase 117 COLD-03) — LEAF. Read-only cold/direct-URL
    // entry regression for the dataRoot #version-bridge alias-indirection
    // staleness (Spike 024). Reads the base dataset read-only (no teardown of its
    // own). `testMatch` is scoped to the cold-entry spec; `voter-journey`'s
    // `testMatch` (/voter-journey\.spec\.ts/) excludes this file, so neither
    // project picks up the other's specs.
    {
      name: 'cold-entry-dataroot',
      testDir: './tests/specs/voter',
      testMatch: /cold-entry-dataroot\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },
```

This is exactly the shape needed: a LEAF project, in `specs/voter`, scoped by exact `testMatch`,
depending on `data-setup-base`, read-only, no teardown of its own. Its spec docblock is also the
model for how a negative-control-carrying regression spec documents itself
`[VERIFIED: tests/tests/specs/voter/cold-entry-dataroot.spec.ts:1-24]`, including the explicit line
*"These tests are the negative control for the COLD-01 codemod: they FAIL against the pre-fix
(aliased) source… and PASS once each consumer reads `ctx.dataRoot.<prop>` directly"* — precisely the
D-16 posture this phase needs.

**One caution the plan must handle:** `voter-journey`'s `testMatch` is `/voter-journey\.spec\.ts/`,
which would **also match** a file named e.g. `voter-journey-eperm07.spec.ts`. Name the new file so it
does not contain the substring `voter-journey.spec.ts` — e.g. `eperm07-term-trigger.spec.ts`.

### R4.3 Minimum navigation to reach Base-3 with a seeded term

Direct-URL entry is **not** available: the route is `/en/questions/<questionId>` where `questionId`
is the DB id, not the seed `external_id`, and voter context requires an election/constituency
selection. The `FIRST_QUESTION_ID` sentinel is `'__first__'`
`[VERIFIED: apps/frontend/src/lib/utils/route/route.ts:83]` — verbatim:
`export const FIRST_QUESTION_ID = '__first__';` — which reaches Base-1 only, and only after the walk.

Minimum path, all pieces already existing:

1. `await walkUntilQuestionsIntro(page)` — Home → elections → constituencies → `/questions` intro.
   Exported at `[VERIFIED: tests/tests/fixtures/voter/voter-journey.fixture.ts:584]` — verbatim:
   `export { answerAndAdvanceToResults, answerNumberScale, walkUntilQuestionsIntro };`. It installs
   the data-consent `addLocatorHandler` guard (lines 130-147), which is required — that popup was a
   documented full-suite flake source.
2. `voterQuestionsPage.clickStart()` — bypass-tolerant, per
   `[VERIFIED: tests/tests/specs/_probes/questionInfo.probe.spec.ts:43-48]`.
3. Advance past the category intro (`categoryIntros.show` is on for `e2e/base` —
   `[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:611-613]`, verbatim: *"Clicking start lands
   on the first category's intro page before the first question (categoryIntros.show is on for the
   base dataset)"*).
4. Answer Base-1, answer Base-2 → land on Base-3. **This last hop is the transition under test and
   must be driven in-app**, not by `goto`.

Estimated iteration cost: single-digit seconds per attempt versus the 648 s full suite — D-03's
stated economics hold.

### R4.4 Concrete skeleton

```ts
/**
 * tests/tests/specs/voter/eperm07-term-trigger.spec.ts
 *
 * EPERM-07 term-trigger intermittent — isolated hunt spec (Phase 138, D-03).
 *
 * Drives ONLY Base-1 → Base-2 → Base-3 and asserts the in-text <Term> trigger,
 * so the ~1-in-8 event can be forced and observed in seconds rather than in a
 * 648 s full-suite run. LEAF project on `data-setup-base` (e2e/base), read-only,
 * no teardown of its own — shape per `cold-entry-dataroot.spec.ts`.
 *
 * FORCING (D-01), both OFF by default so the committed file is neutral:
 *   EPERM07_FORCE_BUDGET_MS   shrink the element budget (default: TIMEOUTS.element)
 *   EPERM07_FORCE_CPU_RATE    CDP CPU slowdown multiplier (default: 1 = none)
 *   EPERM07_NO_VT             emulate prefers-reduced-motion: reduce (discriminator A)
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch
 * around expect(), no .catch fallback.
 */

import { expect, test } from '../../fixtures/voter/views';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';

const FORCED_BUDGET = Number(process.env.EPERM07_FORCE_BUDGET_MS ?? TIMEOUTS.element);
const CPU_RATE = Number(process.env.EPERM07_FORCE_CPU_RATE ?? 1);

test.describe('eperm07-term-trigger', () => {
  test('the Base-3 in-text term trigger is present when the URL says we are on Base-3', async ({
    page,
    voterQuestionsPage
  }) => {
    if (process.env.EPERM07_NO_VT) await page.emulateMedia({ reducedMotion: 'reduce' });

    await walkUntilQuestionsIntro(page);
    await voterQuestionsPage.clickStart();
    // … advance past the category intro, answer Base-1, answer Base-2 …

    if (CPU_RATE > 1) {
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
    }

    // THE HOP UNDER TEST — in-app navigation Base-2 → Base-3.
    // … click Base-2's last option …

    // Mirror the production settle EXACTLY (voter-journey.spec.ts:186-190):
    // URL-only, swallowed timeout. Reproducing the defect requires reproducing
    // the settle, not improving it.
    await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: TIMEOUTS.page }).catch(() => null);

    // Forensic tri-state at the instant of assertion (§R2.4-C) — recorded whether
    // or not the assertion passes, because a near-miss is data too.
    const forensic = await page.evaluate(() => ({ /* … */ }));
    test.info().annotations.push({ type: 'eperm07-state', description: JSON.stringify(forensic) });

    await expect(page.getByTestId(testIds.voter.questions.termTrigger).first()).toBeVisible({
      timeout: FORCED_BUDGET
    });
  });
});
```

Project registration, alongside the sibling voter LEAF projects:

```ts
    // eperm07-term-trigger (Phase 138, D-03) — LEAF. Isolated hunt spec for the
    // DEF-135-04 intermittent. Read-only on e2e/base; no teardown of its own.
    // `testMatch` is exact; `voter-journey`'s /voter-journey\.spec\.ts/ does not
    // match this filename, so neither project picks up the other's specs.
    {
      name: 'eperm07-term-trigger',
      testDir: './tests/specs/voter',
      testMatch: /eperm07-term-trigger\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], video: 'on' },
      dependencies: ['data-setup-base']
    },
```

**Open decision for the plan (not for research):** whether this spec ships as a permanent regression
guard in the default suite (adding 1 to the executed count, which the plan must then reconcile
against the 134 baseline in every subsequent phase) or is removed at phase close. Both are
defensible; `cold-entry-dataroot` is the precedent for keeping it.

---

## R5 — The 16-run batch (D-13)

### R5.1 Measured baseline

| Measure | Value | Source |
|---|---|---|
| Full-suite wall clock | **648 s (10.8 min)**, 6 workers | `[VERIFIED: 137-05-TASK1-RESULT.md]` — verbatim: `→ 134 passed (10.8m)` and *"Started `2026-08-13T11:59:33Z`, ended `2026-08-13T12:10:21Z`, measured wall **648 s**."* |
| Executed / passed / failed / skipped / flaky / did-not-run | **134 / 134 / 0 / 0 / 0 / 0** | `[VERIFIED: 137-05-SUMMARY.md:14]` |
| `--list` (no grep) | 142 tests in 93 files | `[VERIFIED: 137-05-TASK1-RESULT.md]` |
| `--list --grep-invert @probe` | 134 tests in 88 files | `[VERIFIED: 137-05-TASK1-RESULT.md]` |
| Prior gate wall clocks (Phase 136) | 625 / 621 / 621 s | `[VERIFIED: .planning/milestones/v2.14-REQUIREMENTS.md:119]` |
| `yarn db:reset` cost | 28–30 s | `[VERIFIED: .planning/milestones/v2.14-REQUIREMENTS.md:119]` — verbatim: *"`yarn db:reset` (28–30 s, migrations + `seed.sql`, `storage.buckets` asserted to contain `public-assets`)"* |

**16 runs ≈ 16 × 648 s = 2.88 h of suite time**, plus per-run preconditions. With `db:reset` (~30 s)
and a dev-server restart (cold Vite; start-up measured at ~5.2 s per `global-setup.ts:49`, but
`dev:clean` + `watch:shared` rebuild adds more) the realistic batch is **3.2–3.8 h**. D-13's "~3 h"
is right to the nearest half-hour.

### R5.2 Per-run preconditions — REQUIRED vs optional, grounded

| Step | Verdict | Grounding |
|---|---|---|
| **Preflight confirmation** | **REQUIRED, and automatic** | `globalSetup: './global-setup.ts'` `[VERIFIED: tests/playwright.config.ts:99]`; *"There is no bypass here by design"* `[VERIFIED: tests/global-setup.ts:18-22]`. D-17 is satisfied by construction; the loop must nonetheless **capture** the verdict (§R5.4). |
| **`yarn db:reset` before each run** | **REQUIRED** — by precedent, not by proof | Every prior gate did it per run: Phase 136, verbatim *"Before each run: previous dev server killed, `yarn db:reset` (28–30 s…), cold Vite cache (`yarn dev:clean`), fresh dev server"* `[VERIFIED: .planning/milestones/v2.14-REQUIREMENTS.md:119]`; Phase 137, verbatim `| Database | `yarn db:reset` → exit 0 (migrations + `seed.sql`) |` `[VERIFIED: 137-05-TASK1-RESULT.md]`; Phase 135 gate, *"fresh server + `db:reset` per run"* `[VERIFIED: .planning/milestones/v2.14-REQUIREMENTS.md:111]`. The suite does seed and tear down its own data via `data-setup-base` / `data-teardown-base` and the perm chain, but the `app_settings` JSONB singleton is clobbered by every perm setup (`playwright.config.ts:57-64`) and a prior-session residue is only defended against by a best-effort pre-clear (`playwright.config.ts:297-314`). **Deviating from the established per-run reset would make a green batch arguable.** Do not deviate. |
| **Dev-server restart between runs** | **REQUIRED** — by precedent; and note it forces a cold Vite cache | Same three citations. `yarn dev` runs `dev:clean` first `[VERIFIED: package.json:8-9]`, so restart ⇒ cold cache automatically; a separate `dev:clean` invocation is therefore **redundant**, not optional-extra. |
| **`yarn dev:clean` as a separate step** | **redundant** | Subsumed by `yarn dev` per the line above. |
| **Kill stale listeners / assert port free** | **REQUIRED** | `strictPort: true` `[VERIFIED: apps/frontend/vite.config.ts:43]` makes a same-address collision loud; the wildcard shadow-bind case is what the preflight catches (`CLAUDE.md §E2E preflight`). The Phase-137 record shows the port question is live on this machine: the gate ran on **5273** because the Docker sibling holds `*:5173` `[VERIFIED: 137-05-TASK1-RESULT.md]`. **The 16-run loop should pin `FRONTEND_PORT` explicitly** as a shell prefix (never by editing `.env`, per the same record). |
| **Supabase up** | REQUIRED | `yarn db:reset` runs `yarn db:start` first `[VERIFIED: package.json:16]` — verbatim: `    "db:reset": "yarn db:start && yarn workspace @openvaa/supabase reset",`. |
| **Storage/REST readiness poll before starting the suite** | **RECOMMENDED** | `[VERIFIED: 135-04-SUMMARY.md tech-stack.patterns]` — verbatim: *"Poll REST and Storage for 200 and assert the expected buckets exist before starting a suite; `db:status` passing is not readiness"*. The user memory `project_bank_auth_e2e_env_and_determinism` records a `db:reset`/storage 502-wedge that this poll exists to catch. In an **unattended 16-run batch** this is the difference between one wedged run and a wasted night. |

### R5.3 Validity rules the loop must enforce

- **A run is only evidence if 134 tests executed.** Exit code 0 with 130 executed is a cardinal
  failure per `CLAUDE.md §E2E Hard Rule` ("A 'did not run' E2E test counts as a failure"). Assert the
  executed count, not just the exit status.
- **Runs are consecutive.** Criterion 3 says "16 consecutive". A discarded/aborted run resets the
  count; the log must record aborts, not silently skip them. Precedent for this honesty:
  `[VERIFIED: 135-04-SUMMARY.md provides]` — verbatim: *"zero discarded E2E runs"*.
- **The forcing harness must be OFF.** Any env var from §R4.4 leaking into a gate run invalidates it.
  The loop should `unset` them explicitly and record that it did.
- **`retries` must remain 0 locally.** `retries: process.env.CI ? 3 : 0` `[VERIFIED:
  tests/playwright.config.ts:115]` — the loop must not set `CI=1`, or it silently buys three retries
  per test and the gate proves nothing (and would itself be the "retried-until-green" the cardinal
  rule forbids).

### R5.4 The per-run ledger (D-12's phase-local alternative)

**There is no machine-readable reporter configured today** — the reporter array is html-only
`[VERIFIED: tests/playwright.config.ts:120]`. One must be added, and the cleanest way needs **no
config change at all**:

`PLAYWRIGHT_JSON_OUTPUT_FILE` is honoured by the installed Playwright's reporter output resolver
`[VERIFIED: node_modules/playwright/lib/reporters/base.js:565-571]` — verbatim:

```js
function resolveOutputFile(reporterName, options) {
  const name = reporterName.toUpperCase();
  let outputFile = resolveFromEnv(`PLAYWRIGHT_${name}_OUTPUT_FILE`);
  if (!outputFile && options.outputFile)
    outputFile = import_path.default.resolve(options.configDir, options.outputFile);
  if (outputFile)
    return { outputFile };
```

and the JSON reporter consumes it at `[VERIFIED: node_modules/playwright/lib/reporters/json.js:43]` —
verbatim: `    this._resolvedOutputFile = (0, import_base.resolveOutputFile)("JSON", options)?.outputFile;`.
`PLAYWRIGHT_HTML_OUTPUT_DIR` is likewise honoured `[VERIFIED:
node_modules/playwright/lib/reporters/html.js:154]` — needed because the html `outputFolder` is a
single fixed path that 16 runs would otherwise overwrite.

So each iteration is:

```bash
RUN_DIR="$LEDGER/run-$(printf '%02d' "$i")"
mkdir -p "$RUN_DIR"
PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_DIR/results.json" \
PLAYWRIGHT_HTML_OUTPUT_DIR="$RUN_DIR/html" \
FRONTEND_PORT="$PORT" \
  yarn test:e2e --reporter=html,json 2>&1 | tee "$RUN_DIR/stdout.log"
```

Per-run ledger row, derived mechanically (no human transcription):

| Field | Source |
|---|---|
| run index, ISO start/end timestamps | wrapper |
| exit code | `$?` |
| executed / passed / failed / flaky / did-not-run | `results.json` (`suites[].specs[].tests[].results[].status`) |
| **preflight verdict** | `grep -c 'E2E PREFLIGHT FAILED' "$RUN_DIR/stdout.log"` — the headline string is deliberately fixed for grepping `[VERIFIED: tests/tests/support/preflight.ts:93-97]`, verbatim: *"First line of every failure. Fixed, because the phase's verification commands and the runbook both grep for it."* / `const FAILURE_HEADLINE = 'E2E PREFLIGHT FAILED';` |
| EPERM-07 step outcome specifically | `results.json`, the `voter-journey` spec's step titled `EPERM-07 customData.terms: in-text affordance + definition popup on Base-3` |
| dev-server log | `$RUN_DIR/devserver.log` (§R3.4) |
| git HEAD | `git rev-parse HEAD` — pins the code state the batch proves |

Write the aggregate to a phase-local document, e.g.
`.planning/phases/138-…/138-DETERMINISM-LEDGER.md`, one row per run. That is D-12's "phase-local run
log", and it is auditable rather than asserted — the pattern
`[VERIFIED: 135-04-SUMMARY.md patterns-established]` names: *"Gate-run provenance record: per run
capture db:reset timestamp, a DB-empty assertion, the dev-server pid, the listener-identity check,
and start/end timestamps — so a green can be audited rather than taken on trust"* (with the
listener-identity check now superseded by the Phase-137 preflight).

**Disk budget caution:** 16 × (html report + traces for 134 tests) is the dominant cost. `trace: 'on'`
is suite-wide `[VERIFIED: tests/playwright.config.ts:133]`. The plan should either measure run 1's
`$RUN_DIR` size and extrapolate before launching the remaining 15, or retain only `results.json` +
`stdout.log` + `devserver.log` for green runs and the full report for any run that is not green.

---

## R6 — The soft→hard promotion (D-08)

**Exact current text**, `[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:856-858]` — verbatim:

```ts
      // Settle on Base-3 by its heading.
      const questionHeading = page.getByTestId(testIds.voter.questions.heading);
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7, { timeout: TIMEOUTS.element });
```

**The edit** — a single token, `expect.soft` → `expect`:

```ts
      await expect(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7, { timeout: TIMEOUTS.element });
```

### Could promoting it destabilise currently-passing runs?

**Only in the exact case the promotion exists to expose, and that is the point.** Analysis:

- A soft failure **does** fail the test — it is recorded and surfaces at test end. So promoting it
  does not convert a passing run into a failing one; it converts a *late, misattributed* failure into
  an *early, explicable* one. Under H1 the two assertions fail together anyway.
- **Is it currently failing silently?** No — a soft failure is not silent; it fails the test. The
  suite has been observed at 134/134 with zero failures in the Phase-136 (3×) and Phase-137 (1×)
  gates `[VERIFIED: .planning/milestones/v2.14-REQUIREMENTS.md:119; 137-05-SUMMARY.md:14]`, so line
  858 has not been failing in any recorded green run.
- **Where it changes behaviour:** promotion makes the assertion *abort the step*. Downstream lines
  859-874 (term trigger, focus, popup, blur) stop executing on a Base-3 mis-arrival — which is the
  intended diagnostic improvement (`deferred-items.md:216-221`, verbatim: *"Note that this assertion
  is HARD while the heading assertion immediately above it is `expect.soft`… Making that heading
  assertion hard would improve the diagnostic even if it does not change the failure rate."*).
- **Search of recent run records for a soft failure at 858:** the only recorded occurrence quotes the
  `toBeVisible` error alone `[VERIFIED: deferred-items.md:180-188]`. Whether a soft failure at 858
  accompanied it is **not recoverable from the planning record** — see §Unverified U-1.

### Two collateral observations the planner should know

1. **The spec's own docblock claim about soft assertions is stale.** `[VERIFIED:
   tests/tests/specs/voter/voter-journey.spec.ts:14-15]` — verbatim: *"Genuinely soft assertions use
   `expect.soft` (3-slot budget honored)."* The file contains **138** occurrences of `expect.soft`
   `[VERIFIED: grep -c "expect.soft" tests/tests/specs/voter/voter-journey.spec.ts → 138]`. Promoting
   line 858 does not fix that, but the plan should not cite the "3-slot budget" as a live constraint.
2. **Line 863 is also soft** (`toHaveText(/Likert/i)` on the trigger). D-08 names only 858. Leave 863
   alone unless the plan states a reason — scope creep on a diagnosis phase is exactly what the shape
   note forbids.

---

## R7 — Waiver discharge surface (D-18)

### R7.1 Every file referencing the waiver — grep-complete

`grep -rn "CARDINAL-RULE-WAIVER\|cardinal"` across the repo excluding `node_modules`/`.git`
`[VERIFIED: repo-wide grep, 2026-08-13]`:

| # | File:line | What it says | Must be edited? |
|---|---|---|---|
| 1 | `.planning/v2.14-CARDINAL-RULE-WAIVER.md` (whole file) | the waiver itself, four conditions | **YES** — marked discharged, diagnosis referenced (D-18) |
| 2 | `.planning/STATE.md:65` | *"WAIVED at v2.14 close… Phase 138 discharges it unrenewed"* | **YES** |
| 3 | `.planning/MILESTONES.md:25` | *"Closed under an explicit written waiver… Not closed, not downgraded"* | **YES** — add the discharge with a forward reference |
| 4 | `.planning/REQUIREMENTS.md:45-47` | INTEG-01/02/03 checkboxes | **YES** — flip to `[x]` with evidence |
| 5 | `.planning/REQUIREMENTS.md:137-139` | traceability rows, `Pending` | **YES** |
| 6 | `.planning/ROADMAP.md:252` | phase checkbox, unticked | **YES** |
| 7 | `.planning/ROADMAP.md:292-304` | Phase 138 detail block, `**Plans**: TBD` | **YES** — status line + plan list |
| 8 | `.planning/ROADMAP.md:491` | progress table row `138 … 0/TBD \| Not started` | **YES** |
| 9 | `.planning/ROADMAP.md:201` | *"waiver: `.planning/v2.14-CARDINAL-RULE-WAIVER.md`"* | **check** — context-dependent |
| 10 | `.planning/PROJECT.md:20` and `:36` and `:107` | milestone framing: *"the waiver is to be discharged, not renewed"* / *"closed under an explicit written waiver"* | **check** — `:36` is a v2.14 historical record and should probably stay; `:20`/`:107` describe live intent |
| 11 | `.planning/milestones/v2.14-phases/135-…/deferred-items.md:164-222` | DEF-135-04, `**Status:** OPEN` | **YES** — status flip + diagnosis reference |
| 12 | `.planning/milestones/v2.14-REQUIREMENTS.md:111, 119` | archived v2.14 records mentioning DEF-135-04 staying OPEN | **NO** — archived milestone record; do not rewrite history |
| 13 | `CLAUDE.md:39` §E2E Hard Rule | the rule itself | **NO** — the rule never changed; it was waived, not amended |
| 14 | `.planning/v2.14-E2E-COVERAGE-PLAN.md`, `.planning/v2.14-E2E-DISCUSSION-POINTS.md`, `.planning/quick/260620-ole-…` | incidental uses of the word "cardinal" | **NO** |

**The archived-vs-live distinction matters.** ROADMAP criterion 4 says no *"could not reproduce"*
closure exists "anywhere in the record" — that is about **this** phase's closure language, not a
mandate to rewrite v2.14's archive. Editing archived milestone documents to erase the historical
"stayed OPEN" statements would itself be a record integrity problem. State that boundary in the plan.

### R7.2 Forbidden-artefact baselines — making "absence" checkable

Run today, so the plan can assert an unchanged baseline rather than a vibe:

| Pattern | Current count in `tests/` | Source |
|---|---|---|
| `test.skip(` | **0** | `[VERIFIED: grep -rn "\.skip(" tests/tests --include=*.ts → no matches]` |
| `test.fixme(` | **0** | `[VERIFIED: same grep]` |
| `test.only(` / `.only(` | **0** | `[VERIFIED: same grep]` |
| `describe.skip` | **0 in code** | `[VERIFIED: grep -rn "describe.skip" tests/ → one hit, and it is prose in `tests/README.md:133`, not code]` |
| `retries` in config | **1** — `retries: process.env.CI ? 3 : 0` | `[VERIFIED: tests/playwright.config.ts:115]` |
| `forbidOnly` | active on CI | `[VERIFIED: tests/playwright.config.ts:113]` — verbatim: `  forbidOnly: !!process.env.CI,` |

Suggested verification command for the plan (fails loudly if any appear):

```bash
! grep -rnE 'test\.(skip|fixme|only)\(|describe\.(skip|only)\b' tests/tests --include='*.ts'
```

**Two live findings the plan must handle.**

**F-1 — a stale quarantine claim in the live runbook.** `[VERIFIED: tests/README.md:133]` — verbatim:

> The `perm-per-app-notifications` projects + spec are currently quarantined (`describe.skip`) pending
> the Svelte 5 runes migration; their wiring stays in place. See the inline
> `// TODO: re-enable perm-per-app-notifications` marker in `playwright.config.ts`.

Both halves are false today: the spec contains no `describe.skip`
`[VERIFIED: tests/tests/specs/perm/perm-per-app-notifications.spec.ts:18-20 — verbatim
`test.describe('perm-per-app-notifications', () => {`]`, and no such TODO marker exists in
`playwright.config.ts` `[VERIFIED: grep "re-enable perm-per-app-notifications" tests/ → only the
README line]`. Criterion 4 forbids a `test.skip` existing "anywhere in the record"; a live document
asserting one exists is precisely the kind of thing a grep-based audit trips on. **Fix the README
line as part of the discharge**, and record why.

**F-2 — a second stale claim in the same section.** `[VERIFIED: tests/README.md:129]` — verbatim:
*"voter permutation chain (runs in PARALLEL with the base / journey families; FIRST setup has NO
upstream dep)"* — contradicted by the config, where the first perm setup depends on both journeys
`[VERIFIED: tests/playwright.config.ts:487-489]` — verbatim: `      testMatch:
/perm-1e1cg1co\.setup\.ts/,` … `      dependencies: ['voter-journey', 'candidate-journey']`, and by the
config's own docblock `[VERIFIED: tests/playwright.config.ts:57-64]`. This is not in Phase 138's
scope, but a phase that touches the concurrency story to explain a contention-driven race should
either fix it or file it. **Recommendation: file it as a deferred item; do not absorb it.**

**F-3 — the pre-existing CI `retries: 3`.** It predates this phase and is not a "retry annotation"
added to mask this defect. But criterion 4's language is absolute, so the plan should state
explicitly, on the record, that (a) the local gate runs with `retries: 0` (§R5.3) and (b) the CI
setting is untouched and pre-existing — rather than leaving a reader to discover it and wonder.

---

## Standard Stack

**No new packages.** This phase uses only what is installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 `[VERIFIED: node_modules/@playwright/test/package.json]` | test runner, CDP, video, JSON reporter | already the suite's runner |
| `playwright-core` | 1.58.2 `[VERIFIED: node_modules/playwright-core/package.json]` | CDP protocol types | ships `Protocol.CommandParameters` so CDP calls type-check under C-7 |
| `@sveltejs/kit` | 2.55.0 `[VERIFIED: node_modules/@sveltejs/kit/package.json]` | client router (the ordering under investigation) | app dependency; read-only for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CDP `Emulation.setCPUThrottlingRate` | `page.route()` with an artificial delay | Delays the network, not the renderer. Under H1 the stall is a rendering-frame cost, so route delay would target the wrong tier. Keep as the H-B3 instrument if H1 falls. |
| CDP `Network.emulateNetworkConditions` | `Network.emulateNetworkConditionsByRule` | The former is marked deprecated in the bundled protocol `[VERIFIED: protocol.d.ts:12293]`; the latter is newer and unexercised here `[ASSUMED]`. Prefer `page.route()` if a network lever is needed at all. |
| A Playwright `webServer` entry for the frontend | operator-started `yarn dev` (status quo) | §R3.4 — changing it would undermine the Phase-137 trust model. Not a real alternative. |
| An `auto: true` capture fixture in `views.ts` | per-spec inline `page.on(...)` | Inline is narrower but misses the waiver's condition-3 goal ("the next occurrence is data") for later phases' runs. Auto is recommended; the 16-file blast radius must be stated. |

**Installation:** none.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every tool used is already in the
lockfile and was version-verified against the installed tree this session (`@playwright/test` 1.58.2,
`playwright-core` 1.58.2, `@sveltejs/kit` 2.55.0). No registry lookup was required and no package
name was sourced from training data or web search.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram — the failing path as data flow

```
 [Playwright worker]                     [Browser page]                    [Dev server :PORT]
        │                                      │                                  │
        │ answerOption.click()  ───────────────▶ Svelte handler → handleJump()     │
        │  (spec:279)                           (questions/+layout.svelte:222)     │
        │                                      │                                  │
        │                                      ├─ goto(url,{noScroll}) (:252)      │
        │                                      │      │                            │
        │                                      │      ▼                            │
        │                                      │  kit navigate()                   │
        │                                      │      ├─ await load_route ─────────▶ Vite transform
        │                                      │      │   (client.js:1642)         │  (route module)
        │                                      │      │◀───────────────────────────┤
        │                                      │      │                            │
        │                                      │      ├─ history.pushState  ◀── URL becomes /questions/<base3>
        │                                      │      │   (client.js:1760)         │
        │ waitForURL(...) SATISFIED ◀──────────┼──────┘                            │
        │  (spec:189, .catch swallows)         │                                   │
        │                                      │      ├─ await onNavigate[]        │
        │        ┌── RACE WINDOW ──────────────┼──────┤   (client.js:1782)         │
        │        │  DOM still shows BASE-2     │      │      └─ startViewTransition │
        │        │  Base-2 has NO terms        │      │         (+layout.svelte:167)│
        │        │  ⇒ term-trigger count = 0   │      │         └─ [outgoing        │
        │        │                             │      │             snapshot        │
        │        │                             │      │             capture] ◀── stalls under
        │        │                             │      │                            contention
        │ expect.soft(heading).toHaveText ─────┼──────┤   (2 s budget)              │
        │  (spec:858 — SOFT, does not abort)   │      │                             │
        │ expect(termTrigger).toBeVisible ─────┼──────┤   (2 s budget) ⇒ FAILS      │
        │  (spec:862 — HARD)                   │      │                             │
        │        └─────────────────────────────┼──────┤                             │
        │                                      │      ├─ root.$set(props)  ◀── DOM SWAP
        │                                      │      │   (client.js:1824)          │
        │ [error snapshot captured] ───────────▶ shows BASE-3 heading WITH the      │
        │                                        'Likert' <button> — the paradox    │
```

### Pattern 1 — Settle on the DOM, not on the URL

**What:** After a client-side navigation, assert a destination-specific DOM fact before asserting
anything else. The URL is set before the DOM under SvelteKit (`client.js:1760` vs `:1824`).
**When to use:** Every in-app hop whose next assertion is not itself the heading gate.
**Existing correct instance:** `expectQuestionAndAdvance` does this at its own entry
(`voter-journey.spec.ts:252`, `toHaveText`) — but the EPERM-07 step is a *trailing* assertion on a hop
whose settle is only the swallowed `waitForURL`.

### Pattern 2 — Negative-control-pair recording

**What:** Two runs, identical environment, one against pre-fix and one against post-fix, both under
the identical forcing configuration, both recorded verbatim with a full machine stamp.
**Precedent:** `137-NEGATIVE-CONTROL.md` §1-§2 `[VERIFIED]`.

### Pattern 3 — LEAF regression project on `data-setup-base`

**What:** A narrow spec + a named project with an exact `testMatch` and `dependencies:
['data-setup-base']`, read-only, no teardown of its own.
**Precedent:** `cold-entry-dataroot` `[VERIFIED: tests/playwright.config.ts:329-341]`.

### Anti-Patterns to Avoid

- **Raising `TIMEOUTS.element`.** Forbidden by D-07 *and* by the constant's own docblock
  (`timeouts.ts:16-21`). It is also, under H1, not even a fix — it only widens the window in which a
  stale DOM goes unnoticed.
- **Adding `test.skip` / retries / `test.slow()` to the EPERM-07 step.** Forbidden by C-2 and D-18.
- **Setting `CI=1` to run the batch.** Buys `retries: 3` (`playwright.config.ts:115`) and collapses
  workers to 1 — changing *both* the retry posture and the contention environment the failure lives
  in. It would produce a green that proves nothing.
- **Adding a frontend `webServer` entry.** §R3.4.
- **Instrumenting `translateQuestionTerms.ts`.** It never executes (§R1.6).
- **Re-testing cold-start Vite.** Explicitly eliminated (`deferred-items.md:203-210`).
- **Closing on non-reproduction.** ROADMAP shape note, verbatim: *"What it may not do is close on
  non-reproduction."*

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Proving the page under test is this checkout | a bespoke port/title check | the existing `globalSetup` preflight | `tests/tests/support/preflight.ts` + `tests/global-setup.ts` already do it, unskippably, and Phase 137 proved a title check is defeatable (`137-NEGATIVE-CONTROL.md`). D-17 is free. |
| Machine-readable per-run results | a stdout parser over `--reporter=list` | Playwright JSON reporter + `PLAYWRIGHT_JSON_OUTPUT_FILE` | Verified supported in the installed build (`reporters/base.js:565-571`). A regex over human output is exactly the fragile guard this milestone exists to eliminate. |
| Per-run HTML report isolation | copying `playwright-report/` after each run | `PLAYWRIGHT_HTML_OUTPUT_DIR` | Verified at `reporters/html.js:154`. |
| Disabling the View Transition for a discriminator | patching `viewTransition.ts` or threading `?notr=1` through the router | `page.emulateMedia({ reducedMotion: 'reduce' })` | The app already gates on `prefers-reduced-motion` (`viewTransition.ts:28`); Playwright emulates it (`types.d.ts:2601`). Zero app change ⇒ the discriminator cannot itself be the cause. |
| CPU throttling | a busy-loop injected into the page | CDP `Emulation.setCPUThrottlingRate` | A JS busy-loop occupies the same main thread the renderer needs, confounding the measurement; CDP throttles at the scheduler level. |
| Walking the voter to the questions flow | a new bespoke walk | `walkUntilQuestionsIntro` | `voter-journey.fixture.ts:130` — carries the data-consent `addLocatorHandler` guard whose absence was itself a documented full-suite flake. |
| Term-affordance assertions | new locators | `testIds.voter.questions.termTrigger` / `termPopup` | `testIds.ts:243-244`; the suite forbids raw locators. |

**Key insight:** every instrument this phase needs already exists in the tree or in the installed
Playwright. The phase's difficulty is entirely diagnostic, not constructional — which is why the
ROADMAP calls it a diagnosis phase and forbids padding it.

---

## Common Pitfalls

### Pitfall 1 — Reproducing in isolation and calling it the mechanism
**What goes wrong:** The isolated spec forces a failure at CPU rate 20; the fix makes it pass; the
full suite was never the environment.
**Why it happens:** The isolated spec has no contention (`workers: 6` is a *suite* property).
**How to avoid:** Confirm the forced repro *and* the fix under both conditions — alone, and with the
full suite's worker pressure. D-04 pre-authorises the finding that isolation cannot reproduce.
**Warning signs:** the forced failure needs an implausibly extreme throttle to appear.

### Pitfall 2 — The forcing harness leaking into the gate
**What goes wrong:** `EPERM07_FORCE_*` set in a shell, exported, and inherited by the 16-run batch.
**How to avoid:** The loop `unset`s them explicitly and records that it did; the committed spec
defaults to the production budget so a bare run is neutral (§R2.3).

### Pitfall 3 — Treating a green batch as the diagnosis
**What goes wrong:** 16 green runs get written up as the result. That is precisely the
"could not reproduce" closure criterion 4 forbids.
**How to avoid:** The batch is criterion **3** only. Criteria 1 and 2 are discharged by the forced
repro and the negative-control pair, and they come first.

### Pitfall 4 — The port
**What goes wrong:** The batch starts on :5173 where the Docker sibling holds the IPv6 wildcard;
`localhost` and `127.0.0.1` reach different servers.
**Why it happens:** `strictPort` closes the same-address case but not the wildcard shadow-bind
(`CLAUDE.md §E2E preflight`); the Phase-137 gate hit exactly this and ran on 5273
`[VERIFIED: 137-05-TASK1-RESULT.md]`.
**How to avoid:** Pin `FRONTEND_PORT` as a shell prefix for both the dev server and the suite; never
edit `.env`.

### Pitfall 5 — A wedged Supabase quietly poisoning several runs
**Why it happens:** `db:reset` can leave storage 502-ing briefly; `db:status` passing is not readiness
`[VERIFIED: 135-04-SUMMARY.md tech-stack.patterns]`.
**How to avoid:** Poll REST + Storage for 200 and assert the `public-assets` bucket before starting
each run; abort the batch loudly if the poll fails rather than running into it.

### Pitfall 6 — Disk exhaustion mid-batch
**Why it happens:** `trace: 'on'` × 134 tests × 16 runs, plus video.
**How to avoid:** Measure run 1's directory, extrapolate, and prune green runs to
`results.json` + `stdout.log` + `devserver.log`.

### Pitfall 7 — Naming the new spec so `voter-journey`'s `testMatch` swallows it
**Why it happens:** `testMatch: /voter-journey\.spec\.ts/` is a substring regex, not an exact path.
**How to avoid:** `eperm07-term-trigger.spec.ts` (§R4.2).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Assert the `:5173` listener is a `node` process from this repo | Assert the **served application's response** echoes this checkout's absolute path via `/@fs` | Phase 137 (2026-08-13) | D-17 is satisfied automatically for every run in this phase. |
| Q→Q navigation without a transition layer | `onNavigate` + `document.startViewTransition` on every in-app hop | Phase ~99 (VT-01) | Introduced the URL-before-DOM window this research names as the primary suspect. |
| a11y specs racing the cross-fade | a11y specs drive Q→Q with `?notr=1` | Phase 99 (D-02) | The mitigation exists — and was never applied to `voter-journey`. |
| `translateQuestionTerms.ts` as the term-localisation pass | terms arrive as raw JSONB `customData`; parsing lives in `QuestionHeading.addTermsToTitle` | unknown | `translateQuestionTerms.ts` is dead code (§R1.6). |

**Deprecated/outdated:**
- `Network.emulateNetworkConditions` — marked deprecated in the bundled CDP protocol
  `[VERIFIED: protocol.d.ts:12293]`.
- `tests/README.md:133` (quarantine claim) and `:129` (perm-chain independence claim) — both stale
  (§R7.2 F-1, F-2).

---

## Runtime State Inventory

_Not applicable — this is a diagnosis phase, not a rename/refactor/migration phase. No stored data,
service config, OS registration, secret name, or build artifact carries a string this phase renames._

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| `@playwright/test` | every plan | ✓ | 1.58.2 `[VERIFIED: node_modules/@playwright/test/package.json]` | — |
| Chromium browser binary | the hunt + the batch | ✓ (assumed present; the Phase-137 gate ran 134 tests on 2026-08-13) | — | `yarn playwright install` |
| CDP (Chromium-only) | D-01 throttling | ✓ — all relevant projects are `devices['Desktop Chrome']` `[VERIFIED: playwright.config.ts:325, 339, 365, 447]` | — | none needed |
| Local Supabase | `db:reset` per run | ✓ — `supabase_kong_openvaa-local` observed healthy on 54321 `[VERIFIED: 137-NEGATIVE-CONTROL.md §2]` | — | — |
| Frontend dev server (operator-started) | every run | ✓ | Vite 6.4.1 (frontend), SvelteKit 2.55.0 `[VERIFIED: 137-NEGATIVE-CONTROL.md §2; node_modules/@sveltejs/kit/package.json]` | `FRONTEND_PORT` alternate port |
| Free port for the dev server | every run | ⚠ — **:5173 is held by the Docker sibling's `*:5173` wildcard** `[VERIFIED: 137-05-TASK1-RESULT.md]` | — | `FRONTEND_PORT=5273` shell prefix (the Phase-137 gate's own choice) |
| ~3.5 h of uninterrupted host time + disk for 16 runs' artifacts | D-13 batch | ⚠ unmeasured | — | prune green-run artifacts (§R5.4) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** port 5173 → use `FRONTEND_PORT`.

---

## Validation Architecture

`.planning/config.json` contains no `workflow.nyquist_validation` key `[VERIFIED:
.planning/config.json — workflow object is `{research, plan_check, verifier, _auto_chain_active,
use_worktrees}`]`, so per the rule "absent = enabled" this section applies.

### Test Framework
| Property | Value |
|---|---|
| Framework | Playwright Test 1.58.2 `[VERIFIED: node_modules/@playwright/test/package.json]` |
| Config file | `tests/playwright.config.ts` `[VERIFIED]` |
| Quick run command | `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line` (new project, lands in this phase) |
| Full suite command | `yarn test:e2e` `[VERIFIED: package.json:27]` |
| Unit framework (unaffected) | vitest via `turbo run test:unit` `[VERIFIED: package.json:25]` |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| INTEG-01 | The failure is forced on demand under a named configuration | e2e (isolated) | `EPERM07_FORCE_CPU_RATE=20 EPERM07_FORCE_BUDGET_MS=150 npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger` | ❌ Wave 0 |
| INTEG-01 | The tri-state at failure discriminates H1/H2/H3 | e2e artifact | the `eperm07-state` annotation in `results.json` | ❌ Wave 0 |
| INTEG-02 (crit. 2) | Pre-fix FAILS under the forcing harness | e2e negative control | same command, on the pre-fix tree | ❌ Wave 0 |
| INTEG-02 (crit. 2) | Post-fix PASSES under the identical forcing harness | e2e negative control | same command, byte-identical env, on the post-fix tree | ❌ Wave 0 |
| INTEG-02 (crit. 3) | 16 consecutive full-suite runs, 134/134, zero EPERM-07 failures | e2e batch | `tests/scripts/determinism-batch.sh 16` (wrapper) | ❌ Wave 0 |
| INTEG-02 | Each of the 16 runs is preflight-confirmed | grep over per-run stdout | `grep -c 'E2E PREFLIGHT FAILED' run-NN/stdout.log` → 0 | ✅ (preflight exists; the capture does not) |
| INTEG-03 | No forbidden artefact exists | static | `! grep -rnE 'test\.(skip\|fixme\|only)\(\|describe\.(skip\|only)\b' tests/tests --include='*.ts'` | ✅ baseline 0 today |
| INTEG-03 | Waiver + every referencing document reflect discharge | static/manual | checklist in §R7.1 | ✅ files exist |
| D-08 | Heading assertion at 858 is hard | static | `! grep -n 'expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7' tests/tests/specs/voter/voter-journey.spec.ts` | ✅ file exists |
| D-09/10/11 | Forensic artifacts are produced on a failing run | e2e artifact | inspect `run-NN/html` for video + `console.log`/`requestfailed.log` attachments | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line` (seconds) plus `yarn typecheck:tests` and `yarn lint:check` `[VERIFIED: package.json:32-33]`.
- **Per wave merge:** `yarn test:e2e --project=voter-journey` (pulls `data-setup-base`; the EPERM-07 step is inside it).
- **Phase gate:** the 16-run batch (§R5), then full suite green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` — the isolated hunt spec (INTEG-01, criteria 1-2)
- [ ] `eperm07-term-trigger` project entry in `tests/playwright.config.ts`
- [ ] `tests/tests/fixtures/shared/forensicCapture.fixture.ts` + registration in `views.ts` (D-11)
- [ ] `video` on the `voter-journey` project (D-09)
- [ ] Run wrapper script owning dev-server spawn + log redirection + per-run ledger (D-10, D-12, criterion 3)
- [ ] `.planning/phases/138-…/138-NEGATIVE-CONTROL.md` (criterion 2, format per Phase 137)
- [ ] `.planning/phases/138-…/138-DETERMINISM-LEDGER.md` (criterion 3)
- [ ] Framework install: **none required**

---

## Security Domain

`.planning/config.json` carries no `security_enforcement` key `[VERIFIED: .planning/config.json]`, so
per "absent = enabled" this section is included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | This phase touches no auth path. The voter journey is unauthenticated (`cold-entry-dataroot.spec.ts:18` — verbatim: *"Voter routes are public (no auth)"*). |
| V3 Session Management | no | No session code changed. |
| V4 Access Control | no | No RLS/policy surface changed. |
| V5 Input Validation | no | No new user input surface. The env vars added (`EPERM07_FORCE_*`) are developer-controlled test knobs, never read by the application. |
| V6 Cryptography | no | None. |
| V7 Error Handling & Logging | **yes** | D-10/D-11 add log retention. Dev-server logs and browser console logs can contain seeded PII-shaped data (the `e2e/base` dataset seeds candidate names/emails) and, if a run is misconfigured, request URLs with tokens. |
| V14 Configuration | **yes** | The forcing knobs must not survive into committed defaults (D-01 reversibility). |

### Known Threat Patterns for this change

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Retained dev-server / console logs committed to git and leaking local secrets or `.env`-derived values | Information Disclosure | `playwright-report/` and `playwright-results/` are already git-ignored `[VERIFIED: .gitignore:36-37]`; the plan must place the ledger's raw logs under an ignored path (or scrub them) and commit only the derived per-run table. **`.planning/` is committed** — do not put raw `devserver.log` there. |
| Forcing knobs left enabled in the committed config, silently weakening every later run's budget | Tampering (of the test oracle) | §R2.3's env-default design keeps the committed file neutral; add a verification grep asserting `TIMEOUTS.element` is still `2_000` and that no `EPERM07_FORCE_*` default is non-neutral. |
| A "green" batch produced with `CI=1` (3 retries, 1 worker) misrepresented as the gate | Repudiation / false assurance | §R5.3 — assert `retries` effective value and worker count in the ledger. |
| CDP session left attached / throttle left applied, distorting later tests in the same worker | Denial of Service (self-inflicted) | Always reset `rate: 1` and `client.detach()` in a `finally`, and scope the CDP session to the hunt project only. |

---

## Code Examples

### Reading the tri-state at the moment of failure (the diagnosis instrument)

```ts
// Source: composed from tests/tests/utils/testIds.ts:182,243 (verbatim ids) and the
// render gates at (voters)/(located)/questions/+layout.svelte:257-258.
const forensic = await page.evaluate(() => ({
  pathname: location.pathname,
  headingCount: document.querySelectorAll('[data-testid="voter-questions-heading"]').length,
  headingText: document.querySelector('[data-testid="voter-questions-heading"]')?.textContent ?? null,
  triggerCount: document.querySelectorAll('[data-testid="voter-questions-term-trigger"]').length
}));
```

### Disabling the View Transition without touching the app

```ts
// Source: apps/frontend/src/lib/utils/viewTransition.ts:28 (the app's own gate) +
// node_modules/playwright-core/types/types.d.ts:2601 (emulateMedia option).
await page.emulateMedia({ reducedMotion: 'reduce' });
```

### CPU throttling, scoped and always reset

```ts
// Source: node_modules/playwright-core/types/types.d.ts:9024 (newCDPSession),
// :15587-15590 (typed send), node_modules/playwright-core/types/protocol.d.ts:22724.
const client = await page.context().newCDPSession(page);
try {
  await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
  // … the hop under test …
} finally {
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await client.detach();
}
```

### One iteration of the determinism batch

```bash
# Source: package.json:16,27 (db:reset, test:e2e); node_modules/playwright/lib/reporters/base.js:565-571
# (PLAYWRIGHT_JSON_OUTPUT_FILE); reporters/html.js:154 (PLAYWRIGHT_HTML_OUTPUT_DIR);
# tests/tests/support/preflight.ts:93-97 (the fixed failure headline).
set -euo pipefail
unset EPERM07_FORCE_BUDGET_MS EPERM07_FORCE_CPU_RATE EPERM07_NO_VT || true
unset CI || true                       # retries MUST stay 0 (playwright.config.ts:115)

RUN_DIR="$LEDGER/run-$(printf '%02d' "$i")"; mkdir -p "$RUN_DIR"
date -u +%FT%TZ > "$RUN_DIR/started"
git rev-parse HEAD > "$RUN_DIR/head"

yarn db:reset                                            # 28-30 s
# … poll REST + Storage for 200 and assert the public-assets bucket …
FRONTEND_PORT="$PORT" yarn dev > "$RUN_DIR/devserver.log" 2>&1 &   # D-10; runs dev:clean first
DEV_PID=$!

PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_DIR/results.json" \
PLAYWRIGHT_HTML_OUTPUT_DIR="$RUN_DIR/html" \
FRONTEND_PORT="$PORT" \
  yarn test:e2e --reporter=html,json 2>&1 | tee "$RUN_DIR/stdout.log"
echo "${PIPESTATUS[0]}" > "$RUN_DIR/exit"

grep -c 'E2E PREFLIGHT FAILED' "$RUN_DIR/stdout.log" > "$RUN_DIR/preflight-failures" || true
kill "$DEV_PID"; wait "$DEV_PID" 2>/dev/null || true
date -u +%FT%TZ > "$RUN_DIR/ended"
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | H1 (View-Transition snapshot capture stalling the DOM swap) is the mechanism | §R1.8 | The hunt starts on the wrong hypothesis. Mitigated: it is presented as a hypothesis with a named, cheap discriminator (§R2.4-A), and H2/H3 have their own discriminators from the same probe. The phase is explicitly allowed to spend a plan on a disproved hypothesis (ROADMAP shape note). |
| A2 | `workers: 6` contention is the amplifier that makes the failure ~1-in-8 | §R3.1 | If the amplifier is something else (GC, Supabase latency, disk), the isolated spec may not force it and D-04's redirect fires. Low cost — D-04 pre-authorises it. |
| A3 | Chrome skips the view transition after ~4 s and freezes the renderer during the update callback | §Summary, §R1.8 | `[CITED: developer.chrome.com/blog/view-transitions-in-2025; vtbag.dev]` — not verified against this Chromium build. If the ceiling differs, the *shape* of the argument is unaffected (the race window exists regardless); only the "why the snapshot eventually shows Base-3" detail changes. |
| A4 | An `auto: true` fixture on `views.ts` is acceptable across all 16 importing files | §R3.3 | Two listeners per page; no behaviour change expected. If it perturbs timing, scope it to the hunt + voter-journey projects instead. |
| A5 | `testInfo.attach` is the right home for console/network logs | §R3.3 | Cosmetic; a plain file write to `testInfo.outputPath()` is the fallback. |
| A6 | `retain-on-failure` video is the right default scope | §R3.2 | Loses near-miss capture. Stated as a trade-off; `'on'` on the hunt project only is the counter-option. |
| A7 | `Network.emulateNetworkConditionsByRule` is the non-deprecated successor | §Standard Stack | Unexercised. Recommendation is to avoid the network lever entirely unless H1 falls. |
| A8 | Per-run `db:reset` + dev-server restart is REQUIRED (rather than merely conventional) | §R5.2 | Grounded in three prior gates' practice, not in a proof that omitting it breaks. If the batch is shortened by dropping it, a reviewer can legitimately question the green. Recommendation: do not deviate. |
| A9 | The 16-run batch fits in ~3.2-3.8 h | §R5.1 | Derived from 648 s × 16 plus ~30 s `db:reset` and an unmeasured dev-server start. If the dev-server cold start is slower than assumed the batch runs longer; it is unattended, so the risk is schedule only. |
| A10 | Artifact volume for 16 runs is manageable with pruning | §R3.2, §R5.4 | No full-suite artifact measurement exists. Mitigated by measuring run 1 before committing to the remaining 15. |

---

## Unverified / Open Questions

**U-1 — Did the soft heading assertion at line 858 ALSO fail in the original occurrence?**
This is the single highest-value unknown and the cheapest discriminator between H1/H2 (stale or
absent DOM ⇒ 858 fails too) and H3 (correct Base-3 heading, missing trigger ⇒ 858 passes).
`deferred-items.md:180-188` quotes only the `toBeVisible` error and the page snapshot; the full
Playwright report from that run is not in the record and `tests/playwright-report/` has been
overwritten many times since. **Recommendation:** make this Plan 01, Task 0 — search for any retained
artifact (`playwright-report`, `playwright-results`, a pasted report in a Phase-135 plan/summary,
shell history). If it cannot be recovered, record that explicitly and proceed with all three
hypotheses live. Do **not** infer it.

**U-2 — Whether the `question` object's `customData` can change identity/content after first
render.** H3 requires it. `getCustomData` is a pure read (`packages/app-shared/src/data/getCustomData.ts:6`),
so this reduces to whether `DataRoot.update()` fires between the two paints on a Q→Q hop. Not traced
this session; determinable from `voterContext` + `DataRoot` in ~20 minutes if H1 and H2 both fall.

**U-3 — Whether the term trigger participates in the view-transition pseudo-tree.** `question-heading`
carries a `view-transition-name` (`questions/+layout.svelte:278`) and the trigger is a descendant of
it. Whether Playwright's `toBeVisible` (bounding box + `visibility`) can be affected by an element
being painted as a `::view-transition-group` pseudo-element rather than in place was **not**
established. If it can, there is a *fourth* hypothesis (H4: the element exists but is not "visible"
to Playwright during the transition) — but the recorded error text is `element(s) not found`, which is
an *existence* failure, not a visibility failure, so H4 does not fit the evidence. Recorded for
completeness; do not chase it first.

**U-4 — Full-suite artifact size with `trace: 'on'`.** Measured today's directories (64 KB / 1.9 MB)
reflect the last invocation (an 8-test bank-auth run), not a 134-test run. No figure in the record.
Measure on run 1.

**U-5 — Whether the isolated hunt spec should ship permanently.** Affects the 134 executed-count
baseline that every later v2.15 phase reconciles against. A planning decision, not a research
finding.

**U-6 — Whether `Network.emulateNetworkConditionsByRule` works against this Chromium.** Not
exercised. Only relevant if a network lever is needed at all.

---

## Sources

### Primary (HIGH confidence) — read this session from the working tree
- `tests/tests/specs/voter/voter-journey.spec.ts` — lines 14-15, 26, 30, 80-82, 186-190, 234-281, 840-874
- `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — 1-24, 29-41
- `tests/tests/specs/_probes/questionInfo.probe.spec.ts` — whole file
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — 570-574, 607-615, 672-700
- `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` — 1-20
- `tests/tests/specs/perf/performance-budget.spec.ts` — 110
- `tests/playwright.config.ts` — 13-48, 82-136, 138-448, 487-489, 1135-1150
- `tests/global-setup.ts` — whole file
- `tests/tests/support/preflight.ts` — 1-140 (esp. 56, 93-97)
- `tests/tests/helpers/timeouts.ts` — whole file; `tests/tests/helpers/index.ts`
- `tests/tests/utils/testIds.ts` — 182, 228-245
- `tests/tests/fixtures/voter/views.ts` — whole file; `questionInfo.fixture.ts` — 1-80; `voter-journey.fixture.ts` — 120-175, 584
- `tests/README.md` — 1-140 (esp. 7, 129, 133)
- `apps/frontend/src/routes/+layout.svelte` — 156-186
- `apps/frontend/src/routes/MainContent.svelte` — 50-90
- `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` — 1-120, 222-300; `[questionId]/+page.svelte`; `+layout.ts`
- `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` — whole file
- `apps/frontend/src/lib/components/term/Term.svelte` — whole file
- `apps/frontend/src/lib/utils/viewTransition.ts` — whole file
- `apps/frontend/src/lib/api/utils/translateQuestionTerms.ts` — whole file (established as dead code)
- `apps/frontend/vite.config.ts` — 1-45
- `packages/dev-seed/src/templates/e2e/base.ts` — 818-861
- `packages/app-shared/src/data/customData.type.ts` — 185-205
- `package.json` — 1-45; `.gitignore` — 36-37; `.planning/config.json`
- `node_modules/@playwright/test/package.json`; `node_modules/playwright-core/package.json`; `node_modules/@sveltejs/kit/package.json`
- `node_modules/playwright-core/types/types.d.ts` — 2601, 9024, 15577-15596
- `node_modules/playwright-core/types/protocol.d.ts` — 6848-6854, 12293-12296, 22724
- `node_modules/playwright/types/test.d.ts` — 6931-6936, 7440-7457
- `node_modules/playwright/lib/reporters/base.js` — 565-584; `reporters/json.js` — 43; `reporters/html.js` — 154
- `node_modules/@sveltejs/kit/src/runtime/client/client.js` — 1596-1860 (esp. 1642, 1760, 1779-1785, 1824, 1831)
- `.planning/v2.14-CARDINAL-RULE-WAIVER.md`; `.planning/REQUIREMENTS.md`; `.planning/STATE.md`; `.planning/MILESTONES.md`; `.planning/ROADMAP.md` 195-310, 491; `.planning/PROJECT.md`
- `.planning/milestones/v2.14-phases/135-…/deferred-items.md` — 160-226; `135-04-SUMMARY.md`
- `.planning/milestones/v2.14-REQUIREMENTS.md` — 111, 119
- `.planning/phases/137-…/137-NEGATIVE-CONTROL.md`; `137-05-SUMMARY.md`; `137-05-TASK1-RESULT.md`
- `CLAUDE.md`; `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` — 105-130

### Secondary (MEDIUM confidence)
- Chrome View Transitions update-callback timeout (~4 s) and renderer freeze during the callback —
  `https://developer.chrome.com/blog/view-transitions-in-2025`,
  `https://vtbag.dev/tips/view-transition-fails-and-fixes/`,
  `https://drafts.csswg.org/css-view-transitions-2/`. Cross-checked against the repo's own use of
  `?notr=1` for Q→Q determinism, hence MEDIUM rather than LOW
  (`gsd-tools query classify-confidence --provider websearch --verified` → `MEDIUM`).

### Tertiary (LOW confidence)
- None relied upon. `gsd-tools query classify-confidence --provider websearch` (unverified) returns
  `LOW`; no claim in this document rests on an unverified web result alone.

---

## Metadata

**Confidence breakdown:**
- Repo mechanism map (§R1) — **HIGH**: every step read from source this session with file:line and verbatim quotes, including the SvelteKit router ordering from the installed package.
- Harness mechanics (§R2, §R3) — **HIGH**: every API confirmed present in the installed Playwright's own type and lib files, not from memory.
- Root-cause hypothesis ranking (§R1.8) — **MEDIUM**: H1 is strongly motivated by verified ordering plus in-repo prior art, but it is a hypothesis for the phase to *force*, not a finding. Presented with falsifiers.
- 16-run gate mechanics (§R5) — **HIGH** on measured numbers and reporter env vars; **MEDIUM** on the "REQUIRED" verdicts, which rest on three prior gates' consistent practice rather than on a proof.
- Waiver discharge surface (§R7) — **HIGH**: grep-complete over the repo, with the archived-vs-live boundary stated.

**Research date:** 2026-08-13
**Valid until:** 2026-09-12 (30 days) — or immediately invalidated by any change to
`tests/playwright.config.ts`, `apps/frontend/src/routes/+layout.svelte`, or a `@sveltejs/kit` /
`@playwright/test` version bump, each of which moves a line number this document cites.
