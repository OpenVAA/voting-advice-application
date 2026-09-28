# Phase 92: E2E test infrastructure hardening - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the e2e test suite's *infrastructure* (not its coverage) so it is type-safe, locator-stable, and configuration-consistent. Five fixed workstreams from ROADMAP.md:

1. **Typecheck + locator stability** — typecheck all tests under `tests/`, fix all warnings/errors; eliminate truly-raw locators; prefer testIds over `getByRole` where a testId exists.
2. **goToPage/expectPageVisible paradigm** — add these two methods to every navigated/asserted page fixture and migrate raw `page.goto`/URL expectations to them.
3. **Timeout consolidation** — one semantic-buckets timeouts file, used everywhere, with documented inline exceptions.
4. **Flag questionable diagnosis** — mark the prior imgproxy/pooler diagnosis as questionable.
5. **Freshness-guard fix** — stop the `Database is NOT fresh` guard from false-positiving on auto-seeded baseline rows.

This phase does NOT add new test surfaces/specs — it hardens the scaffolding under the existing suite. New test *coverage* is out of scope.

</domain>

<decisions>
## Implementation Decisions

### Locator stability (Workstream 1)
- **D-01:** Forbidden locators (enforce via an eslint rule set to **error** so they cannot regress): bare `page.locator(...)`, `getByText(...)`, and chained `.locator(...)`. Scout count = 7 occurrences (2 `page.locator` + 1 `getByText` + 4 chained `.locator`). Fix all 7. Prefer `eslint-plugin-playwright`'s `no-raw-locators` (or equivalent) if the installed version supports it; otherwise a custom rule.
- **D-02:** `getByRole(...)` stays an **allowed** locator (a11y-semantic, Playwright-recommended) — it is NOT on the forbidden list. Scout count = 115 occurrences; do not blanket-migrate them.
- **D-03:** **testId-preference sweep:** wherever an element accessed via `getByRole(...)` already has — or reasonably warrants — a stable testId, migrate that call to `getByTestId(...)`. `getByRole` remains only where no dedicated testId is appropriate (pure semantic roles with no distinct element). This sweep is one-time + code-review enforced; a lint rule cannot detect "a testId exists," so the lint rule (D-01) only guards the truly-raw patterns.
- **D-04:** testIds accessed via the shared `testIds` catalog (scout count = 333 `getByTestId`) are the canonical, preferred access path — unchanged.
- **D-05:** Typecheck: `tests/` currently has no own `tsconfig.json`/`package.json` typecheck script (delegated to root). Researcher/planner to establish how tests are typechecked and wire a green typecheck for everything under `tests/`, fixing all surfaced errors/warnings.

### goToPage / expectPageVisible paradigm (Workstream 2)
- **D-06:** `goToPage(locale?: string)` **navigates AND asserts visibility** — it internally calls `expectPageVisible(true)` so a stable element confirms load before the test proceeds. One call replaces the old goto+wait pattern.
- **D-07:** `expectPageVisible(visible = true)` stays a public method for explicit re-checks and negative (`visible=false`) assertions.
- **D-08:** Locale handling: `goToPage(locale?)` builds the locale-aware URL respecting the app's optional `[[lang=locale]]` segment (omitted ⇒ default locale).
- **D-09:** **Full coverage:** every page a spec navigates to (`page.goto`) OR asserts a URL/visibility on gets a fixture with `goToPage` + `expectPageVisible`. This **includes rebuilding the voter-side page fixtures** (home, intro, questions, results, entity-detail) whose `pages/voter/*` page objects were just deleted. Scout: ~22 fixtures exist (candidate-heavy + results); 69 raw `page.goto` calls to migrate. Each fixture's `expectPageVisible` must key on a stable testId that confirms that page loaded — extend testIds where one is missing.

### Timeout consolidation (Workstream 3)
- **D-10:** Single exported object of **named semantic buckets** covering the union of current uses — e.g. `{ element, click, page, slowPage, testMax }` — each documented with when to use it. Derive the canonical bucket set from the actual current local `TIMEOUT` shapes (`{element,click,page,slowPage}` and `{testMax,slowPage,element}`).
- **D-11:** File location: `tests/tests/helpers/timeouts.ts`, exported via the existing helpers barrel (`tests/tests/helpers/index.ts`).
- **D-12:** Documented exceptions (single-test total timeouts that don't fit a bucket) stay **inline at the call site** with a required `// reason:` comment — matches the repo's existing `// reason:` convention (CLAUDE.md). Replace scattered hardcoded values (`10000/15000/30000/45000/60000`) and the per-spec local `TIMEOUT` objects with imports from the central file; `playwright.config.ts`'s global `timeout: 90000` is the per-test ceiling and may reference the central `testMax` bucket.

### Questionable-diagnosis flag (Workstream 4)
- **D-13:** Annotate the prior diagnosis ("Storage/imgproxy healthy but `supabase_edge_runtime` + `supabase_pooler` were stopped — already-tracked imgproxy/storage-decoupling flakiness, unrelated to the answers data model; logged but not fixed") as **questionable**. Planner to mark it clearly wherever it is recorded (inline comment at the relevant test/setup site and/or the originating STATE/todo entry) so future readers do not trust it as settled. This is a documentation/annotation task, not a re-investigation.

### Freshness-guard fix (Workstream 5)
- **D-14:** Keep the guard's **warn-only default** (warn-and-proceed); `E2E_REQUIRE_FRESH_DB=true` still opts into hard-fail. Behavior change is limited to making detection accurate.
- **D-15:** Make detection **seed-aware via a sentinel prefix**: rows that are intentionally/auto-seeded as a persistent baseline should carry a recognizable `external_id` prefix, and the guard treats any row with that prefix as expected/fresh (alongside the current per-template test prefix). User-proposed sentinel name: `global-seed` (or similar). **Open for research:** the dev-seed default already uses prefix `seed_` (`packages/dev-seed/src/ctx.ts:89`); there is **no** `apps/supabase/seed.sql` seeding entities. Researcher must (a) pin down the actual origin/prefix of the ~2 false-positive non-test candidates/orgs, and (b) decide whether to **reuse the existing `seed_` prefix** as the allowlist or **introduce a dedicated `global-seed` sentinel** for rows meant to persist across e2e runs. The probe (`setupFromTemplate.ts:84-121` + mirror in `data.setup.ts`) currently excludes only `${prefix}%`; extend it to also exclude the auto/baseline-seed prefix.

### Claude's Discretion
- Exact eslint rule/config for D-01 (plugin rule vs custom), the canonical timeout bucket names/values, the precise per-page stable testId chosen for each `expectPageVisible`, and how voter-side fixtures are structured — all left to research/planning, consistent with existing fixture conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase definition
- `.planning/ROADMAP.md` §"Phase 92: E2E test infrastructure hardening" — the five fixed workstreams (scope anchor).

### Locator stability + typecheck (WS1)
- `tests/playwright.config.ts` — global `timeout: 90000`; suite config.
- `tests/tests/helpers/index.ts` — helpers barrel (will host `timeouts.ts`).
- testIds catalog (the `testIds` constant imported across specs — researcher to locate exact path) — canonical element-access surface.

### goToPage / fixture paradigm (WS2)
- `tests/tests/fixtures/candidate/candidate-mega.ts` — candidate composition root (11 fixtures).
- `tests/tests/fixtures/voter-mega.fixture.ts` — voter journey composition root.
- `tests/tests/fixtures/views.ts` — voter/results composition root.
- `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts` — representative per-page fixture shape (`expectTasks`, `expectStatusMessage`, `clickTask`, …).
- Recently deleted `pages/voter/*` (HomePage, IntroPage, QuestionsPage, ResultsPage, EntityDetailPage) — voter fixtures to be rebuilt under the function-fixture paradigm.
- `tests/tests/helpers/navigation.helper.ts` / `settle.helper.ts` — existing goto/settle helpers the migration replaces or wraps.

### Freshness guard + seed (WS5)
- `tests/tests/setup/setupFromTemplate.ts` §`probeFreshDatabasePrecondition` (lines ~84-121) — the guard to fix.
- `tests/tests/setup/data.setup.ts` (lines ~76-120) — mirror guard implementation (fix both).
- `packages/dev-seed/src/ctx.ts:89` + `packages/dev-seed/src/writer.ts:142` — `externalIdPrefix` default `'seed_'`.
- `packages/dev-seed/src/supabaseAdminClient.ts:654-660` — `external_id LIKE '${prefix}%'` query shape.
- `packages/dev-seed/README.md` — template authoring + prefix conventions.

### Conventions
- `CLAUDE.md` — `// reason:` inline-rationale convention (used for D-12 timeout exceptions and any accepted-warning annotations); testId + fixture conventions from Phases 88–91.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Function-fixture paradigm + composition roots** (`candidate-mega.ts`, `voter-mega.fixture.ts`, `views.ts`): the established shape for new page fixtures — specs import the composition root directly; no per-fixture barrel.
- **Existing helpers barrel** (`tests/tests/helpers/index.ts`): drop-in home for the new `timeouts.ts`.
- **testIds catalog** (333 `getByTestId` consumers): canonical element access; extend it where a page lacks a stable load-confirming testId.
- **Existing local `TIMEOUT` objects** (in `voterIntro.ts`, `candidate-mega-journey.spec.ts`, `voter-mega-journey.spec.ts`, `perm-localisation-positive.spec.ts`): seed the canonical bucket set, then delete in favor of imports.

### Established Patterns
- Locator access already dominated by testIds (333) + getByRole (115); only 7 truly-raw locators remain — small, surgical WS1 fix plus the testId-preference sweep over getByRole.
- `external_id` prefix-based row scoping (`${prefix}%`) is the existing idiom for distinguishing test data — the WS5 fix extends this same idiom to the baseline-seed prefix.
- `// reason:` inline rationale blocks (CLAUDE.md) — reuse for documented timeout exceptions and the WS4 questionable-diagnosis annotation.

### Integration Points
- WS2 migration touches all ~22 fixtures + 69 `page.goto` call sites + may extend the testIds catalog.
- WS5 fix touches BOTH guard implementations (`setupFromTemplate.ts` + `data.setup.ts`) and may touch the seed mechanism (dev-seed prefix or a new sentinel).
- WS1 lint rule integrates into the repo `lint:check`/`lint:fix` pipeline.

</code_context>

<specifics>
## Specific Ideas

- User refinement on locators: not a binary "kill getByRole" — keep it, but **migrate getByRole → testId wherever a testId is available**. The 7 truly-raw locators are the only hard-forbidden set.
- User refinement on freshness guard: prefer a **sentinel prefix** for auto-seeded rows (proposed `global-seed`) over a hardcoded count threshold or per-row allowlist, so any baseline-seed row is unambiguously recognized as fresh.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (The four todo-matcher hits — party-app generalization, app-shared paradigm, mergeSettings re-exports, alliance-tab — were spurious keyword matches unrelated to e2e infra hardening and were not folded.)

</deferred>

---

*Phase: 92-e2e-test-infrastructure-hardening*
*Context gathered: 2026-06-02*
