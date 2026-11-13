---
phase: 182-analytics-relay
plan: 18
subsystem: frontend-consent
tags: [analytics, consent, contestant-app, terms-of-use, svelte, wcag]
status: complete

requires:
  - phase: 182-13
    provides: shouldShowContestantOptOut (gates.ts)
  - phase: 182-15
    provides: AppContext.analyticsGate and setDataConsent
  - phase: 182-26
    provides: analyticsGate declared on the contestant context beside setDataConsent
  - phase: 182-12
    provides: the keys privacy.usageData.title, privacy.usageData.content and privacy.trackingOptOut.label
  - phase: 182-17
    provides: DataConsent with no provider condition of its own
provides:
  - TrackingOptOut, a native opt-out checkbox with the bindable prop optOut (test id terms-tracking-opt-out, field name trackingOptOut)
  - TermsOfUseGate writes the contestant's choice to the origin-wide consent store after a recorded acceptance, only when the box was shown
  - TermsOfUse renders the non-dynamic usage-data section when trackEvents is on and a provider is configured
  - the Contestant privacy page shows the inline DataConsent control under shouldShowContestantOptOut
affects: [182-19, 182-24, 182-27, 182-29]

estimate:
  tokens: 90000
  tasks: 3
actuals:
  tokens: 8316      # chars/4 over the five code commits' diff (33264 chars)
  tasks: 3
  commits: 6        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: e6a8008324d560d200c66f4b6a381042cd98a612
plan_head_after: 36fd7b0ec5ecbef8d5e49c36d74a3cf62ea044c2

tech-stack:
  added: []
  patterns:
    - "A gate component holds the context object as `ctx`, destructures only its stable functions, and evaluates the pure gate function on `ctx.analyticsGate.current` in a `$derived`"
    - "Fake contexts of tests that mount the terms or the gate carry an inactive analytics gate, so the existing assertions run against the view with no opt-out and no usage-data section"

key-files:
  created:
    - apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.svelte
    - apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.type.ts
    - apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte.test.ts
    - apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/18-gates.txt
  modified:
    - apps/frontend/src/lib/contestant/components/termsOfUse/index.ts
    - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte
    - apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte
    - apps/frontend/src/routes/contestant/privacy/+page.svelte
    - apps/frontend/src/routes/contestant/homeButton.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/gateFocus.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/setPasswordLayout.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts

key-decisions:
  - "The terms paragraph is shown when trackEvents is on and a provider is configured (A-08); the visitor's Global Privacy Control signal is not part of the condition. Follow-up 182-R6 is not confirmed by the operator"
  - "The opt-out's initial value is read once from the stored consent when the gate mounts; a refusal stored in this browser starts it ticked"
  - "setDataConsent is called after the success check of acceptTermsOfUse and before invalidateAll, and only when the box was shown"
  - "The privacy page's consent control uses the same gate function as the opt-out, so the contestant is offered a way to change the choice exactly where the choice was offered"

requirements-completed: [RELAY-11, RELAY-13, RELAY-19]

duration: 11min
completed: 2026-10-19
---

# Phase 182 Plan 18: The Contestant app's tracking opt-out at the terms of use Summary

**The Contestant terms-of-use view offers an unticked "do not collect usage data" checkbox when events could be sent in gated mode. The box starts ticked over a stored refusal. A recorded acceptance writes `granted` or `denied` to the same origin-wide consent store the voter popup writes, and writes nothing when the box was not shown. The terms carry a non-dynamic usage-data section when `trackEvents` is on and a provider is configured. The Contestant privacy page offers the inline consent control under the same condition.**

Start sha: `e6a8008324d560d200c66f4b6a381042cd98a612`.

## Performance

- Duration: about 11 min
- Tasks: 3 of 3
- Files: 14 (5 created, 9 modified), plus the evidence record

## Accomplishments

- **`TrackingOptOut`** (`.svelte`, `.type.ts`, `.svelte.test.ts`, exported from the directory's `index.ts`):
  - The same `label` / native `input type="checkbox"` / `span` markup as the terms checkbox, inside a `div` that takes the rest props.
  - `bind:checked={optOut}`, `name="trackingOptOut"`, `data-testid="terms-tracking-opt-out"`, label text `t('privacy.trackingOptOut.label')`.
  - No `tabindex`, no constant `checked`. It holds no condition and writes nothing.
  - Five cases: label and native semantics, unticked by default, ticked from the prop, a click written back both ways through the binding, and in the tab order and enabled.
- **`TermsOfUseGate.svelte`**:
  - Holds `const ctx = getContestantContext()` and destructures only `t`, `logout`, `acceptTermsOfUse` and `setDataConsent`.
  - `showOptOut = $derived(shouldShowContestantOptOut(ctx.analyticsGate.current))`.
  - `optOut = $state(ctx.analyticsGate.current.consent === 'denied')`.
  - `{#if showOptOut}<TrackingOptOut bind:optOut />{/if}` directly under `<TermsOfUseForm bind:termsAccepted />`.
  - In `handleSubmit`, `if (showOptOut) setDataConsent(optOut ? 'denied' : 'granted');` runs between the success check and `await invalidateAll()`.
  - The doc block says what is read and written.
- **`TermsOfUseGate.svelte.test.ts`**: 11 cases covering the six behaviours.
  - No stored choice: the box is unticked and accepting writes `granted` once.
  - Box ticked: accepting writes `denied` once.
  - Stored `granted` or `indetermined`: the box is unticked.
  - Stored `denied`: the box is ticked and accepting writes `denied`.
  - Four hidden conditions (`trackEvents` off, consent mode `free`, Global Privacy Control, no provider): no box and no write. In each, acceptance and the rerun do happen, as the control.
  - A non-success result writes nothing.
  - Call order: acceptance, then `setDataConsent`, then `invalidateAll`.
- **`TermsOfUse.svelte`**:
  - Gets `ctx = getAppContext()`.
  - Derives `showUsageData` from `ctx.appSettings.analytics.trackEvents && ctx.analyticsGate.current.projection.active`.
  - Adds a section with `<h2>{t('privacy.usageData.title')}</h2>` and `<p>{t('privacy.usageData.content')}</p>` as text, not `{@html`.
  - The doc block names the condition and why the keys are not dynamic.
- **`TermsOfUse.svelte.test.ts`**: the four cases of the plan, each the others' control, plus one case that the two dynamic sections stay.
- **Contestant privacy page**:
  - Renders `<DataConsent description="inline" class="bg-base-300 p-lg rounded-lg" />` after `<TermsOfUse />` in the existing block, under `{#if shouldShowContestantOptOut(contestantCtx.analyticsGate.current)}`.
  - The doc comment gained an Analytics section.
  - It is the inline control. No popup was added to the Contestant or the Admin app.

## The condition of the terms paragraph

The paragraph is shown when `trackEvents` is on **and** a provider is configured (`projection.active`). This follows amendment A-08 of `182-CONTEXT.md`, which narrows D-14. A-08 rests on the recommended answer of follow-up 182-R6, which the operator has **not confirmed**.

- **Why a provider is required:** with no provider the relay drops everything. A paragraph saying that the three apps are measured would then say something untrue.
- **Why Global Privacy Control is deliberately not part of it:** the terms are what the deployment states to every user. The privacy page explains the effect of that signal, not the terms.
- **If the operator overrules 182-R6:** the condition in `TermsOfUse.svelte` becomes `trackEvents` alone. In `TermsOfUse.svelte.test.ts`, the case "`trackEvents` true, provider configured false" then expects both keys. Nothing else changes.

## Not yet observed by a person

- the visibility of the focus ring on the opt-out checkbox

Everything else a person used to be asked to look at is automated in plan **182-27** (E2E). That plan covers:

- the box shown unticked with its label;
- reaching it with Tab and toggling it with Space;
- no horizontal scroll at 320 px, with the box inside the viewport;
- the axe scan of the view with the box visible;
- the terms holding the paragraph;
- the privacy page showing the consent control.

Plan 182-29 carries the focus-ring line into the closing record.

## Task Commits

1. **Task 1: the TrackingOptOut component.**
   - `6e0155737` (test, RED: 5 of 5 failed, "Component is not a function")
   - `c2e336da2` (feat, GREEN)
2. **Task 2: the gate writes the choice, and TermsOfUse renders the paragraph.**
   - `be636dde0` (test, RED: 8 failed, the 8 controls passed)
   - `352401f4b` (feat, GREEN)
3. **Task 3: the consent control on the Contestant privacy page.**
   - `84e2c4e38` (feat)
   - `36fd7b0ec` (docs, the gate record)

## Verification

- Task 1 verify (`test:unit` on `TrackingOptOut.svelte.test.ts`): exit 0, 5 passed.
- Task 2 verify (`test:unit src/lib/contestant`): exit 0, 31 files, 823 tests passed. `test:unit src/routes/contestant`: 41 files, 976 tests passed.
- Task 3 verifies, all exit 0:
  - the page grep for `<DataConsent description="inline"` and `shouldShowContestantOptOut(contestantCtx.analyticsGate.current)`;
  - the `DataConsentPopup` grep over the Contestant and Admin trees (`git grep` exit 1, so `test $? -eq 1` is 0);
  - the gate-record check over slot `18-gates`.
- Scoped `prettier --check` and `eslint` on every edited file before each commit: exit 0.
- Commit scope:
  - No commit of this plan lists `TermsOfUseForm.svelte`, `contestantContext.svelte.ts` or a file under `tests/`.
  - Neither edited component destructures `appSettings` or `analyticsGate`.
- **Closing gates.** Attempt `20261019T192707Z.84e2c4e38`, tracked copy in `evidence/18-gates.txt`. `GATE_HEAD` and `GATE_HEAD_AFTER` are both `84e2c4e3870f061e0c29d50fbd18f28352ece073`, and the tree was clean before and after.

  | Gate | Command | Exit | Result |
  |------|---------|------|--------|
  | `TYPECHECK_EXIT` | `yarn workspace @openvaa/frontend typecheck` | 0 | 2322 files, 0 errors, 0 warnings |
  | `UNIT_EXIT` | `yarn workspace @openvaa/frontend test:unit` | 0 | 258 files passed, 1 skipped; 5945 tests passed, 31 skipped |
  | `LINT_EXIT` | `yarn workspace @openvaa/frontend lint` | 0 | |
  | `BUILD_EXIT` | `yarn build` | 0 | 14/14 turbo tasks, 0 cached, private `TURBO_CACHE_DIR=tmp/turbo-182-18` |

- No stack, dev server or E2E run was started. The frontend unit run does not need the stack.

## Deviations from Plan

**1. [Rule 3 - Blocking] Four existing tests' fake contexts got an inactive analytics gate.**
- **Found during:** Task 2, the run over `src/routes/contestant` (21 failures).
- **Issue:** `TermsOfUse` now calls `getAppContext()`, and the gate and the privacy page read `analyticsGate.current`. Four tests mount these through fake contexts that had neither:
  - `homeButton.svelte.test.ts` (the privacy page);
  - `(protected)/gateFocus.svelte.test.ts`;
  - `(protected)/setPasswordLayout.svelte.test.ts`;
  - `(protected)/termsOfUseLayout.svelte.test.ts`.
- **Fix:** each fake context got `appSettings.analytics.trackEvents: false` and an `analyticsGate` whose `current` has no provider. Where the file did not already mock `$lib/contexts/app`, it now does. No assertion was changed: those tests see the view with no opt-out and no usage-data section, as before.
- **Files:** not in the plan's `files_modified`, but the plan's read-first step lists the existing callers and tests of the two components. Committed in `352401f4b`.

**2. [Plan form] TDD commits are split RED/GREEN.** Each of Tasks 1 and 2 has a `test` commit with the failing tests and a `feat` commit with the code, per the TDD reference. The plan says only "write the test first".

Otherwise the plan was executed as written.

## Notes for later plans

- **182-27 (E2E):**
  - The box is `input[data-testid="terms-tracking-opt-out"]`, directly after the terms checkbox `terms-checkbox`, outside the `Expander`.
  - It appears only with a provider configured, no Global Privacy Control, `trackEvents` on and consent mode `gated`. The usage-data section appears inside the `Expander` and on `/contestant/privacy` whenever `trackEvents` and a provider are on, Global Privacy Control or not.
  - The privacy page's control is the `DataConsent` buttons ("Yes, I agree to share my data" / "I don’t want to share my data").
  - Acceptance writes `appContext-userPreferences.dataCollection` before the load reruns.
- **182-19:** none of this plan's files touches `analytics.platform`. The deferred items addressed to 182-19 in `deferred-items.md` are unchanged.
- **182-24:** the contestant's choice lands in the same `localStorage['appContext-userPreferences']` the voter popup writes. A granted choice made at acceptance therefore lets Contestant and Admin pages send events (via `maySendEvents`) in that browser, and a denied one keeps them to the pageview.
- **Text, for the stream owner:** `privacy.usageData.content` (182-12) says "unless you tick the box below the terms". That holds on the gate. The same section is also rendered:
  - on the Contestant privacy page, where the control is the two consent buttons, not a box;
  - in `TermsOfUseForm` on the pre-registration email page, which offers no opt-out at all. v2.16's phase 179 plans to delete that tree.

  The wording was not changed here; it is the stream owner's call.
- **Scope of the gate's initial state:** the opt-out reads the stored choice once, when the gate mounts. A choice made in another tab while the gate is open is not reflected until the gate is shown again.

- **REQUIREMENTS.md not ticked:** RELAY-11, RELAY-13 and RELAY-19 are left as they are in `REQUIREMENTS.md`, as plans 182-16 and 182-17 left theirs. Later plans of the phase, among them the E2E coverage of 182-27, still contribute to them; the phase close ticks them.

## Known Stubs

None.

## Threat Flags

None. The plan adds no endpoint, no storage and no new trust boundary. The one write goes to the store the voter popup already writes.

- T-182-75: mitigated by the pre-tick over `denied`, with a unit case.
- T-182-76: mitigated by writing only when the box was rendered, with four hidden-condition cases asserting zero calls.
- T-182-77: mitigated. The only pre-tick is of the opt-out, from a stored refusal.
- T-182-78: mitigated by non-dynamic keys and four paired cases.

## Self-Check: PASSED

- FOUND: the five created source and test files and `evidence/18-gates.txt`
- FOUND: `6e0155737`, `c2e336da2`, `be636dde0`, `352401f4b`, `84e2c4e38`, `36fd7b0ec` are ancestors of HEAD
