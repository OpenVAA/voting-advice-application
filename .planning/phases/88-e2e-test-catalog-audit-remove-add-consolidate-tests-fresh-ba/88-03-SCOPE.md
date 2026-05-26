# Plan 88-03 — Scope memo

**Drafted:** 2026-05-26
**Revised:** 2026-05-26 (post-plan-check — 3 HIGH concern resolutions locked: spec location, concurrency topology, startFromCG mechanism)
**For:** `/gsd:plan-phase 88` (Plan 88-03)
**Operator request:** add a NEW test project "Voter: election and constituency permutations" that exercises every election/constituency-selection topology on minimal-data datasets, modeled on the voter-mega-journey first-parts pattern.

## Post-plan-check resolutions (LOCKED 2026-05-26)

| # | Concern | Resolution |
|---|---------|-----------|
| HIGH-1 | `voter-app` testIgnore regex is anchored on `voter-*`, doesn't match `perm-*.spec.ts` → wrong-seed pickup risk | **New directory `tests/tests/specs/perm/`.** No edits to `voter-app` testIgnore. Only playwright.config.ts gets append-only project entries with `testDir: './tests/specs/perm'`. |
| HIGH-2 | `app_settings` is a global singleton → parallel perm-* setups would clobber each other's `disallowSelection`, `startFromConstituencyGroup` | **Chain perm-* setups sequentially within the perm-* family** (mirror existing variant-* chain pattern). Each `data-setup-perm-<N>` declares `dependencies: ['<previous-perm-setup>']` (the FIRST perm setup has no dep on any existing chain — preserving "no cross-chain dependency to existing"). Specs within each perm-* project still run `fullyParallel: false` (single-test serial) per the topology-level contract. SCOPE acceptance #2 is REVISED below. |
| HIGH-3 | `elections.startFromConstituencyGroup` expects a UUID, not an external_id — template's `app_settings.fixed[0]` can't resolve at seed time | **Runtime set in spec beforeAll** (mirror `variant-startfromcg.setup.ts:18-23` + `startfromcg.spec.ts:23-29` precedent). `perm-startfromcg.spec.ts` beforeAll: query `constituency_groups` table for the CG-2 UUID via `SupabaseAdminClient`, then call `client.updateAppSettings({elections:{startFromConstituencyGroup: <uuid>}})`. afterAll restores. Template `perm-startfromcg.ts` OMITS the key entirely. |
| MED-4 | voter-not-located test 5 (whitelist) landing-route ambiguity | Mirror existing `voter-not-located-redirect.spec.ts` `expectLandedOn(page, /\/(questions\|results)/)` regex pattern verbatim. |
| MED-5 | perm-2e-shared test 1 "select first only" pattern unification | **Unify on the deselect-the-other pattern** (the elections page default-selects all elections, so "select only EL1" = "deselect EL2"). `selectElectionAndAdvance` helper is renamed to `deselectElectionAndAdvance({ optionText })` semantics — picks an option that is CURRENTLY checked and clicks to deselect, then continues. Tests that want "only EL1" call `deselectElectionAndAdvance({ optionText: /Election 2/i })`. Tests that want "both" omit the call and just hit continue (the default state is both-selected). |
| MED-6 | perm-disjoint test 2 `iterateSelectOptions` hedge | Remove hedge. `iterateSelectOptions(page, comboboxLocator)` with default `optionIndex=0` picks option 0 of each matched combobox — the hedge in the planner's notes is overcautious. Test 2 calls `iterateSelectOptions` with `.nth(0)` (single combobox), then asserts continue disabled, then `.nth(1)`, asserts continue enabled. |
| LOW-7 | verify command workspace name | Use `cd tests && npx tsc --noEmit -p .` (no workspace name). |
| LOW-8 | Task 1 read_first DO ADOPT / DO NOT ADOPT cleavage | Make explicit in Task 1 action block — see SCOPE memo's "Modeled on voter-mega-journey first-parts" section below (already inline). |

These resolutions are BINDING — they override any conflicting prose in the original (unrevised) sections below.

## Operator's words (verbatim)

> as part of this phase/milestone, implement the new test project "Voter: election and constituency permutations" described in TEST-INVENTORY-REFACTOR-2.md, including utils necessary. I want the tests to be rigid with no unnecessary soft constraints, and succinct. Use the voter mega journey (especially the first parts) as a model. Do not concern yourself with any of the old test projects.

## Authoritative spec

`./TEST-INVENTORY-REFACTOR-2.md` lines **1-209** (the new permutations project). Sections of the doc beyond line 211 (`# THESE ARE NOT ORGANIZED YET`) are OUT-OF-SCOPE for 88-03.

## What this plan delivers

A new family of e2e tests — small, rigid, succinct — covering the voter-app's election + constituency selection logic across every distinct dataset topology spec'd in the refactor doc.

### Topology variants (each gets a minimal-data template + setup + spec)

Per refactor-doc:8-16 the "minimal" baseline is **1 election, 1 constituency group, 1 constituency, 2 question categories (info + opinion), 1 question per category (text + Likert5), 0 alliances, 2 organisations, 1 candidate per organisation per constituency.** Each variant below adds the minimum-needed shape on top.

| # | Variant slug | Topology (E = election, CG = const-group, CO = constituency) | Doc reference | Test count |
|---|---|---|---|---|
| 1 | `perm-1e1cg1co` | 1E - 1CG - 1CO (implied — no selectors) | refactor-doc:139-144 | 1 |
| 2 | `perm-2e-shared` | 2E sharing 1 CG with 1 CO (implied — no selectors) | refactor-doc:142-145 | 2 (select first; select both) |
| 3 | `perm-2e-asymmetric` | EL1=CG1×CO-1A; EL2=CG2 with 2 CO (CO-2A + CO-2B); CG1 shared by EL2 | refactor-doc:146-154 | 1 (select both — only EL2/CG2 picker, CG1 prefilled+disabled) |
| 4 | `perm-startfromcg` | EL1=CG1 with CO-1A + CO-1B; EL2=CG2 with leaf COs (parents=1A/1B + orphan 1C); `startFromConstituencyGroup: CG2` | refactor-doc:158-167 | 2 (select CO-1A1 → shows election selector; select CO-1C → no election selector) |
| 5 | `perm-disjoint-1co` | 2E with disjoint CGs (CG1=CO-1A, CG2=CO-2A); | refactor-doc:171-181 | 2 (select EL1 → only CG1 picker; select both → both pickers, continue disabled until both filled) |
| 6 | `perm-disable-election-1co` | 2E - 1 shared CG - 1 CO; `elections.disallowSelection: true` | refactor-doc:185-188 | 1 (no election OR constituency selector) |
| 7 | `perm-disable-election-2co` | 2E - 1 shared CG - 2 CO; `elections.disallowSelection: true` | refactor-doc:189-192 | 1 (no election selector, but show constituency selector) |
| 8 | `perm-not-located-2e2cg` | 2E - 2 disjoint CGs - 2 CO each (the voter-not-located-redirect rebuild) | refactor-doc:198-209 | 5 (the 26.1.1-5 cells, rebuilt from scratch — see "Voter-not-located redirect" below) |

**Total:** 8 topology variants → 8 templates → 8 setups → 8 playwright projects → ~15 tests across 8 specs (or 1 spec with 8 describes — planner picks).

### Helpers to extract

Per refactor-doc:115-136, the new spec family relies on these shared helpers, hoisted into a single util file (e.g. `tests/tests/utils/voterIntro.ts`):

```
bypassIntroAndExpect(page, expectation: async () => Promise<void>)
  // home → start → intro → continue → run expectation

expectQuestion(page)
expectElectionSelector(page): Promise<Locator>
expectConstituencySelector(page): Promise<Locator>

bypassIntroAndExpectQuestion(page)
  // for no-election-or-constituency-selection topologies

bypassIntroAndExpectElectionSelector(page): Promise<Locator>
selectElectionAndAdvance(page, { optionText })

bypassIntroAndExpectConstituencySelector(page): Promise<Locator>
selectConstituencyAndAdvance(page, { selectorText, optionText })
```

Modeled on the FIRST-PARTS pattern of `voter-mega-journey.spec.ts` (the home/intro/elections/constituencies block at lines ~492-633). Extract — don't duplicate.

### Voter-not-located redirect rebuild

Per refactor-doc:196 — rebuild the 5 cells of `voter-not-located-redirect.spec.ts` (existing inventory rows 26.1.1-5) against the new `perm-not-located-2e2cg` minimal dataset. The new cells assert the same SHAPES (deferred-target query-param resume; double-bounce; pre-selected-election bounces only to constituency; refresh-after-localStorage-clear resumes target; open-redirect to external URL rejected) but on the minimal 2E×2CG×2CO seed — not the existing variant-Ne-Nc dataset.

## Critical constraints

### Rigidity (operator emphasis)

- **NO `expect.soft(...)`** — every assertion is hard.
- **NO defensive `try/catch` around `expect(...)`** — exceptions propagate.
- **NO soft-gates / `[u53-followup]` console.info diagnostics** — if a step's contract isn't enforceable, restructure the dataset until it is.
- **NO best-effort `.catch(() => ...)` on assertion-bearing locator interactions** — best-effort dialog/cleanup utilities (e.g. `dismissLeftoverDialogsBestEffort`) are OK only when they precede an explicit hard assertion.

The mega-journey's mixed posture (hard + soft due to empirical-UI-inspection uncertainty against the 135-row baseV1 template) does NOT carry over. Minimal datasets make every contract enforceable; that's the whole point of the permutations project.

### Succinctness (operator emphasis)

- Share helpers aggressively. If two tests both walk home → intro → expect-X, they BOTH use `bypassIntroAndExpect(page, ...)`.
- One spec per topology when the topology has ≥2 cells; one spec OR one describe-block in a shared `voter-permutations.spec.ts` when the topology has 1 cell. Planner picks the cleaner shape and justifies briefly.
- No deferred-step placeholders. No `[xxx-followup]` markers. Every test step runs real assertions.

### Modeled on voter-mega-journey first-parts (operator emphasis)

The home/intro/elections/constituencies block of `voter-mega-journey.spec.ts:492-633` is the canonical model. Specifically:

- `TIMEOUT` semantic-bucket pattern (element / click / page / slowPage / testMax).
- `TEXT_RE` for any regex used 2+ times (election names, constituency names, etc.).
- Module-scope helper functions for any walk logic that would trip `playwright/no-conditional-in-test`.
- `page.getByTestId(testIds.voter.elections.list)` etc. for stable locator surface.

The DIFFERENCE from mega-journey: minimal data + rigid assertions + small specs. No 30-step walk, no question-answering, no results-card matrix.

### Ignore old test projects (operator emphasis)

- Do NOT migrate `tests/tests/specs/voter/voter-not-located-redirect.spec.ts`. Rebuild from scratch against the new dataset.
- Do NOT touch `tests/tests/setup/variant-Ne-Nc.setup.ts` or any other existing variant setups.
- Do NOT modify the existing voter-app `testIgnore` regex (mega-journey already extended it; further extensions land in 88-NN if needed).
- The new permutation chains are FULLY ISOLATED — they share no playwright dependencies with the existing chains (just like the mega-journey block does today).

### Per-template `externalIdPrefix` for parallel-prefix decoupling

Per the Phase 88-01 SUMMARY's documented breach (the shared `'test-'` prefix forced 88-01 to chain `data-setup-baseV1` after `variant-hidden-required-candidate`), each new template declares a UNIQUE `externalIdPrefix`:

- `perm-1e1cg1co` → `test-perm-1e1cg1co-`
- `perm-2e-shared` → `test-perm-2e-shared-`
- `perm-2e-asymmetric` → `test-perm-2e-asymmetric-`
- `perm-startfromcg` → `test-perm-startfromcg-`
- `perm-disjoint-1co` → `test-perm-disjoint-1co-`
- `perm-disable-election-1co` → `test-perm-disable-elec-1co-`
- `perm-disable-election-2co` → `test-perm-disable-elec-2co-`
- `perm-not-located-2e2cg` → `test-perm-notloc-`

Each prefix is ≥2 chars (runTeardown's safety guard). Each chain teardowns ITS OWN prefix — no cross-chain interference. This is the parallel-only contract that 88-01 punted to "88-NN" (per its SUMMARY); 88-03 lands the contract for its own chains.

### Playwright project topology

For each variant, three new playwright projects appended to `tests/playwright.config.ts` AFTER the existing mega-journey block:

```
data-setup-perm-<NAME>      (setup project, runs setupFromTemplate)
perm-<NAME>                 (spec project, fullyParallel:false, depends on data-setup-perm-<NAME>)
data-teardown-perm-<NAME>   (teardown project, wired via teardown: key on the setup)
```

Variant 8 may instead reuse a shared `data-teardown-permutations` teardown if multiple permutation projects can share one (planner decides — but each setup still gets ITS OWN teardown wire because the prefixes differ).

The 8 chains run in parallel with each other AND with the existing default + variant + mega-journey chains, since prefixes are disjoint.

## Probable plan structure (planner refines)

The planner should weigh task granularity vs. parallelism. A reasonable first cut:

1. **Task 1: Helpers** — author `tests/tests/utils/voterIntro.ts` with all helpers spec'd above. Reads `voter-mega-journey.spec.ts:492-633` first for pattern parity.
2. **Task 2: Templates (Wave A — parallel)** — author all 8 minimal templates under `packages/dev-seed/src/templates/permutations/<NAME>.ts` (or a single `permutations.ts` with named exports — planner decides). Each declares its own `externalIdPrefix`. Registered in `packages/dev-seed/src/templates/index.ts`.
3. **Task 3: Setups (Wave A — parallel)** — author 8 setup files at `tests/tests/setup/perm-<NAME>.setup.ts`, each a 3-line wrapper around `setupFromTemplate('<templateName>')`. Plus 8 teardown files OR one shared teardown that runTeardowns each prefix (planner decides which is cleaner).
4. **Task 4: Playwright config** — append 24 project entries (8 setups + 8 spec projects + 8 teardowns, OR a smaller number if teardowns are consolidated) AFTER the mega-journey block. Surgical edit — no changes to existing entries.
5. **Task 5: Specs (Wave B — parallel)** — author the spec files (count TBD per planner's grouping decision). Each spec lives at `tests/tests/specs/voter/perm-<NAME>.spec.ts` (or one consolidated spec — planner picks).
6. **Task 6: Verification** — run each new project in isolation (`--project=perm-<NAME>`) AND a full-suite run, capture pass/fail counts; document parallel-only contract is honored (no `dependencies:` between perm chains and other chains).

## Acceptance criteria for Plan 88-03

1. All 8 permutation projects run GREEN in isolation: `yarn test:e2e --project=perm-<NAME>` passes for each `<NAME>`.
2. The 8 perm-* chains run SEQUENTIALLY within their own family (post-revision HIGH-2 resolution) and run in parallel with the existing default + variant + mega-journey chains. `yarn test:e2e` does not regress any pre-existing pass count attributable to perm-* chains; net `pass_count` ≥ baseline + (sum of new test counts). The first perm-* setup has NO `dependencies:` entry referencing any non-perm chain (preserves "no cross-chain dependency to existing"); each subsequent perm-* setup depends only on the previous perm-* setup.
3. No `expect.soft`, no `try/catch` around `expect`, no `[xxx-followup]` markers in any new spec file.
4. Helper file `tests/tests/utils/voterIntro.ts` is consumed by ≥2 perm specs (proves the helpers earn their keep).
5. Each template's `externalIdPrefix` is unique and ≥2 chars; `runTeardown(prefix, client)` matches verbatim.
6. No edits to existing setup files, existing spec files, existing templates, or `ROADMAP.md` / `STATE.md`.
7. The mega-journey project still runs GREEN (it doesn't share a prefix with the new chains, so this should be free — but verify).

## Out-of-scope for 88-03

- TEST-INVENTORY-REFACTOR-2.md lines 211+ (`# THESE ARE NOT ORGANIZED YET`) — deferred to subsequent 88-NN plans.
- Migrating any of the existing variant setups or specs to use `setupFromTemplate`. The existing surface remains untouched.
- Decoupling the existing default chain's `'test-'` prefix (the 88-NN punt from 88-01 remains punted; only the NEW perm-* chains land the prefix decoupling).
- Documentation updates to `TEST-INVENTORY.md` — deferred to the final 88-NN inventory-rebuild plan.
- Capturing the Phase 88 final baseline anchor — that's the final plan in the 88-NN series, not 88-03.

## Risks to surface for the planner

- **R1 — prefix uniqueness collisions:** if any new prefix overlaps a `LIKE 'test-%'` query elsewhere, the parallel-only contract breaks. Mitigation: all new prefixes start with `test-perm-` so they're still under the existing `test-`-style umbrella but never collide with `test-baseV1-`-style or bare `test-<short>-` prefixes.
- **R2 — playwright config bloat:** 24 new project entries is a meaningful jump. Mitigation: consider consolidating teardowns OR grouping perm specs into one consolidated `perm-permutations.spec.ts` driven by the dataset choice via env var. Planner weighs tradeoff; consolidated-spec saves config-line count but obscures per-project pass/fail granularity.
- **R3 — bypassIntroAndExpect contract drift:** if the helper accepts an arbitrary expectation callback, type discipline at the call site is important. Mitigation: planner specifies the helper signature and adds a 1-line comment explaining the contract.
- **R4 — voter-not-located rebuild parity:** the rebuilt 26.1.1-5 cells must exercise the SAME contracts as the existing spec (deferred-target redirect; double-bounce; whitelist; etc.) but against the new dataset. Risk: subtle contract drift if the rebuilder reads the SPEC docstring instead of the source. Mitigation: planner's read_first must include both `voter-not-located-redirect.spec.ts` (the source-of-truth contracts) AND the new perm-not-located dataset shape.
- **R5 — setupFromTemplate helper limits:** the existing helper resolves templates via `BUILT_IN_TEMPLATES[name]`. The new 8 templates must be registered there. Risk: if templates are registered but accidentally not exported from `@openvaa/dev-seed`'s root index, the setup project import path breaks. Mitigation: planner's verification task runs each setup-file's TypeScript import path before declaring the templates done.
