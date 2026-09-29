---
phase: 159-component-context-consolidation
plan: 11
subsystem: testing
tags: [e2e, playwright, phase-gate, review-triage, env-config, non-vacuity, vitest]

requires:
  - phase: 159-component-context-consolidation
    provides: "all ten prior plans - this is the gate that speaks for the tree they collectively produced; every earlier green run describes a tree that no longer exists"
  - phase: 157-adapter-boundary-and-typing
    provides: "55c9c07e9, which had already collapsed the duplicated identity-provider default in the opposite direction to the one this plan assumed, and getLocalized in app-shared, which discharges the blocker the research assigned to review comment 2"
  - phase: 158-routing-auth-surface-harmonisation
    provides: "158-LIB-UTILS-MOVE-PROPOSAL.md section 3.2, which names getAllianceSummary.ts in the cluster it recommends moving - the reason the rename is deferred rather than done"
provides:
  - "The phase's cardinal end-to-end gate: 155 passed, 0 failed, 0 skipped, 0 did-not-run, exit 0, against a reset database and one fresh preflight-verified server"
  - "A disposition for all six of the phase's uncovered review comments - none dropped"
  - "Three register entries: the identity-provider default, the i18n translate helpers, the getAllianceSummary rename"
  - "159-02's non-vacuity gap CLOSED - all four PasswordSetter cases observed RED, component restored byte-identical"
  - "159-06's stale tracking-guard rationale re-derived against the selective forward"
  - "A measured refutation of the plan's own founding premise, filed rather than implemented"
affects: [v2.15-milestone-close, 157.1-fail-loudly-parse-posture, gsd-verify-work]

actuals:
  tokens: 6632
  tasks: 3
  commits: 8

tech-stack:
  added: []
  patterns:
    - "A gate whose premise is disproven at execution time is measured, reported and filed - never satisfied by bending the code to the acceptance grep"
    - "Non-vacuity mutations are chosen to be strictly MORE restrictive (or purely cosmetic) so a credential-surface test can be proven able to fail without any step that weakens a check"

key-files:
  created:
    - .planning/todos/pending/2026-09-03-159-identity-provider-default-remove-request.md
    - .planning/todos/pending/2026-09-03-159-i18n-translate-helpers-after-app-shared-extraction.md
    - .planning/todos/pending/2026-09-03-159-rename-getalliancesummary-to-alliances.md
  modified:
    - apps/frontend/src/lib/utils/constants.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
    - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts
    - .planning/WINDOWS.md

key-decisions:
  - "The identity-provider default was NOT removed. The plan's founding premise - a second authoritative default downstream - is false at HEAD; 55c9c07e9 removed it three days earlier. Removing the survivor would throw at four server routes, so it was documented at the line and filed instead."
  - "Two acceptance greps that no correct implementation can satisfy were measured and reported, not met. A third passes for the wrong reason and is called out as the criterion that would have let the regression through."
  - "The i18n register entry was filed with a CORRECTED premise, not the stale blocker the plan dictated: the app-shared extraction has landed, and the claimed zero direct importers are three."
  - "The unit suite was run BEFORE the database reset, inverting the plan's stated order, because yarn test:unit leaves the whole default seed template in the live database."
  - "Non-vacuity mutations were chosen to be strictly more restrictive or purely cosmetic, which is what let the demonstration run at all after two prior attempts were blocked."

patterns-established:
  - "An acceptance criterion whose parenthetical states its intent ('the authoritative default survives downstream') must be checked against the INTENT, not the grep - this one returned 3 while the thing it claimed to prove was absent."

requirements-completed: [REVIEW-CMP-01, REVIEW-CMP-02, REVIEW-CMP-03, REVIEW-CMP-04, REVIEW-CMP-05, REVIEW-CMP-06]

coverage:
  - id: D1
    description: "The full end-to-end suite is green on the final tree, run against a reset database and exactly one fresh server that passed the served-application preflight."
    requirement: REVIEW-CMP-01
    verification:
      - kind: e2e
        ref: "yarn test:e2e -> 155 passed (10.5m), exit 0; zero failed, zero skipped, zero flaky, zero did-not-run"
        status: pass
      - kind: other
        ref: "E2E PREFLIGHT OK /Users/.../voting-advice-application-gsd/apps/frontend (verified against /Users/.../voting-advice-application-gsd)"
        status: pass
      - kind: other
        ref: "yarn build --force -> Tasks 14 successful / 14 total, Cached 0 of 14, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The two deferred review comments are on the register, each naming its blocker, and the third (the identity-provider default) is filed with the measurement that refutes the plan's premise."
    requirement: REVIEW-CMP-03
    verification:
      - kind: other
        ref: "grep -rln 'i18n/init' .planning/todos/pending/ -> 4 (>= 1); grep -rln 'getAllianceSummary' .planning/todos/pending/ -> 1 (>= 1)"
        status: pass
      - kind: other
        ref: "three new files under .planning/todos/pending/ following the YYYY-MM-DD-slug.md convention"
        status: pass
    human_judgment: false
  - id: D3
    description: "159-02's non-vacuity gap is closed: every one of the four PasswordSetter contract cases has been observed RED against a deliberately broken component, and the component was restored byte-identical."
    requirement: REVIEW-CMP-04
    verification:
      - kind: unit
        ref: "PasswordSetter.svelte.test.ts - three mutation runs, 3+1+3 reds covering all four cases; verbatim output recorded below"
        status: pass
      - kind: other
        ref: "sha256 41e18124124fb10fc875113bbc8f9f6d2bcc6c501273657ba3d72d50bc0d90e6 before and after; git status clean"
        status: pass
    human_judgment: false
  - id: D4
    description: "The tracking surface lock's rationale describes the mechanism that is actually on the tree - an explicit six-member forward, not the wholesale inherit it was written against."
    requirement: REVIEW-CMP-05
    verification:
      - kind: unit
        ref: "trackingService.svelte.test.ts -> 8 passed (8); the eight-member assertion is unchanged"
        status: pass
      - kind: other
        ref: "yarn lint:check exit 0 including the phase-152 comment-hygiene guard, 1642 files, 0 violations"
        status: pass
    human_judgment: false
  - id: D5
    description: "The identity-provider default keeps exactly one authoritative location, the resolved outcome is unchanged, and no environment file was edited."
    requirement: REVIEW-CMP-06
    verification: []
    human_judgment: true
    rationale: "The plan asked for a code change; the measurement says the change would be a regression, so none was made. That is a judgement about an authentication-path configuration variable and the operator should confirm it - specifically whether an unconfigured deployment should keep defaulting to Signicat or should fail loudly, which is routed to Phase 157.1. The success criterion as written is satisfied by the tree as it stands, but a reader who expected a diff deserves to be asked rather than told."
  - id: D6
    description: "All six of the phase's uncovered review comments end in an implemented change, a close-as-already-fixed with a named commit, or a filed register entry."
    requirement: REVIEW-CMP-02
    verification:
      - kind: other
        ref: "six-row disposition table below; commit ce0f5e746 verified to exist for row 1"
        status: pass
    human_judgment: true
    rationale: "Completeness against the ORIGINAL triage is the claim, and the triage lives in a document this plan did not re-derive from the pull request. The six are the six that 159-RESEARCH.md enumerated and that 159-10 re-stated; if the triage held a seventh, no artifact here would show it."

duration: 40 min
completed: 2026-09-03
status: complete
---

# Phase 159 Plan 11: The phase gate — Summary

**The cardinal full-suite gate green at 155/155 on a reset database and one preflight-verified server, 159-02's non-vacuity gap closed with all four cases observed RED, and the plan's own founding premise measured false: the identity-provider default was documented and filed rather than removed, because removing it would have thrown at four server routes.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-09-03T06:56:36Z
- **Completed:** 2026-09-03T07:36:51Z
- **Tasks:** 3 (plus two gate-context items the phase deliberately deferred to this plan)
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- **The gate is green.** `155 passed (10.5m)`, exit 0 — zero failed, zero skipped, zero flaky, zero did-not-run — against a database reset before the server started and exactly one fresh server that printed `E2E PREFLIGHT OK` for this checkout.
- **The plan's first task would have been a regression, and it was caught by re-measuring rather than by the acceptance greps** — two of which are unsatisfiable by any correct implementation and a third of which passes for the wrong reason.
- **159-02's non-vacuity gap is closed** after two prior attempts were blocked, by choosing mutations that are strictly more restrictive instead of weakening a credential check. All four cases seen RED; component restored byte-identical.
- **Every gate's exit code was read directly**, never through a pipe — the specific failure that cost 159-09 two commits.

## Task Commits

1. **Task 1: the identity-provider default — measured, documented, filed** — `05dfe74f2` (docs)
2. **Task 2: the two deferred review comments, filed with re-measured premises** — `3d682b5ea` (docs)
3. **Gate item: 159-06's stale tracking-guard rationale (ledger 225)** — `ac3824d98` (docs)
4. **Gate item: 159-02's non-vacuity gap + the format:check failure (ledgers 227, 232)** — `57fb6e4f5` (test)
5. **Task 3: the cardinal end-to-end gate** — `c4b830384` (test)

---

## Task 1 — the premise was false, so the change was not made

The plan's first `must_haves` truth reads: *"Removing the duplicated provider default is a provable runtime no-op with the environment variable unset, because a second, authoritative default sits downstream in the provider selector."*

**The two lines, side by side, as the plan asked — and they prove the opposite of what it expected:**

```ts
// apps/frontend/src/lib/utils/constants.ts:10  (upstream — the surviving default)
PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat',

// apps/frontend/src/lib/api/utils/auth/providers/index.ts:27  (downstream — no default at all)
const providerType = constants.PUBLIC_IDENTITY_PROVIDER_TYPE as ProviderType;
```

`159-RESEARCH.md` row 3 quotes that second line as `(constants.PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat')` at `:31`. **That form no longer exists.** The module's own header, three lines above, states the inversion outright:

> The `'signicat'` default for backward compatibility with existing deployments is applied **once, at `$lib/utils/constants`; this module applies none of its own.**

**Who changed it:** `55c9c07e9` — `refactor(157-13): remove the doubly-applied provider default in getActiveProvider`, 2026-08-30, three days before this plan ran. Phase 157 collapsed the duplication the review comment named, and kept the **upstream** copy.

**So the planned edit is not a no-op.** `getActiveProvider()` switches on the value with `case 'idura'` / `case 'signicat'` and a `default:` that throws; there is no case for the empty string. With the variable unset, `?? ''` makes every call throw — at **four server callers**: `routes/api/oidc/authorize/+server.ts:22`, `routes/api/oidc/token/+server.ts:20`, `routes/api/oidc/callback/+server.ts:64` and `routes/candidate/preregister/+layout.server.ts:41`. That is exactly the outcome the plan's own threat model rates **high** and forbids (T-159-34: *"keeping the resolution outcome provably identical"*).

**No environment file was edited, and none needs to be.** Stated explicitly because the plan warned a reader could conclude otherwise. `.env.example:46` already carries `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat`, so documented deployments do not lean on the default in the first place. The only other reader, `routes/candidate/preregister/+page.svelte:75`, compares `=== 'idura'` and is unaffected by any value.

### Three acceptance criteria, measured honestly

| Criterion | Required | Measured | Disposition |
|---|---|---|---|
| `grep -c "signicat" constants.ts` | 0 | **1** | **Unsatisfiable** by any correct implementation |
| `grep -cE "\?\? ''" constants.ts` | 10 | **9** | **Unsatisfiable** — same cause |
| `grep -c "signicat" providers/index.ts` *("the authoritative default survives downstream")* | >= 1 | **3** | **Passes for the wrong reason** — the matches are the `case 'signicat'` arm and two doc mentions. This is the criterion that would have waved the regression through. |
| `git diff --name-only` lists one non-environment file | yes | **yes** — `constants.ts` only | met |
| `yarn workspace @openvaa/frontend test:unit` exit 0, both provider tests pass | yes | **88 files / 1590 tests, exit 0**; `idura.test.ts` 16 ✓, `signicat.test.ts` 16 ✓ | met |
| `yarn typecheck` exit 0 | yes | **0 errors, 0 warnings, exit 0** | met |

The plan's own `<success_criteria>` line — *"exactly one authoritative identity-provider default remains, with the resolved outcome proven unchanged and no environment file edited"* — **is satisfied by the tree as it stands, without an edit.**

**What was done instead:** a comment at the line, so the next reader who lands on "Remove default." finds the measurement rather than repeating it, plus a register entry routing the one question that genuinely survives — *should an unconfigured deployment fail loudly?* — to **Phase 157.1, Fail-Loudly Parse Posture**, whose entire subject that is, and which `157-13` already moved this same variable one step toward.

---

## The six uncovered review comments — full disposition, count exactly six

| # | Comment | Anchor | Disposition | Where |
|---|---|---|---|---|
| 1 | "This ad hoc rollup is fixed in the last branch of the stack" | `appContext.svelte.ts` EXPLICIT FORWARDING block (now `:242`, cited as `:335`) | **Closed as already fixed.** Commit `ce0f5e746` — *"refactor(quick/260824-sdp): forward dataCtx and tracking via inheritContextMembers"* — verified to exist. No code change. | recorded here |
| 2 | "Check whether these utils are any longer needed after the extraction of translation utils to app-shared" | `i18n/init.ts:48` (cited `:52`) | **Filed** — with the blocker **discharged**, not asserted | `3d682b5ea` |
| 3 | "Remove default." | `constants.ts:10` | **Measured, documented in-file, filed.** Not implemented — the premise is false and the edit would be a regression | `05dfe74f2` |
| 4 | "Rename to `alliances.ts`" | `lib/utils/getAllianceSummary.ts` | **Filed**, deferred to whoever owns 158's section 3.2 cluster move | `3d682b5ea` |
| 5 | "If so, `minSelection` should be checked to be > 0" | `multiChoiceValidity.ts:8` | **Implemented**, seen RED first | 159-10 (`a61245b4c`) |
| 6 | "Add as a follow-up blocking task for me to UAT: BooleanInput, multi-select choices" | `QuestionChoices.svelte:1` | **Filed AND delivered**; the operator's run is at milestone close | 159-10 (`4f5da11d5`) |

**Six comments, six dispositions, none dropped.**

### Comment 2 — the blocker the plan told me to name is discharged

The plan instructed: *"State that the comment's precondition ... has NOT landed on this tree ... Name the phase the precondition belongs to. State plainly that the question cannot be answered before that lands."*

**I could not write that, because it is false at HEAD.** Two of the research's three supporting measurements are wrong:

| Research claim | Measured | |
|---|---|---|
| "the app-shared extraction ... has NOT landed here yet" | `packages/app-shared/src/data/getLocalized.ts` exists, is exported from the barrel at `index.ts:5`, and has a colocated test | **FALSE** |
| "nothing imports them from `'$lib/i18n'` directly (**0** such imports)" | **three** do: `api/utils/translateQuestionTerms.ts:1`, `translateHeroContent.ts:2`, `translateVideoContent.ts:1` | **FALSE — 3, not 0** |
| "the only app-shared module mentioning translation is a type" | three files mention it; none is the utility, but `getLocalized.ts` above is | conclusion superseded |

**Phase 157 delivered it** — success criterion 5, *"`getLocalized` and its test are colocated with `packages/app-shared/src/data/localized.type.ts`"* — and closed 2026-08-31. The phase is named, as the plan required; it is named as the phase that **discharged** the blocker.

The entry was therefore filed with the corrected premise plus a six-row measured table of where the two utilities actually differ (soft locale matching, empty-string skipping, fallback order, default-locale source, miss result, generic value type), so whoever answers the comment starts from facts. It is still filed rather than implemented because answering it is a user-visible behaviour decision plus a migration with its own tests, and this phase's boundary is components and contexts. A third implementation the research does not mention — `packages/data/src/i18n/translate.ts`, already imported by `localServerDataProvider.ts` — is listed so it is not rediscovered.

Recorded under the standing rule that an addendum alone lets a stale premise propagate: writing "blocked on 157" here would have sent the next reader looking for work that is already done.

### Comment 4 — deferred, with the real reason

`getAllianceSummary.ts` (23 lines, one export) is a **named member of section 3.2** of `158-LIB-UTILS-MOVE-PROPOSAL.md`, the proposal's strongest verdict, recommending the whole entity cluster move to `lib/entities/`. That document closes: *"Acting on any verdict here is a separate decision, for the operator to make and for a later phase to own."* Renaming inside `lib/utils/` now would be half of a two-step move. Both importers were re-measured — `EntityCard.svelte:57` and `EntityDetails.svelte:37`; the research cites `:56` and `:38`, both drifted by one during this phase.

---

## 159-02's non-vacuity gap — CLOSED, with the RED output verbatim

Ledger 227 recorded that 159-02's deliberate-break demonstration was **blocked twice by the runtime command classifier**, because the proposed break weakened a credential check. The fix was to pick mutations that cannot be read as weakening anything:

- **A** — the verdict pinned to `false`. Strictly stricter: accepts nothing that was previously accepted.
- **B** — the message ladder pinned to one key. More errors shown, never fewer.
- **C** — `reset()` no longer clearing the confirmation field. A form-clearing bug; no gate involved.

**Run 1 (mutations A + B), verbatim:**

```
 ❯ src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts (4 tests | 3 failed) 39ms
   ✓ PasswordSetter validity and error message > reports not valid with the not-valid message for an empty password 22ms
   × PasswordSetter validity and error message > reports not valid with the do-not-match message when the confirmation differs 9ms
     → expected 'candidateApp.setPassword.passwordNotV…' to be 'candidateApp.setPassword.passwordsDon…' // Object.is equality
   × PasswordSetter validity and error message > reports valid with no message when a valid password is confirmed 4ms
     → expected false to be true // Object.is equality
   × PasswordSetter validity and error message > clears both fields and the message when reset is called 3ms
     → expected 'candidateApp.setPassword.passwordNotV…' to be 'candidateApp.setPassword.passwordsDon…' // Object.is equality
```

**That run did not prove case 4.** It failed at `:166`, *before* `harness.reset()` ran — so mutation C was never exercised. Saying "3 of 4 red, done" would have claimed a proof the run does not contain. Two more runs were needed.

**Run 2 (mutation C alone), verbatim:**

```
 ❯ src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts (4 tests | 1 failed) 36ms
   ✓ ... reports not valid with the not-valid message for an empty password 22ms
   ✓ ... reports not valid with the do-not-match message when the confirmation differs 5ms
   ✓ ... reports valid with no message when a valid password is confirmed 3ms
   × ... clears both fields and the message when reset is called 6ms
     → expected 'Zyxwvu9?' to be '' // Object.is equality
```

Failing at `:171`, `confirmationValue()` — the reset assertion itself.

**Run 3 (ladder pinned to the other key), verbatim** — needed because case 1 stayed green through runs 1 and 2:

```
 ❯ src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts (4 tests | 3 failed) 37ms
   × ... reports not valid with the not-valid message for an empty password 25ms
     → expected 'candidateApp.setPassword.passwordsDon…' to be 'candidateApp.setPassword.passwordNotV…' // Object.is equality
   ✓ ... reports not valid with the do-not-match message when the confirmation differs 5ms
   × ... reports valid with no message when a valid password is confirmed 4ms
     → expected 'candidateApp.setPassword.passwordsDon…' to be undefined
   × ... clears both fields and the message when reset is called 3ms
     → expected 'candidateApp.setPassword.passwordsDon…' to be undefined
```

**All four cases have now been observed RED at least once.** Case 1 in run 3; case 2 in run 1; case 3 in runs 1 and 3; case 4's reset assertions in run 2.

**Byte-identity after restore:**

```
41e18124124fb10fc875113bbc8f9f6d2bcc6c501273657ba3d72d50bc0d90e6  PasswordSetter.svelte   (before)
41e18124124fb10fc875113bbc8f9f6d2bcc6c501273657ba3d72d50bc0d90e6  PasswordSetter.svelte   (after)
```

`git status` clean, `4 passed (4)`. Ledger 227 marked fixed.

**Ledger 232 closed in the same commit.** `yarn format:check` was red on this same file at HEAD (introduced by 159-02, out of 159-08's and 159-09's scope). One statement re-wrapped by `prettier --write`, no semantic change; whole-repo `format:check` now exits 0.

---

## 159-06's stale rationale (ledger 225) — re-derived, not renumbered

The gate context pointed at `apps/frontend/src/lib/contexts/tests/` and an `EXPECTED_KEYS` lock. **Re-measured by content: neither exists.** `contexts/tests/` holds one unrelated file, and there is no `EXPECTED_KEYS` symbol anywhere — the lock is a local `const expected = [...]`. The real anchor is `contexts/app/tracking/trackingService.svelte.test.ts:158-160`.

Three things were stale, and one was not:

| Claim in the guard's prose | Measured at HEAD | |
|---|---|---|
| "consumed via `...tracking` spread (appContext.svelte.ts:299)" | **zero** `...tracking` spreads exist; the file is **376** lines and the forward is an `Object.assign` | stale |
| "`appContext` blanket-forwards ... via `inheritContextMembers(this, this.#tracking)`" | `inheritContextMembers` is now called for `#dataCtx` only | stale |
| "the eight own-enumerable members **appContext forwards**" | the producer exposes **eight**; appContext forwards **six** | half stale |
| the eight-entry assertion itself | **correct** | **unchanged** |

The rationale needed re-deriving, not a number swap: with an explicit downstream list, this case no longer guards against silent widening — it locks the producer surface that the list is maintained against, and it is the only place the two withheld members (`sessionId`, `shouldTrack`) are pinned at all. `8 passed (8)`; `lint:check` exit 0 including the phase-152 hygiene guard. Ledger 225 marked fixed.

---

## Task 3 — the cardinal gate

### The four prerequisites, all measured before the run

| Prerequisite | State |
|---|---|
| **Disk headroom** | **98 GiB free / 89%** immediately before the run (threshold 15 GiB). 159-01 recorded 110.2 GiB pre-run and 108 GiB post-run; the fall over the phase is real but leaves ~6.5x the threshold, so this was not a stop-and-report. |
| **`tests/e2e-runs/`** | **Intact — 6.8 GiB, 128 entries**, before and after. Not deleted, not touched. |
| **Database reset before the server started** | `yarn db:reset` exit 0, then the server. **Never during a run.** |
| **Exactly one fresh server on the agreed port** | **One** listener on **5173** (`strictPort`). No `FRONTEND_PORT` override was needed — unlike 159-01, which moved to 5273 around a foreign server; 5173 and 5273 were both measured free at plan start. |
| **Preflight** | `E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)` |

### The suite results

| Gate | Result | Exit |
|---|---|---|
| `yarn build --force` | **Tasks 14 successful / 14 total, Cached 0 of 14** — genuinely executed, not a cache replay | **0** |
| `yarn test:unit` (monorepo) | 25/25 tasks; frontend **88 files / 1590 tests**; data 244, dev-seed 603, app-shared 95, matching 43, llm 39, argument-condensation 30, filters 22, question-info 22 | **0** |
| `yarn lint:check` | all guards 0 violations | **0** |
| `yarn format:check` | clean repo-wide | **0** |
| `yarn typecheck` | svelte-check **0 errors, 0 warnings** | **0** |
| **`yarn test:e2e`** | **`155 passed (10.5m)`** — **0 failed, 0 skipped, 0 flaky, 0 did-not-run** | **0** |

Every exit code was captured directly into a variable and echoed; none was read through a pipe. `git status --short` is empty — the run modified nothing under `tests/`.

**Disk:** 100 GiB free at plan start → 98 GiB immediately before the run → 96 GiB immediately after → 97 GiB at close. Capacity 89% → 90%.

**The visual-regression conditional does not fire.** The wave-two alert decision chose the **render-identical** branch (`-mt-[1rem]` → `-mt-16`, proven against the compiled stylesheet); 159-04 records the `PLAYWRIGHT_VISUAL=1` line as explicitly *"not applicable: that branch was not chosen, and nothing rendered changed."* No baseline was regenerated, so none needed review.

### The order was changed, deliberately

The plan says reset, then server, then *"the unit suite, the static gate and then the FULL end-to-end suite."* **Running the unit suite in that position would have corrupted the gate.**

`packages/dev-seed/tests/integration/default-template.integration.test.ts` calls its teardown at `:210`, inside `beforeAll` — with **no `afterAll` counterpart**. Re-measured at this HEAD, still true. So `yarn test:unit` leaves the entire `default` template (1 election, 4 categories, 26 questions, 328 candidates, 377 nominations, all `seed_`-prefixed) in the live database. Phase 144 ran exactly the plan's order and got **8 failed / 79 did not run / 48 passed**, with failures that look like product defects rather than seeding.

So: unit and the static gates ran **first**, then `db:reset`, then one fresh server, then the suite. The plan's actual invariants — reset before the server, never during a run — are both honoured.

---

## Operator instructions reflected here, and NOT re-raised

**On 159-09's answer-shape change** (a `multipleText` question now persists `Array<LocalizedString>` where it persisted `Array<string>`), verbatim:

> "There is no existing data we need to care about, nor document this change."

**No follow-up todo, no data migration and no back-compatibility test was filed for it, and none should be.** Recorded verbatim so its absence is not later read as an oversight. What this run *does* provide is the measurement 159-09 lacked: the change is now covered by a green full suite, including the candidate-journey answer save/read path. Ledger 234 closed.

**On the 2-choice / multi-select UAT**, the operator scheduled the run for **v2.15 milestone close** and it is **explicitly not a Phase 159 blocker**. `159-UAT-QUESTION-INPUTS.md` and its register entry already exist. Nothing here blocks on it.

---

## Files Created/Modified

- `constants.ts` — one comment. Why the default stays, what happens if it goes, and where the residual question was routed.
- `trackingService.svelte.test.ts` — two comments re-derived against the selective forward; the assertion untouched.
- `PasswordSetter.svelte.test.ts` — one statement re-wrapped by prettier. No semantic change.
- `.planning/todos/pending/…-identity-provider-default-remove-request.md` — the refutation, the four affected callers, the three criteria, and the routing to 157.1.
- `.planning/todos/pending/…-i18n-translate-helpers-after-app-shared-extraction.md` — the corrected premise and the six-row difference table.
- `.planning/todos/pending/…-rename-getalliancesummary-to-alliances.md` — the deferral and the one-move-not-two argument.
- `.planning/WINDOWS.md` — two new entries; four closed (225, 227, 232, 234, 236 — five, in fact).

## Deviations from Plan

### 1. [Rule 4-adjacent — premise disproven] Task 1's code change was NOT made

- **Found during:** Task 1, reading the downstream selector rather than assuming it (which the plan itself instructed)
- **Issue:** the plan's founding truth — a second authoritative default downstream — is false; `55c9c07e9` removed it on 2026-08-30
- **Fix:** none, deliberately. Making the change would throw at four server routes with the variable unset — the plan's own `high`-severity T-159-34 outcome. Documented at the line; filed with the residual question routed to Phase 157.1
- **Why no checkpoint:** the conservative action is *not* changing the code, and it satisfies the plan's `<success_criteria>` as written. It is the change that would have needed approval. The decision is surfaced here and in the register entry rather than blocking the budgeted suite run on a one-token question.
- **Files modified:** `constants.ts` (comment only)
- **Committed in:** `05dfe74f2`; ledger entry filed

### 2. [Rule 1 — Bug] The register entry the plan dictated would have asserted a false blocker

- **Found during:** Task 2
- **Issue:** the plan required stating that Phase 157's app-shared extraction has not landed. It has.
- **Fix:** filed with the corrected premise and the measured difference table
- **Committed in:** `3d682b5ea`; ledger entry filed

### 3. [Rule 3 — Blocking] The plan's gate order would have contaminated the gate

- **Found during:** Task 3
- **Issue:** `yarn test:unit` reseeds the live database; running it between the reset and the suite reproduces Phase 144's 8-failed / 79-did-not-run outcome
- **Fix:** unit and static gates before the reset; reset, then server, then suite
- **Committed in:** `c4b830384`

### 4. [Rule 2 — Missing critical] Two ledger entries the phase left for its gate

- Ledger **225** (159-06's stale rationale) and **227 / 232** (159-02's unproven non-vacuity and its red `format:check`) were both flagged for this plan by the gate context but appear in no task. Closed in `ac3824d98` and `57fb6e4f5`.

---

**Total deviations:** 4 (1 premise refutation, 1 bug, 1 blocking, 1 missing-critical)
**Impact on plan:** two of the three tasks changed shape because their premises had drifted — the seventh, eighth and ninth consecutive plan in this phase to find that. No acceptance criterion was satisfied by editing code or prose to hit a number; the two unsatisfiable ones are reported with what they measure and why.

## Issues Encountered

- **`.env` is unreadable to this executor** (the harness denies `grep` against it), so `FRONTEND_PORT` was verified indirectly: both 5173 and 5273 were measured free, the server bound 5173, and the preflight confirmed the suite drove the same port. That chain is sufficient — a mismatch would have aborted the preflight by construction.
- **The first dev server had to be stopped and restarted** because of the unit-suite reseeding above. Both starts were verified as exactly one listener.

## Known Stubs

None.

## User Setup Required

None — no external service configuration required. **No environment file was edited**, and none needs to be.

## Next Phase Readiness

- **Phase 159 is complete.** All 11 plans have summaries; the cardinal gate is green on the final tree; `REVIEW-CMP-01..06` release with this summary.
- **One decision waits for the operator:** whether to remove the last identity-provider default so an unconfigured deployment fails loudly. Filed and routed to **Phase 157.1**; deliberately not decided here.
- **Two register entries carry named owners** — the i18n consolidation question (needs an owning phase; no longer blocked) and the `getAllianceSummary` rename (waits on the ruling for `158-LIB-UTILS-MOVE-PROPOSAL.md` § 3.2).
- **One item waits for milestone close:** the 2-choice / multi-select UAT, per the operator's own scheduling. Not a Phase 159 blocker.
- **Disk is the standing risk for the next full-suite run:** 97 GiB free at close, down from 110.2 GiB at 159-01 — roughly 13 GiB consumed across the phase, ~11 of it by this run. `tests/e2e-runs/` is at 6.8 GiB and must not be deleted.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-03*

## Self-Check: PASSED

All three created register entries and this summary exist on disk. All six commits (`05dfe74f2`, `3d682b5ea`, `ac3824d98`, `57fb6e4f5`, `c4b830384`, `d2dc913af`) are in the log; the working tree is clean. Every gate re-verified from its own run artifact rather than recall, exit codes read directly and never through a pipe: `yarn test:e2e` `155 passed (10.5m)` with `E2E_EXIT=0` and one `E2E PREFLIGHT OK` line for this checkout, zero occurrences of failed / skipped / flaky / did-not-run / interrupted; `yarn build --force` Tasks 14/14 with Cached 0 of 14, exit 0; `yarn test:unit` 25/25 tasks (frontend 88 files / 1590 tests), exit 0; `yarn lint:check`, `yarn format:check` and `yarn typecheck` all exit 0. `PasswordSetter.svelte` sha256 `41e18124…d90e6` matches its pre-mutation value exactly, and the three RED runs are recorded verbatim above. `tests/e2e-runs/` intact at 6.8 GiB / 128 entries.
