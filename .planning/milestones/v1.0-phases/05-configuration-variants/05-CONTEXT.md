# Phase 5: Configuration Variants - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Multiple Playwright projects, each with a distinct dataset, covering the major deployment configuration combinations: single/multi-election, constituency enabled/disabled (with hierarchical relationships), results section filtering (candidates-only, organizations-only), and election/constituency-specific question filtering. Also tests the `startFromConstituencyGroup` and `disallowSelection` settings that alter the selection flow. No candidate app tests, no locale testing (ADV-02), no new voter features.

</domain>

<decisions>
## Implementation Decisions

### Dataset strategy
- Shared base + overlay pattern: reuse existing `default-dataset.json` as the base, with per-variant overlay files that add/modify entries
- A common merge utility composes the base + overlay at import time in each variant's data-setup
- 4 overlay files, one per variant axis:
  1. **multi-election-overlay.json** — adds a 2nd election with its own single constituency. Both elections have single constituencies so only election selection is triggered (not constituency selection)
  2. **constituency-overlay.json** — adds multiple constituencies to the existing single election in a hierarchical pattern: regions for E1 and municipalities for E2 (superset relationship — E1 regions contain E2 municipalities). Triggers constituency selection
  3. **startfromcg-overlay.json** — same as constituency overlay but one municipality belongs to no region. Tests the `startFromConstituencyGroup` reversed flow (constituency first, then elections)
  4. **No overlay needed for results section tests** — use default dataset and toggle `results.sections` via API
- Variant datasets include election-scoped and constituency-scoped questions to verify question filtering: questions can be specific to an election or constituency, applied at question category or individual question level. Tests verify correct question count and at least one question title per election/constituency

### Project topology
- Each variant gets its own dedicated data-setup project (e.g., `data-setup-multi-election`, `data-setup-constituency`)
- Variant projects are fully independent from existing candidate-app/voter-app projects — own setup-to-test chain
- Sequential execution: variant projects run AFTER all default projects finish (depend on data-teardown of the default suite)
- Single `yarn test:e2e` command runs everything — no separate variant command needed
- Claude's discretion: whether one shared final teardown or per-variant teardown pairs

### Journey depth per variant
- Selection + results verification: test variant-specific selection steps (election/constituency), answer a few questions, reach results, verify per-election/per-constituency results display correctly
- Skip deep entity detail testing (already covered in Phase 3)
- Multi-election results: verify that switching between elections in the results accordion shows different result sets (different candidate counts/names per election)
- Election/constituency-specific questions: verify correct question count per election/constituency, and spot-check at least one question title
- `disallowSelection` setting: verify election selection page is bypassed AND results page shows all elections in the accordion

### Constituency scenarios
- 5 configuration scenarios total (rows 1 is already tested in Phase 3):
  1. ~~1 election, 1 constituency (auto) — Phase 3 default~~
  2. 2 elections, each with 1 constituency — election selection only (multi-election overlay)
  3. 1 election, multiple constituencies — constituency selection (constituency overlay)
  4. 2 elections, hierarchical constituencies (regions/municipalities, superset) — combined selection flow (constituency overlay with 2 elections)
  5. `startFromConstituencyGroup` mode — constituency-first flow with one orphan municipality (startfromcg overlay)
- `disallowSelection` mode tested as a settings toggle on the multi-election dataset

### Results section variants (CONF-05, CONF-06)
- Settings toggle on default dataset: set `results.sections` to `['candidate']` or `['organization']` via API
- No extra overlay datasets needed — the default data has both entity types
- Standalone project using default data-setup (like the Phase 4 settings pattern)
- Verify tabs appear/disappear AND check entity count matches expected

### Claude's Discretion
- Exact overlay file structure and merge utility implementation
- Teardown strategy (shared vs per-variant)
- Spec file naming and organization within each variant project
- Page objects for election selection and constituency selection pages
- How many questions to answer in each variant journey (minimum needed to reach results)
- Exact data values in overlay datasets (candidate names, constituency names, question texts)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StrapiAdminClient`: importData, deleteData, updateAppSettings — handles all data and settings management
- `default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json` — established dataset separation pattern
- `data.setup.ts` / `data.teardown.ts` — dataset import/cleanup via API, pattern for new variant setups
- Election selection page with testIds: `voter-elections-list`, `voter-elections-continue`
- Constituency selection page with testIds: `voter-constituencies-list`, `voter-constituencies-continue`
- Results page testIds: `voter-results-election-select` (accordion), `voter-results-entity-tabs`, `voter-results-candidate-section`, `voter-results-party-section`
- `answeredVoterPage` fixture: completes full voter journey to results — reusable for variant journeys
- `QuestionsPage` page object: answer navigation methods

### Established Patterns
- Playwright project dependencies: setup -> app-project chains
- Per-test API settings toggle with afterAll restore (Phase 2/4 pattern)
- `assert { type: 'json' }` for JSON imports
- `fullyParallel: false` for settings-mutating spec files
- Serial describe blocks within spec files for shared state

### Integration Points
- `getImpliedElectionIds()`: auto-implies when 1 election OR `disallowSelection` is set
- `getImpliedConstituencyIds()`: auto-implies when ALL elections have `singleConstituency`
- `(located)/+layout.ts`: gate that redirects to selection pages when params can't be implied
- `appSettings.results.sections`: array of entity types controlling which tabs appear in results
- `appSettings.elections.startFromConstituencyGroup`: reverses flow to constituency-first
- `appSettings.elections.disallowSelection`: forces all elections to be auto-selected
- `nominationAndQuestionStore`: builds match tree per election+entityType, excludes types with no nominations
- `election.getQuestions({ constituency, entityType, type })`: returns questions filtered by election and constituency

</code_context>

<specifics>
## Specific Ideas

- Constituency hierarchy: regions for E1, municipalities for E2 where E1 is a superset of E2 — tests the implication logic where selecting a municipality implies the parent region
- `startFromConstituencyGroup` variant includes one municipality that belongs to no region — tests edge case of orphan constituency in reversed flow
- Question filtering: variant datasets include election-specific questions (only shown for that election) and constituency-specific questions (only shown for that constituency), verifiable by count + title spot-check
- Results section tests use the same pattern as Phase 4 settings tests: toggle via API, verify, restore

</specifics>

<deferred>
## Deferred Ideas

- Full constituency overlap matrix (no-overlap, partial overlap, 3+ elections with mixed patterns) — could be a future phase if more coverage is needed
- Data-driven results section testing (no nominations for an entity type) — covered by settings approach for now
- `elections.startFromConstituencyGroup` with 3+ elections — complex scenario deferred

</deferred>

---

*Phase: 05-configuration-variants*
*Context gathered: 2026-03-09*
