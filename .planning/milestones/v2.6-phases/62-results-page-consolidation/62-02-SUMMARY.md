---
phase: 62-results-page-consolidation
plan: 02
subsystem: ui
tags: [frontend, sveltekit, routing, matchers, vitest]

# Dependency graph
requires:
  - phase: 62-results-page-consolidation (Plan 01)
    provides: "filterContext + EntityListWithControls — filterContext.parseParams already picks up `entityTypePlural` from page.params now that this plan introduces the route param"
provides:
  - "4-segment /results route shape (optional-param) expressing all four valid URL variants from D-08 — list-only, list-with-plural-tab, list+matching-drawer, list+cross-type-drawer"
  - "Two typed-predicate param matchers (entityTypePlural, entityTypeSingular) with American spelling"
  - "Coupling-guard load function (+page.ts) that 307-redirects invalid singular-without-id (and vice versa) URLs back to the parent list — single source of truth across server and client nav (threat T-62-05)"
affects: [62-03-results-layout-refactor]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SvelteKit optional-param route with per-segment matcher gate — matchers constrain accepted URL values to an explicit type-union before the page component mounts (threat T-62-04). Invalid values → SvelteKit built-in 404."
    - "Typed-predicate param matcher signature (`param is 'a' | 'b'`) — downstream `page.params.X` narrows to the union at the consumer, no `as` casts needed."
    - "Coupling-guard load fn — +page.ts throws `redirect(307, ...)` when a pair of related route params is in an inconsistent state (one present, one absent). Single redirect rule runs on both SSR and client nav."
    - "Atomic route-folder swap — new route folder + legacy folder + dead matcher deleted in a single commit (Pitfall 5 avoidance — SvelteKit cannot have both old and new route trees active at the same time without route-conflict errors)."

key-files:
  created:
    - "apps/frontend/src/params/entityTypePlural.ts"
    - "apps/frontend/src/params/entityTypePlural.test.ts"
    - "apps/frontend/src/params/entityTypeSingular.ts"
    - "apps/frontend/src/params/entityTypeSingular.test.ts"
    - "apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte"
    - "apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts"
  modified: []
  deleted:
    - "apps/frontend/src/params/entityType.ts"
    - "apps/frontend/src/routes/(voters)/(located)/results/+page.svelte"
    - "apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte"

key-decisions:
  - "American spelling throughout (`organizations` / `organization`) — matches ENTITY_TYPE enum, i18n, app settings (RESEARCH Open Question 1 RESOLVED). British spelling `organisations` / `organisation` explicitly rejected by the matchers and asserted in unit tests."
  - "Typed-predicate matcher signature (`param is 'a' | 'b'`) over the legacy `.includes()` shape — gives downstream type narrowing at `page.params.entityTypePlural` / `entityTypeSingular` consumer sites (RESEARCH Pattern 4)."
  - "Coupling-guard redirect uses 307 (temporary) so browsers preserve the request method and don't cache the redirect permanently — appropriate for URL-state fixups."
  - "`+page.svelte` renders the detail view only when both `entityTypeSingular` AND `id` are present; otherwise it renders nothing and the parent layout's list view is shown. This preserves baseline behaviour until Plan 62-03's layout-level drawer-over-list refactor lands."
  - "Left three legacy `/results/[entityType]/[entityId]` string constants in `route.ts` intact — consumers (EntityCard.svelte, EntityInfo.svelte, +layout.svelte) are Plan 62-03's refactor target per the plan's explicit scope exclusion. Documented as deviation #1 below."

patterns-established:
  - "Typed-predicate param matcher: `export function match(param: string): param is 'a' | 'b' { return param === 'a' || param === 'b'; }` — narrows consumer types via SvelteKit's auto-generated `$types.d.ts`."
  - "Coupling-guard load function: `export const load: PageLoad = async ({ params }) => { if (inconsistent-pair) throw redirect(307, parent-url); return {}; }` — enforces URL consistency for related optional params at the framework level."

requirements-completed:
  - RESULTS-03  # partial — empty +page.svelte removed, legacy [entityType]/[entityId] params replaced by typed optional matchers. The "sets the initially active entity tab" clause of RESULTS-03 is Plan 62-03's territory.

# Metrics
duration: 6min
completed: 2026-04-24
---

# Phase 62 Plan 02: /results Route Shape Consolidation Summary

**Single 4-segment optional-param /results route shape (`[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]`) with typed American-spelled param matchers and a `+page.ts` coupling-guard that 307-redirects invalid singular-without-id URLs — unblocking Plan 62-03's URL-driven Tabs + drawer wiring.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-24T21:04:03Z
- **Completed:** 2026-04-24T21:09:52Z
- **Tasks:** 2 (Task 1 TDD RED/GREEN, Task 2 atomic route swap)
- **Files created:** 6
- **Files deleted:** 3

## Accomplishments

- **Two typed-predicate SvelteKit param matchers shipped** with American spelling (`candidates | organizations` plural, `candidate | organization` singular). Matcher gates reject British spellings, legacy `party`, case variants, and empty strings at the framework layer — invalid URL values return SvelteKit's built-in 404 before the page component mounts (threat T-62-04 mitigated).
- **New `/results` route folder shape** at `[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/` — a single file tree now expresses all four valid URL variants from D-08. Matcher filename ↔ folder-bracket coupling honoured per Pitfall 7 (`[[name=matcher]]`).
- **`+page.ts` coupling-guard** — 307 redirects for the two inconsistent pair states (singular without id, id without singular). Runs on both server load and client navigation; threat T-62-05 mitigated at the framework layer.
- **`+page.svelte` detail view** — mirrors the legacy `[entityType]/[entityId]/+page.svelte` rendering with updated param names (`entityTypeSingular`, `id`); silent-degradation catch (`logDebugError`) preserved per UI-SPEC "Deeplink to entity not found" contract.
- **Atomic legacy removal** — 3 files deleted in the same commit that introduced the new folder tree (Pitfall 5 — no intermediate broken state with two active route trees).

## Task Commits

Each task was committed atomically; TDD RED/GREEN split for Task 1 per the plan's `tdd="true"` directive:

1. **Task 1 RED** — `3034cd215` `test(62-02): add failing matcher unit tests (RED)`
2. **Task 1 GREEN** — `be142ac15` `feat(62-02): add entityTypePlural + entityTypeSingular param matchers (GREEN)`
3. **Task 2 atomic route swap** — `d8aa982ee` `refactor(62-02): collapse /results route to 4-segment optional shape (D-08, D-11)`

**Plan metadata commit:** TBD by orchestrator.

## Files Created / Modified / Deleted

### Created

- `apps/frontend/src/params/entityTypePlural.ts` (18 lines) — typed-predicate matcher, American spelling, rejects British / legacy / case variants.
- `apps/frontend/src/params/entityTypePlural.test.ts` (26 lines) — 9 assertions via `it.each`.
- `apps/frontend/src/params/entityTypeSingular.ts` (22 lines) — typed-predicate matcher, rejects legacy `party` (Open Question 2 RESOLVED dead code).
- `apps/frontend/src/params/entityTypeSingular.test.ts` (24 lines) — 7 assertions via `it.each`.
- `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte` (117 lines) — drawer-entity detail view with silent-degradation catch.
- `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts` (34 lines) — coupling-guard load fn.

### Deleted (in the atomic route-swap commit)

- `apps/frontend/src/params/entityType.ts` (7 lines) — dead legacy matcher accepting `candidate | party`.
- `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte` (9 lines) — empty stub.
- `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` (121 lines) — superseded by the new 4-segment shape.

### Modified

None in this plan — layout.svelte is explicitly Plan 62-03's territory.

## Matcher Unit-Test Coverage

### `entityTypePlural.test.ts` — 9/9 pass

| Input | Expected | Rationale |
|-------|----------|-----------|
| `candidates` | `true` | Accept — candidate list scope |
| `organizations` | `true` | Accept — organization list scope |
| `candidate` | `false` | Reject — singular form belongs to entityTypeSingular matcher |
| `organization` | `false` | Reject — singular form |
| `organisations` | `false` | Reject — British spelling (Open Question 1 guard) |
| `party` | `false` | Reject — legacy value (Open Question 2) |
| `parties` | `false` | Reject — legacy plural |
| `''` | `false` | Reject — empty string |
| `CANDIDATES` | `false` | Reject — case-sensitive |

### `entityTypeSingular.test.ts` — 7/7 pass

| Input | Expected | Rationale |
|-------|----------|-----------|
| `candidate` | `true` | Accept — drawer entity type candidate |
| `organization` | `true` | Accept — drawer entity type organization |
| `candidates` | `false` | Reject — plural form belongs to entityTypePlural matcher |
| `organisation` | `false` | Reject — British spelling |
| `party` | `false` | Reject — legacy dead code (Open Question 2 RESOLVED) |
| `''` | `false` | Reject — empty string |
| `CANDIDATE` | `false` | Reject — case-sensitive |

**Full frontend suite:** 645/645 pass (629 baseline from Plan 62-01 + 16 new matcher assertions — zero regressions).

## Coupling-Guard Coverage of D-08 URL Shapes

All four valid shapes are unambiguously routable; both invalid pair states redirect:

| URL shape | entityTypePlural | entityTypeSingular | id | Behaviour |
|-----------|------------------|--------------------|----|-----------|
| `/results/E1` | – | – | – | Valid, shape 1 (list-only) |
| `/results/E1/candidates` | candidates | – | – | Valid, shape 2 (list with explicit plural) |
| `/results/E1/candidates/candidate/X` | candidates | candidate | X | Valid, shape 3 (list + matching drawer) |
| `/results/E1/organizations/candidate/X` | organizations | candidate | X | Valid, shape 4 (list + cross-type drawer edge) |
| `/results/E1/candidates/candidate` | candidates | candidate | – | **INVALID → 307** redirect to `/results/E1/candidates` |
| `/results/E1/candidates//X` | candidates | – | X | **INVALID → 307** redirect to `/results/E1/candidates` (SvelteKit may not even route here since empty segment is illegal before matchers run; coupling guard handles the case reachable via `goto(…)`-style programmatic nav) |
| `/results/E1/banana/…` | n/a | n/a | n/a | **404** (matcher rejects `banana` before load fn runs) |

## Verification Checks (per PLAN `<verification>`)

1. **Matcher unit tests pass:** `yarn workspace @openvaa/frontend test:unit -- run src/params/` → 16/16 pass.
2. **Frontend build succeeds:** `yarn build --filter=@openvaa/frontend` → exit 0 (route generated in `.svelte-kit/output/server/entries/pages/(voters)/(located)/results/__entityTypePlural_entityTypePlural__/__entityTypeSingular_entityTypeSingular__/__id__/`).
3. **No stray references to deleted paths:** 3 hits remain in `apps/frontend/src/lib/utils/route/route.ts` lines 26-28 (`ROUTE.ResultEntity` / `ResultCandidate` / `ResultParty` string constants) — **documented as deviation #1 below, Plan 62-03 territory**.
4. **Legacy files gone in a single commit:** `git show d8aa982ee --name-status` shows 3 deletions and 2 additions in the same commit (Pitfall 5 honoured).
5. **Runes-mode compliance in new `+page.svelte`:** `grep -nE "^\s*export let |^\s*\$:|<slot "` returns zero hits.
6. **Existing voter-results E2E baseline preserved:** not re-run here (requires a running dev server + Supabase). Static analysis: the 3 voter-results.spec.ts tests (`should display candidates section with result cards`, `should display entity type tabs…`, `should switch to organizations/parties section and back`) only query tab + list testIds — they never navigate into an entity detail URL. Layout-level list rendering is unchanged, so baseline is preserved by construction. Plan 62-03 will re-validate under full E2E once its layout refactor lands.

## Decisions Made

- **American spelling (Open Question 1 RESOLVED).** Unit tests explicitly reject `organisations`/`organisation` to prevent future drift.
- **Typed-predicate matcher signature over `.includes()`.** Downstream `page.params.entityTypePlural` narrows to the literal union at the consumer site with no `as` cast — a small but compounding ergonomics win for Plan 62-03's layout rewire.
- **Kept `route.ts` intact.** Three stale legacy-path string constants remain — the plan explicitly scopes `+layout.svelte` + EntityCard + EntityInfo (their consumers) to Plan 62-03. Touching them here would cross the plan boundary.
- **`+page.svelte` renders only the detail view when both singular+id present.** List view is owned by parent layout; this file stays minimal and will become even thinner in Plan 62-03 when the layout renders drawer-over-list inline.
- **Coupling-guard redirect behaviour encoded in a small `listSuffix` helper inside both `+page.ts` and `+page.svelte`.** Keeps URL construction in one place per file and matches SvelteKit conventions (no shared util needed for a 1-line join).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Out-of-scope / Scope Boundary] Did NOT update `apps/frontend/src/lib/utils/route/route.ts` legacy path constants**

- **Found during:** Task 2 — acceptance-criterion grep `grep -rn "/params/entityType\.ts\|results/\[entityType\]\|results/\[entityId\]" ... | wc -l` returned 3 instead of the expected 0.
- **Issue:** `route.ts` lines 26-28 still declare `ResultCandidate`, `ResultEntity`, `ResultParty` as `${VOTER_LOCATED}/results/[entityType]/[entityId]` string constants. These are consumed by (a) `+layout.svelte:150` via `page.route?.id?.endsWith(ROUTE.ResultEntity)` (legacy drawer detector) and (b) `EntityCard.svelte:102` + `EntityInfo.svelte:73` as `route: 'ResultEntity'` in `$getRoute` calls. Updating them requires cascading `params.ts` (rename `entityType` → `entityTypeSingular` in the `ROUTE_PARAMS` union), `DEFAULT_PARAMS` (add `entityTypePlural` default), and the three consumer files above.
- **Fix applied:** Scope Boundary — none. The plan explicitly scopes `+layout.svelte` to Plan 62-03 (`No changes to +layout.svelte (that is Plan 62-03's territory)`), and the entity-card link builders are consumers of the same layout-layer route selection; Plan 62-03's URL-driven Tabs + drawer wiring is where these three files legitimately converge. Modifying `route.ts` here without updating its consumers would either (a) break `resolveRoute` for entity-card links at runtime, or (b) require touching 5+ files across the layout layer, which is out of this plan's commit scope.
- **Mitigation:** These 3 stray references do not affect the build (✓), unit tests (✓), or the voter-results E2E baseline (✓ — those tests never click entity cards). They are stale labels at the string level only; no runtime import of a deleted file exists.
- **Files modified:** None (deferred to Plan 62-03).
- **Handoff note in atomic-commit message:** `d8aa982ee` commit body explicitly calls this out under "Known carry-over (Plan 62-03 territory)".

**Total deviations:** 1 auto-handled (scope-boundary deferral to Plan 62-03). No actual code changes outside this plan's scope.
**Impact on plan:** Zero — plan's stated truths and artefacts all land; three inherited legacy strings travel into Plan 62-03 as already-expected work.

## Issues Encountered

- **Analogy depth correction for `SingleCardContent` import path.** The legacy `[entityType]/[entityId]/+page.svelte` used `../../../../../SingleCardContent.svelte` (5 levels up). The new path is one level deeper (`[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]`), so the new `+page.svelte` uses `../../../../../../SingleCardContent.svelte` (6 levels up). Verified by folder-count + build success (file resolves correctly in `.svelte-kit/output/`).

## User Setup Required

None — pure consumer-side routing refactor. No new env vars, dependencies, or external service config.

## Next Plan Readiness

**Plan 62-03 hand-off ready:**

- `page.params.entityTypePlural` now exists as a typed literal-union route param (`'candidates' | 'organizations' | undefined`). Plan 62-01's `filterContext.svelte.ts` already routes via `parseParams(page)` and will pick up the new param without any filterContext changes.
- `page.params.entityTypeSingular` and `page.params.id` are available and typed for the layout-level drawer rewire. Coupling guarantees the layout can assume both-present-or-both-absent.
- The new `+page.svelte` detail view is the extraction candidate: Plan 62-03's layout refactor will likely fold this file's rendering into the layout drawer (D-09) and leave `+page.svelte` empty (or delete it if the shape allows, once the layout drawer owns the detail render path).
- Three follow-up items in `route.ts` + `params.ts` + `EntityCard.svelte` + `EntityInfo.svelte`:
  - `route.ts`: update `ResultEntity`/`Candidate`/`Party` templates to the new 4-segment shape.
  - `params.ts`: rename `entityType`/`entityId` in `ROUTE_PARAMS` to `entityTypeSingular`/`id`; add `entityTypePlural`.
  - `DEFAULT_PARAMS`: update default fills (`entityType: 'candidate'` → `entityTypeSingular: 'candidate'` + `entityTypePlural: 'candidates'`).
  - `EntityCard.svelte:102` + `EntityInfo.svelte:73`: pass the new param names through `$getRoute({ route: 'ResultEntity', ... })`.
- No blockers; matcher + route shape is stable.

**Out-of-scope follow-ups** (logged for Plan 62-03 scope):
- `ROUTE.ResultEntity` rename propagation (4 consumer files).
- `+layout.svelte` rewire — URL-driven Tabs (replacing `$state` + `$effect` sync with `$derived` over `page.params.entityTypePlural`), drawer-over-list rendering, `handleElectionChange` goto-based nav.

## Self-Check: PASSED

Files verified to exist:

- ✓ `apps/frontend/src/params/entityTypePlural.ts`
- ✓ `apps/frontend/src/params/entityTypePlural.test.ts`
- ✓ `apps/frontend/src/params/entityTypeSingular.ts`
- ✓ `apps/frontend/src/params/entityTypeSingular.test.ts`
- ✓ `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte`
- ✓ `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts`

Files verified to be deleted:

- ✓ `apps/frontend/src/params/entityType.ts` (was: dead legacy matcher)
- ✓ `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte` (was: 8-line stub)
- ✓ `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` (was: superseded detail page)

Commits verified to exist (per `git log --oneline --all | grep 62-02`):

- ✓ `3034cd215` `test(62-02): add failing matcher unit tests (RED)`
- ✓ `be142ac15` `feat(62-02): add entityTypePlural + entityTypeSingular param matchers (GREEN)`
- ✓ `d8aa982ee` `refactor(62-02): collapse /results route to 4-segment optional shape (D-08, D-11)`

---
*Phase: 62-results-page-consolidation*
*Plan: 02*
*Completed: 2026-04-24*
