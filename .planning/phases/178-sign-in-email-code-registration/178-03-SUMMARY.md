---
phase: 178-sign-in-email-code-registration
plan: 03
subsystem: testing
tags: [dev-seed, e2e-dataset, registration-modes, invitations, test-constants, playwright]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-01: the gate and E2E drivers, the verdict script and the baseline run tests/e2e-runs/178-e2e/178-01-baseline"
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-02: the probe findings; nothing of them changes this plan"
provides:
  - "The base E2E dataset and the perm family's shared settings state registrationModes { candidate: ['email', 'code'], organization: ['email', 'code'] }"
  - "Five reserved, unconfirmed base-dataset rows with no nomination, answer or editor: test-e2e-base-or-registration, test-e2e-base-ca-registration, test-e2e-base-ca-recovery, test-e2e-base-ca-scan-open, test-e2e-base-ca-scan-used"
  - "tests/tests/utils/invitationConstants.ts: five external-id constants, five address prefixes, RECOVERY_LINK_EMAIL_SUBJECT and the frozen INVITATION_ADDRESS_PREFIXES (seven members)"
  - "tests/tests/utils/invitationConstants.test.ts: no prefix is the beginning of another; an address built on a prefix begins with it and is lower-case"
  - "178-03-close: five gate rows at 0 and a full E2E run of 444 of 444 in 116 projects, every project's total equal to the baseline's"
affects: [178-05, 178-06, 178-12, 178-14, 178-17, 178-19, 178-21, 178-22, 178-23]

actuals:
  tokens: 7585
  tasks: 2
  commits: 2
plan_head_before: d8eee46994eb40bdf2bda2dd18a31182a61507c1
plan_head_after: 89588f80682e73341b459cb8956b5228fdd6219f

tech-stack:
  added: []
  patterns:
    - "A reserved dataset row is held to one mention in the serialised template, which covers every nomination, answer map and reference at once"
    - "Address prefixes of the invitation specs are listed in one frozen array, and the prefix-freedom of that array is a unit case"

key-files:
  created:
    - tests/tests/utils/invitationConstants.test.ts
  modified:
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/templates/e2e/perm/shared.ts
    - packages/dev-seed/tests/templates/base-app-settings.test.ts
    - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
    - packages/dev-seed/tests/templates/base.test.ts
    - tests/tests/utils/invitationConstants.ts
    - tests/README.md

key-decisions:
  - "Item J3d is unanswered by the operator and is built at its recommended option: the organization row is widened"
  - "The four reserved candidates take sort orders 18, 19, 24 and 25: the four lowest values no candidate of the dataset holds (20 to 23 are held)"
  - "base.test.ts gains a describe block for the five reserved rows, beside the changed counts and id lists, so that the dataset's own suite holds what the plan's verify counts"
  - "tests/README.md states the matrix and the reserved rows as they now are, in a commit of its own: the dataset commit made one of its sentences false"

patterns-established:
  - "A new invitation-test address prefix is added to INVITATION_ADDRESS_PREFIXES, where the unit case reads it"

requirements-completed: [REG-09, REG-10]

coverage:
  - id: D1
    description: "The base dataset and the perm family's shared settings allow organizations the email and code modes, with every pin stating the same value"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/base-app-settings.test.ts and built-in-templates-contestant-app.test.ts — yarn workspace @openvaa/dev-seed test:unit, 1076 of 1076"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-03-t1-verify.sh (Task 1's automated block, byte for byte) — exit 0 at head 99473ebcc; it reads the matrix from the two templates, not from a pin"
        status: pass
    human_judgment: false
  - id: D2
    description: "Five reserved rows, each unconfirmed and named once in the template, with their constants and one address prefix per spec or setup"
    requirement: REG-10
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/base.test.ts#baseTemplate — the five rows reserved for the registration, recovery and scan tests"
        status: pass
      - kind: unit
        ref: "tests/tests/utils/invitationConstants.test.ts — yarn test:unit:tests, 104 of 104"
        status: pass
    human_judgment: false
  - id: D3
    description: "The suite is as green on the widened dataset as on the baseline, with the same tests in the same projects"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-03-close — 444 of 444, 116 projects; node 178-verdict.mjs e2e 178-03-close --same-projects-as tests/e2e-runs/178-e2e/178-01-baseline: PASS"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-gates/178-03-close — typecheck, lint, unit, build, format all 0; bash tests/e2e-runs/178-unit/178-03-t2-verify.sh — exit 0 at head 89588f806"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 03: The Dataset Before Any Screen — the Widened Organization Row, Five Reserved Rows and One Address Prefix per Spec — Summary

**The base E2E dataset and the perm family's shared settings now allow organizations the email and code modes, five unconfirmed rows with no nomination are reserved for the registration, recovery and scan specs, each spec has an address prefix that begins no other, and the full suite reports on this dataset exactly what it reported on the baseline: 444 of 444 in 116 projects.**

## Read this first

- **Item J3d is unanswered and is built at its recommended option.** The operator has not ruled on the base dataset's organization row; it is widened. The other option stays located where the plan says: this plan's template edit is dropped and plan 178-17 gains a template, a setup and a teardown.
- **One file outside the plan's list was changed**, in a commit of its own: `tests/README.md`, whose description of the base dataset stated the matrix this plan replaced. See *Deviations*.
- **Nothing red, flaky, skipped or void anywhere.** No axe finding, no overflow: this plan changes no surface.

## Performance

- **Duration:** 24 min
- **Started:** 2026-10-12T16:33:29Z
- **Completed:** 2026-10-12T16:57:03Z
- **Tasks:** 2
- **Files modified:** 8 (seven of the plan, one more)

## Task Commits

1. **Task 1: The widened matrix, five reserved rows, their pins and the specs' constants** — `99473ebcc` (test)
2. **Deviation: the tests README states the dataset as it now is** — `89588f806` (docs)
3. **Task 2: The gate rows and one full E2E run** — no commit of its own; its evidence is under `tests/e2e-runs/` (gitignored) and in this file

## Each task's verify command, with its real exit status

| Task | Script (the plan's `<automated>` block, byte for byte) | Head | Exit |
|---|---|---|---|
| 1 | `tests/e2e-runs/178-unit/178-03-t1-verify.sh` | `99473ebcc` | **0** |
| 2 | `tests/e2e-runs/178-unit/178-03-t2-verify.sh` | `89588f806` | **0** |

Each has its `.log`, `.exit` and `.head` beside it. Task 1's verify was run before the README commit; the README is outside the two directories its `git diff --quiet` reads.

## The matrix, as it now stands

Both files state the same literal:

```
registrationModes: {
  candidate: ['email', 'code'],
  organization: ['email', 'code']
}
```

- `packages/dev-seed/src/templates/e2e/base.ts` — `BASE_APP_SETTINGS.contestantApp`, with `entityTypes: ['candidate', 'organization']`.
- `packages/dev-seed/src/templates/e2e/perm/shared.ts` — `MINIMAL_BASE_APP_SETTINGS.contestantApp`, with `entityTypes: ['candidate']`. The organizations' row decides nothing there while the type is not served.

Three perm templates declare a matrix of their own and keep it, as the plan says: `perm-organization-editing`, `perm-no-nomination` and `perm-contestant-nominations` still state `organization: []`. Their pins were not touched and are green.

## The five rows

| External id | Table | Names | `sort_order` | Reserved for |
|---|---|---|---|---|
| `test-e2e-base-or-registration` | organizations | `[or-registration] Party Registration`, short `REG`, color `{ normal: '#0f6b6b', dark: '#6bcfcf' }` | 7 | the registration tests |
| `test-e2e-base-ca-registration` | candidates | Registering / Entity Four | 18 | the registration tests |
| `test-e2e-base-ca-recovery` | candidates | Recovering / Entity Five | 19 | the password-recovery tests |
| `test-e2e-base-ca-scan-open` | candidates | Scanned / Entity Six | 24 | the signed-out scans, an open code |
| `test-e2e-base-ca-scan-used` | candidates | Scanned / Entity Seven | 25 | the signed-out scans, a used code |

Each is `confirmed: false`, belongs to no organization, and has no nomination, no answers map and no editor. Each external id appears once in `base.ts` outside comments (the verify's count) and once in the serialised template (a unit case). No existing row was changed: the diff of `base.ts` removes four lines — two of the header's inventory, the comment above the settings root and the organizations' member of the matrix.

**The sort orders 24 and 25** are the plan's "next free": candidates hold 0 to 17, 20 to 23, 30 to 34, 40 to 43, 50 and 51, so after 18 and 19 the next two free values are 24 and 25. The rows are unconfirmed and unnominated, so no list a voter sees orders them.

## Every pin changed, before and after

| File | What | Before | After |
|---|---|---|---|
| `base-app-settings.test.ts` | the literal of the whole `contestantApp` root | `organization: []` | `organization: ['email', 'code']` |
| `base-app-settings.test.ts` | the expectation on the organization's member, and its test title | `toEqual([])`; "serves organizations without a registration mode for them, and differs from the minimal perm base on purpose" | `toEqual(['email', 'code'])`; "serves organizations with the email and code modes candidates have, and differs from the minimal perm base in the served types on purpose" |
| `built-in-templates-contestant-app.test.ts` | `SERVED_BY_FAMILY['e2e/base']` | `organization: []`; title "… for candidates and none for organizations" | `organization: ['email', 'code']`; title "serves both entity types, with email and code registration for both" |
| `built-in-templates-contestant-app.test.ts` | `SERVED_BY_FAMILY.perm` (the minimal family, 29 templates) | `organization: []`; title "serves candidates only, with email and code registration for candidates and none for organizations" | `organization: ['email', 'code']`; title "serves candidates only, and states email and code registration for both entity types" |
| `built-in-templates-contestant-app.test.ts` | the `perm-hide-hero` literal | `organization: []` | `organization: ['email', 'code']` |
| `base.test.ts` | organizations count and title | `5 + 1 + 1` | `5 + 1 + 1 + 1` |
| `base.test.ts` | candidates count and title | `30 + 2 + 1` | `30 + 2 + 1 + 4` |
| `base.test.ts` | nominations title (the count, `61 + 3`, is unchanged) | "none for the 2 invitation rows" | "none for the 2 invitation rows or for the 5 rows reserved for the registration, recovery and scan tests" |
| `base.test.ts` | `REQUIRED_EXTERNAL_IDS` | 7 organizations named in its comment; no reserved row | 8; the five reserved ids added |
| `base.test.ts` | candidates that state `confirmed`, and the title | five ids | nine ids: the four reserved candidates added |
| `base.test.ts` | organizations that state `confirmed`, and the title | two ids | three: `test-e2e-base-or-registration` added |

Unchanged on purpose: the literals of `perm-organization-editing`, `perm-no-nomination` and `perm-contestant-nominations`, and of the `default` family.

**Added to `base.test.ts`**, a describe block "the five rows reserved for the registration, recovery and scan tests", 21 cases: each row unconfirmed (5), named once in the whole template (5), answering nothing (5), each candidate with both names and no organization (4), each reserved candidate's full name carried by no other candidate (1), the organization's name and short name carried by no other organization (1). The dev-seed suite holds 1076 cases with them (1055 before, by subtraction; the earlier total was not measured in this plan).

**No further dataset count was reported by the dev-seed suite.** After the template change every one of its 69 files was green; no pin outside the three named files moved.

## Red before green

Kept under `tests/e2e-runs/178-unit/` as `178-03-t1-red-{devseed,harness}.{log,exit}` with `178-03-t1-red.head` (`d8eee4699`), made with the pins and the new unit file written and the templates and constants untouched:

- dev-seed: exit 1, 63 failed of 1076, in the three pin files and nowhere else; every failure an `AssertionError`.
- harness: exit 1, 2 failed of 104, both in the new file. The first is an expectation (`expected false to be true`, the list is not a frozen array). **The second is a `TypeError` on the missing export**, which is what the plan asks to see ("seen failing on the missing export") and is not an expectation failure.

Green: `178-03-t1-green-{devseed,harness}.{log,exit}` — 1076 of 1076 and 104 of 104.

## The constants

`tests/tests/utils/invitationConstants.ts` now exports, each with TSDoc:

- `REGISTRATION_CANDIDATE_EXTERNAL_ID`, `REGISTRATION_ORGANIZATION_EXTERNAL_ID`, `RECOVERY_CANDIDATE_EXTERNAL_ID`, `ENTRY_SCAN_OPEN_CODE_CANDIDATE_EXTERNAL_ID`, `ENTRY_SCAN_USED_CODE_CANDIDATE_EXTERNAL_ID`
- `EMAIL_REGISTRATION_ADDRESS_PREFIX` (`email-registration-`), `CODE_REGISTRATION_ADDRESS_PREFIX` (`code-registration-`), `PASSWORD_RECOVERY_ADDRESS_PREFIX` (`password-recovery-`), `ENTRY_SCAN_ADDRESS_PREFIX` (`entry-scan-`), `PASSWORDLESS_SESSION_ADDRESS_PREFIX` (`passwordless-session-`)
- `RECOVERY_LINK_EMAIL_SUBJECT` (`Reset your password for the voting advice application`)
- `INVITATION_ADDRESS_PREFIXES`: a frozen `ReadonlyArray<string>` of seven — the five above and the two the file already had, `INVITATION_TEST_ADDRESS_PREFIX` and `INVITATION_LANDING_ADDRESS_PREFIX`.

`invitationConstants.test.ts` has two cases, as the plan pins: the list is frozen and no member is the beginning of another; an address built on each member begins with it and is lower-case.

## The gate rows — `tests/e2e-runs/178-gates/178-03-close`, head `89588f806`

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 23 |
| lint | 0 | 53 |
| unit | 0 | 84 |
| build | 0 | 18 |
| format | 0 | 22 |

`node 178-verdict.mjs gates 178-03-close --rows typecheck,lint,unit,build,format`: **PASS** — five expected, five recorded, not stale, no Sleep entry in the window. These are the first five rows of the fourteen copied from Phase 177 to be run through the new driver.

## The full run — `tests/e2e-runs/178-e2e/178-03-close`, head `89588f806`

- total 444, passed 444, failed 0, flaky 0, skipped 0, did not run 0; 116 projects
- wrapper status 0; no void marker; one preflight success, no failure; no Sleep, Wake or DarkWake entry in the window
- started 2026-10-12T16:44:14Z, ended 2026-10-12T16:56:43Z (12 min 29 s)
- Docker VM free space before it: **15.89 GiB** (the driver's reading after its own builder prune; the guard is 13.8)
- `node 178-verdict.mjs e2e 178-03-close --same-projects-as tests/e2e-runs/178-e2e/178-01-baseline`: **PASS** — **116 projects compared, 0 not as expected**; every project's total equals the baseline's
- the standing `TypeError … (reading 'map')` of `Input.svelte` is in the dev-server log once, as in every full run; it is not this plan's

## Decisions Made

- **J3d at its recommended option**, unanswered by the operator. Recorded, not chosen.
- **Sort orders 18, 19, 24, 25** for the four candidates, the literal reading of "the next free".
- **One commit for the seven files**, as Task 1's step 6 lays out, with the red state kept as logs and not as a commit: the plan's verify requires the two directories committed and names one subject.
- **A describe block for the reserved rows in `base.test.ts`.** The plan names the counts, titles and id lists; the block is the dataset's own statement of prohibition PROH-178-08 and of the threat register's T-178-13, in a file the plan lists.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] `tests/README.md` described the matrix this plan replaced**
- **Found during:** Task 1, searching for every statement of the old matrix
- **Issue:** the README's description of the `e2e/base` dataset said `registrationModes: { candidate: ['email', 'code'], organization: [] }` and gave "no mode is declared for organizations" as a reason. The dataset commit made both false. The file is not in the plan's `files_modified`, and no later plan of the phase names that paragraph.
- **Fix:** the literal and the reason now state the dataset as it is, and one bullet names the five reserved rows and where their constants and prefixes live. Two lines changed, one added.
- **Files modified:** `tests/README.md`
- **Verification:** `prettier --check` 0, `yarn assert:comment-hygiene` 0; the `format` and `lint` gate rows ran on the head that holds it
- **Committed in:** `89588f806`, a commit of its own, so that the task commit holds exactly the plan's seven files

**2. [Rule 1 - Bug] `base.test.ts` as first written failed the formatter**
- **Found during:** Task 1, before the commit
- **Issue:** a three-member array I had written over five lines; `prettier --check` named the file
- **Fix:** `prettier --write` on that file; one statement rejoined to one line
- **Committed in:** `99473ebcc`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug). **Impact:** one file beyond the plan's list, documentation only; nothing else.

### Other departures, none of them a fix

- **The code-review checklist was not walked**: the plan adds no application code — a seed template, test pins and test constants.
- **The second red case is not an expectation failure** (above). The plan asks for exactly that failure; the dispatch rules' general sentence on red reports would not count it.

## Issues Encountered

None.

## Observed, and inferred

- **Observed:** both unit suites red and then green; the two verify scripts at 0; the five gate rows; the full run and its comparison with the baseline; that the three perm templates with a matrix of their own are unmoved by the change to the shared settings (their pins are green); that the host slept at no point in either window.
- **Inferred, not observed:** that an invitation seeded for a reserved row makes nothing public. No invitation was seeded for one in this plan; the statement rests on the absence of a nomination, which the unit cases hold.
- **Inferred, not observed:** that the widening is neutral for a browser beyond what the suite asserts. The suite is the evidence the plan names, and it is unchanged.

## Not done, or not verified

- Nothing of the plan is undone.
- The database rows of the gate set (`db-reset` to `integration`) and the `stack` row were not run; the plan names five rows.
- `RECOVERY_LINK_EMAIL_SUBJECT` names a mail no function sends yet. Nothing reads the constant; plan 178-06 writes the template it must equal.

## The state the local stack is left in

Up, not restarted and not reset by this plan. The database is as the full run `178-03-close` left it: the E2E project's rows as the run's teardowns left them, and whatever `private.invitation_link_witness` rows the run wrote, so pgTAP test 238 of `39-invitations.test.sql` is red on it until the next reset — the known finding. Nothing listens on the E2E port; no `started` without an `ended` is under `tests/e2e-runs/`. Docker VM free space after the run: about 15.7 GiB.

## For later plans

- **Predecessor label for 178-05:** `178-03-close` — 444 tests, 116 projects, head `89588f806`.
- **178-05 — three perm datasets still state `organization: []` while serving organizations**: `perm-organization-editing`, `perm-no-nomination`, `perm-contestant-nominations`. Once the server enforces the matrix, an open organization invitation in those projects reads as absent. I listed the callers of the seeding steps and of `inviteByEmail` — `invitationFlow.fixture.ts`, `invitation-contract.spec.ts`, `invitation-landing.spec.ts`, `contestant-journey.spec.ts` and `perm-localisation-positive.spec.ts` — and did not read which entity type each invites or how those three datasets' editors are registered. Check before the condition lands.
- **178-05, 178-06 — the perm family's shared matrix now names organizations** though the family serves candidates only. Under the rule of `getEffectiveRegistrationModes` an unserved type's row is not honoured; a pgTAP or parity case that reads "a row for an unserved type" has a live example in every minimal perm dataset.
- **178-12 and every spec plan — the fixture's `DEDICATED_ROWS` still maps `candidate` and `organization` to the two invitation rows.** The five new constants are read by nothing yet; the steps that seed for a reserved row need a way to name it.
- **Any plan that adds an address prefix** adds it to `INVITATION_ADDRESS_PREFIXES`; the unit case reads the list, not the individual exports.
- **`password-recovery-` and `passwordless-session-`** differ at the ninth character; neither begins the other. A cleanup that matched on `password` alone would take both.
- **178-23 (docs):** `tests/README.md` § the `e2e/base` dataset already states the widened matrix and the five rows.
- **A full run took 12 min 29 s; the five gate rows 3 min 20 s.**
- **Power:** 72 % at dispatch, 68 % before the gate rows, 65 % before the full run. The host was put on AC power during the full run and read 66 % and charging at the end, so this run measured no battery cost.

## Prohibitions

| Id | Statement | Held | How |
|---|---|---|---|
| PROH-178-08 | no reserved row is given a nomination, an answer, an editor or a confirmed state, and no existing row is changed | yes | each id is named once in the template (verify and unit case); the diff of `base.ts` removes no line of any row |
| PROH-178-09 | the widened row is not applied by editing a pin until the test passes | yes | the two templates and each pin were changed to one stated value; the verify reads the templates themselves and compares the two; no pin states anything else |

## Threat Flags

None. The change adds no endpoint, no auth path and no schema; the settings value it widens is not yet read by the server.

## Known Stubs

None.

## Next Phase Readiness

Ready for plan 178-04. The dataset the registration specs will run on exists, its pins say what it holds, and the committed suite is green on it.

## Self-Check: PASSED

- The eight changed files and the run records (`178-gates/178-03-close/summary.tsv`, `178-e2e/178-03-close/summary.json`, the two verify `.exit` files) exist.
- Commits `99473ebcc` and `89588f806` are ancestors of HEAD; `git rev-list --count d8eee4699..HEAD` was 2 when this file was written.
- `git status --short` showed only the operator's untracked `CAND-APP-PLAN.md`.

---
*Phase: 178-sign-in-email-code-registration*
*Completed: 2026-10-12*
