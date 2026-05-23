# Phase 88 — Context

**Gathered:** 2026-05-23
**Status:** Ready for planning (Plan 88-01)
**Mode:** operator-led catalog audit (no discuss-phase needed — design is documented inline in `TEST-INVENTORY-REFACTOR-1.md`)

<domain>
## Phase Boundary

Phase 88 is v2.10's final phase: operator-driven audit of the entire e2e test catalog (remove obsolete tests, add coverage gaps, consolidate redundant specs) followed by a fresh 3-run cold-start baseline against the mutated catalog. The Phase 88 anchor replaces Phase 87's `b2ad76e5…` anchor as the gate against which all future development is verified (starting with v2.11 rune migration).

Phase 88 is structured as MULTIPLE plans, each handling one slice of the catalog mutation. This CONTEXT.md governs **Plan 88-01** (the first slice); subsequent plans (88-02, 88-03, …, 88-N for final baseline capture) will each receive their own scope memo.

</domain>

<scope_plan_88_01>
## Plan 88-01 — Scope (THIS plan)

**Operator request (verbatim):**

> Let's start phase 88 with creating a new setup and base template and moving most of the voter app tests to one mega-journey. Do this in a parallel setup onto which we'll migrate the other specs as well. This is described in TEST-INVENTORY-REFACTOR-1.md (not some of the specs left to be organised in later steps (after line 379)).

**Authoritative spec:** `./TEST-INVENTORY-REFACTOR-1.md` lines **1-378**.

**Out-of-scope for 88-01:** `./TEST-INVENTORY-REFACTOR-1.md` lines **379+** ("THESE ARE NOT ORGANIZED YET (BUT SOME MAY BE DEPRECATED BY THE ONES ABOVE)") — these are deferred to later 88-NN plans.

**Parallel-setup principle:** the new setup + new base template + new mega-journey spec land **alongside** (not replacing) the existing setup + templates + voter specs. The existing test surface must stay green throughout 88-01 — migration is incremental and reversible. Subsequent plans within Phase 88 retire the old surfaces once the new mega-journey is proven stable.

</scope_plan_88_01>

<decisions>
## Implementation Decisions (locked from TEST-INVENTORY-REFACTOR-1.md, sections 1-378)

### General refactor direction (`TEST-INVENTORY-REFACTOR-1.md:1-12`)

- **Deprecate `--likert-only` filter** entirely (not removed in 88-01 itself — but the new template + base dataset are built so the flag is not needed; deprecation lands when last consumer migrates).
- **Replace per-variant setup files with one generic template-driven setup helper.** Signature: `setupFromTemplate(template) → { cleanup }`. Inside: teardown → seed → seed-check → return cleanup-fn callable from `afterAll` when needed.
- **Create new base dataset** (spec'd at lines 13-108 of the refactor doc — elections, constituencies, question categories, questions, alliances, organizations, candidates, nominations).
- **Robust answering helper**: support `'min'` / `'max'` answer modes (first/last option for ordinal, min/max value for numeric).
- **Move repeated setup to `beforeEach`** (away from per-test inline setup duplication).

### Base dataset shape (`TEST-INVENTORY-REFACTOR-1.md:13-108`)

Defined verbatim in the refactor doc — DO NOT re-derive. Key shape:
- **2 elections** (EL-Reg Regional, EL-Mun Municipal), **6 constituencies** across 2 constituency groups (CG-Reg = regions parent, CG-Mun = municipalities child).
- **8 question categories**: 1 info (QG-Info with 9 questions covering all info-question types), 5 opinion (QG-Opin-Base + B + C + EL-Reg-scoped + CO-Mun-SE-SW-scoped + 2 filtered-per-question categories).
- **Question types covered in opinion**: Likert5, Likert4, Likert7, Categorical, Boolean (5 in base set).
- **Question types covered in info**: MultipleChoiceCategorical, SingleChoiceCategorical (NOT filterable), Text, Text+longText, Text+settings.type='link', Number, Boolean, Date, MultipleText.
- **Alliances + organizations**: 2 alliances (AL-A with OR-AA + OR-AB; AL-B with OR-BA + OR-BB); 1 unaffiliated party (OR-C).
- **Candidates + nominations**: Region North has the bulk (CA-AA-Special, CA-AA-Hidden no-ToU, 4 generic AA, 1 AB, 2 BA, 2 BB, 2 C, 1 Independent). Region South is the "not always allied" foil. Municipal constituencies cover the special-case shapes (NE has CA-AA-Special again; NW has only CA-Independent; SE / SW each have 1 candidate per party).

### Base settings shape (`TEST-INVENTORY-REFACTOR-1.md:109-200`)

Defined verbatim in the refactor doc — DO NOT re-derive. Key flags worth flagging for the planner:
- `matching.minimumAnswers: 5` (drives the answers-link-enable behavior the mega-journey tests).
- `questions.categoryIntros.allowSkip: true` + `questions.categoryIntros.show: true`.
- `questions.questionsIntro.allowCategorySelection: true` + `show: true`.
- `entities.hideIfMissingAnswers.candidate: true` + `showAllNominations: true`.
- `entityDetails.contents` per entity type as spec'd.

### Combined Full Voter Journey — mega-journey shape (`TEST-INVENTORY-REFACTOR-1.md:204-378`)

The mega-journey is ONE long-running `test(...)` block (or one `describe` with `test.describe.configure({ mode: 'serial' })` so the assertions chain) that walks the voter app end-to-end through the new base dataset. The refactor doc lists every test step in execution order, calling out:

- **MOVED from existing specs**: each ref like `### 9.1.1 [should load home page…]` points to the existing test that's being absorbed. The planner should keep an internal mapping table.
- **NEW/MOVE markers** (~30 of them in lines 204-378): brand-new test steps to author, or steps moved from a non-voter-journey spec.
- **Boundary at line 378** (`### 9.5.18 [SETTINGS-01 wave B — MISSING_FILTER_VALUE]`): last item in scope for Plan 88-01.

### Parallel-setup principle (HOW the new shape lives next to the old)

- New setup helper + new base template + new mega-journey spec land at NEW paths (likely `tests/tests/setup/base.setup.ts` + `packages/dev-seed/templates/base.ts` + `tests/tests/specs/voter/voter-mega-journey.spec.ts`, but the planner picks exact names).
- They appear as NEW playwright projects in `tests/playwright.config.ts` (alongside the existing projects).
- Existing setup + existing voter specs run UNCHANGED for the duration of 88-01.
- The Phase 88 final baseline capture (a later plan) will then decide whether to retire the OLD or treat them as parallel coverage.

</decisions>

<canonical_refs>
## Canonical References

- `./TEST-INVENTORY-REFACTOR-1.md` (817 lines, lines 1-378 are 88-01 scope; lines 379+ are deferred). **PRIMARY DESIGN SOURCE.**
- `./tests/TEST-INVENTORY.md` (3,212 lines, generated by quick task `260522-mps` on 2026-05-22). The current pre-audit inventory — operator uses it to cross-reference which tests are absorbed by the new mega-journey.
- `./tests/playwright.config.ts` — project graph; new playwright projects added by 88-01 must respect the existing topology.
- `./packages/dev-seed/templates/**` — existing template files; new base template lives alongside.
- `./tests/tests/setup/**.setup.ts` — existing variant-specific setup files; the new generic helper consolidates these eventually (NOT in 88-01 — old setups stay during the parallel phase).
- `./tests/tests/specs/voter/voter-journey.spec.ts` — existing voter-journey spec; the new mega-journey is a SIBLING spec, not a replacement.
- `.planning/STATE.md` Phase 88 Roadmap-Evolution entry (2026-05-22) — phase rationale.
- `.planning/ROADMAP.md:345-353` — Phase 88 entry.

</canonical_refs>

<gating_constraints>
## Gating constraints (carried forward from Phase 88 roadmap entry)

- Plan 88-01 must NOT break the existing test suite. The Phase 87 anchor (`b2ad76e5…`) remains the operative gate until Phase 88's final plan replaces it.
- Plan 88-01 must NOT modify ROADMAP.md, STATE.md, or existing spec files (except as needed to add NEW playwright project entries).
- New tests must pass on a fresh `yarn db:reset-with-data` against the new base template; deterministic across 3+ runs (project standard from v2.10 DETERM-04 lineage).
- Documentation updates to `TEST-INVENTORY.md` are NOT in 88-01 scope — that's a final-plan task once the catalog stabilizes.

</gating_constraints>
