# Phase 91: TIR6 perm + edit test additions + visual/perf/a11y/bank-auth refactor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
**Areas discussed:** Mega-journey vs new-spec, Refactor scope, Per-perm dataset boundaries
**Mode:** `--chain` (interactive discuss, then auto-advance to plan-phase)

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Plan partition | Group ~16 deliverables; single bundle / category-per-plan / perm-per-plan / fixture-first hybrid | |
| Mega-journey vs new-spec | Where do 'New step' / 'Edit Step' TIR6 additions land — append to mega-journey or new specs | ✓ |
| Refactor scope | Visual/perf/a11y/bank-auth — minimal vs full rewrite vs no-touch | ✓ |
| Per-perm dataset boundaries | Strict-per-perm template vs shared topology / helper-based | ✓ |

**User's choice:** Mega-journey vs new-spec + Refactor scope + Per-perm dataset boundaries.
**Notes:** Plan partition deferred to planner per 89/90 convention.

---

## Mega-journey vs new-spec

### Q1: Where do the three edit-journey additions land?

| Option | Description | Selected |
|--------|-------------|----------|
| Append into existing mega-journey specs | Add invalidUrl step into candidate-mega-journey, feedback-dialog + all-nominations into voter-mega-journey. Mirrors 89-D-89-01 lockstep pattern. Smallest blast radius. | ✓ |
| New separate spec files | Three new spec files + three new project chains. Smaller per-file diff, parallel-safe — but fragments canonical journey and duplicates serial-spec setup. | |
| Hybrid — absorb single-step additions, feedback as new spec | Feedback flow is multi-step with state persistence; large enough for own spec. | |

**User's choice:** Append into existing mega-journey specs (Recommended).
**Notes:** None.

### Q2: feedbackDialog fixture location + surface?

| Option | Description | Selected |
|--------|-------------|----------|
| Shared fixture under fixtures/shared/ | Author at tests/tests/fixtures/shared/feedbackDialog.fixture.ts with expectVisible/Hidden, setRating, setComment, submit, cancel, expectSuccess, etc. Both nav surfaces (voter + candidate) trigger the same modal. | ✓ |
| Voter-only fixture under fixtures/voter/ | Only voter-mega consumes; smaller surface, promote later if needed. | |
| Inline in voter-mega.fixture.ts | Conflates canonical journey scaffold with sub-feature interaction surface. | |

**User's choice:** Shared fixture under fixtures/shared/ (Recommended).
**Notes:** None.

### Q3: Disposition of existing voter-feedback-persistence.spec.ts?

| Option | Description | Selected |
|--------|-------------|----------|
| Absorb persistence spec; delete voter-feedback-persistence.spec.ts | TIR6 step IS a superset of persistence contract. One canonical assertion. | |
| Keep both — voter-mega does happy-path, persistence stays for boundary cases | Conservative — risks duplication. | |
| Defer the decision to researcher | RESEARCH.md determines via overlap audit. | |

**User's choice (freeform):** "The new tests fully supersede all old test, i.e. others than the 2 mega journeys and those in perm. The old ones can be consulted but they're often erroneous and contain misinformation in comments."

**Notes:** Established broader principle — the **two mega-journeys + perm specs are the canonical surface**. All "old" specs outside those three categories that have surface overlap with TIR6 deliverables are SUPERSEDED. Voter-feedback-persistence is therefore deleted in same plan as voter-mega feedbackDialog absorption.

### Q4: Delete-list scope for Phase 91?

| Option | Description | Selected |
|--------|-------------|----------|
| Surface-overlap deletes only | Delete only voter-feedback-persistence.spec.ts; researcher audits other voter-* and candidate-* specs for overlap but doesn't act. | |
| Full supersession sweep | Delete every spec outside mega-journeys + perm/* + visual/perf/a11y/bank-auth in 91-LAST. | |
| Two-stage — surface-overlap now, full sweep deferred | Delete only direct overlap in 91; broader sweep in 91-LAST or v2.11+. | ✓ |

**User's choice:** Two-stage — surface-overlap now, full sweep deferred.
**Notes:** Conservative scope discipline preserved. Broader sweep deferred to v2.11+ legacy-retirement phase.

---

## Refactor scope (visual / perf / a11y / bank-auth)

### Q1: Visual regression refactor scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Rebaseline + tighten fixtures | --update-snapshots for post-89 baseV1; swap candidate-preview to candidatePreviewPage fixture wrap. | ✓ |
| Full rewrite with new dataset | Author perm-visual-regression so screenshots are deterministic against a known minimal shape. | |
| Minimal pass — just rebaseline | --update-snapshots only; no fixture changes. | |

**User's choice:** Rebaseline + tighten fixtures (Recommended).
**Notes:** None.

### Q2: Perf budget + A11Y axe smoke refactor depth?

| Option | Description | Selected |
|--------|-------------|----------|
| Perf minimal pass; A11Y fixture wrap + voter-mega traversal reuse | Perf re-verifies thresholds. A11Y swaps raw test + SupabaseAdminClient UUID resolution to voterTest.answeredVoterPage for located routes. | ✓ (with extension) |
| Perf rebaseline; A11Y per-perm dataset | Perf re-calibrate P90. A11Y gets own minimal perm-a11y-smoke dataset. | |
| Defer both refactors | Leave as-is unless they break. | |

**User's choice (freeform):** "1 - but retire all legacy fixtures, only the new ones are to be used. This goes for voterTest.answeredVoterPage as well and will effect the visual perf specs too. We can use the baseV1 dataset for these after all and let's extend the new fixtures or utils to get us to the answered voter page in a deterministic manner."

**Notes:** Major pivot — extended scope to **retire all legacy fixtures** (specifically `voter.fixture.ts` exposing `voterTest.answeredVoterPage`). Migrate visual + perf + a11y onto the new `voter-mega.fixture.ts` `answeredVoterPage`. Use baseV1 dataset (not new perm datasets). Extend new fixtures/utils to provide deterministic answered-voter-page state.

### Q3: Fixture migration aggressiveness?

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate only TIR6 refactor targets; mark legacy fixture deprecated | Phase 91 migrates visual + perf + a11y. Other 12 consumers stay on legacy. voter.fixture.ts gets @deprecated banner; deletion deferred to follow-up sweep. | ✓ (with audit) |
| Migrate ALL 15 consumers + delete voter.fixture.ts | Full retirement, largest blast radius, cleanest end state. | |
| Migrate TIR6 + voter/* (skip candidate-settings) | Voter-app surface fully unified; candidate-settings legacy retirement deferred. | |

**User's choice (freeform):** "1 - but also check the new tests (journeys, perms) that they do not use any of the legacy fixtures. If they do, refactor."

**Notes:** Augmented — mandatory audit of ALL new tests (mega-journeys + perm specs from Phases 88/89/90) for legacy-fixture imports; refactor any that leak. The 12 other voter-* consumers stay on legacy in Phase 91.

### Q4: Bank-auth refactor depth?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal pass — tighten assertions, audit for legacy-fixture imports | Bank-auth is Edge-Function-direct, no UI fixture. Audit imports, tighten any soft assertions, leave JWE/env-gating intact. | ✓ |
| Full rewrite — author per-test minimal dataset | Refactor to use perm-style data-setup/teardown. Larger blast radius. | |
| Skip bank-auth refactor entirely | Env-gated, opt-in, lower-priority. Leave as deferred-item. | |

**User's choice:** Minimal pass (Recommended).
**Notes:** None.

---

## Per-perm dataset boundaries

### Q1: Dataset strategy for 9 new TIR6 perms?

| Option | Description | Selected |
|--------|-------------|----------|
| Strict per-perm template | 9 new templates, 9 spec files, 27 project entries. Mirrors 89-D-90-01 directly. Zero coupling. | |
| Shared 1e1cg1co for 6 settings-only + 3 bespoke | One shared template for 6 perms + 3 bespoke. Violates strict-per-perm-template runtime invariant. | |
| Per-perm template + shared dataset-builder helper | 9 templates, all consuming a buildMinimal helper at packages/dev-seed/src/templates/_helpers/. Zero duplication, preserves runtime per-perm decoupling. | ✓ (with port) |

**User's choice (freeform):** "3 - and also check the existing perms and port them to use it"

**Notes:** Augmented — port existing perms with compatible topology to use the helper. Researcher inventories compatible perms; bespoke perms (2e-asymmetric, 2e-shared, disjoint-1co, disable-election-*, not-located-2e2cg, startfromcg) stay hand-authored.

### Q2: Helper authoring style + porting scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Fresh-minimal seed + port only truly-minimal existing perms | Helper authors from scratch (1e/1cg/1co/1org/N cands/M qs, no hero/info content). Port: perm-1e1cg1co, perm-disable-voter-app, perm-disable-candidate-app, perm-per-app-notifications, perm-missing-nominations, perm-localisation-positive. Stay bespoke: 7 non-minimal perms. | ✓ |
| Helper supports topology variants — port everything | Larger API surface; risks regressions on existing perm specs. | |
| Fresh-minimal seed + defer existing-perm porting | Phase 91 only uses helper for 6 new TIR6 settings-only perms. Existing perms stay hand-authored. | |

**User's choice:** Fresh-minimal seed + port only truly-minimal existing perms (Recommended).
**Notes:** None.

### Q3: TIR6 ambiguities (`!has info` + dup `showCategoryTags`)?

| Option | Description | Selected |
|--------|-------------|----------|
| Treat both as straightforward — typo / paste artifact | Candidate authors info on BOTH Q1 + Q2; allowOpen=false suppresses Q2 rendering. Single perm spec for showCategoryTags. | ✓ |
| Flag both as research questions — wait for TIR clarification | Block on TIR draft fix. | |
| Dual showCategoryTags perm — candidate-side variant + voter-side variant | Treat dup as intentional split. | |

**User's choice:** Treat both as straightforward (Recommended).
**Notes:** None.

---

## Final Confirmation

### Ready for context?

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | Write CONTEXT.md and auto-advance to /gsd-plan-phase 91 (chain mode). | ✓ |
| Explore more gray areas | Surface additional areas (testid additions, parallel-landing, 91-LAST scope, helper signature, perm naming). | |

**User's choice:** I'm ready for context.

---

## Claude's Discretion

- Exact filenames for the 9 perm templates / specs / setup/teardown wrappers (follow 89-04 / 90 naming).
- Exact `buildMinimal()` signature and parameter shape (researcher refines based on `Template` shape).
- Exact testid additions to candidate-app + voter-app Svelte components where TIR6 expectations require selectors not yet present.
- `expect.toBeVisible()` vs `toBeDisabled()` vs `toBeHidden()` matcher choice per locator.
- Internal implementation of `feedbackDialog` fixture composition (standalone in `fixtures/shared/` per D-91-MJ-02).
- Whether feedback-dialog assertions fold into one test() block or multiple (follow voter-mega test() discipline).
- Plan partition (likely 4-5 plans per CONTEXT D-91-PARTITION; planner confirms).

## Deferred Ideas

- Broader supersession sweep (other voter-* and candidate-* specs) — v2.11+ legacy-retirement phase.
- Full migration of remaining 12 legacy `voter.fixture.ts` consumers — v2.11+ legacy-retirement phase.
- `voter.fixture.ts` deletion — v2.11+ legacy-retirement phase.
- Bank-auth dataset authoring — indefinitely deferred (Edge-Function-direct).
- Candidate-side feedback fixture consumption — future phase if/when candidate-side assertions are added.
- Helper extension for non-minimal topologies — future phase if needed.
- TIR draft hygiene (flag TIR6 `!has info` typo + dup `showCategoryTags`) — documentation hygiene only.
- 89/90 carry-over deferred items (e2eTemplate row-count drift, QuestionInCardContent, emailHelper.ts, runes-test errors) — orthogonal.
