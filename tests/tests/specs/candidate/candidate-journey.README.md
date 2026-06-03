# Candidate journey — Phase 89 Plan 03

> The candidate-app mirror of `voter-journey.spec.ts`. Walks the
> complete candidate flow per TEST-INVENTORY-REFACTOR-4.md:101-257 in a
> single long serial test composed of 22 named `test.step` segments.

## Sibling-not-replacement contract

This spec ships ALONGSIDE the existing legacy candidate-app specs
(`candidate-auth.spec.ts`, `candidate-password.spec.ts`,
`candidate-registration.spec.ts`, `candidate-questions.spec.ts`,
`candidate-required-info.spec.ts`). The legacy specs are NOT deleted
or modified in Plan 89-03 — they continue to run under their existing
playwright project entries. Plan 89-LAST will retire the legacy specs
once their coverage is fully absorbed here.

This is the parallel-landing pattern established by Phase 88 Plan 04
(voter-journey shipped sibling-to-legacy-specs) and continued
through Plan 89-02 (candidate fixture library shipped sibling-to-legacy
PageObject classes). See `tests/tests/fixtures/candidate/candidate-journey.ts`
file-level docstring for the fixture-side parallel-landing contract.

## Authoritative design source

[`TEST-INVENTORY-REFACTOR-4.md`](../../../../TEST-INVENTORY-REFACTOR-4.md)
lines 101-257.

## Structure

- ONE `test.describe('candidate journey', ...)` block configured
  `mode: 'serial'`.
- ONE long `test('full candidate journey end-to-end', ...)` body.
- 22 named `test.step('<NN. title>', ...)` segments mirroring TIR4:101-257.
- File-scope `test.use({ storageState: { cookies: [], origins: [] } })`
  starts every run UNAUTHENTICATED (R13 binding +
  `candidate-registration.spec.ts:22` precedent).
- Fixture imports come from
  `tests/tests/fixtures/candidate/candidate-journey.ts` (the Plan 89-02
  composition root).

## 22-step outline

| #   | test.step name                                                                              | Source (TIR4)     |
| --- | ------------------------------------------------------------------------------------------- | ----------------- |
| 1   | static: /candidate/help reachable while unauthenticated                                     | 108               |
| 2   | static: /candidate/privacy reachable while unauthenticated                                  | 109               |
| 3   | registration: send invite email + extract link                                              | 111-114           |
| 4   | registration: navigate to callback + set initial password                                   | 116-118           |
| 5   | ToU: accept and advance                                                                     | 119-121           |
| 6   | home: three tasks with profile-active                                                       | 122               |
| 7   | logout: mid-flow with TimedModal dialog + re-attempted nav redirects to login               | 123-131           |
| 8   | forgot-password: send reset email + follow link + set PASSWORD_2                            | 132-141           |
| 9   | login: submit-disabled empty + wrong password + correct password                            | 142-153           |
| 10  | static: navigate to /candidate/help + return to home via button                             | 154-158           |
| 11  | home: three tasks profile-active (unchanged after re-login)                                 | 160-164           |
| 12  | profile: static info + filtered questions partition + required badge                        | 166-172           |
| 13  | profile: portrait error paths + valid upload + fill info (except required + first) + submit | 173-182           |
| 14  | profile: revisit + fill required + submit → questions overview                              | 183-188           |
| 15  | questions overview: intro + clickStart → first opinion question                             | 189-194           |
| 16  | first opinion question: hero emoji + continue-disabled + select + enabled + info + continue | 196-205           |
| 17  | overview: continue prompt + Q1 round-trip + Q2 answer button + category-expander toggle     | 206-214           |
| 18  | edit Q1: change choice + change info + clickContinue → overview shows updates               | 216-225           |
| 19  | walk remaining opinion questions → home shows completed + preview enabled                   | 227-237           |
| 20  | overview: completion message + no continue prompt                                           | 239-243           |
| 21  | preview: info + portrait + opinion answers + NO voter-comparison                            | 245-251           |
| 22  | final logout WITHOUT dialog → /candidate/login                                              | 253-256           |

## Rigidity contract

Per TIR4:8-12 + Phase 88 Plan 04 SCOPE acceptance #6:

- 0 `expect.soft` calls.
- 0 `try/catch` wrapping `expect(...)`.
- 0 `.catch(() => null)` on assertion-bearing locator interactions.

All assertions are strict — discrepancies between the seeded base data
and the rendered UI surface as hard test failures.

## Unregistered candidate data dependencies

The spec walks the registration flow for the
`test-ca-aa-unregistered` candidate row added to base in Plan 89-01:

- **External ID:** `test-ca-aa-unregistered`
- **Email:** `unregistered-aa@test.openvaa.local` (per Wave 0 R8 verdict
  the candidates table has no email column, so the email string lives in
  `tests/tests/utils/candidateJourneyConstants.ts` and is supplied to
  `sendEmail({ email })` at the call site).
- **Constituency:** `test-co-reg-n` (Region North in EL-Reg).
- **Organization:** `test-or-aa`.
- **No `terms_of_use_accepted`** — forces the ToU acceptance step
  post-registration.
- **No `answersByExternalId`** — fresh candidate with zero answers; the
  journey is the only way to land any answers for this row.
- **Paired nomination:** `test-nom-reg-n-ca-aa-unregistered` with
  `election_symbol: '999'` (sentinel for the unregistered candidate).

The candidate's location (CO-Reg-N in EL-Reg) determines the profile
filtering surface: the north-only filtered info question
(`test-qu-info-filt-co-reg-n`) is visible; the mun-only and south-only
filtered info questions (`test-qu-info-filt-mun-only`,
`test-qu-info-filt-co-reg-s`) are absent — this is the step-12 partition
assertion contract.

## Logout dialog discrimination (R11 + TIR4:124-126 + 253-256)

The `candidateLogoutButton.clickWithDialog()` / `clickWithoutDialog()`
methods exercise the two LogoutButton modes:

- **Step 7 (mid-flow):** clickWithDialog. Profile is incomplete → the
  TimedModal confirmation dialog opens. The spec asserts the modal is
  visible, clicks the in-modal Logout button, then asserts the URL
  changes to `/candidate/login`.
- **Step 22 (post-completion):** clickWithoutDialog. All required
  answers are complete → LogoutButton dispatches straight to logout.
  The spec asserts NO `role="dialog"` is opened, then asserts the URL
  changes to `/candidate/login`.

The two SEPARATE fixture methods (NOT a boolean parameter) keep the
rigidity contract clean — the spec call-site says exactly which mode
is being tested.

## Playwright project chain

Runs under the `data-setup-candidate-journey → candidate-journey →
data-teardown-candidate-journey` triple appended to
`tests/playwright.config.ts`:

```text
voter-journey
  → data-setup-candidate-journey
    → candidate-journey
  ↦ data-teardown-candidate-journey  (via teardown: key)
```

Sequenced AFTER `voter-journey` via
`dependencies: ['voter-journey']` per R3 binding — both chains share
the `'test-'` external_id prefix; running them in parallel would race on
`runTeardown('test-', ...)`.

The `candidate-journey` spec project sets
`use: { storageState: { cookies: [], origins: [] } }` to start
UNAUTHENTICATED — required for the registration-via-email flow (per R13
+ `candidate-registration.spec.ts:22` precedent).

## Running

```bash
# Cold-start full chain:
yarn db:reset && cd tests && npx playwright test --project=candidate-journey --reporter=list

# Iterating mid-development (skip the db reset between runs):
cd tests && npx playwright test --project=candidate-journey --reporter=list
```
