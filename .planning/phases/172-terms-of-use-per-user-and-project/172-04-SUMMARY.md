---
phase: 172-terms-of-use-per-user-and-project
plan: 04
subsystem: ui
tags: [sveltekit, svelte5, server-load, gate, terms-of-use, invalidateAll, vitest, e2e, playwright]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "Plan 01: the acceptance table and its access model. Plan 02: the E2E admin client's acceptance default, its opt-out and acceptTermsOfUse(email). Plan 03: BasicUserData.termsOfUseAccepted, the writer's acceptTermsOfUse and the context's acceptTermsOfUse"
provides:
  - "lib/contestant/gates/gates.ts: ContestantGateId, ContestantGate, the frozen ordered CONTESTANT_GATES holding the terms-of-use gate, and firstNeededGate(user, gates?)"
  - "lib/contestant/gates/TermsOfUseGate.svelte: the acceptance view; Continue calls acceptTermsOfUse() then awaits invalidateAll()"
  - "lib/contestant/gates/gateViews.ts: GATE_VIEWS, a frozen Record<ContestantGateId, Component>"
  - "The protected server load in five stages: session, getBasicUserData, firstNeededGate, loadEntity, question data; it returns { gate, user } or { gate: null, user, questionData, contestantUserData }"
  - "loadEntity(): the one inner function that reads the user's entity and holds its four sign-out outcomes"
  - "The protected layout renders GATE_VIEWS[data.gate] in place of the page and no longer reads acceptance from the entity"
  - "Stage 1 closed green on one tree: nine gate rows at 0 and 177 of 177 E2E tests, with candidates.terms_of_use_accepted still in the schema"
affects: [172-05, 172-06, 172-07, 172-08, 172-09, 173, 176, 178, 179]

actuals:
  tokens: 13017
  tasks: 3
  commits: 2
plan_head_before: 4e5adff62e585c4a114b837815a151f74cbe0e44
plan_head_after: 0cd6eba4da1d8828c79ed69bfed07b926f82cc94

tech-stack:
  added: []
  patterns:
    - "A gate has two halves: a predicate over user-level data in a plain frozen module the server load imports, and a view in a record keyed by the gate id type that only the layout imports"
    - "A server load that decides a gate returns early with the gate id and the user-level data, so the layout narrows on one discriminant and nothing below the gate runs"
    - "A view that depends on stored state is left only by rerunning the load (await invalidateAll()), never by a local flag"

key-files:
  created:
    - apps/frontend/src/lib/contestant/gates/gates.ts
    - apps/frontend/src/lib/contestant/gates/gates.test.ts
    - apps/frontend/src/lib/contestant/gates/gateViews.ts
    - apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte
    - apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
    - .planning/phases/172-terms-of-use-per-user-and-project/deferred-items.md
  modified:
    - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
    - apps/frontend/src/routes/contestant/(protected)/+layout.svelte
    - apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts

key-decisions:
  - "The layout tests the gate with `data.gate != null`, not `!== null`: the generated LayoutData has a third arm with every member absent (the load's returns that only redirect), and the strict form does not typecheck against it"
  - "After loadEntity() the load carries one narrowing line, `if (!entity) return;`, because handleError is typed Promise<void> and was left as it is"
  - "The gate view sets its status back to idle once invalidateAll() has resolved, so a gate that is still shown after the rerun (the acceptance could not be read back) can be answered again"
  - "A browser probe of 26 checks was run against a temporary dev server on the default project, because no E2E spec asserts the gate's load data, a deep URL, the gate's own Logout or the chrome around the gate"
  - "REG-12 is reported as completed by this plan: the gate is switched. Earlier plans of the phase reported it as not yet completed for that reason"

patterns-established:
  - "Insert a gate ahead of terms of use: one entry in CONTESTANT_GATES before it, one member in ContestantGateId, one view in GATE_VIEWS. The load and the layout do not change"
  - "Phase 173's swap point: loadEntity() in the protected server load"

requirements-completed: [REG-12]

coverage:
  - id: D1
    description: "CONTESTANT_GATES is a frozen, ordered list holding exactly the terms-of-use gate; its predicate is true for a null or absent acceptance and false for any stored time; firstNeededGate returns the first needed entry or null"
    requirement: REG-12
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/gates/gates.test.ts (13 cases: content, the freeze with three throwing writes, the predicate, the order with a two-entry list, null, an empty list, the user handed to the predicate)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The server load decides the gate on getBasicUserData() alone; for a gated user it returns { gate: 'termsOfUse', user } and reads neither the entity nor the questions and signs nobody out"
    requirement: REG-12
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts#a user who must pass a gate > returns the gate and the user-level data only, and does not read the entity"
        status: pass
      - kind: other
        ref: "negative control: with the entity step moved above the gate, 2 of the file's 6 cases fail (vitest exit 1); the file was restored and is byte-identical to the committed one"
        status: pass
      - kind: other
        ref: "browser probe checks 6 and 7: the gated page's __data.json names the gate and termsOfUseAccepted and contains no contestantUserData, questionData, nominations or the candidate's id"
        status: pass
    human_judgment: false
  - id: D3
    description: "A user past the gates gets { gate: null, user, questionData, contestantUserData }, with the entity read once and after the user-level read; a failed user-level read signs out and redirects with loginFailed; no session redirects before anything is read"
    verification:
      - kind: unit
        ref: "layout.server.test.ts (4 cases: a user past the gates x2, the user-level data cannot be read, no session)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The entity step is one inner function, loadEntity, holding getContestantUserData and the four outcomes spelled as before; no error code reworded, no locale string added, handleError unchanged"
    verification:
      - kind: other
        ref: "git grep for the four codes on +layout.server.ts (the same four as before the task, loginFailed once more for the user-level read); getContestantUserData appears only inside loadEntity; git diff 4e5adff62..HEAD names no file under apps/frontend/messages"
        status: pass
    human_judgment: false
  - id: D5
    description: "The layout renders the gate's view in place of the page for a gated load, provides no data to the context and logs no error for it; an ungated load renders no gate and provides its data"
    requirement: REG-12
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts#a gated load (2 cases); #an ungated load"
        status: pass
    human_judgment: false
  - id: D6
    description: "A failed acceptance shows tou-save-error with the save-failed key, keeps the form and does not rerun the load; a result that is not a success is treated the same"
    requirement: REG-12
    verification:
      - kind: unit
        ref: "termsOfUseLayout.svelte.test.ts#accepting the terms of use > shows the save-failed message, keeps the form and does not rerun the load when the acceptance rejects; > treats a result that is not a success as a failure"
        status: pass
    human_judgment: false
  - id: D7
    description: "A recorded acceptance calls acceptTermsOfUse once and invalidateAll once, in that order; Continue stays busy until the rerun has finished; no local state advances past the gate"
    requirement: REG-12
    verification:
      - kind: unit
        ref: "termsOfUseLayout.svelte.test.ts#accepting the terms of use (3 cases)"
        status: pass
      - kind: other
        ref: "negative control: with `await invalidateAll()` replaced by a call that is not awaited, the loading case fails (vitest exit 1); the file was restored"
        status: pass
    human_judgment: false
  - id: D8
    description: "In a browser: a user with no acceptance row meets the gate after sign-in and at a deep URL without a redirect; accepting leaves them on the requested page at the same URL; one row is stored for the project; after signing out and in again they are not asked again"
    requirement: REG-12
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/172/172-04-stage1: contestant-journey 1 of 1 (steps 5, 8 and 9: the gate, then no second prompt after the password reset and after sign-in)"
        status: pass
      - kind: other
        ref: "browser probe, 26 of 26 (exit 0): checks 1 to 4, 12 to 15, 19"
        status: pass
    human_judgment: false
  - id: D9
    description: "The gate no longer reads the entity: a user whose candidate row has terms_of_use_accepted set still meets the gate, and accepting does not write the column"
    verification:
      - kind: other
        ref: "browser probe: the picked candidate's column held 2025-01-01T00:00:00+00:00 before and after; the user met the gate; git grep -n termsOfUseAccepted -- apps/frontend/src/routes ':!*.test.ts' prints nothing (exit 1)"
        status: pass
    human_judgment: false
  - id: D10
    description: "Every force-registered identity and the localisation spec's invited user are past the gate: the suites that sign in as them are green with the gate reading the table"
    verification:
      - kind: e2e
        ref: "summary.json byProject: auth-setup 1 of 1, contestant-a11y-scan 14 of 14, cold-entry-dataroot-contestant 1 of 1, perm-localisation-positive 2 of 2"
        status: pass
    human_judgment: false
  - id: D11
    description: "Stage 1 closes green on one tree with the column still in the schema: nine static gates at 0 and the full default E2E suite at 177 of 177"
    requirement: REG-12
    verification:
      - kind: other
        ref: "bash 172-gates.sh --judge 172-04-stage1 (exit 0; nine rows, every status 0; head 0cd6eba4d, clean tree)"
        status: pass
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-04-stage1 (exit 0; 177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; the full default suite; head 0cd6eba4d)"
        status: pass
      - kind: other
        ref: "git grep -n terms_of_use_accepted -- apps/supabase/supabase/schema/102-entities.sql (one line, exit 0)"
        status: pass
    human_judgment: false
  - id: D12
    description: "PROH-172-01 and PROH-172-03: acceptance is recorded only by the user's Continue click; the gate adds no redirect, no next= parameter and no sign-out; userNoCandidate is moved only and pinned by no test"
    verification: []
    human_judgment: true
    rationale: "The plan marks both prohibitions as verified by judgment. The supporting facts are measured and listed under 'Prohibitions, Checked'."

duration: 28min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 04: The Gate Switched to User-Level Data, the Gate List and the Close of Stage 1 Summary

**The protected server load of the Contestant App now reads the signed-in user's terms-of-use acceptance first, decides the gate from it through a frozen one-entry gate list, and reads the entity only for a user who has accepted; the layout renders the gate's extracted view in place of the page and is left only by a rerun of the load; stage 1 closed green on one tree with nine gate rows at 0 and 177 of 177 E2E tests, the candidate column still in the schema and unread by the layout.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-10-06T00:59:09Z
- **Completed:** 2026-10-06T01:27:00Z
- **Tasks:** 3 of 3
- **Files changed outside `.planning/`:** 8, exactly the plan's `files_modified`
- **Start revision:** `4e5adff62e585c4a114b837815a151f74cbe0e44`
- **The tree the gate run, the E2E run, the probe and every closing check describe:** `0cd6eba4da1d8828c79ed69bfed07b926f82cc94`, clean apart from the operator's untracked `CAND-APP-PLAN.md`

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| The entity-step function | `loadEntity()`, an inner function of `load` in `routes/contestant/(protected)/+layout.server.ts`. It takes no argument and closes over `dataWriter` and `handleError`. It resolves `{ userData, electionId }`: the whole `ContestantUserData` and the de-duplicated ids of the elections the entity is nominated in. Its four other outcomes sign the user out and redirect (`loginFailed`, `userNotAuthorized`, `userNoCandidate`, `candidateNoNomination`) |
| The two return shapes of the load | `{ gate: ContestantGateId, user: BasicUserData }` for a gated user; `{ gate: null, user: BasicUserData, questionData, contestantUserData: ContestantUserData }` otherwise. `user` is the result of `getBasicUserData()` in both; in the second shape `contestantUserData.user` holds the same facts from the entity read's own call |
| A third arm in the generated type | `LayoutData` also has an arm in which every member is absent, for the load's returns that only redirect (it had one before this plan too). The layout therefore tests `data.gate != null` |
| Where the gate list and the view map live | `apps/frontend/src/lib/contestant/gates/gates.ts` (`$contestant/gates/gates`) and `apps/frontend/src/lib/contestant/gates/gateViews.ts` (`$contestant/gates/gateViews`). The directory has no barrel: the server load must import the list without the views |
| `userNoCandidate` | Moved only. The line reads `if (!candidate) return await handleError('userNoCandidate');` as before, now inside `loadEntity`. No message catalogue changed, `handleError` is unchanged, and no test names the code |
| The gate renders with no entity data | Observed in a browser: the gated page's `__data.json` is about 3.3 kB, names `termsOfUse` and `termsOfUseAccepted`, and contains no `contestantUserData`, `questionData`, `nominations` or the candidate's id. In the unit test a gated load calls neither `setDataRoot` nor `userData.init` and logs nothing |
| The header's logout on the gate | **There is none to observe.** The header's action row holds no logout button on the gate, and none on the contestant home either: `Banner.svelte` renders it only when `page.data.token` is truthy, and no load returns a `token`. The plan's stated consequence 3 therefore does not occur. The gate's own Logout button signs out and lands on the login page with no dialog (observed) |
| Assumption A2 | **Held**, as far as it has a subject. On the gate the header renders, the navigation drawer opens (11 menu items), and there was no page error, no console error and no response of status 400 or above. The header logout it names does not exist |
| Assumption A1 | Not exercised by this plan: it concerns the changed seed of 172-06 and 172-07. The journey's preview step passed on the unchanged seed |

## Accomplishments

- The gate list, its resolver, the acceptance view and the id-to-view map exist under `lib/contestant/gates/`, with 13 unit cases on the list.
- The server load runs in five stages and returns early for a gated user; the entity read and its four outcomes are one function below the gate.
- The layout shrank from 160 to 98 lines: the terms state, both handlers, the `'terms'` layout state, the two local flags, four imports and two context members (`logout`, `t`) are gone; `validity` is guarded on the gate.
- A new server-load test holds the order: for a gated user the entity read is not called. The layout test was rewritten against `acceptTermsOfUse` and `invalidateAll`.
- Two negative controls showed the two load-bearing assertions go red when the code is wrong.
- A browser probe showed the gate end to end in the states no spec covers.
- Stage 1 closed: nine gate rows at 0, then 177 of 177.

## Task Commits

1. **Task 1: the gate list, the view and the view map** — `25c8e9013` `feat(172-04): add the ordered contestant gate list, the terms-of-use gate view and the id-to-view map`
2. **Task 2: the load decides the gate, the layout renders it** — `0cd6eba4d` `feat(172-04): decide the terms-of-use gate on user-level data before the entity step and render it from the gate list`
3. **Task 3: the close of stage 1** — no commit. Neither the gate set nor the suite found a defect, so the task changed no source file, as the plan provides.

`git rev-list --count 4e5adff62..0cd6eba4d` is 2. The commit that carries this file follows them.

## The Surface as Committed

```ts
// lib/contestant/gates/gates.ts
export type ContestantGateId = 'termsOfUse';
export type ContestantGate = {
  readonly id: ContestantGateId;
  readonly isNeeded: (user: BasicUserData) => boolean;
};
export const CONTESTANT_GATES: ReadonlyArray<ContestantGate>; // frozen, entries frozen
export function firstNeededGate(
  user: BasicUserData,
  gates: ReadonlyArray<ContestantGate> = CONTESTANT_GATES
): ContestantGateId | null;

// lib/contestant/gates/gateViews.ts
export const GATE_VIEWS: Readonly<Record<ContestantGateId, Component>>; // frozen

// routes/contestant/(protected)/+layout.server.ts, inside load
const user = await dataWriter.getBasicUserData().catch(/* log */ () => undefined);
if (!user) return await handleError('loginFailed');
const gate = firstNeededGate(user);
if (gate !== null) return { gate, user };
const entity = await loadEntity();
if (!entity) return;
```

```svelte
<!-- routes/contestant/(protected)/+layout.svelte -->
{#if data.gate != null}
  {@const GateView = GATE_VIEWS[data.gate]}
  <GateView />
{:else if layoutState === 'error'}
```

- `TermsOfUseGate.svelte` takes no props, has no `.type.ts`, and destructures `t`, `logout` and `acceptTermsOfUse` from `getContestantContext()`. Its submit handler returns when the box is not ticked, sets `loading`, awaits `acceptTermsOfUse()`, throws on a result whose `type` is not `'success'`, awaits `invalidateAll()`, and on any throw logs with `log.error(…, { err })` and sets `error`.
- `validity` has a third state, `'gated'`. Both `$effect`s act only on `'resolved'` and `'error'`, so neither runs for a gated load. `layoutState` is `'loading' | 'error' | 'ready'`.
- The user-data state store's terms members (`setTermsOfUseAccepted`, `resetTermsOfUseAccepted`, `#editedTermsOfUseAccepted`) still exist and have no caller in `apps/frontend/src/routes`.
- `TermsOfUseForm.svelte`, its type file, the `termsOfUse` barrel and the preregister route tree are unchanged.

## Gate and E2E Results

Every exit status was read from the command itself or from the attempt's `done` file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Task 1 verify chain | `vitest run gates.test`, the two greps, as one command | 0 | 53 tests in 2 files (the filter also matches `appGates.test.ts`); the new file alone: 13 of 13 |
| Frontend typecheck after Task 1 | `yarn workspace @openvaa/frontend typecheck` | 0 | 0 errors, 0 warnings |
| Frontend typecheck, first run after the load and layout change | same | **1** | one error: `Type 'undefined' cannot be used as an index type` at `GATE_VIEWS[data.gate]`; see deviation 1 |
| Frontend typecheck after the fix, and again before the commit | same | 0, 0 | |
| Frontend lint, first run | `yarn workspace @openvaa/frontend lint` | **1** | one `func-style` error in the rewritten layout test; fixed before the commit |
| Frontend lint after the fix | same | 0 | 0 errors, the one warning the baseline also has |
| Task 2 verify chain | the two test filters, typecheck, the three greps, as one command | 0 | 69 tests in 5 files (the filter also matches three Admin load tests); the two files alone: 14 of 14 |
| Frontend unit suite | `yarn workspace @openvaa/frontend test:unit` | 0 | 137 files, 2171 tests (was 135 and 2146) |
| Negative control 1 | the entity step moved above the gate, `layout.server.test.ts` | **1** | 2 failed of 6, as intended; restored |
| Negative control 2 | `invalidateAll()` not awaited, `termsOfUseLayout.svelte.test.ts` | **1** | 1 failed of 8, as intended; restored |
| Prettier and ESLint on every changed file | per directory or file | 0 | |
| Comment hygiene, app-name gate, no-session-in-loads | the three root scripts | 0, 0, 0 | |
| **Gate set** | `172-gates.sh 172-04-stage1` | **0** | **nine rows, all `0`**, head `0cd6eba4d`, clean tree |
| **E2E** | `172-e2e.sh 172-04-stage1` | **0** | **177 / 177 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 4.7 min |
| Task 3 verify, part 1 | `172-gates.sh --judge 172-04-stage1` | 0 | nine rows, every status 0 |
| Task 3 verify, part 2 | `172-e2e.sh --judge 172-04-stage1` and the column grep, as one command | 0 | verdict GREEN, not below the baseline total |
| Plan verification | `vitest run gates.test layout.server.test termsOfUseLayout` | 0 | 122 tests in 7 files |
| Browser probe | `tsx` on a scratch script outside the repository | 0 | 26 of 26 |
| Allowlist | `170-allowlist-probe.sh after` | 0 | every row OK; the stack was not restarted |

The nine rows of `172-04-stage1`: lint 41 s, types-regen 31 s, types-clean 0 s, sql-lint 3 s, pgtap 4 s (38 files, 1392 tests), unit 54 s (frontend 2171 in 137, dev-seed 997 in 67, supabase 206 in 15, app-shared 141 in 10), svelte-check 8 s (2655 files, 0 errors, 0 warnings), build 15 s, format 16 s.

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/172-gates/172-04-stage1` | `0cd6eba4d` | nine rows, all `0` | green |
| `tests/e2e-runs/172/172-04-stage1` | `0cd6eba4d` | 177 of 177 over 100 projects | **green, the full default suite** |

There was no red gate row and no red E2E run, no rerun under a label, and nothing under `tests/e2e-runs/` was deleted. One preflight success, no preflight failure, wrapper status 0.

**Dev-server log of the green run.** Lines matching `A DataProvider returned an invalid result`, `Error loading election data` or `Error loading constituency data`: 4 (`172-01-baseline` 6, `172-03-writer` 6). The number did not rise. The log holds no record naming `getBasicUserData`, `acceptTermsOfUse`, `Error fetching basic user data`, `Error fetching user data` or `Error loading protected-layout data`: no server-side acceptance read failed, no user was signed out by the load, and no gated load was logged as an error.

## The Browser Probe

A scratch script (in the session scratchpad, not committed) drove Chromium against a dev server started for it on port 5373 and scoped to the default project, as an editor of one seeded candidate of the `default` dataset registered with `{ acceptTermsOfUse: false }`. 26 checks, all passed:

- **Sign-in:** the gate is shown, not home; the box is unticked; Continue is disabled.
- **The load data of the gated page:** names the gate and the acceptance; carries no entity data, no question data and not the candidate's id.
- **The chrome:** one logout button on the page, none in the header's action row; the navigation drawer opens; no page error, no console error, no response of status 400 or above.
- **A deep URL** (`/en/contestant/profile`): the gate is shown at that URL with no redirect. After ticking and Continue the profile page is shown at the same URL and no alert appeared.
- **The row:** one, for the project, with `accepted_at` stamped by the database. The candidate's `terms_of_use_accepted` column held the same value before and after.
- **Sign out, sign in:** home directly; not asked again.
- **The row removed with the service role, then a reload:** the gate is shown again. Its Logout lands on the login page with no dialog; a protected URL then redirects to login; no acceptance was recorded by logging out.
- **Afterwards:** the probe user is gone, the table holds 0 rows as before, the candidate column is as it was found.

The dev server was stopped when the probe ended; nothing listens on 5173, 5273 or 5373.

## What the Evidence Does and Does Not Show

- **Shown by unit tests:** the list's content, order, predicate and freeze; the load's order (the entity is not read for a gated user) and its two shapes; the view's three outcomes; that only the rerun removes the gate.
- **Shown by the E2E run:** the journey's email-flow user, who has no row, meets the gate, accepts, lands on home and is not asked again after a password reset or a fresh sign-in; every force-registered identity and the localisation spec's invited user are past the gate. This is the first run in which `acceptTermsOfUse` and the context wrapper ran from a browser session.
- **Shown by the probe only:** the gate's load data, a deep URL surviving acceptance, the gate's own Logout, the chrome around the gate, and that the entity's column no longer decides anything.
- **Not shown:** a failed acceptance in a real browser (the unit test holds it; threat T-172-20's stale-token case was not provoked); the gate under an axe scan (plan 172-08 adds the scan entries); a user with no entity meeting the gate first (no test pins what follows, by the plan's rule).

## Decisions Made

None of the plan's decisions was decided differently. The calls the plan does not make are under `key-decisions`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The gate check the plan words as `data.gate !== null` does not typecheck**
- **Found during:** Task 2, on the first typecheck after the layout change (exit 1, one error).
- **Issue:** SvelteKit turns each `void` return of a load into an arm of `LayoutData` in which every member is optional and absent. The load has such returns (`return await handleError(…)`, and had them before this plan). With three arms, `data.gate !== null` leaves `'termsOfUse' | undefined`, and `GATE_VIEWS[undefined]` is an error.
- **Fix:** the layout tests `data.gate != null` in the template and in `validity`, with one comment saying why. A load that returned nothing falls to the error branch, as it did before.
- **Files modified:** `apps/frontend/src/routes/contestant/(protected)/+layout.svelte`
- **Verification:** typecheck exit 0; the layout test's ungated case passes `gate: null`.
- **Committed in:** `0cd6eba4d`

### Small departures in form

- **One narrowing line after `loadEntity()`:** `if (!entity) return;`, with a comment. `handleError` always redirects, but it is typed `Promise<void>` and the plan says not to change it, so `loadEntity` is typed as resolving an entity or nothing.
- **`status = 'idle'` after `await invalidateAll()`.** The plan does not say what the status is once the rerun has resolved. Normally the view is gone by then. If it is still shown (the acceptance could not be read back, so the load reported the gate again), the form is usable again rather than stuck in its loading state.
- **The entity step's catch logs the same text as before; the user-level read's catch logs `Error fetching basic user data: …`,** so the two failures can be told apart in a log.
- **More unit cases than the plan lists.** Gate list: an empty list, the user handed to the predicate, and `push` throwing. Server load: the user identity in the gated shape, and the user-level read preceding the entity read. Layout: a non-success result, Continue busy until the rerun has finished, the gate staying until the load data changes, and a gated load providing no data and logging no error.
- **The gated case of the server-load test sets the entity read to reject.** A load that reached it would sign out and fail the case, so the case cannot pass by the mock's default.

### Beyond the plan's list

- **Two negative controls**, each a temporary edit of one file, restored from a copy and checked byte-identical before going on.
- **The browser probe**, described above. It started and stopped its own dev server on port 5373, created one auth user and removed it, and wrote one acceptance row that went with the user.
- **`deferred-items.md`** in the phase directory, holding the two out-of-scope discoveries below.

### Acceptance criteria that did not hold as written

- **Task 2, step 4: "The template's first branch is `data.gate !== null`".** It is `data.gate != null`; see deviation 1.
- **Task 2: the four error codes "the same four codes as before the task".** The same four, spelled as before, and `'loginFailed'` on one more line: the user-level read's failure, which the plan's step 1 asks for.

Every other criterion holds as written, and each `<automated>` check was run as one command and exited 0.

### Departures in procedure

- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct; the branch is not the default branch and was checked before each commit.
- **Polling** was a bounded foreground loop of `--status` calls 45 seconds apart; both helper runs were started with the tool's background mode.
- **`172-RESEARCH.md`, `172-PATTERNS.md` and `173-CONTEXT.md` were read by the sections the plan and the dispatch name,** not whole.
- **`yarn workspace @openvaa/docs generate:docs` was not run.** The new component is in `lib/contestant/gates/`, which is not one of the three directories the generator scans, so the generated listing does not change.

---

**Total deviations:** 1 auto-fixed (blocking), five small departures in form, three additions beyond the plan.
**Impact on plan:** none on behaviour or scope. The one a later phase must carry is the third arm of `LayoutData` and the `!= null` check that answers it.

## Prohibitions, Checked

| Prohibition | Evidence |
|---|---|
| PROH-172-01: acceptance is recorded only by the user's own Continue click | The only caller of the context's `acceptTermsOfUse` is `handleSubmit` in `TermsOfUseGate.svelte`, which returns unless the box is ticked. The box starts `false` (unit case and probe). Ticking alone records nothing (unit case). The server load only reads. Logging out on the gate recorded no row (probe). Verified by judgment, as the plan says |
| PROH-172-03: the gate costs neither place nor session | The gated path of the load has no `redirect` and no `handleError`; the unit case asserts `signOut` was not called. A deep URL is kept through the gate and after accepting (probe). No `next=` parameter exists. `userNoCandidate` is on one moved line; `git diff 4e5adff62..HEAD` names no file under `apps/frontend/messages`; a search of every test file under `apps/frontend/src` and `tests/tests` for `userNoCandidate`, `userNotAuthorized` and `candidateNoNomination` prints nothing. Verified by judgment, as the plan says |

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-172-12 reaching a protected page around the gate | mitigate | the decision is in the server load of the layout every protected page sits under, ahead of the entity read; `layout.server.test.ts` asserts the entity read is not called for a gated user, and negative control 1 shows the assertion bites. The probe's deep URL met the gate. The accepted residual (the data API is not gated) is unchanged |
| T-172-13 passing the gate by flipping client state | mitigate | the view has no flag that advances it; the unit case "keeps the gate until the load data changes" holds it, and in the probe a reload after the row was removed showed the gate again |
| T-172-14 a user with no entity sees the gate first | accept | the gated load data was observed to carry the user-level object and nothing of an entity |
| T-172-20 a stale token on accept | accept | not provoked. The failure path it relies on (`tou-save-error`, the form stays) is held by two unit cases |
| T-172-SC package installs | accept | no package was installed; `yarn.lock` and every `package.json` are unchanged |

No security-relevant surface was added beyond the plan's threat model. The gated load returns `user`, which the ungated load also returns inside `contestantUserData`; `yarn assert:no-session-in-loads` exits 0.

## Changes for the Operator's Eye

- **The seven items the plan lists for review stand as planned,** with one correction: item 3's visible consequence (the header's logout on the gate) does not occur, because the header has no logout button anywhere.
- **A signed-in user whose candidate row says "accepted" but who has no acceptance row is now asked.** That is the point of the plan, and it is what a user of an existing local database will meet on their next visit. Nothing is deployed, so no data is migrated.
- **The local database was reset once, by the gate run,** and the `default` dataset was seeded again afterwards (`yarn db:seed:default`, exit 0).
- **The stack was not stopped or restarted.** The other Supabase stack on this host, `my-redis` and the Vite server on port 5199 were not touched.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Deferred Issues

None fixed, all outside this plan. Items 1 and 2 are also in `deferred-items.md`:

1. **The header's logout button is never rendered,** in the Contestant App or the Admin App: `Banner.svelte` requires `page.data.token`, which no load returns. Whether the button should return or the dead branch should go is a product call.
2. **A click on the login page's "Log in" button (`login-show`) before hydration submits the empty login form** and gets a 400: the button sits inside the `<form>` and `Button` sets no `type`. Seen only where the project's settings hide the form behind that button, and only at script speed.
3. **Comments this plan made stale, in files plan 172-08 owns:** the docblock of `tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts` ("rendered by `(protected)/+layout.svelte` when `candidate.termsOfUseAccepted == null`"), the comment at step 5 of `contestant-journey.spec.ts` ("`terms_of_use_accepted` is null on the unregistered candidate so the protected layout shows the ToU form"), and the known-gaps row of `contestant-a11y.spec.ts` that calls the gate a modal. One more in a file 172-08 reads but does not list for editing: the comment on `terms.submit` in `tests/tests/utils/testIds.ts` says the button lives in the layout; it lives in `TermsOfUseGate.svelte`.
4. `layoutState` keeps a `'loading'` member and a template branch that nothing produces. Both were there before this plan and the plan says to keep the existing branches.
5. The double user-level read per protected load (once by the load, once inside the entity read) is as plan 03 recorded it; Phase 173 reshapes the entity read.
6. `172-VALIDATION.md` was not touched; its rows for this plan are answered in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run. No todo was filed.

## Issues Encountered

Two red results inside Task 2, both fixed before its commit: the typecheck error of deviation 1, and a `func-style` lint error in the rewritten layout test. The probe needed three attempts for reasons of its own (the default project hides the login form behind a button, and a click before hydration is deferred item 2); the product code did not change between them.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plan 172-05**

- Nothing under `apps/frontend/src/routes` calls `setTermsOfUseAccepted` or reads `termsOfUseAccepted` from the entity any more. The store's terms members, the five store tests about them, `SetPropertiesOptions`' member and `LocalizedCandidateData.termsOfUseAccepted` have no consumer left in the routes and are yours to delete.
- The layout test's ungated fixture no longer carries `termsOfUseAccepted` on the candidate.
- Compare against: gates `172-04-stage1` (nine rows at 0), E2E `172-04-stage1` (177 / 177). Frontend unit is 2171 tests in 137 files; dev-seed 997 in 67, supabase 206 in 15, app-shared 141 in 10; pgTAP 38 files, 1392 tests; svelte-check 2655 files. The census of the retired candidate column is unchanged at 43 files and 158 lines.

**Plans 172-06 and 172-07**

- The gate does not read `candidates.terms_of_use_accepted`. The probe's candidate had the column set and its user still met the gate, so dropping the column cannot change who is asked.

**Plan 172-08**

- The gate is `GATE_VIEWS.termsOfUse`, rendered by the layout when the load returns `gate: 'termsOfUse'`. It is an in-layout view, not a modal. Its Logout button carries no test id; Continue is `terms-of-use-submit`, the box `terms-checkbox`, the failure `tou-save-error` (a literal in the view and in the layout test, not in the registry).
- An identity registered with `{ acceptTermsOfUse: false }` stays on the gate at every protected URL, with no entity data loaded. The probe used exactly that against the default project.
- Stale comments to rewrite are listed under deferred item 3.

**Phase 173**

- **The swap point is `loadEntity()`.** It returns `{ userData, electionId }` or signs out through `handleError`. The load's line after it, `if (!entity) return;`, exists only because `handleError` is typed `Promise<void>`; when the step renders a view in place of signing out, that line and `handleError`'s use in the step go together.
- **The gate half is user-level only** and moves to a user-level layout as it is: `getBasicUserData()`, `firstNeededGate(user)`, the early return, and in the layout the `{#if data.gate != null}` branch with `GATE_VIEWS`. `validity`, the two `$effect`s and the error and ready branches are the entity half.
- **`LayoutData` has an arm with every member absent** wherever a load returns `void`. A load that never returns `void` loses it, and `!== null` then works.
- **`userNoCandidate` was moved only,** and no test names it.
- `gates.ts` imports only a type from `$lib/api/base/dataWriter.type`; `gateViews.ts` imports the view. Keep the server load importing the first and not the second.

**Phases 178 and 179**

- A gate ahead of terms of use is one entry before it in `CONTESTANT_GATES`, one member of `ContestantGateId` and one view in `GATE_VIEWS`; `GATE_VIEWS` does not typecheck until the view is there. A predicate receives `BasicUserData` and nothing else, so a new gate's fact goes on that type.
- `gates.test.ts` compares the ids as a whole array and fails until a new entry has its own cases.

**Host state:** the stack is up and healthy on the live allowlist; nothing listens on 5173, 5273 or 5373. The database holds migrations plus `seed.sql`, the pgTAP helper functions in `public` (left by the gate run), what the E2E run left in its own project, and the `default` dataset in the default project. `terms_of_use_acceptances` is empty.

## Self-Check: PASSED

- The five source files under `key-files.created`, the three under `key-files.modified`, `deferred-items.md` and this file exist, and `git diff --name-only 4e5adff62..0cd6eba4d` lists exactly the eight source files, which are the plan's `files_modified`.
- The two commits (`25c8e9013`, `0cd6eba4d`) are ancestors of HEAD; `git rev-list --count 4e5adff62..HEAD` was 2 when this file was written.
- `tests/e2e-runs/172/172-04-stage1/summary.json` and `tests/e2e-runs/172-gates/172-04-stage1/summary.tsv` exist; both attempts hold `done` = 0 and record head `0cd6eba4d`.
- The plan's verification items were re-run on the final tree: `vitest run gates.test layout.server.test termsOfUseLayout` (0), `172-gates.sh --judge 172-04-stage1` (0), `172-e2e.sh --judge 172-04-stage1` (0); the four entity-step codes are spelled as before and no message catalogue changed.
- Every acceptance criterion of the three tasks was checked by command; the two that do not hold as written are listed above with what was measured.
- No stub pattern is in the added lines. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
