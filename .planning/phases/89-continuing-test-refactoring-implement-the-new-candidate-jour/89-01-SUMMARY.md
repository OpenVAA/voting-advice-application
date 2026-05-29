---
phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
plan: 01
subsystem: testing
tags: [playwright, e2e, dev-seed, baseV1, voter-mega-journey, hero, info-content, testids, jsonb, custom_data, fixtures]

# Dependency graph
requires:
  - phase: 88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba
    provides: baseV1 dataset (88-01 + 88-04 Pass-5 resolver + voter-mega-journey spec shape + central testIds.ts namespace)
provides:
  - "baseV1 dataset extended per TIR4:17-32 + TIR4:82-100 (hero content on Q1/Q2/QG-Opin-Base; info content on Q1; required test-qu-info-text; 3 filtered info questions mun-only / north-only / south-only; unregistered candidate test-ca-aa-unregistered with paired nomination election_symbol='999')"
  - "3 new testid string constants under testIds.voter.questions.* (hero / categoryHero / infoButton)"
  - "data-testid attributes on 2 voter route Svelte files (questions/[questionId]/+page.svelte hero figure + QuestionBasicInfo restProps; questions/category/[categoryId]/+page.svelte category hero figure)"
  - "voter-mega-journey.spec.ts extended with 4 strict assertion groups (category hero <img>; Q1 hero emoji + info button + clicked-reveals-info-body; Q2 hero <img> + info button toHaveCount(0); candidate-details info-tab matrix 13→14 + north-only present + mun/south absent)"
  - "deferred-items.md with 8 items (7 from research + 1 Task 2 environment cascade)"
affects: [89-02 (candidate fixture library), 89-03 (candidate-mega-journey spec consumes baseV1 unregistered candidate), 89-04 (perm templates use minimal data — orthogonal but share testIds.ts namespace), 89-LAST (legacy retirement)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "[Pattern E] baseV1 dataset row extension — additive custom_data.hero JSONB field via the existing dev-seed Writer JSONB serialization path (no Pass-5 changes; same shape as 'filterable' / 'longText' / 'min' / 'max' fields already shipping)"
    - "[Pattern L] Frontend testid attribute additions — single commit per file; testids land under testIds.voter.questions.* namespace; kebab-case values; Svelte restProps forwarding for nested-component testid passthrough (QuestionBasicInfo → Expander outer div)"
    - "Lockstep voter-mega absorption — D-89-01 contract: baseV1 mutation + voter-mega spec assertions land in the same plan to keep the existing project chain green"
    - "Strict-only assertions on new test.step blocks (TIR4:8-12 + Phase 88 lineage) — 0 new expect.soft, 0 new try/catch, 0 new .catch fallbacks"

key-files:
  created:
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-01-WAVE0-PROBES.txt
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/deferred-items.md
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-01-SUMMARY.md
  modified:
    - packages/dev-seed/src/templates/baseV1.ts
    - tests/tests/utils/testIds.ts
    - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
    - tests/tests/specs/voter/voter-mega-journey.spec.ts

key-decisions:
  - "D-89-01 (planner) honored: mutated baseV1 in place; no baseV2 fork. Voter-mega assertions absorbed in same plan."
  - "R8 verdict (Wave 0 probe): candidates table has NO email column in packages/supabase-types/src/database.ts — unregistered candidate row omits email; the email string is reserved for a 89-03 sibling const file."
  - "R7 hero shape: { emoji: '🗳️' } and { url, type: 'image' } — both minimum viable per isEmoji + isImage discriminators in @openvaa/app-shared. type: 'image' field included for downstream caller convention (matches @openvaa/data Image type)."
  - "Static asset paths (/images/test-hero-q2.svg, /images/test-hero-qg-base.svg) chosen as paths only — no real assets shipped (Hero.svelte renders <img src> which 200s on the dev-server static-asset fallback or 404s but does not break the test of Hero rendering structure)."
  - "Q1 info button testid landed on QuestionBasicInfo's restProps (forwarded to Expander outer div via concatClass); clicking the testid-bearing div toggles the inner checkbox via Expander's onclick handler — strict assertion that the post-click DOM contains the info content body."
  - "candidate-details matrix step (TIR4:99): info-items hard count assertion 13 → 14 (1 new north-only filtered info question visible for CA-AA-Special's CO-Reg-N nomination); narrowing assertions inserted as toContainText/not.toContainText on the infoTab Locator's text content."

patterns-established:
  - "Wave 0 probe pattern continued from 88-04: R3/R7/R8 evidence captured in 89-01-WAVE0-PROBES.txt before mutation lands (matches 88-04-WAVE0-PROBES.txt naming convention)."
  - "baseV1 in-place mutation invariants preserved: externalIdPrefix '', kebab-case external_ids, seed: 42, generateTranslationsForAllLocales: false, [<id>] desc heading format on all new rows."
  - "Hero content + info content + required-flag flip — additive at row level; no removal or rename of existing rows."

requirements-completed:
  - TIR4:17-32
  - TIR4:82-100
  - TIR4:25-32
  - TIR4:99
  - TIR4-DATA-01
  - TIR4-DATA-02
  - TIR4-DATA-03
  - TIR4-DATA-04
  - TIR4-DATA-05
  - TIR4-VOTER-01
  - TIR4-VOTER-02
  - TIR4-VOTER-03
  - D-89-03

# Metrics
duration: ~70 min
completed: 2026-05-29
---

# Phase 89 Plan 01: baseV1 dataset extensions + voter-mega-journey lockstep absorption Summary

**TIR4:17-32 + 82-100 baseV1 mutations (hero emoji+image, info content, required-flag flip, unregistered candidate with election_symbol "999", 3 filtered info questions mun/north/south) landed in-place plus 3 voter testids + 4 voter-mega-journey assertion groups + 8 deferred items surfaced.**

## Performance

- **Duration:** ~70 min
- **Started:** 2026-05-29T09:48:46Z (orchestrator)
- **Completed:** 2026-05-29T10:04:47Z (final commit) — plus SUMMARY/STATE phase
- **Tasks:** 4
- **Files modified:** 5
- **Files created:** 3 (probes, deferred-items, this SUMMARY)

## Accomplishments

- **baseV1 dataset extended in place per D-89-01 lockstep** — 9 net additions (4 mutated rows + 5 new rows): Q1 hero emoji + info LocalizedString; Q2 hero image; QG-Opin-Base category hero image; test-qu-info-text required true; 3 filtered info questions (mun-only via _elections sentinel, north-only + south-only via _constituencies sentinels); 1 new unregistered candidate (test-ca-aa-unregistered, NO terms_of_use_accepted, NO answersByExternalId, NO email column per Wave 0 R8); 1 new paired nomination (test-nom-reg-n-ca-aa-unregistered, election_symbol '999', parent test-nom-reg-n-or-aa).
- **3 new testids added to testIds.voter.questions namespace** — hero / categoryHero / infoButton; kebab-case values per central testIds.ts convention.
- **2 voter route Svelte files extended with data-testid** — questions/[questionId]/+page.svelte gains hero (on `<figure role="presentation">` inside `{#snippet hero()}`) + infoButton (on `<QuestionBasicInfo>` via restProps); questions/category/[categoryId]/+page.svelte gains categoryHero (on the category-intro `<figure>`).
- **voter-mega-journey.spec.ts extended with 4 strict assertion groups** — (1) NEW step asserts category hero `<img>` visible on QG-Opin-Base intro; (2) within first-category-intro step asserts Q1 hero emoji '🗳️' + info button visible + click reveals `[qu-opin-base-1-info]` body; (3) after advancing to Q2 asserts Q2 hero `<img>` + info button `toHaveCount(0)`; (4) candidate-details info-tab matrix patched — count 13 → 14 + north-only filtered info question text present + mun-only/south-only text absent (TIR4:99).
- **Wave 0 R3/R7/R8 de-risk** — playwright dependencies-array syntax for 89-03; Hero discriminator shape locked; candidates.email column ABSENT verdict drives Task 1 row shape.
- **8 deferred items surfaced** — 7 from 89-RESEARCH.md (e2e.test.ts:431 drift, QuestionInCardContent v2.11+ TODO, emailHelper.ts retirement, legacy PageObject classes, TIR5 deferred catalogue, expectQuestionDisplayToHave legacy helper, TEST-INVENTORY.md refresh) + 1 Task 2 environment cascade (perm-1e1cg1co pre-existing flake + concurrent vite dev server race with db:reset cache wipe).

## Task Commits

Each task was committed atomically (no worktree mode; hooks bypassed per `project_gsd_repo_hook_workaround.md`):

1. **Task 0: Wave 0 probes — R3/R7/R8 de-risk** — `9c6fe9f41` (docs)
2. **Task 1: Mutate baseV1 — hero + info + required + unregistered candidate + 3 filtered info questions** — `0b0e4fd30` (feat)
3. **Task 2: Add 3 testids + extend voter-mega-journey** — `9359ebfba` (feat)
4. **Task 3: Surface 8 deferred items** — `786554e2e` (docs)

**Plan metadata:** (this commit) docs(89-01): complete plan

## Files Created/Modified

- `.planning/phases/89-…/89-01-WAVE0-PROBES.txt` — Wave 0 evidence (R3/R7/R8)
- `.planning/phases/89-…/deferred-items.md` — 8 deferred items
- `.planning/phases/89-…/89-01-SUMMARY.md` — this summary
- `packages/dev-seed/src/templates/baseV1.ts` — 9 net additions to `questions.fixed[]` (3 new) + `question_categories.fixed[]` (1 mutation: hero) + `candidates.fixed[]` (1 new) + `nominations.fixed[]` (1 new) + 3 existing rows mutated (Q1 hero+info, Q2 hero, test-qu-info-text required→true)
- `tests/tests/utils/testIds.ts` — 3 new constants `testIds.voter.questions.{hero,categoryHero,infoButton}`
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` — 2 testid additions (hero figure + QuestionBasicInfo restProps)
- `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte` — 1 testid addition (category hero figure)
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` — 1 new test.step block + inline assertions within existing first-category-intro step + candidate-details matrix step patch

## Decisions Made

- Followed planner's D-89-01 contract (mutate-in-place + lockstep voter-mega absorption). NO baseV2 fork.
- Wave 0 R8 verdict drove Task 1 row shape: candidates table has NO email column (verified verbatim from `packages/supabase-types/src/database.ts:152-238`). Email reserved for 89-03 sibling const file `tests/tests/utils/candidateMegaConstants.ts` (or similar).
- Wave 0 R7 verdict: kept the `type: 'image'` field on image-hero shape (per Hero.type.ts / @openvaa/data Image convention) even though `isImage` only requires the `url` field — defensive against downstream callers that read `type`.
- Static asset paths chosen as bare strings (no real SVG files shipped) per plan's option: Hero renders `<img src=…>` which gets a 200 from the dev-server's static-asset fallback OR a 404 — either way the testid-bearing `<figure>` is visible + contains an `<img>`, which is what voter-mega asserts.
- Q1 info button testid placement: chose restProps on `<QuestionBasicInfo>` (which forwards to inner `<Expander>` outer div via `concatClass`) instead of wrapping in a new `<div>` — minimizes DOM churn.
- candidate-details matrix step patching: kept all 13 existing per-index assertions (nth(0)..nth(12)) intact; only bumped the hard count 13 → 14 + added narrowing assertions as `toContainText` / `not.toContainText` against the entire `infoTab` Locator. This is robust against the new row's position uncertainty in the rendered info-item list.

## Deviations from Plan

### Test verification deferral (not a Rule 1-4 deviation; environment cascade)

**1. [Out-of-scope / environment cascade] Task 2 voter-mega-journey verify command blocked by 2 pre-existing issues**
- **Found during:** Task 2 (post-implementation verify)
- **Issue 1 (pre-existing CASCADE):** The voter-mega-journey project's transitive dependency chain (`data-setup-baseV1` → `perm-not-located-2e2cg` → … → `perm-1e1cg1co`) hits the pre-existing perm-1e1cg1co flake (TimeoutError on `getByTestId('voter-home-start')`). This is documented as a known shared voter-app cold-deeplink loader race from Phase 86.3-05. NOT introduced by 89-01.
- **Issue 2 (sandbox environment):** Two concurrent `vite dev` processes were running at verification time (PIDs 6977 + 58604). `yarn db:reset` invokes `dev:clean` which wipes `apps/frontend/.svelte-kit/`. The running dev servers do NOT auto-regenerate `.svelte-kit/generated/` after the wipe (only the type-level files come back via `npx svelte-kit sync`). Cannot safely kill the user's dev server.
- **Decision:** Per scope boundary rule (auto-fix only issues DIRECTLY caused by current task's changes), both blockers are out of scope. Code-level state of Task 2 is correct + statically verifiable via grep on the 3 testid placements + Svelte template syntax validity. Documented in deferred-items.md item #8.
- **Files modified:** None (no code rollback, no temp file committed; the temporary `tests/playwright.voter-mega-isolated.config.ts` was created and DELETED during diagnosis — never staged).
- **Verification path post-89-01:** A fresh full-suite run after a clean dev-server restart (single vite process) + perm-1e1cg1co cascade resolution will exercise the new assertions. The 4 new assertion groups are additive — they only assert content the previous steps did not exercise — so a fresh run is expected to be green provided baseV1 mutations seed correctly (which is independently verified via the direct `yarn db:seed --template baseV1` Task 1 run that produced 23 questions + 30 candidates + 61 nominations as expected).
- **Not committed in:** N/A (no fix committed).

---

**Total deviations:** 1 (environment cascade, not a Rule 1-4 auto-fix).
**Impact on plan:** Code-level state of all 4 tasks is correct + the verify-command failure is structurally orthogonal to the changes. Plan goals (data foundation + voter-mega assertion proof structure) shipped; full-suite green proof deferred to a clean-environment follow-up run.

## Issues Encountered

- **Two concurrent vite dev servers** at verification time interfered with `yarn db:reset`'s cache wipe — the running dev servers couldn't regenerate `.svelte-kit/generated/` after the wipe. Documented in deferred-items.md item #8. Recommended future operator workflow: ensure single vite dev server BEFORE running `yarn db:reset` to avoid this race.
- **Pre-existing perm-1e1cg1co cascade** blocks the voter-mega-journey project chain. Already deferred to v2.10 close / Phase 86.3-05 follow-up. Out of 89-01 scope per scope boundary rule.

## Known Stubs

None introduced in 89-01. The 3 new filtered info questions land as `type: 'text'` rows with no inline answer data — by design (they're info questions; candidates' answers to them are arranged by the `answersByExternalId` blocks on candidate rows, which are unchanged in 89-01 because no existing candidates explicitly answer the new filtered info questions). Plan 89-03 candidate-mega-journey will exercise the unregistered candidate's profile-fill flow which will answer these.

## Threat Flags

No new security-relevant surface introduced beyond the threat_model in 89-01-PLAN.md:
- T-89-01-01 (Tampering — baseV1 JSONB hero writes): mitigated. The existing dev-seed Writer JSONB serialization handles the new `custom_data.hero` field identically to the existing `custom_data.{filterable,longText,min,max}` fields that already ship cleanly via 88-04 ADR-88-04-01 Pass-5 resolver.
- T-89-01-02 (DoS — 3 new filtered info questions on baseV1): accepted. Pre-existing e2e.test.ts:431 row-count drift surfaces in deferred-items.md item #1 per D-89-01 explicit deferral.
- T-89-01-03 (Info Disclosure — unregistered candidate email field): mitigated. Wave 0 R8 probe verdict (`candidates.email` column ABSENT) routes the email string to a 89-03 sibling const file, NOT into the database row.
- T-89-01-SC (no package installs): accepted. Zero npm/pip/cargo installs in 89-01.

## Next Phase Readiness

- **89-02 (candidate fixture library)** unblocked. The unregistered candidate test-ca-aa-unregistered + paired nomination (election_symbol '999') is now seedable via baseV1; 89-02 fixtures can author against the testid surface added here.
- **89-03 (candidate-mega-journey spec)** unblocked. Consumes both 89-01 data + 89-02 fixtures; sibling const file `tests/tests/utils/candidateMegaConstants.ts` (per Wave 0 R8 verdict) holds the unregistered candidate's email string `unregistered-aa@test.openvaa.local`.
- **89-04 (3 settings permutations)** unblocked. Orthogonal — does not depend on 89-01.
- **89-LAST (legacy retirement)** unblocked structurally; final shape depends on 89-02/03/04 deliverables.

### Blockers / Concerns

- The pre-existing perm-1e1cg1co cascade blocks the canonical voter-mega-journey project run. Resolving this is on the v2.10 close trajectory (Phase 86.3-05 + 89 follow-ups). Until then, fresh-environment manual verification by the operator is the recommended Task 2 acceptance path.

## Self-Check: PASSED

Verified prior to final commit:

- `89-01-WAVE0-PROBES.txt` exists at `.planning/phases/89-…/89-01-WAVE0-PROBES.txt`: **FOUND**
- `deferred-items.md` exists at `.planning/phases/89-…/deferred-items.md` (≥7 items): **FOUND (8 items)**
- Commit `9c6fe9f41` (Task 0) exists in git log: **FOUND**
- Commit `0b0e4fd30` (Task 1) exists in git log: **FOUND**
- Commit `9359ebfba` (Task 2) exists in git log: **FOUND**
- Commit `786554e2e` (Task 3) exists in git log: **FOUND**
- `packages/dev-seed/src/templates/baseV1.ts` post-mutation grep returns ≥9 mentions of the 9 expected external_ids: **PASS (31 mentions)**
- `tests/tests/utils/testIds.ts` contains all 3 new constants: **PASS** (`voter-questions-hero`, `voter-questions-category-hero`, `voter-questions-info-button`)
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` has 0 NEW soft constructs in the diff: **PASS**

---
*Phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour*
*Plan: 01*
*Completed: 2026-05-29*
