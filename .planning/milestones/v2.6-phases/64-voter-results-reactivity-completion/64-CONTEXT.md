# Phase 64: Voter Results Reactivity Completion - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Milestone:** v2.6 Svelte 5 Migration Cleanup (closing — Phase 62-bis)

<domain>
## Phase Boundary

Close out the 5 voter-results E2E failures deferred from Phase 63's parity gate by completing the Phase 62 reactivity refactor. All 5 failing tests live in `tests/tests/specs/voter/voter-results.spec.ts`:

1. **RESULTS-01 + RESULTS-02** — `filter toggle narrows list without effect_update_depth_exceeded`
2. **D-14** — `filter state resets on plural tab switch`
3. **D-15** — `filter state survives drawer open/close`
4. **D-08 shape 3** (RESULTS-03) — `deeplink list+drawer URL renders both`
5. **D-08 shape 4** (RESULTS-03) — `deeplink edge case: organizations list + candidate drawer`

Phase 62's D-01..D-15 architectural decisions are LOCKED — Phase 64 inherits them verbatim (compound `EntityListWithControls`, `filterContext` bundled through `voterContext`, 4-segment optional route shape, drawer-first paint via source-order + `content-visibility: auto`, scope tuple `(electionId, entityTypePlural)`, URL as single source of truth, `goto()` as the only mutation point). Phase 64 fixes the implementation gaps, not the architecture.

**Goal anchor:** Flip the v2.6 parity gate to PASS so `/gsd-complete-milestone` can proceed without `pending_review` caveat. Phase 64 also re-anchors the parity-script constants from a fresh post-fix capture (folded in from Phase 63 D-13 — see D-08 below).

**In scope (Phase 64):**
- 5 named voter-results E2E tests must pass deterministically inside a full v2.6 parity capture (`yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json`)
- Reactivity bridge + lifecycle audit covering `filterContext.svelte.ts`, `EntityListWithControls.svelte`, and the `(voters)/(located)/results/+layout.svelte` consumer surface
- Targeted changes to `@openvaa/filters` IF root-cause analysis demands them, subject to the UI-framework agnosticism constraint (D-01)
- e2e-template extension in `@openvaa/dev-seed` IF needed to make filter tests deterministic (D-04)
- Removal of `test.skip(true, ...)` skip-paths in the 4 filter-dependent tests once seed prerequisites are guaranteed
- Full v2.6 parity capture + parity-script constants regeneration against the new baseline (D-08, D-09)
- Phase 62's deferred 9-step manual smoke checklist (`62-03-HUMAN-CHECKPOINT.md`) cleared as part of Phase 64 verification

**Out of scope (Phase 64):**
- imgproxy infrastructure flake (ROADMAP-declared OoS; STATE.md known-issue line item; restart workaround stays informal)
- Migration of other `EntityList` consumers across the candidate-app and remaining voter surfaces to `EntityListWithControls` (Phase 62 deferred follow-up sweep — stays deferred)
- Deeper voter-app reactivity refactor beyond the filters/results surface (e.g., `voterContext` shape, election persistence in URL, `fromStore`/`toStore` bridge retirement) — captured as deferred ideas
- New features. v2.6 milestone scope remains bug-fix + migration-cleanup only.

</domain>

<decisions>
## Implementation Decisions

### Scope of Allowed Changes

- **D-01: `@openvaa/filters` source IS in scope, BUT must remain UI-framework agnostic.** Phase 62 D-07 ("untouched") is rescinded for Phase 64. Targeted modifications to the package are permitted when root-cause analysis points to a contract that no consumer-side bridge can cleanly fix. **Hard constraint:** no Svelte-specific primitives may leak into `@openvaa/filters` source — no `$state`, no `$derived`, no `svelte/store`, no `svelte/reactivity` imports inside the package. The package must remain consumable by any UI framework (today: Svelte; tomorrow: hypothetical React/Solid/Vue consumers). Permissible categories of change: (a) pure-TS API additions (e.g., a `getSnapshot()` accessor for filter rule state), (b) internal correctness/notification-ordering fixes in `FilterGroup._onChange` dispatch, (c) `Filter.setRule` / `Filter._rules` immutability guarantees, (d) new generic accessors that consumers can wrap themselves. Excluded: any Svelte-specific code path inside `packages/filters/`.

- **D-02: `initFilterContext()` lifecycle audit IS in scope.** The current implementation calls `$effect(() => { ... })` directly inside the `initFilterContext({ entityFilters })` function body (`apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:80-88`). Svelte 5 normally requires `$effect` to run inside a component setup or an explicit `$effect.root()` scope. The bridge is suspected to mis-attach on cold deeplinks (D-05). Phase 64 audits and, if reproduction confirms the lifecycle is part of the failure class, fixes it — likely options: wrap in `$effect.root()`, move the bridge into a component-level `$effect` in `EntityListWithControls.svelte`, or replace the version-counter pattern entirely (see D-03).

- **D-03: Svelte 5 best-practice for external subscriptions MUST be researched before locking the bridge architecture.** The researcher conducts a focused web survey covering: (a) Svelte 5 docs §reactivity / §runes / §createSubscriber — does `svelte/reactivity` provide a canonical pattern for bridging non-rune external state into the `$state` graph? (b) Svelte 5 GitHub issues for "external subscription", "$effect.root", "non-component reactivity"; (c) `mcp__context7__*` Svelte docs lookups for canonical patterns. Output: a "Svelte 5 external-subscription patterns" section in `64-RESEARCH.md` ranking 2-3 viable approaches with code sketches. **Decision branch:** if the survey reveals that the `onChange` callback paradigm is fundamentally a poor fit for Svelte 5 (e.g., `createSubscriber` is the canonical idiom and it requires a different consumer-side shape), Phase 64 may **narrow `@openvaa/filters` scope to abstract filtering logic only** — drop the built-in `onChange` subscription model from the package entirely, leaving consumers to manage state externally (e.g., immutable filter snapshots that consumers replace, or framework-native subscription primitives layered on top). This narrowing is a Phase 64-eligible architectural change conditional on the research outcome — the planner makes the final call after reviewing the research findings.

- **D-04: `@openvaa/dev-seed` e2e-template extension IS in scope** for Phase 64 IF the contract for RESULTS-01/02, D-14, D-15 requires deterministic filter checkboxes. The dev-seed shape change inherits Phase 63's E2E-02 precedent (template-driven app_settings). Specific scope: ensuring at least one EnumeratedFilter target (party affiliation, the existing implicit filter) renders deterministically on the voter results page in the e2e seed. Preferred minimum: **fix consumer-side wiring first** (D-05.b) so the EnumeratedFilter for party renders without a seed change; only extend the template if a true seed gap is identified. Two follow-up todos captured (see Deferred Ideas) for systematic e2e coverage.

### Investigation Direction (no pre-rank — reproduce first)

- **D-05: Reproduce-first stance for the deeplink fixture timeout.** Phase 63-03 reported D-08 shapes 3+4 hit `answeredVoterPage` 30s timeout on cold-nav. The user explicitly requests no prior on root-cause direction; planning/research must reproduce locally first and rank from observation. The three plausible directions, in no particular order:
  - **(a) Component-side** — `getEntityAndTitle({ matches: voterCtx.matches, ... })` in `+layout.svelte:170-185` may catch and silently degrade when `voterCtx.matches` is unpopulated during cold-nav; drawer never renders; `voter-results-list` testid the fixture waits for never appears (note: the fixture's terminal wait at `voter.fixture.ts:84` is for `voter-results-list`, which is set on the `EntityListWithControls` component at `+layout.svelte:381` — if the layout flow lands in the `<Loading />` branch or the `error.noNominations` branch, the testid is absent and the 10s fixture wait + 30s test budget cascade).
  - **(b) Load-function-side** — `+layout.ts` canonical redirect (bare `/results/[electionId]` → `/results/[electionId]/candidates`) and `+page.ts` coupling-guard redirect interactions on cold deeplinks. A deeplink with all 3 segments + persistent `?electionId=` may enter a redirect that strips state.
  - **(c) Fixture-side** — `answeredVoterPage` short-circuits if the page URL already contains `/results/...` and skips the question-answering loop. Less likely but verifiable.

- **D-06: No predetermined investigation order.** Researcher reproduces against a clean `yarn dev:reset-with-data && yarn dev` stack, reads JSON test report, and determines empirical root cause. Whichever direction the evidence points to becomes the fix path. The planner sequences fixes accordingly.

### PASS Criterion + Verification Gate

- **D-07: PASS criterion = 5 named tests pass deterministically inside a full v2.6 parity capture, AND parity-script constants regenerated against the post-fix baseline.** Lower bars (single test-grep run, or focused 3x runs of the 5 tests) are insufficient. The verification artifact is one canonical Playwright invocation: `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json`. The 5 tests must appear `passed` in that JSON. The full-suite invocation also serves as the input to D-08 (constants regeneration) — single capture, dual purpose.

- **D-08: Phase 64 owns parity-script constants regeneration.** Phase 63's D-13 had earmarked this for `/gsd-complete-milestone`. Phase 64 absorbs the responsibility because the Phase 64 post-fix baseline IS the v2.6 anchor; deferring constants regeneration would force `/gsd-complete-milestone` to redo a full capture. Phase 64 therefore:
  - Captures `playwright-report.json` at `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` (mirrors Phase 63's `post-v2.6/` artifact location convention)
  - Regenerates `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS` constants in `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` from the new baseline (D-14 canonical refresh from Phase 63 — same logic, new input)
  - Commits both atomically (artifact + constants) as the Phase 64 milestone-anchor change
  - The v2.5 baseline at `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` is preserved (D-15 from Phase 63, honored)

- **D-09: imgproxy upload test + 13 cascades classify into `DATA_RACE_TESTS` in the regenerated constants.** Reasoning: the test isn't deterministically broken — it's flaky tied to a flaky upstream (imgproxy Docker container 502s). `DATA_RACE_TESTS` semantics ("intermittent-allowed; not-counted-as-regression") fit the actual behavior. Future captures that PASS the upload test shrink the data-race pool naturally. Cascade tests (candidate-profile + candidate-app-settings + candidate-app-password + re-auth-setup, 13 tests total per Phase 63 diff.md) follow the same classification because their pass/fail outcome is structurally tied to the imgproxy upstream. The 1 imgproxy direct + 13 cascades are therefore NOT regressions in the regenerated baseline; they're tagged data-race.

- **D-10: Phase 62 deferred 9-step manual smoke checklist (`62-03-HUMAN-CHECKPOINT.md`) is cleared as part of Phase 64 verification.** The 5 E2E tests cover most of the 9 steps automatically; user runs the 9-step manual smoke once after Phase 64's executor completes; both phases close on the same gate. Items in the manual smoke not covered by E2E (notably dark-mode contrast assertion, step 7) are rolled into Phase 64's verification surface.

### Test Hygiene

- **D-11: `test.skip(true, ...)` paths in RESULTS-01/02, D-14, D-15 are removed once seed prerequisites are guaranteed.** Replace skip paths with hard assertions (`expect(filterButton.count()).toBeGreaterThan(0)`, `expect(firstCheckbox.count()).toBeGreaterThan(0)`) so a future seed regression produces a hard fail rather than silent skip. The skip paths were honest signals during Phase 62's data-uncertainty era; Phase 64's deterministic seed contract makes them obsolete.

- **D-12: Filter source for the deterministic contract = party filter (already implicit in e2e seed).** Candidates already have party affiliations via `nominate_for` in the e2e template. If the EnumeratedFilter for party isn't rendering today on the voter results page, fix the consumer-side wiring (D-04 minimum). Two follow-up todos capture the broader work for systematic filter coverage and suite-wide skip-path cleanup (Deferred Ideas).

### Plan Split

- **D-13: 3 plans, root-cause grouped.**
  - **Plan 64-01: Reactivity bridge** — RESULTS-01/02 + D-14 + D-15 (filter loop, scope reset, drawer-cycle persistence). Includes: Svelte 5 external-subscription research outcome integration (D-03), `initFilterContext` lifecycle audit + fix (D-02), conditional `@openvaa/filters` mutations (D-01), conditional dev-seed extension (D-04), skip-path removal (D-11), unit tests for any new helpers/accessors.
  - **Plan 64-02: Deeplink load chain** — D-08 shape 3 + D-08 shape 4. Reproduction-first investigation (D-05/D-06). Fix scope likely spans `+layout.svelte` (`drawerEntity` derivation, voterCtx.matches readiness), `+layout.ts` / `+page.ts` (coupling-guard interactions), and possibly `voter.fixture.ts` if direction (c) lands.
  - **Plan 64-03: Verification + close** — full v2.6 parity capture, post-fix artifact (`post-fix/playwright-report.json`), parity-script constants regeneration (D-08), 9-step Phase 62 manual smoke clearance (D-10), Phase 64 verification report.
  - Plans run sequentially: 64-01 → 64-02 → 64-03. 64-01 may surface architectural decisions (e.g., narrowing `@openvaa/filters` per D-03) that influence 64-02's fix space; sequencing avoids parallel rework.

### Claude's Discretion

- Exact Svelte 5 best-practice pattern selection for the external-subscription bridge — researcher surveys and recommends; planner picks based on which option closes RESULTS-01/02 + D-14 + D-15 most cleanly with the lowest blast radius. The narrowing-of-`@openvaa/filters` decision in D-03 is gated on this output.
- Whether `initFilterContext` is fixed in-place (e.g., `$effect.root()`) vs replaced by a component-side bridge inside `EntityListWithControls` — both are eligible per D-02; planner picks based on which preserves the existing API contract better.
- Specific shape of `@openvaa/filters` API additions if any (e.g., `getSnapshot()` vs `subscribe()` vs immutable rule snapshots) — D-01 sets the agnosticism constraint; planner picks the API shape.
- Whether D-08 shape 4 (orgs list + candidate drawer) requires a separate fix or rides the same fix as shape 3 — likely the same, but reproduction will confirm.
- Whether to capture and ship a `dev:reset-with-imgproxy` script as a side artifact (low value; user can invoke `supabase stop && supabase start` directly).
- Test sequencing within 64-01: whether to fix RESULTS-01/02 first (most architectural) or D-14/D-15 first (probably blocked by RESULTS-01/02 anyway). Planner's call.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements

- `.planning/ROADMAP.md` §Phase 64 — Goal, Depends on (Phase 63), Out of scope (imgproxy infrastructure flake)
- `.planning/REQUIREMENTS.md` §RESULTS — RESULTS-01/02/03 requirement text (parent requirements; Phase 62 was the primary closer, Phase 64 closes the residual)
- `.planning/STATE.md` §Session Continuity — v2.6 milestone status; Phase 63-03 stopped-at line cites the 5 voter-results residuals

### Prior-Phase Context (LOCKED architecture — do not contradict)

- `.planning/phases/62-results-page-consolidation/62-CONTEXT.md` — D-01..D-15 architectural decisions LOCKED for Phase 64 (compound EntityListWithControls, filterContext, 4-segment route shape, drawer-first paint, URL-as-SoT)
- `.planning/phases/62-results-page-consolidation/62-03-PLAN.md` + `62-03-SUMMARY.md` — Plan 62-03 implementation log; reference for what was completed vs deferred
- `.planning/phases/62-results-page-consolidation/62-03-HUMAN-CHECKPOINT.md` — 9-step manual smoke checklist deferred from Phase 62; Phase 64 D-10 absorbs it into Phase 64 verification
- `.planning/phases/62-results-page-consolidation/62-RESEARCH.md` — Phase 62's research §Pattern 1 (version-counter bridge), §Pitfall 1 (`Filter._rules` is plain JS not `$state`), §Pitfall 2 (cleanup return for $effect)
- `.planning/phases/62-results-page-consolidation/62-VERIFICATION.md` — Phase 62 goal-backward analysis

### Prior-Phase Artifacts (Phase 63 baseline + parity gate)

- `.planning/phases/63-e2e-template-extension-greening/63-CONTEXT.md` D-12, D-13, D-14, D-15 — re-anchor methodology + ownership split (Phase 64 D-08 supersedes Phase 63 D-13's `/gsd-complete-milestone` ownership claim)
- `.planning/phases/63-e2e-template-extension-greening/63-03-SUMMARY.md` — Phase 63 final parity gate log; 5 voter-results residuals classified Category A; budget consumed 1/3
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` — v2.6 baseline (current state Phase 64 measures forward from); 4550 lines
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md` — 19-regression classification; lines 33-42 enumerate the 5 voter-results residuals with status changes
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — parity gate tool; Phase 64 D-08 regenerates its embedded constants from new baseline
- `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — v2.5 baseline, preserved (D-15 honored)

### Target Files — Reactivity Bridge (Plan 64-01)

- `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` — 123 lines; **primary lifecycle audit target** (D-02). `$effect` at lines 80-88 attaches/detaches `FilterGroup.onChange` handler; suspected to mis-mount on cold deeplinks. The version-counter bridge pattern (line 45-46, 84) may be replaced wholesale per D-03 outcome.
- `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` + `__tests__/FilterContextHarness.svelte` + `__tests__/GetFilterContextHarness.svelte` — existing unit-test harness; extend for new reactivity contract
- `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` — `FilterContext` interface; may evolve per D-03 (e.g., add `subscribe()` / `getSnapshot()`)
- `apps/frontend/src/lib/contexts/filter/index.ts` — barrel export
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — bundles filterContext (D-05 from Phase 62); may need init-order changes if D-02 audit relocates the bridge
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` — 221 lines; consumes `fctx.version` (line 110) inside `$derived.by`; consumer-side bridge replacement target if D-03 outcome requires it
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` — pure `computeFiltered` / `countActiveFilters` helpers
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts` — existing unit-test scaffold; extend
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — 414 lines; consumer site for filter rendering; the EnumeratedFilter for party should render here for the deterministic contract (D-12)

### Target Files — `@openvaa/filters` (conditional, Plan 64-01)

- `packages/filters/src/group/filterGroup.ts` — `class FilterGroup`, `_onChange: Set<callback>` registry (line 17), `doOnChange` dispatch (line 101), `onChange(handler, add)` (line 109). Conditional mutation target subject to D-01 agnosticism constraint and D-03 outcome.
- `packages/filters/src/filter/base/filter.ts` — `Filter` base class with `_rules` and `setRule`; conditional mutation target.
- `packages/filters/src/index.ts` — public surface; any API additions land here.
- `packages/filters/tests/filter.test.ts` — extend with new contracts if API changes.

### Target Files — Deeplink Load Chain (Plan 64-02)

- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` lines 161-186 — `drawerVisible` and `drawerEntity` $derived; suspected component-side gap on cold-nav (D-05 direction (a))
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.ts` — canonical redirect (D-05 direction (b))
- `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts` — coupling-guard redirect (D-05 direction (b))
- `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte` — empty placeholder (Phase 62 reduced); verify still empty
- `tests/tests/fixtures/voter.fixture.ts` lines 52-90 — `answeredVoterPage` fixture (D-05 direction (c)); terminal wait at line 84 for `testIds.voter.results.list` = `voter-results-list` testid
- `apps/frontend/src/lib/utils/entityDetails/getEntityAndTitle.ts` — referenced by `drawerEntity`; verify error-path semantics on missing matches

### Target Files — Test Hygiene + Verification (Plans 64-01 + 64-03)

- `tests/tests/specs/voter/voter-results.spec.ts` lines 150-306 — the 5 failing tests; lines 169-181, 202-213, 232-243 contain the `test.skip(true, ...)` paths that D-11 removes
- `tests/tests/utils/testIds.ts` line 105-110 — voter results testid registry
- `tests/playwright.config.ts` — canonical invocation: `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json`
- `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` — **NEW** target path for Phase 64 baseline artifact (D-08)

### Target Files — Dev-Seed (conditional, Plan 64-01)

- `packages/dev-seed/src/templates/e2e.ts` — base e2e template; potentially extended to guarantee filter-target seed (D-04). Confirm during reproduction whether existing party affiliations already meet contract.
- `packages/dev-seed/src/types.ts` — template type; only modified if a new field is needed
- `tests/seed-test-data.ts` — thin wrapper over dev-seed; reference only

### Cross-Phase Methodology (read for parity-script regeneration)

- Phase 60 §Common Pitfalls + Phase 60 RESEARCH.md `effect_update_depth_exceeded` root cause and `get(store) + untrack(() => store.update(...))` workaround — apply if any FilterGroup mutation lands inside `$effect`
- Phase 63 D-14 — canonical refresh logic for `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS`; Phase 64 D-08 reuses this exact methodology

### External References (research targets — Plan 64-01)

- Svelte 5 official docs §reactivity, §runes, §$effect — researcher surveys for `$effect.root()` semantics and external-subscription idioms
- `svelte/reactivity` package — verify presence/absence of `createSubscriber` or equivalent canonical bridge
- Svelte GitHub issues: search "external subscription", "$effect.root", "non-component reactivity" for known patterns and pitfalls
- `mcp__context7__*` Svelte docs lookup for canonical patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`FilterGroup._onChange: Set<callback>`** — already framework-agnostic (`packages/filters/src/group/filterGroup.ts:17`). Pure-JS subscription registry. Phase 64's filtersContext bridge wires Svelte reactivity on top of this; the bridge itself is the bug surface, not the registry.
- **`FilterGroup.apply(entities)`** — pure function (no side effects). Safe inside `$derived`.
- **`computeFiltered` / `countActiveFilters`** helpers in `EntityListWithControls.helpers.ts` — pure; existing unit-test coverage; reuse unchanged unless D-03 narrowing reshapes the bridge contract.
- **Phase 62 `$derived.by` + `void version` dependency-edge pattern** in `EntityListWithControls.svelte:109-117` — proven technique for forcing re-evaluation when external state changes; may be retained or replaced per D-03.
- **Phase 60 `get(store) + untrack(() => store.update(...))` idiom** — applied if any filter-state mutation lands inside `$effect` triggering `effect_update_depth_exceeded`. Don't reach for it preemptively; only if reproduction shows the symptom.
- **Phase 63's parity-gate diff script** at `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — canonical comparison tool; Phase 64 D-08 regenerates its constants but does not modify the script.
- **`SupabaseAdminClient` deterministic seed flow** + `runPipeline(template, overrides)` — Phase 63 E2E-02 established the e2e template pattern for app_settings; Phase 64 D-04 may extend the same template if filter prerequisites need fortification.

### Established Patterns

- **URL-as-single-source-of-truth (Phase 62 D-09, D-13)** — Tabs index, drawer visibility, active entity type all `$derived` over `page.params`. Phase 64 inherits this verbatim. New bridges must not introduce `$state` twins for URL-derivable state.
- **Context-per-concern composition** — `lib/contexts/<concern>/<concern>Context.svelte.ts` exports `init<Concern>Context()` and `get<Concern>Context()`. `filterContext` follows this pattern; if D-02 fix relocates the bridge, the location pattern is preserved.
- **Drawer-first source order + `content-visibility: auto`** — Phase 62 D-10. Don't reorder DOM in `+layout.svelte` even when fixing deeplink-render bugs; the source-order contract is binding.
- **Param matchers** — `entityTypePlural.ts` and `entityTypeSingular.ts` (Phase 62 D-11) — read-only references for Phase 64.
- **UI-framework agnosticism for `@openvaa/filters`** — D-01 hard constraint. The package's existing `_onChange` callback registry is acceptable today (pure-JS); future changes must preserve agnosticism.

### Integration Points

- **`+layout.svelte:362-383`** is where `EntityListWithControls` consumes `voterCtx.matches[activeElectionId]?.[activeEntityType]` and `entities`. The drawerEntity branch (lines 165-186) is a parallel consumer of `voterCtx.matches`. If `voterCtx.matches` is unpopulated on cold-nav (D-05 direction (a)), both branches degrade silently — research must trace this end-to-end.
- **`voterContext.svelte.ts`** initializes filterContext (Phase 62 D-05). If D-02 relocates the bridge, the init-order through `voterContext` may need adjustment.
- **`page.params.entityTypeSingular` + `page.params.id`** — drawer visibility gate (`drawerVisible = $derived(...)` at +layout.svelte:161-163). Coupling-guard redirect in `+page.ts` enforces both-or-neither; Phase 62 D-11 contract.
- **Parity-script constants** — embedded in `diff-playwright-reports.ts`. Phase 64 D-08 regenerates them as a single canonical refresh from the post-fix baseline; no incremental edits.

</code_context>

<specifics>
## Specific Ideas

- **UI-framework agnosticism for `@openvaa/filters`** is a HARD constraint (D-01). The package today is consumable by any UI framework — Svelte is the only consumer in tree, but the package's value proposition includes "external deployers can consume without choosing Svelte". Phase 64 may add to `@openvaa/filters` but must not introduce Svelte-specific primitives (`$state`, `$derived`, `svelte/store`, `svelte/reactivity`).
- **Conditional package narrowing** (D-03) is a research-gated decision. If Svelte 5 best practice for external subscriptions reveals that the `onChange` callback paradigm is fundamentally a poor fit, the planner may decide to **drop the subscription model from `@openvaa/filters` entirely** and restrict the package to abstract filtering logic (pure functions + immutable state). Consumers then own all reactivity. This is a valid Phase 64 outcome conditional on the research; it's not the default.
- **Single full-suite capture serves dual purpose** (D-07 + D-08) — the canonical `--workers=1 --reporter=json` invocation that verifies the 5 tests is the SAME run that produces the post-fix baseline JSON for constants regeneration. Don't run it twice.
- **Imgproxy reclassification to `DATA_RACE_TESTS`** (D-09) is a deliberate choice over `CASCADE_TESTS`. Rationale: the upload test's failure mode is genuinely flaky (Docker container 502s), not deterministic. `DATA_RACE_TESTS` semantics ("intermittent-allowed; pass-set growth doesn't require these") fits. Future runs that PASS the upload naturally shrink the data-race pool.
- **Phase 62 9-step manual smoke folded into Phase 64** (D-10) — closes both phases on one user-facing verification gate. User runs `yarn dev:reset-with-data && yarn dev`, walks the 9 steps once, signs off; 62 + 64 close together.
- **Reproduction-first for D-08 shapes 3+4** (D-05/D-06) — user explicitly declined to pre-rank investigation directions. Researcher reproduces locally, ranks from observation. The three plausible roots are documented for context, not as a sequencing prescription.

</specifics>

<deferred>
## Deferred Ideas

- **Sweep all `EntityList` consumers across the candidate-app and other surfaces to migrate to `EntityListWithControls`** — Phase 62's deferred follow-up; remains deferred. Phase 64 only touches voter results.
- **Extend e2e tests to cover ALL supported filter types systematically** — currently only the implicit party filter is exercised by RESULTS-01/02 + D-14 + D-15. Add e2e tests covering: NumberFilter, TextFilter (beyond search), additional EnumeratedFilter sources (categorical question filters), nested FilterGroup compositions. Captured as a follow-up todo (file under `.planning/todos/pending/`).
- **Sweep the entire E2E suite for `test.skip(true, ...)` modifiers and remove them where prerequisites can be made deterministic** — broader cleanup: every `test.skip(true, ...)` is a place where the test contract is data-dependent. Replace with hard assertions where possible; document the remainder. Captured as a follow-up todo.
- **Deeper voter-app reactivity refactor** — `voterContext` shape, election persistence in URL, `fromStore`/`toStore` bridge retirement. Out of v2.6 scope; revisit in a later milestone.
- **Wider audit of `$effect` lifecycle in non-component contexts across the app** — if D-02 reveals `initFilterContext`'s pattern is buggy, similar patterns may exist in other `lib/contexts/*/initXContext()` functions. Audit captured as follow-up; Phase 64 only fixes filterContext.
- **Declarative test-scoped settings/seed mutation DSL** — Phase 63 deferred idea; remains relevant if future test-hygiene work expands.
- **`@openvaa/filters` API redesign post-narrowing** — if D-03 narrows the package, a follow-up phase formalizes the new API surface, drops `_onChange`, and provides a Svelte-native consumer-side bridge utility (lives outside the package, e.g., in `apps/frontend/src/lib/contexts/filter/` or a new `@openvaa/filters-svelte` package). Phase 64 ships the narrowed package; the consumer-side helper is a separate concern.
- **Imgproxy resilience** — `dev:reset` could include `supabase stop && supabase start` to refresh the imgproxy container. STATE.md documents this as known infrastructure debt; a small DX-improvement phase could address it.
- **Centralized overlay architecture** — Phase 60 deferred; Phase 62 deferred; Phase 64 deferred. Consistent "later" classification.
- **Snippet-based controls customization for `EntityListWithControls`** — Phase 62 D-03 locked fixed layout; Phase 64 doesn't revisit.

### Reviewed Todos (not folded)

- None — Phase 64 scope is precisely the 5 voter-results residuals + parity-gate close. No additional pending todos surface as in-scope.

</deferred>

---

*Phase: 64-voter-results-reactivity-completion*
*Context gathered: 2026-04-27*
