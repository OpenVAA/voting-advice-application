# Plan 88-04 — Scope memo

**Drafted:** 2026-05-27
**For:** `/gsd-plan-phase 88` (Plan 88-04)
**Operator request:** absorb the T3–T9 portion of `TEST-INVENTORY-REFACTOR-3.md` that was deferred from quick task `260527-nat` (T1+T2 shipped atomically; T3+ deferred because the work is phase-sized — settings-resolution ADR + frontend testid sweep + heavy spec migration).

## Provenance

- Authoritative design source: `./TEST-INVENTORY-REFACTOR-3.md` (194 lines).
- Already shipped via `260527-nat` (out-of-scope for 88-04, do NOT redo):
  - **T1** (`caf6ee931`) — Categorical entity filter: `No answer` selectable + empty selection = 0 results + library-level distinction between `include=undefined` (inactive) and `include=[]` (active, allow none). 22/22 unit tests green.
  - **T2** (`accfba54f`) — baseV1 `[<id-token>] desc` rename across 45 `name: { en: ... }` rows; `opt-a` → `[qg-opin-opt-a-NotSelected]`; `opt-b` → `[qg-opin-opt-b-Skipped]`. 135-row seed verified.
- Quick-task SUMMARY: `.planning/quick/260527-nat-apply-test-inventory-refactor-3-md-to-vo/260527-nat-SUMMARY.md` (canonical recommendation for this plan's scope + wave order — lines 118–207).

## What this plan delivers

A fixtures-driven refactor of `voter-mega-journey.spec.ts` (and downstream consumers) that lands:

1. The deferred **settings-resolution architecture** (T3) — `cardContents.candidate` accepts `{question: '<external_id>'}` so seeds can wire result-card content by stable token instead of database UUID.
2. A **fixtures library** (T4) for the main voter views — `resultsPage`, `entityFilters`, `entityFilterDialog`, `entityFilter`, `entityDetails` — moving common element selection / interaction logic OUT of specs and INTO reusable fixtures.
3. **Spec migrations** (T5–T8) that consume the new fixtures: `result-card-contents` (EDIT), `matching: organisations` (ADD), `voter-vs-entity matrix on CA-AA-Special` (REFACTOR + rename), `party-drawer → organisation details` (REFACTOR), `filters: text` (ADD), `filters: dialog` (ADD), plus targeted REMOVE steps for redundant cells.
4. **TEXT_RE cleanup** (T9) — drop or tighten the module-scope `TEXT_RE` constants in `voter-mega-journey.spec.ts` now that T2's `[<id>] desc` convention + fixture-driven testid queries reduce the need for free-text probes.

## Operator's words (verbatim — from `TEST-INVENTORY-REFACTOR-3.md`)

> as part of this phase, apply TEST-INVENTORY-REFACTOR-3.md to voter-mega-journey + associated files. T1 and T2 already landed via the quick task; T3–T9 are this plan's scope. Build fixtures for all main views so we can use them in the perm (and other) specs too. Logic for selecting common elements and interacting with them should be in the utils, not the specs. Refactor the mega-journey EDIT/ADD/REMOVE/REFACTOR steps to use those fixtures. Rename "candidate details" / "party-drawer" steps. Add the `matching: organisations`, `filters: text`, and `filters: dialog` cells. Drop the deferred `[u53-followup]` markers — rigid hard assertions only.

## Scope by task

### T3 — `cardContents.candidate` accepts `{question: '<external_id>'}` (settings-resolution ADR)

**TIR3 lines 21–29** spec block:

```ts
results: {
  cardContents: {
    candidate: ['submatches', {
      question: FETCH DB ID FOR question with ex id of 'test-qu-info-text'
    }],
  }
}
```

**ADR question (discuss-phase room MUST resolve):** where does `external_id → DB UUID` resolution land?

| Option | Where | Trade-off |
|---|---|---|
| **A (load-time, in-frontend)** | Resolver hook at `EntityCard` consumer site reads `dataRoot.questions.byExternalId(<external_id>)` lazily | No seed-time coupling; widens `QuestionInCardContent` to a union `{ id: Id } \| { question: ExternalId }`. Adapter unaware. |
| **B (seed-time, in dev-seed Writer)** | dev-seed resolves `external_id → UUID` at template-application time; writes resolved UUID into `app_settings.results.cardContents.candidate[*].question` | Settings shape unchanged; couples dev-seed to know about settings schema. |

Quick-task SUMMARY (line 126) recommends **Option A** but flags the resolver hook and type widening shape as needing a discuss-phase ADR. Plan-phase MUST produce the ADR before any code lands.

**Touches (likely surface):**

- `packages/app-shared/src/settings/dynamicSettings.type.ts` — type widening for `QuestionInCardContent`.
- `apps/frontend/src/lib/dynamic-components/entityCard/` (exact file TBD via grep) — load-time resolver.
- `packages/dev-seed/src/templates/baseV1.ts:~204` — the wiring line (`question: 'test-qu-info-text'`).

### T4 — Fixtures library (`tests/tests/fixtures/`)

**TIR3 lines 30–66** spec block — fixture signatures verbatim:

```
resultsPage:
  selectElection(/name/ | (count) => index)
  selectEntityTab(entityType)
  expectEntityTabs(entityType[])  // OR getEntityTabs() + spec-side assert
  getEntityCards()                 // outer cards only for orgs and alliances
  getEntityCard(/name/ | (count) => index)
  dismissAllDialogs()
  openEntityDetailsForCard(/name/ | (count) => index)

entityFilters:
  getTextFilter()
  setTextFilter(text)
  clearTextFilter()
  openFilterDialog()
  getFilterButtonBadge()

entityFilterDialog (OR bundle into entityFilters):
  getFilters()
  getFilter(/name/ | (count) => index)
  expectResetToBeDisabled({ disabled: true/false }?)
  close()
  reset()

entityFilter (OR bundle into entityFilters):
  getOptions()
  getOption(/accessible name/ | (count) => index)
  setSelection(/values/ | (count) => indices | undef for all)   // checkboxes only
  setNumberRange(min?, max?)

entityDetails:
  selectTab(tabType from settings)
  expectTabs(tabType[])
  getInfoItems()
  expectInfoItem(/label/, /value/)
  getQuestionDisplays()
  expectQuestionDisplay( ... )  // like the util already built
  getMemberCards()
```

**Scaffold target:**

- `tests/tests/fixtures/resultsPage.fixture.ts`
- `tests/tests/fixtures/entityFilters.fixture.ts`
- `tests/tests/fixtures/entityDetails.fixture.ts`
- `tests/tests/fixtures/index.ts` — composition root that re-exports `test`/`expect` from `@playwright/test` extended with the new fixtures.

**Test-id surface:** the plan calls out `score-gauge`, `election-symbol`, `entity-list-filter-badge` as testIds that may not exist in the frontend yet. Discovery procedure (planner MUST budget for this):

1. Grep `apps/frontend/src/lib/dynamic-components/` + `apps/frontend/src/lib/components/` for each candidate testid.
2. If absent: ADD `data-testid` (registered via `tests/tests/utils/testIds.ts`) to the appropriate component — minimal surgical edit, no behavioural change.
3. Promote the new testids into `tests/tests/utils/testIds.ts` so fixtures key off the constants.

### T5 — EDIT step `result-card-contents`

**TIR3 lines 68–84:**

- Refactor to use T4 fixtures.
- Asserts on the first candidate card:
  - Answer to `test-qu-info-text` is shown.
  - Submatches are shown.
  - Submatches contain 4 score gauges.
  - Election symbol `10` is shown.
- REMOVE the existing "switch to parties tab + assert ≥1 organization card" block (the assertion is covered redundantly by T8's `matching: organisations` step + per-tab fixture coverage).

Depends on: T3 (cardContents.candidate wiring) + T4 (fixtures landed).

### T6 — ADD step `matching: organisations`

**TIR3 lines 86–104:**

```
selectElection(reg)
selectEntityTab(orgs)
cards = getEntityCards() → expect count === 5
card = cards.first() → expect to be Party BB - Best-Regional-Party
                     → expect 2 candidates shown
                     → expect NO "Show all x candidates" button
bigPartyCard = cards.filter({ hasText: 'Party AA' })
  → expect 3 candidates shown
  → expect "Show all 5 candidates" button
  → click it → expect all 5 candidates shown
             → expect "Collapse list" button
  → click Collapse → expect 3 candidates shown
                   → expect "Show all 5 candidates" button
```

Depends on: T4. Verify the 5/2/3/5 counts against the current baseV1 seed reality at planner-research time (quick-task SUMMARY flags these as "verify at execution time" — pre-flight check eliminates PARTIAL placeholders).

### T7 — REFACTOR step `9.6.5–8 voter-vs-entity matrix on CA-AA-Special` + `party-drawer → organisation details`

**TIR3 lines 106–126:**

- REMOVE `detail: drawer open` + `detail: Polar-Max info-items` cells (consumed by T7's matrix + organisation-details cells).
- REFACTOR `9.6.5-8 voter-vs-entity matrix on CA-AA-Special`: use T4 fixtures; rename step from "candidate details" → "candidate details" (TIR3 says "rename 'candidate details'" — exact new name is operator's call at planner-research time; default proposed: keep "candidate details" — the rename target may be implicit in the TIR3 line context).
- REFACTOR `party-drawer: info+candidates+opinions tabs + correct filter list` → `organisation details`:

```
selectElection(reg) → selectEntityTab(orgs) → openEntityDetailsForCard(/Party AA/)
expectTabs(info, members, opinions)
selectTab(info)
expectInfoItems:
  Election / Regional Election
  Constituency / Region North
  alliance / Alliance A (AL-A)
selectTab(members)
getMemberCards() → expect count 5
```

**Member-count reconciliation:** quick-task SUMMARY (lines 148–153) flags that the `5` member count needs verification against the actual Party AA membership at seed time (likely 7 AA candidates of which CA-AA-Hidden is hidden + show-all filter active → 5). Planner MUST run the reconciliation grep + seed check before locking the count.

Depends on: T4 + T6.

### T8 — ADD steps `filters: text` + `filters: dialog`

**TIR3 lines 128–194:**

REMOVE (per TIR3 line 128–132 — these have already been MOVED to the SETTINGS-01 / RESULTS-01+02 / D-13+14+15 / 9.5.5–9.5.18 cells in earlier phases):

- `filters: toggle without effect_update_depth_exceeded`
- `filters: plural tab switch reset + drawer survival + browser back`
- `filters: SETTINGS-01 wave B Number/Text/Choice/Group/MissingValue`

ADD `filters: text` (TIR3 lines 134–143):

```
selectElection(reg) → selectEntityTab(cands)
setTextFilter("polar")
getEntityCards() → expect count 2
                 → expect first card to be Polar-Max candidate
                 → expect second card to be Polar-Min candidate
clearTextFilter()
```

ADD `filters: dialog` (TIR3 lines 145–194) — 6-stage choreography:

| Stage | Action | Expectations |
|---|---|---|
| 1 | open dialog, get filters | Party + Info: pick multiple… + Info: years of experience |
| 2 | Party.getOption(/No answer/) | count text matches /1/ |
| 3 | setSelection(/No answer), close | cards count = 1; getEntityCard(/Free independent/) matches; badge = 1 |
| 4 | reopen, reset | cards count = 13; badge empty |
| 5a | Info: pick multiple, setSelection(/Choice A\|B/), close | cards count = 12; CA-AA-Special NOT visible |
| 5b | reopen, reset, reopen | (re-prep) |
| 5c | Info: years of experience, getOptions() | count 2 (min + max); text /42/ + /99/ |
| 5d | setNumberRange(50, null), close | cards count = 1; CA-AA-Special visible |
| 6 | reopen, Info: pick multiple, setSelection(/Choice A\|B/), close | cards count = 0 |
| 7 | reopen, reset | (cleanup) |

Counts (2 / 13 / 12 / 1 / 0) are baseV1 reality — quick-task SUMMARY (lines 154–161) flags these for execution-time verification. Planner MUST budget a pre-flight seed run + count grep.

Depends on: T1 library semantics (already landed) + T4 fixtures.

### T9 — TEXT_RE cleanup

**TIR3 (implicit — quick-task SUMMARY recommendation, lines 162–167):**

- Walk `voter-mega-journey.spec.ts` and identify every consumer of the module-scope `TEXT_RE` constant block.
- For each consumer:
  - If the new T2 `[<id>] desc` prefix + fixture-driven testid query supersedes the free-text probe → DROP the `TEXT_RE` entry.
  - If the probe is still needed → tighten the regex to include the new `[<id-token>]` bracket prefix.
- Remove dead `TEXT_RE` entries entirely.
- The `optionalOpinionsA` / `optionalOpinionsB` entries SPECIFICALLY need updating (quick-task SUMMARY line 173–174 — new names: `[qg-opin-opt-a-NotSelected] Optional Opinion Questions A` + `[qg-opin-opt-b-Skipped] Optional Opinion Questions B`).

Depends on: T5–T8 landing first (so the planner knows which entries still have consumers).

## Critical constraints

### Rigidity (operator emphasis — inherits 88-03's posture)

- **NO `expect.soft(...)`** in any new or refactored cell.
- **NO defensive `try/catch` around `expect(...)`.**
- **NO `[u53-followup]` / `[xxx-followup]` console.info markers.** If a cell's contract isn't enforceable at execution time, the planner must surface the gap during research-phase and either reshape the dataset OR file a v2.11+ todo — not paper over it with a soft-gate.
- **NO best-effort `.catch(() => null)` on assertion-bearing locator interactions.** Best-effort cleanup utilities (`dismissAllDialogs`, `dismissLeftoverDialogsBestEffort`) are OK only when they precede an explicit hard assertion.

### Succinctness (operator emphasis)

- Fixtures absorb the choreography. Specs are the WHAT; fixtures are the HOW.
- One spec file per cell-cluster (matching / filters / details). The planner picks the grouping.
- No deferred-step placeholders. Every cell runs real assertions.

### Pre-flight reconciliation (planner research-phase obligation)

The quick-task SUMMARY explicitly demands a research-phase pass BEFORE the executor wave starts:

> A research-phase pass for T4-T8 to grep the actual baseV1 row counts, DOM testids (`score-gauge`, `election-symbol`, `entity-list-filter-badge`), and party-membership numbers BEFORE the executor wave starts. This avoids PARTIAL placeholders in spec assertion counts.

(SUMMARY lines 191–195.) This is BINDING for plan-phase.

### Out-of-scope for 88-04

- `voter-mega-journey.spec.ts` step ordering / structural reorganisation beyond what T5–T8 + T9 touch. The spec stays roughly the same shape — fixtures replace ad-hoc choreography in the named cells.
- Any work on the perm-* family (that's 88-03's surface — already complete).
- Any of the 88-01 deferred 25 mega-journey steps not covered by T5–T8 — those remain under a future 88-NN.
- The final v2.10-close anchor capture (still owned by `88-LAST`, the final plan in the 88-NN series).
- Documentation refresh of `TEST-INVENTORY.md` — owned by `88-LAST`.

## Probable wave order (planner refines)

Per quick-task SUMMARY lines 201–207:

1. **Wave 1 — T3 ADR + landing.** Atomic: ADR + type widening + frontend resolver + baseV1 wiring. Must land before T4 because some fixtures will read the new cardContents shape.
2. **Wave 2 — T4 fixtures library.** Includes testid grep + minimal frontend testid additions where missing. Single executor (or 2 parallel sub-tasks if the planner can cleanly partition results/filters/details into independent fixture files).
3. **Wave 3 — T5 / T6 / T7 / T8 in parallel.** Each cell-cluster touches a different segment of `voter-mega-journey.spec.ts`. The planner may choose to serialise these in this order if git's hunk-merge can't keep up — empirical call.
4. **Wave 4 — T9 TEXT_RE cleanup.** Runs LAST so it knows which entries are still referenced.
5. **Wave 5 — full `voter-mega-journey` project run as integration gate.** Cold-start; expect green per the rigidity constraint.

## Acceptance criteria for Plan 88-04

1. T3 ADR is committed under `.planning/phases/88-…/88-04-ADR-cardContents-resolver.md` (or equivalent path) BEFORE any frontend/resolver code lands. ADR captures: Option A vs B trade-off, chosen option + reason, resolver placement, type-widening surface for `QuestionInCardContent`.
2. `cardContents.candidate` in `packages/dev-seed/src/templates/baseV1.ts` uses `{question: '<external_id>'}` — no DB UUIDs hardcoded in the template.
3. Fixtures landed: `tests/tests/fixtures/{resultsPage,entityFilters,entityDetails}.fixture.ts` + `index.ts` composition root. Each fixture exposes the signatures spec'd above (T4 block).
4. Fixtures consumed by **≥3** cells in `voter-mega-journey.spec.ts` (proves the fixtures earn their keep).
5. Cells landed / refactored / removed exactly per T5–T8 scope. Counts (5 / 2 / 3 / 5 / 2 / 13 / 12 / 1 / 0 / 4 / 13 / etc.) match baseV1 reality at execution time — verified via pre-flight grep + seed run during research-phase, NOT during executor wave.
6. `voter-mega-journey.spec.ts` no longer references `[u53-followup]` markers or `expect.soft(...)`. (Inventory grep PASSES with 0 hits.)
7. `TEXT_RE` constant block is either deleted OR every remaining entry has ≥1 spec consumer (no dead entries).
8. Full `voter-mega-journey` project runs GREEN cold-start (3-run gate not required at this plan boundary; deferred to 88-LAST).
9. No regression in 88-01 baseV1 chain (existing 25 deferred steps remain deferred — this plan does NOT pick them up).
10. No edits to perm-* chains (88-03 territory), to ROADMAP.md outside the Phase 88 plans list, or to STATE.md outside the Roadmap Evolution section.

## Risks to surface for the planner

- **R1 — T3 resolver placement under-specified.** ADR must close this before any T4+ work. If discuss-phase can't reach consensus on Option A vs B, escalate to operator before plan-phase declares the ADR locked.
- **R2 — testid sweep sprawl.** T4 may surface missing testids in 3+ components; the addition is mechanically simple but each one is a frontend-side commit. Planner should budget a discrete task per testid-addition cluster.
- **R3 — count drift between TIR3 and current baseV1.** TIR3 was authored against the pre-T2 baseV1 state; the post-T2 rename + Party BB suffix + NEAR_MAX answer block changes may have shifted some counts. Pre-flight reconciliation is THE primary risk-mitigator.
- **R4 — fixture coupling to baseV1.** The fixtures are intended to be reusable across perm-* specs too (TIR3 line 32: "so that we can use them in the perm (and other) specs too"). Planner MUST validate that the fixtures don't bake in baseV1-specific assumptions — they should accept locators / regexes from the caller, not hardcode `'Party AA'`.
- **R5 — TEXT_RE cleanup blocks T5–T8 verification.** If a refactored spec depends on a still-valid `TEXT_RE` entry that T9 deletes, the spec breaks. T9 MUST run last, and the integration gate (Wave 5) MUST be green before plan close.
- **R6 — discuss-phase budget.** T3's ADR + T4's testid grep + count reconciliation collectively need a real discuss-phase. Skipping discuss-phase (as 88-01 did per "refactor doc IS the spec") is NOT appropriate here — the ADR alone demands it.

## Plan-phase entry checklist

- [ ] Discuss-phase runs (NOT skipped — T3 ADR demands it).
- [ ] Research-phase pre-flight runs: grep baseV1 row counts, DOM testids, party membership; capture findings.
- [ ] ADR drafted as a discrete artefact under the phase directory before plan tasks lock.
- [ ] Wave-1 task scoped atomically (ADR + types + resolver + baseV1 wiring — one commit OR one PR cluster).
- [ ] Fixture file shapes locked (planner picks bundle-into-entityFilters vs separate-files per TIR3's "OR bundle smartly" parenthetical).
- [ ] Cell-by-cell verification counts locked from research-phase findings (NOT from TIR3 numbers — TIR3 is design intent, baseV1 reality is the contract).
