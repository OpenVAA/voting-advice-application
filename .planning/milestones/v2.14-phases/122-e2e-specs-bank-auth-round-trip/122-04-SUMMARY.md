---
phase: 122-e2e-specs-bank-auth-round-trip
plan: 04
subsystem: testing
tags: [playwright, bank-auth, idura, page-object, fixtures, setup-teardown, preregister]

# Dependency graph
requires:
  - phase: 122-01
    provides: testIds.candidate.preregister block (10 keys) driven by the page-object
  - phase: 122-03
    provides: bank-auth-journey Playwright project + data-setup/teardown project entries (testMatch globs) these files satisfy
provides:
  - candidate-preregister page-object (createCandidatePreregisterPage) — elections → constituencies → email/ToU walk via testIds
  - bank-auth-journey fixture composition root (candidate-bank-auth-journey.ts) — { test, expect } extended with page-object + emailBucket + candidatePasswordSetter
  - bank-auth-journey.setup.ts — perm-not-located-2e2cg template reuse (D-04) + idempotent auth pre-clean
  - bank-auth-journey.teardown.ts — e2e-perm-notloc- prefix wipe + created-auth-user cascade delete
  - BANK_AUTH_JOURNEY_EMAIL constant (single source of truth across comp-root + setup + teardown)
affects: [122-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "createCandidate<Thing>Page page-object convention + ReturnType Fixture-type export (mirrors candidatePasswordSetter.fixture.ts)"
    - "Dual-shape constituency selection: native <select> (selectOption index 1) vs autocomplete combobox (click input → click first role=option), disambiguated by tag name via locator.evaluate — no raw .locator() (lint-clean)"
    - "Minimal opt-in composition root (base.extend) wiring only journey-needed fixtures + recipientEmail option fixture through emailBucket"
    - "Opt-in-isolated setup/teardown (NOT in the perm serial chain) reusing an EXISTING perm template (D-04) rather than authoring a new data-setup pair"
    - "Idempotent identity pre-clean + cascade teardown via unregisterCandidate (find-by-email → clear candidate FK + ToU, delete user_roles, delete auth.users)"

key-files:
  created:
    - tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts
    - tests/tests/fixtures/candidate/candidate-bank-auth-journey.ts
    - tests/tests/setup/candidate/bank-auth-journey.setup.ts
    - tests/tests/setup/candidate/bank-auth-journey.teardown.ts
    - tests/tests/utils/bankAuthJourneyConstants.ts
  modified: []

key-decisions:
  - "D-04 / A1 CONFIRMED at build: perm-not-located-2e2cg template seeds 2 elections × 2 disjoint constituency groups × 2 constituencies each (template doc-block + fixed[] inspection) → forces BOTH the candidate-preregister election selector AND the constituency selector to render. No fallback to perm-2e-asymmetric needed."
  - "Constituency selector renders via the shared Select component in TWO shapes (native <select> when autocomplete off; role=combobox input + role=option listbox when on); submitConstituency handles both by tag-name disambiguation so the page-object is robust to either rendering."
  - "Teardown deletes the created auth user via unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL) (find-by-email cascade) rather than by user_id — the journey identity is keyed by the recipient email at invite time; idempotent across partial runs."
  - "Extracted BANK_AUTH_JOURNEY_EMAIL to a constants module so the comp-root recipientEmail default, the setup pre-clean target, and the teardown delete target stay in lockstep (single source of truth)."

requirements-completed: [EFLOW-10]

# Metrics
duration: ~9min
completed: 2026-06-17
---

# Phase 122 Plan 04: Bank-Auth Journey Support Layer Summary

**Built the EFLOW-10b journey-support layer: a testId-driven candidate-preregister page-object (elections → constituencies → email/ToU walk handling both the native-`<select>` and autocomplete-combobox constituency shapes), a minimal `bank-auth-journey` fixture composition root wiring the page-object + `emailBucket` + `candidatePasswordSetter`, and an opt-in-isolated setup/teardown pair that reuses the existing `perm-not-located-2e2cg` template (D-04 — the only shape forcing both selectors to render, confirmed at build) and owns the journey's created-auth-user cleanup. Combined with 122-03's mock issuer + project wiring, this fully unblocks 122-05.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-17T11:35Z (approx)
- **Completed:** 2026-06-17
- **Tasks:** 3
- **Files modified:** 5 (5 created, 0 modified)

## Accomplishments

- **Task 1 — candidate-preregister page-object.** `createCandidatePreregisterPage(page)` exporting
  `{ clickStart, submitElection, submitConstituency, fillEmailAndAcceptToU }` +
  `CandidatePreregisterPageFixture = ReturnType<...>`, mirroring the `candidatePasswordSetter.fixture.ts`
  convention. Read the actual page sources (`elections`/`constituencies`/`email/+page.svelte` +
  `ElectionSelector.svelte` + `ConstituencySelector.svelte` + the shared `Select.svelte`) to pin the
  selection mechanism rather than assume: the election list renders `election-selector-option`
  checkboxes (single-election auto-select guard via `isDisabled`), and the constituency list renders
  one `Select` per section in EITHER a native `<select>` (autocomplete off → `selectOption({index:1})`,
  skipping the disabled placeholder) OR a `role="combobox"` input + `role="option"` listbox
  (autocomplete on → click input, click first option), disambiguated by `locator.evaluate(tagName)`.
  All selectors are testId/role-based; rigidity contract honored.
- **Task 2 — fixture composition root.** `candidate-bank-auth-journey.ts` extends Playwright `test`
  with exactly the 3 fixtures the journey spec needs (`candidatePreregisterPage`, `emailBucket`,
  `candidatePasswordSetter`) + a `recipientEmail` option fixture threaded through `emailBucket`
  (default `BANK_AUTH_JOURNEY_EMAIL`), exports `{ test, expect }`. Minimal by design (no copy of
  `candidate-journey.ts`'s 11-fixture surface).
- **Task 3 — setup + teardown (D-04 reuse).** `bank-auth-journey.setup.ts` calls
  `setupFromTemplate('perm-not-located-2e2cg', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })`
  (reusing the TEMPLATE, not the perm chain) AND idempotently pre-cleans the journey identity via
  `new SupabaseAdminClient().unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL)`.
  `bank-auth-journey.teardown.ts` mirrors `perm-not-located-2e2cg.teardown.ts`
  (`PREFIX='e2e-perm-notloc-'` + `runTeardown` + `toBeGreaterThanOrEqual(0)` guard) AND additionally
  deletes the created auth user (`auth.users` + `candidates` + `user_roles` cascade) via
  `unregisterCandidate`. Both idempotent. Verified the config's `testMatch` globs
  (`/bank-auth-journey\.setup\.ts/`, `/bank-auth-journey\.teardown\.ts/`) from 122-03 match the new
  filenames exactly.

## Task Commits

1. **Task 1: candidate-preregister page-object** — `ec9c2aa0a` (feat)
2. **Task 2: bank-auth-journey composition root** — `bb9f0ba38` (feat)
3. **Task 3: setup + teardown + constants (D-04 reuse)** — `3cc49b427` (feat)

## Files Created/Modified

- `tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts` (created) — page-object; 4 step methods via `testIds.candidate.preregister`; dual-shape constituency selection.
- `tests/tests/fixtures/candidate/candidate-bank-auth-journey.ts` (created) — minimal composition root; `{ test, expect }`.
- `tests/tests/setup/candidate/bank-auth-journey.setup.ts` (created) — perm-not-located-2e2cg seed + auth pre-clean.
- `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` (created) — prefix wipe + created-auth-user cascade delete.
- `tests/tests/utils/bankAuthJourneyConstants.ts` (created) — `BANK_AUTH_JOURNEY_EMAIL` single source of truth.

## Decisions Made

- **D-04 / A1 confirmed at build, no fallback.** Inspected `packages/dev-seed/src/templates/e2e/perm/perm-not-located-2e2cg.ts`: its doc-block declares "2 elections with 2 disjoint CGs × 2 COs each … forces both selector pages to render", and the `elections.fixed[]` array confirms 2 elections (`el-1`/`el-2`) with disjoint `constituency_groups`. The candidate-preregister selectors consume the same `dataRoot.elections` / `preregistrationElections` as the voter path, so they render the same multi-option surface. The `perm-2e-asymmetric` fallback was not needed.
- **Dual-shape constituency selection.** The shared `Select` component renders a native `<select>` (single-option role=combobox) OR an autocomplete combobox depending on `autocomplete`/`singleConstituency`. The page-object handles both by tag-name disambiguation, so it does not break if the seed produces single- vs multi-constituency groups.
- **Cascade teardown by email.** Used `unregisterCandidate(email)` (find-by-email → clear candidate FK + ToU + delete user_roles + delete auth.users) for the created-auth-user cleanup, matching the `candidate-journey.teardown.ts` precedent and remaining idempotent across partial runs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rigidity-contract doc-block reworded to satisfy the plan's own negative grep**
- **Found during:** Task 1 (verify).
- **Issue:** The plan's `<verify>` runs `! grep -q "expect.soft\|\.catch(() => null)\|\.catch(()=>null)"`. The canonical rigidity-contract doc-block (copied verbatim from `candidatePasswordSetter.fixture.ts`) literally contains the strings `expect.soft` and `.catch(() => null)` as prose, which would FALSE-trip the negative grep even though there is no such USAGE.
- **Fix:** Reworded the doc-block to state the same contract without the forbidden literals ("no soft assertions, no try/catch wrapping assertions, no swallowed-rejection fallbacks…"). The contract is fully honored in the code (zero soft assertions, zero try/catch around assertions, zero swallowed rejections).
- **Files modified:** `candidatePreregisterPage.fixture.ts` (+ same wording in the composition root).
- **Committed in:** `ec9c2aa0a`, `bb9f0ba38`.

**2. [Rule 3 - Blocking] Replaced raw `.locator()` calls flagged by `playwright/no-raw-locators`**
- **Found during:** Task 1 (eslint).
- **Issue:** The first draft used `section.locator('select')` and `list.locator('[data-testid="constituency-selector"] > div')` to find the constituency widgets — both forbidden by the repo's `playwright/no-raw-locators` + `no-restricted-locators` rules.
- **Fix:** Reworked `submitConstituency` to iterate `list.getByRole('combobox')` (the role both the native `<select>` and the autocomplete input expose) and disambiguate the interaction by tag name via `combobox.evaluate(el => el.tagName.toLowerCase())`. No raw locators remain; lint-clean.
- **Files modified:** `candidatePreregisterPage.fixture.ts`.
- **Committed in:** `ec9c2aa0a`.

**3. [Lint] simple-import-sort autofix on the composition root**
- The composition root tripped `simple-import-sort/imports` twice (initial draft + after adding the
  `BANK_AUTH_JOURNEY_EMAIL` import). Resolved via `eslint --fix`; no behavior change. Folded into the
  Task 2 / Task 3 commits.

**4. [Rule 3 - Blocking] Typecheck/lint target adaptation (inherited from 122-01/02/03)**
- The `tests/` dir has no `@openvaa/tests` workspace; typechecked via `npx tsc --noEmit -p tests/tsconfig.json`
  and linted via `npx eslint <file>` per the established pattern. Both exit 0 after every task.

**Total deviations:** 4 (3 Rule-3 blocking, 1 lint). No source-behavior scope creep — the 5 artifacts are exactly as specified plus the `BANK_AUTH_JOURNEY_EMAIL` constant (a single-source-of-truth extraction the plan's setup/teardown both reference).

## Verify-not-fully-green note (NOT a blocker for this plan)

Per-task verifies here are typecheck/structural/grep only — the full browser journey (`yarn test:e2e`
3× cardinal gate) is plan 122-05's deliverable, not this plan's. The new `bank-auth-journey` project
matches 0 spec files until 122-05 lands `candidate-bank-auth-journey.spec.ts` (Playwright does not
error on an empty project). All five files typecheck clean (`tsc -p tests/tsconfig.json` exit 0) and
lint clean (`eslint` exit 0).

## Threat Flags

None new. T-122-10 (app_settings clobber) is mitigated by the opt-in-isolated setup (NOT in the perm
serial chain). T-122-11 (created auth.users/candidates/user_roles disclosure) is mitigated by the
teardown's `unregisterCandidate` cascade + prefix wipe, idempotent across re-runs. T-122-SC — no
package installs (built from existing fixtures + `@openvaa/dev-seed` + `@playwright/test`).

## Next Phase Readiness

- **122-05** (EFLOW-10b journey spec): import `{ test, expect }` from
  `candidate-bank-auth-journey.ts`, `test.use({ recipientEmail: BANK_AUTH_JOURNEY_EMAIL })`, drive
  `candidatePreregisterPage` + `emailBucket` + `candidatePasswordSetter`. The `bank-auth-journey`
  project + mock issuer webServer (122-03) + setup/teardown (this plan) are all wired. Run the 3×
  cardinal gate then.
- No blockers.

## Self-Check: PASSED

- Files: FOUND all 5 (`candidatePreregisterPage.fixture.ts`, `candidate-bank-auth-journey.ts`, `bank-auth-journey.setup.ts`, `bank-auth-journey.teardown.ts`, `bankAuthJourneyConstants.ts`) + this SUMMARY.
- Commits: FOUND `ec9c2aa0a` (feat), `bb9f0ba38` (feat), `3cc49b427` (feat).
- Verifies: `PAGEOBJECT_OK`, `COMPROOT_OK`, `SETUP_TEARDOWN_OK`; `tsc -p tests/tsconfig.json` exit 0; `eslint` exit 0 on all 5 files. Config `testMatch` globs from 122-03 confirmed matching the new setup/teardown filenames.

---
*Phase: 122-e2e-specs-bank-auth-round-trip*
*Completed: 2026-06-17*
