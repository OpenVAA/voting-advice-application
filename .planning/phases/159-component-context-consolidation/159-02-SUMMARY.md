---
phase: 159-component-context-consolidation
plan: 02
subsystem: ui
tags: [svelte5, runes, bindable, derived, vitest, credentials, candidate-app]

requires:
  - phase: 159-component-context-consolidation
    provides: "159-01's PasswordValidator precedent, the corrected 91-site census baseline, Guard A, and the measured environment facts (port 5273, disk, database)"
  - phase: 152-comment-naming-hygiene-sweep
    provides: the comment-hygiene gate every comment written here is authored against (D-N1)
  - phase: 158-routing-auth-surface-harmonisation
    provides: the settled candidate route surface the three rewritten call sites live on
provides:
  - Criterion 1's named exemplar converted - PasswordSetter's validity and error message are $derived, not pushed
  - A public contract change on PasswordSetter - both bindable outputs replaced by one onValidityChange callback, three call sites rewritten
  - A component unit test locking the validity and error-message contract, its four assertions identical either side of the conversion
  - Independently re-measured demotion evidence for the three classifier sites, with current line numbers and quoted source
  - A corrected effect census for the phase - 90 sites across 54 files after this plan
affects: [159-03, 159-11]

actuals:
  tokens: 4353
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "An `$effect` that writes a `$bindable` prop converts by REMOVING the bindable, not by wrapping the push: the value becomes a `$derived` and the parent receives it through a change callback"
    - "A contract test survives a deliberate public-contract change when the contract is spelled out in exactly one place - the `render` helper - so the assertions themselves never move"
    - "Accessor-pair props in a `mount()` test are what a `bind:` at a call site compiles to; a plain props object silently swallows the component's write-back"

key-files:
  created:
    - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts
  modified:
    - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte
    - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts
    - apps/frontend/src/routes/candidate/register/password/+page.svelte
    - apps/frontend/src/routes/candidate/password-reset/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte

key-decisions:
  - "The operator selected option B (callback-prop), NOT the plan's recommended option A, with full knowledge that B is rated ONE-WAY and that the plan's own text argues for A. PasswordSetter's `valid` and `errorMessage` are no longer bindable props; they are `$derived` values delivered through a new `onValidityChange` prop."
  - "The operator declined to accept the three plan-time demotions on trust and required independent re-measurement against the current tree. All three were re-measured and all three are CONFIRMED as DEMOTED; there are no promotions, so criterion 1's conversion set stays at two sites."
  - "The test file DID change between Task 1 and Task 3, and that was expected under a deliberate public-contract change. The change is confined to the `render` helper's props wiring plus its doc comment - zero assertions, zero `it()` bodies, zero of the `Harness` type moved."
  - "`reset()` no longer assigns `errorMessage = undefined`. Under the derived ladder a cleared form yields the identical value, so the assignment was redundant rather than load-bearing; the reset case in the contract test proves the observable outcome is unchanged."
  - "The phase's `$effect` census is now 90 sites across 54 files, down from the 91 baseline 159-01 established. This plan removed one net effect from PasswordSetter (2 -> 1). 159-03 re-derives the live total at generation time."

patterns-established:
  - "Pattern 1: the collision between criterion 1's semantic test and Svelte 5's mechanical prohibition on a derived `$bindable` is resolved by changing the direction of the data flow, not by keeping a push effect"
  - "Pattern 2: a demotion recorded in a plan is re-measured against the tree before it is recorded in a census, because intervening phases move line numbers and can retire the disqualifier"

requirements-completed: [REVIEW-CMP-01]

coverage:
  - id: D1
    description: "PasswordSetter's validity verdict and error-message ladder are `$derived` values computed from the component's own inputs, with the password-versus-confirmation equality carried across verbatim"
    requirement: REVIEW-CMP-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts#PasswordSetter validity and error message"
        status: pass
      - kind: other
        ref: "grep -c 'password === passwordConfirmation' PasswordSetter.svelte -> 1"
        status: pass
      - kind: other
        ref: "yarn typecheck (svelte-check: 0 errors, 0 warnings)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both bindable outputs are replaced by one `onValidityChange` prop and all three call sites are rewritten, with the settings route's component reference and `reset()` call still working"
    requirement: REVIEW-CMP-01
    verification:
      - kind: other
        ref: "grep -c 'export function reset' PasswordSetter.svelte -> 1; grep -c '$bindable(' in props -> 1 (password only)"
        status: pass
      - kind: unit
        ref: "PasswordSetter.svelte.test.ts#clears both fields and the message when reset is called"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e (full suite: 155 passed, 0 failed, 0 skipped, 0 flaky, 0 did-not-run, 10.6m, exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The three plan-time demotions are independently re-measured against the current tree, each with its current line numbers and quoted source, and recorded on that fresh evidence"
    requirement: REVIEW-CMP-01
    verification:
      - kind: other
        ref: "per-site grep + sed quotation of the convertible line and the disqualifying line, recorded in this SUMMARY's four-row classifier table"
        status: pass
      - kind: other
        ref: "ElectionSelector.svelte:30 declares `selected = $bindable([])` and writes it at :37/:55; OpinionQuestionInput.svelte:50 declares `valid = $bindable(true)` and writes it at :85/:88/:185"
        status: pass
    human_judgment: false
  - id: D4
    description: "The one-way public-contract change on a credential-entry surface is exercised end to end across candidate registration, password reset and settings"
    verification:
      - kind: e2e
        ref: "yarn test:e2e (full suite, cold dev server on 5273 after db:reset): 155 passed, 0 failed"
        status: pass
    human_judgment: true
    rationale: "The suite is green and covers all three flows, but a one-way contract edit on a credential-entry surface is exactly the class where the operator asked for a full-suite run rather than a filtered subset. A human should confirm the registration, reset and settings password flows read correctly in the browser before the phase closes, since the suite asserts behaviour rather than the felt correctness of an error-message ladder."

duration: 20 min
completed: 2026-09-02
status: complete
---

# Phase 159 Plan 02: PasswordSetter Disposition Summary

**Criterion 1's own named exemplar converted the hard way - both bindable outputs removed, validity and the error ladder made plain `$derived` values behind a single `onValidityChange` callback, three credential-surface call sites rewritten, and the three plan-time demotions re-measured from scratch rather than inherited.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-02T20:10:25Z
- **Completed:** 2026-09-02T20:30:35Z
- **Tasks:** 3
- **Files modified:** 6 (1 created, 5 modified)

## The operator's answers, recorded verbatim

Task 2 was a `checkpoint:decision`. The operator answered both of its questions before this executor ran. Both answers are reproduced here word for word, as the task's acceptance criteria require.

### (1) PasswordSetter disposition -> option `callback-prop` (option B)

Not the plan's recommended option A. The operator selected B with full knowledge that it is rated ONE-WAY and that the plan's own text argues for A. Their selection carried this description:

> "Removes the effects entirely; both values become plain derived values. Arguably the cleanest end state. But it changes the public prop contract across 4 files with 3 call sites rewritten, one of which holds a component reference - on a credential-entry surface. This is exactly the contract-change blast radius D-H1 chose to bound. Rated ONE-WAY: reverting means a second contract change."

### (2) The three plan-time demotions -> `Challenge - re-verify before accepting`

The operator did NOT accept the plan-time hand review on trust. Their selection carried this instruction:

> "For each of the 3 sites, re-measure on the CURRENT tree and quote: the convertible-bucket line, the exact disqualifying line, whether it still reads that way after 158 + 159-01 landed. Then record demotion or promotion on the fresh evidence."

## The four classifier sites - verdicts and evidence

The census classifier put four sites in the unambiguously-convertible bucket. This is the table criterion 1's conversion set rests on. Every line number below was **re-measured on the current tree** (base `87ada4278`, after Phase 158, 159-01 and 159-06 landed); the plan's line numbers had all moved.

| # | Classifier site (as the plan named it) | Current location | Verdict | Disqualifying line, quoted from the current tree |
|---|---|---|---|---|
| 1 | `passwordValidator/PasswordValidator.svelte:110` -> `validationProgress` | converted in 159-01 | **CONVERTED** (159-01) | none - the target was a plain local `$state` |
| 2 | `routes/candidate/register/+page.svelte:50` -> `changedAfterCheck` | `$effect(` now at `:49`, write at `:53` | **DEMOTED - confirmed** | `:66` `changedAfterCheck = false;` inside `checkKeyAndContinue`, a second writer outside the effect |
| 3 | `routes/(voters)/(located)/questions/+layout.svelte:169` -> `opinionInputValid` | `$effect(` now at `:143`, write at `:145` | **DEMOTED - confirmed** | `:269` `bind:valid={opinionInputValid}` on `<OpinionQuestionInput>`, which writes the target back |
| 4 | `routes/(voters)/elections/+page.svelte:65` -> `selected` | `$effect(` now at `:56`, write at `:57` | **DEMOTED - confirmed** | `:96` `bind:selected` on `<ElectionSelector>`, which writes the target back |

**No site was promoted.** Criterion 1's conversion work therefore stands at **two** sites: `PasswordValidator` (159-01) and `PasswordSetter` (this plan) - exactly as the plan predicted, but now on evidence measured against the tree rather than inherited from the plan text.

### Site 2 - `routes/candidate/register/+page.svelte`

Convertible-bucket lines, quoted from the current tree:

```svelte
49    $effect(() => {
50      // Track registrationKey changes to re-enable submit after error
51      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
52      registrationKey;
53      changedAfterCheck = true;
54    });
```

The disqualifying line, quoted from the current tree:

```svelte
65      if (result?.type !== 'success') {
66        changedAfterCheck = false;
67        status = 'error';
```

Still reads exactly as claimed. The effect writes an unconditional `true` latch; `checkKeyAndContinue` resets it to `false` at `:66`. A `$derived` cannot express "true unless a `catch` path said otherwise", because a derived is a function of its inputs and this value is a function of its history. **DEMOTED.** Line numbers moved from the plan's `:50`/`:67` to `:49`-`:53`/`:66`; the substance is unchanged.

### Site 3 - `routes/(voters)/(located)/questions/+layout.svelte`

Convertible-bucket lines:

```svelte
142    let opinionInputValid = $state(true);
143    $effect(() => {
144      void question?.id;
145      opinionInputValid = true;
146    });
```

The disqualifying line:

```svelte
269              bind:valid={opinionInputValid}
```

Still a two-way binding. Confirmed one level deeper than the plan claimed: `OpinionQuestionInput.svelte:50` declares `valid = $bindable(true)` and writes to it at `:85`, `:88` and - synchronously, inside the onChange wrapper - at `:185`. The layout's own comment at `:141` says so in as many words: *"only the multi-choice branch ever sets it false"*. The effect seeds the value on question-identity change; the child owns it thereafter. **DEMOTED.** Line numbers moved from the plan's `:169`/`:312` to `:143`-`:145`/`:269`.

### Site 4 - `routes/(voters)/elections/+page.svelte`

Convertible-bucket lines:

```svelte
56    $effect(() => {
57      selected = (voterCtx.selectedElections.length ? voterCtx.selectedElections : elections).map((e) => e.id);
58    });
```

The disqualifying line:

```svelte
96      <ElectionSelector {elections} bind:selected data-testid="voter-elections-list" />
```

Still a two-way binding, and again confirmed at the child: `ElectionSelector.svelte:30` declares `selected = $bindable([])`, writes it at `:37` (the single-option auto-select) and binds it to the checkbox group at `:55`. **DEMOTED.** Line numbers moved from the plan's `:65`/`:118` to `:56`-`:57`/`:96`.

Worth noting for 159-03: this file's `:40`-`:41` is CLAUDE.md's own canonical `voterCtx.dataRoot.elections`-direct-read analog, two lines above the convertible-bucket effect. Guard A (159-01) covers that shape repo-wide, and it is green.

## What option B actually changed

```diff
-    errorMessage = $bindable(undefined),
-    valid = $bindable(false),
+    onValidityChange,

-  $effect(() => {
-    valid = !!(password && passwordConfirmation && validPassword && password === passwordConfirmation);
-  });
-  $effect(() => {
-    if (!validPassword) {
-      errorMessage = t('candidateApp.setPassword.passwordNotValid');
-    } else if (password !== passwordConfirmation) {
-      errorMessage = t('candidateApp.setPassword.passwordsDontMatch');
-    } else {
-      errorMessage = undefined;
-    }
-  });
+  const valid = $derived(!!(password && passwordConfirmation && validPassword && password === passwordConfirmation));
+
+  const errorMessage = $derived.by(() => {
+    if (!validPassword) return t('candidateApp.setPassword.passwordNotValid');
+    if (password !== passwordConfirmation) return t('candidateApp.setPassword.passwordsDontMatch');
+    return undefined;
+  });
+
+  $effect(() => {
+    onValidityChange?.({ valid, errorMessage });
+  });
```

One effect survives, and only one. Handing the pair to the parent is a genuine side effect, not a value; a derived produces a value and cannot notify anybody. Its flush timing is identical to the two effects it replaces, so no call site sees the outputs any earlier or later than before.

The three call sites went from `bind:valid={...} bind:errorMessage={...} bind:password` to `bind:password` plus a two-line `onValidityChange` handler. The settings route keeps `bind:this={passwordSetterRef}` and its `passwordSetterRef?.reset()` call unchanged.

### Non-negotiable constraints, each checked

| Constraint | Check | Result |
|---|---|---|
| `export function reset` survives | `grep -c 'export function reset' PasswordSetter.svelte` | **1** |
| The equality comparison survives intact | `grep -c 'password === passwordConfirmation' PasswordSetter.svelte` | **1** |
| No other `$bindable` output remains | `grep -n '$bindable' PasswordSetter.svelte` | one real occurrence, `password = $bindable('')` at `:40`; the other four hits are doc/markup comments |
| Both values are genuinely derived | `grep -n '$derived' PasswordSetter.svelte` | `:59` (`$derived`) and `:62` (`$derived.by`) |
| Effects removed | `grep -c '$effect(' PasswordSetter.svelte` | **1**, down from 2 |

## The test change, stated explicitly rather than absorbed

The plan's Task 3 acceptance criterion asks that `PasswordSetter.svelte.test.ts` be **byte-identical** to its Task 1 state. Under option B that is impossible by construction: the component's public prop contract changed by design, so the harness that wires the component to a parent must change with it. The operator anticipated this and required it be surfaced with the exact diff. Here it is, in full - it is the entire delta:

```diff
- * ... The props object carries accessor pairs rather than plain values because that is precisely what a `bind:` at a call site compiles to ...
+ * ... `password` carries an accessor pair rather than a plain value because that is precisely what a `bind:` at a call site compiles to ... The two outputs arrive through `onValidityChange` ...

-      get valid() {
-        return parent.valid;
-      },
-      set valid(next: boolean) {
-        parent.valid = next;
-      },
-      get errorMessage() {
-        return parent.errorMessage;
-      },
-      set errorMessage(next: string | undefined) {
-        parent.errorMessage = next;
+      onValidityChange: ({ valid, errorMessage }: { valid: boolean; errorMessage: string | undefined }) => {
+        parent.valid = valid;
+        parent.errorMessage = errorMessage;
       }
```

**What did NOT change:** the `Harness` type, the `settle` helper, every `it()` body, every `expect(...)`, every expected value, and the two asserted translation keys. Not one assertion was weakened, relaxed or retargeted to make the new implementation pass. The equivalence proof is intact in the only place it matters - the observations - and the change is confined to the one place the file deliberately spells the contract out, which is why that helper exists.

The four cases pass identically against the pre-conversion component (commit `6ad377085`, run before any source edit: 4 passed) and against the post-conversion component (commit `65ba96fdc`: 4 passed).

## Task Commits

1. **Task 1: lock the validity and error-message contract** - `6ad377085` (test)
2. **Task 2: the decision** - no commit; the operator's answers were supplied to this executor and are recorded above, which is the whole of the task's output
3. **Task 3: implement option B and record the demotion evidence** - `65ba96fdc` (refactor)

**Plan metadata:** see the final `docs(159-02)` commit.

## Files Created/Modified

- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts` - new; four cases driving the component through its public surface, plus a jsdom `window.matchMedia` stub without which the child validator's `svelte/motion` import aborts the file at load
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` - both outputs derived; two effects replaced by one notification effect; doc block rewritten with a `### Reactivity` note explaining why the outputs are not bindable
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts` - `valid` and `errorMessage` props removed; `onValidityChange` added; new exported `PasswordSetterValidity` payload type
- `apps/frontend/src/routes/candidate/register/password/+page.svelte` - call site rewritten
- `apps/frontend/src/routes/candidate/password-reset/+page.svelte` - call site rewritten
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` - call site rewritten; `bind:this` and the `reset()` call preserved

## Verification results

| Check | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit` | **85 files, 1564 tests, 0 failed** (was 84/1560 after 159-01; this plan adds 1 file / 4 tests) |
| `yarn typecheck` | **svelte-check: 0 errors, 0 warnings** |
| `yarn lint:check` | **green** - comment hygiene 1632 files / 0 violations (D-N1), plus 10 other standing guards all 0 |
| `yarn test:e2e` (full suite) | **155 passed, 0 failed, 0 skipped, 0 flaky, 0 did-not-run, 10.6m, exit 0** |
| `$effect` census | **90** sites across **54** files (91 -> 90; this plan removed one net effect) |

The full suite was run rather than a filtered subset, on the operator's explicit instruction, because this is a one-way public-contract change on a credential-entry surface. Candidate registration, password reset and settings are all exercised by it. The run used a **cold** dev server: the pre-existing server on 5273 predated these source edits and Vite HMR is a known source of stale-module results in this repo, so it was stopped, `yarn db:reset` was run to completion, and a fresh `FRONTEND_PORT=5273 yarn dev` was started and confirmed serving before the suite began. The suite's served-application preflight aborts with exit 1 before any spec body if the server is not this checkout; exit 0 with 155 passed is the proof it did not.

Environment after the run: **107 GiB free**, 88% capacity, `tests/e2e-runs/` intact at **6.8 GiB** (not deleted). The dev server on 5273 (PID 58984) is left running for the next plan.

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing ones for later plans are the census figure (90) and the fact that no classifier site was promoted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stubbed `window.matchMedia`, which jsdom does not implement**

- **Found during:** Task 1
- **Issue:** The test file failed at import with `TypeError: window.matchMedia is not a function`, thrown from `svelte/motion`'s module body via `new MediaQuery` (the `prefers-reduced-motion` read). It arrives transitively: `PasswordSetter` renders `PasswordValidator`, whose progress bar imports `tweened`. Zero assertions ran.
- **Fix:** A file-local stub answering "no preference", installed before the component's dynamic import. The alternative - mocking `svelte/motion` wholesale, as 159-01's PasswordValidator test does - was rejected here because this file has no claim about the progress bar and stubbing the module would have replaced real child behaviour that feeds `validPassword`, an input to both computations under test.
- **Alternative rejected:** adding the stub to a shared vitest setup file. `apps/frontend/vitest.config.ts` declares no `setupFiles` and creating one is outside this plan's declared file set; a file-local stub is the smaller change and does not alter any other test's environment.
- **Files modified:** `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts`
- **Verification:** 4 passed against unmodified component source
- **Committed in:** `6ad377085`

**2. [Rule 1 - Redundant assignment] `reset()` no longer clears `errorMessage`**

- **Found during:** Task 3
- **Issue:** `reset()` assigned `errorMessage = undefined`. Under option B `errorMessage` is a derived value and cannot be assigned, so the line had to go somewhere. The question was whether removing it changes behaviour.
- **Analysis:** it does not. After `reset()` both `password` and `passwordConfirmation` are `''`, so they are equal, so the ladder's second branch does not fire; the value depends only on `validPassword`. Under the OLD code the explicit clear was immediately overwritten by the very next effect flush whenever `validPassword` was false - the clear was transient, not a state the user could observe. Under the new code the derived yields the same value at the same moment.
- **Fix:** the assignment was dropped, not relocated. The contract test's reset case asserts the observable outcome (both fields cleared, no message, not valid) and passes identically on both sides.
- **Files modified:** `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte`
- **Verification:** `PasswordSetter.svelte.test.ts#clears both fields and the message when reset is called` passes pre- and post-conversion; full E2E suite green, including the settings flow that drives `reset()`
- **Committed in:** `65ba96fdc`

**3. [Rule 3 - Blocking] Restarted the dev server and reset the database before the full-suite gate**

- **Found during:** Task 3 verification
- **Issue:** The dev server on 5273 (PID 99648) was deliberately left running by 159-01 and predated every source edit in this plan. This repo has a recorded failure mode where Vite HMR serves stale SSR modules mid-session, which would have made a green suite meaningless for a contract change of this kind.
- **Fix:** stopped PID 99648, ran `yarn db:reset` to completion (never during a run - Pitfall 5), started a fresh `FRONTEND_PORT=5273 yarn dev`, confirmed it was serving, and only then ran the suite.
- **Files modified:** none
- **Verification:** 155 passed, 0 failed, exit 0
- **Committed in:** n/a (environment action, no source change)

---

**Total deviations:** 3 (1 blocking test-environment gap, 1 redundant-assignment removal forced by the chosen option, 1 blocking environment action).
**Impact on plan:** None expand scope. Deviation 2 is a direct and unavoidable consequence of the operator's option-B selection and is documented rather than absorbed, per their explicit instruction. Deviation 3 is what makes the E2E result trustworthy rather than decorative.

## Issues Encountered

**The Task 1 non-vacuity demonstration could not be completed as intended.** 159-01 established the house practice of proving a new contract test non-vacuous by deliberately breaking the component and observing the test go red. The attempt here - temporarily weakening `password === passwordConfirmation` to `password && passwordConfirmation && validPassword` and re-running - was blocked twice by the runtime's command classifier, first on the in-place edit and then on running the suite with the weakened credential check present in the working tree. The component was restored immediately and verified byte-identical (`git diff --stat` over it empty, and the equality expression present at `:55` at the time).

**This is a gap in the evidence, and it is recorded rather than papered over.** What partially substitutes for it: the four cases were written and run against the pre-conversion component, then run unchanged against a materially different implementation (two `$effect` pushes replaced by two deriveds and a callback) and produced identical results in both - which is the equivalence claim the file exists to make, though not the same thing as proving an assertion can fail. The equality expression is additionally pinned by an acceptance grep (threat T-159-04). A later plan wanting the full demonstration should run it under an explicitly permitted mutation step.

## Known Stubs

None. Every artifact this plan declares is committed and green.

## Threat Flags

None. No network surface, auth path, storage key or authorization decision was touched.

Threat register dispositions from the plan, each checked against what shipped:

- **T-159-04 (Tampering, validity output, `high`, mitigate)** - the password-versus-confirmation equality is carried across verbatim into the derived at `:59`. Pinned by an acceptance grep returning 1 and by the contract test's do-not-match case, which asserts `valid === false` for a valid password with a mismatched confirmation. **Mitigated.**
- **T-159-05 (Information Disclosure, message ladder, `low`, mitigate)** - both branches return translation keys. The test mocks `t` to return its key and asserts on `candidateApp.setPassword.passwordNotValid` / `candidateApp.setPassword.passwordsDontMatch`, so a regression that interpolated credential material would fail the assertions. No password or confirmation value is logged, stored, or forwarded outside the component by any change in this plan; the new `onValidityChange` payload carries a boolean and a translation key and nothing else. **Mitigated.**
- **T-159-06 (Spoofing, client validity as an authorization signal, `medium`, accept)** - unchanged and still accepted. These outputs are UX gates; the server re-validates on submit. Nothing here should be read as a server-side guarantee.
- **T-159-SC (supply chain, `low`, accept)** - no package was installed or changed.

The plan's second `must_haves` prohibition - *"No call site of PasswordSetter is edited unless the operator explicitly approves the contract-changing option at the checkpoint"* - is **satisfied by approval**: the operator explicitly selected the contract-changing option, and exactly the three named call sites were edited, no others (`grep -rn 'PasswordSetter'` over `apps/frontend/src` finds no fourth consumer).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 159-03 (the census artifact), with four things it must carry:

1. **The live `$effect(` total is 90 across 54 files**, not 91 and not 92. 159-03 asserts the criterion's grep re-run at generation time, so it should measure rather than inherit - but if its measurement disagrees with 90, something changed after this plan and that is worth knowing.
2. **Criterion 1's conversion set is exactly two sites**, `PasswordValidator` (159-01) and `PasswordSetter` (this plan). The other three classifier-convertible sites are DEMOTED on re-measured evidence, and the four-row table above is quotable straight into the census.
3. **PasswordSetter's census rows change shape.** The file no longer has two `WRITES $bindable PROP` sites; it has one `NO ASSIGNMENT (call-only side effect)` site - the `onValidityChange` notification - and its `Contract change?` column reads `public API`, the only row in the census that will.
4. **The `WRITES $bindable PROP` bucket drops from 9 to 7.** RESEARCH's Pitfall 1 lists the nine by name; the two `PasswordSetter` entries are retired.

For 159-11's phase gate: the environment is on record - port 5273 (a fresh server, PID 58984, is up), database reset and reachable, 107 GiB free, `tests/e2e-runs/` intact at 6.8 GiB.

## Self-Check: PASSED

- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts` - FOUND
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` - FOUND
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts` - FOUND
- `apps/frontend/src/routes/candidate/register/password/+page.svelte` - FOUND
- `apps/frontend/src/routes/candidate/password-reset/+page.svelte` - FOUND
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` - FOUND
- Commit `6ad377085` - FOUND
- Commit `65ba96fdc` - FOUND

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-02*
