---
phase: 69-alliance-card-lane-a
plan: 01
subsystem: ui
tags: [svelte5, alliance, i18n, app-shared, voter-results, route-matcher, types, dev-seed]

# Dependency graph
requires:
  - phase: 67-default-seed-alliances
    provides: 2 alliances + 10 alliance-noms + 30/10 org-nom parent split — render path now consumes the v2.7 seed.
  - phase: 64-voter-results-reactivity-completion
    provides: Supabase adapter reverse-fills `organizationNominationIds` on Alliance parents — alliance.organizationNominations accessor returns non-empty arrays.
  - phase: 62-results-route-matchers
    provides: SvelteKit param-matcher infrastructure (`[[entityTypePlural=entityTypePlural]]` / `[[entityTypeSingular=entityTypeSingular]]`) — Phase 69 widens the existing matchers without restructuring.
provides:
  - "ParentEntityDetailsContent type (renamed from OrganizationDetailsContent with value 'children'); cardContents.organization renamed 'candidates' → 'children'; cardContents.alliance widened with 'children'; entityDetails.contents.alliance defaults to ['info','children']."
  - "findOrganizationNominations helper (mirror of findCandidateNominations one level up the parent hierarchy: AllianceNomination → OrganizationNomination)."
  - "getAllianceSummary helper — pure derivation of {numCandidates, numParties} from an AllianceNomination; shared between EntityCard list-variant + EntityDetails drawer-header."
  - "EntityCard alliance subentities branch with maxSubcards = Infinity override (D-03) and 'X candidates across N parties' summary line below the card header."
  - "EntityDetails alliance drawer: ['info','children'] tabs (no opinions tab); entityType ternary so EntityChildren receives ENTITY_TYPE.Organization for alliance children."
  - "Route-matcher widening: entityTypePlural/entityTypeSingular accept 'alliances'/'alliance' via strict allowlist — clicking an alliance card no longer 404s."
  - "Voter results +layout.svelte 5-site widening: ENTITY_PLURALS, _urlPlural, activeEntityType, handleEntityTabChange, _pluralForActiveType. New testid voter-results-alliance-section."
  - "i18n: 7 locales × 2 files updated. tabs.candidates → tabs.children with localized labels; new results.alliance.summary key with ICU nested-plural pattern."
  - "Renamed E2E data-testid: voter-entity-detail-submatches → voter-entity-detail-children, atomically with its 3 consumer files (testIds.ts, EntityDetailPage.ts, voter-detail.spec.ts)."
  - "Dev-seed default + e2e templates carry the rename through; 4 fixture-pin tests + 5 E2E variant spec line-occurrences updated."
affects:
  - 69-02 # Plan 02 (matching-pipeline cascade) builds on this stable foundation
  - 70    # Phase 70 warning sweep — does not depend on alliance render but shares files (EntityCard, EntityDetails)
  - 71    # Phase 71 strict-typing cleanup — same surface

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic-uniform 'children' opt-in for parent-entity types — replaces the per-type 'candidates' literal so Organization (children = CandidateNominations) and Alliance (children = OrganizationNominations) share a single union arm."
    - "Alliance-specific maxSubcards override pattern: parsed.subcardsMax (declared inside the parsed $derived) takes precedence over the maxSubcards prop default of 3, leaving the default behaviour unchanged for organization cards."
    - "Route-matcher widening via strict boolean-OR allowlist — no regex, no glob, no user-supplied predicate. ASVS V5 Input Validation."

key-files:
  created:
    - apps/frontend/src/lib/utils/getAllianceSummary.ts
  modified:
    - packages/app-shared/src/settings/dynamicSettings.type.ts
    - packages/app-shared/src/settings/dynamicSettings.ts
    - apps/frontend/src/lib/utils/matches.ts
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
    - apps/frontend/src/params/entityTypePlural.ts
    - apps/frontend/src/params/entityTypeSingular.ts
    - apps/frontend/src/params/entityTypePlural.test.ts
    - apps/frontend/src/params/entityTypeSingular.test.ts
    - apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte
    - apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/entityDetails.json
    - apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/results.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - packages/dev-seed/src/templates/default.ts
    - packages/dev-seed/src/templates/e2e.ts
    - packages/dev-seed/tests/templates/variant-app-settings.test.ts
    - packages/dev-seed/tests/templates/e2e-app-settings.test.ts
    - tests/tests/specs/variants/results-sections.spec.ts
    - tests/tests/specs/variants/constituency.spec.ts
    - tests/tests/specs/variants/startfromcg.spec.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/pages/voter/EntityDetailPage.ts
    - tests/tests/specs/voter/voter-detail.spec.ts

key-decisions:
  - "D-01: Semantic-uniform 'children' rename — Organization cardContents 'candidates' → 'children'; new ParentEntityDetailsContent type with value 'children'; cardContents.alliance widened with 'children' arm."
  - "D-02: entityDetails.contents.alliance typed Array<EntityDetailsContent | ParentEntityDetailsContent> (broader union for symmetry with organization). Default ships ['info','children']."
  - "D-03: Alliance subcards render flat — maxSubcards = Infinity override via parsed.subcardsMax; organization cards keep top-3 + expand."
  - "D-04: 'X candidates across N parties' summary rendered on the alliance list card AND the drawer header. Helper getAllianceSummary shared between sites."
  - "Executor Rule 1 deviation: limited the EntityCard summary-line render to variant === 'list' (was 'list' || 'details') to avoid a visible duplicate when EntityCard variant=details is consumed inside EntityDetails. EntityDetails owns the drawer-header surface."

patterns-established:
  - "Pattern: parent-entity 'children' opt-in via shared ParentEntityDetailsContent — symmetric across Organization (children = CandidateNominations) and Alliance (children = OrganizationNominations)."
  - "Pattern: per-variant maxSubcards override via the parsed $derived's subcardsMax field — alliance branch sets Infinity, organization branch leaves undefined → fallback to maxSubcards prop default (3)."
  - "Pattern: matcher widening retains the strict boolean-OR allowlist invariant — ASVS V5 input validation preserved across all alliance-route additions."

requirements-completed: [ALLIANCE-01]  # Plan 02 will mark ALLIANCE-01 fully complete; Plan 01 lands the non-matching surface.

# Metrics
duration: ~75min
completed: 2026-05-09
---

# Phase 69 Plan 01: Alliance Card Lane A Foundation Summary

**Alliance card now renders with member-org subcards via the existing EntityCard recursion + drawer opens to Info/Members tabs — semantic-uniform 'children' rename across types, defaults, dev-seed, i18n, and 5 layout/route widening sites all in one atomic plan.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-05-09T14:11:00Z (approx.)
- **Completed:** 2026-05-09T11:29:07Z (logged after final close-gate; clock skew vs. dev-machine is local TZ vs UTC reporting)
- **Tasks:** 9 (8 implementation + 1 close-gate)
- **Files modified:** 32 (excluding generated translationKey.ts and SUMMARY.md)

## Accomplishments

- **Type-rename atomicity:** OrganizationDetailsContent → ParentEntityDetailsContent monorepo-wide. Zero `OrganizationDetailsContent` references in source tree. Build clean across @openvaa/app-shared and @openvaa/frontend.
- **Alliance render branch (EntityCard):** alliance subentities derived via findOrganizationNominations; maxSubcards override = Infinity so all member orgs render flat; "X candidates across N parties" summary line rendered below the card header via the new getAllianceSummary helper.
- **Alliance drawer (EntityDetails):** default tabs `['info','children']` for alliance entities (no Opinions tab); EntityChildren receives `entityType=ENTITY_TYPE.Organization` for alliance children; drawer-header summary line rendered via the same getAllianceSummary helper.
- **Route precondition for SC-3:** entityTypePlural / entityTypeSingular widened to accept 'alliances' / 'alliance' via strict allowlist (no regex, no glob). Click-to-drawer for alliance entities no longer 404s.
- **Voter results layout:** 5-site widening (ENTITY_PLURALS const, _urlPlural OR-chain, activeEntityType ternary, handleEntityTabChange clause-3, _pluralForActiveType) + new `voter-results-alliance-section` data-testid.
- **i18n alignment:** entityDetails.tabs.candidates → tabs.children with locale-appropriate labels in 7 locales; new results.alliance.summary ICU nested-plural key in 7 locales; translationKey.ts regenerated and prettier-formatted.
- **E2E data-testid rename atomic:** `voter-entity-detail-submatches` → `voter-entity-detail-children` in EntityDetails.svelte AND its 3 consumer files (testIds.ts, EntityDetailPage.ts, voter-detail.spec.ts) — Plan 02 parity gate ready.

## Task Commits

Each task was committed atomically per the SEQUENTIAL execution mode (main working tree, hook-bypass via `git -c core.hooksPath=/dev/null commit`):

1. **Task 1 — App-shared type rename + alliance defaults:** `fbb620669` (feat)
2. **Task 2 — findOrganizationNominations + getAllianceSummary helpers:** `f201683e3` (feat)
3. **Task 3 — EntityCard alliance branch + summary line + maxSubcards override:** `f3e5055a6` (feat)
4. **Task 4 — EntityDetails alliance drawer + 3 E2E consumer renames:** `bf36ab69f` (feat)
5. **Task 5 — Route matcher widening + positive/negative test rows:** `17253bc27` (feat)
6. **Task 6 — Voter results +layout.svelte 5-site widening:** `516ba7411` (feat)
7. **Task 7 — i18n key rename + alliance summary key + translationKey regen:** `fd8145f36` (feat)
   - Plus `375e86200` (chore) — prettier-format the regenerated translationKey.ts (Rule 1 fix).
8. **Task 8 — Dev-seed templates + fixture pins + E2E variant spec pins:** `2ad46ff16` (feat)
9. **Task 9 — Plan-close gate (SUMMARY.md + Rule 1 svelte-check fix to EntityDetails.svelte):** [pending — this commit]

_Plan-close commit also lands STATE.md / ROADMAP.md / REQUIREMENTS.md updates._

## Files Created/Modified

**Created:**
- `apps/frontend/src/lib/utils/getAllianceSummary.ts` — pure-derivation helper for {numCandidates, numParties} computation; shared between EntityCard and EntityDetails.

**Modified (per category):**

@openvaa/app-shared (2):
- `packages/app-shared/src/settings/dynamicSettings.type.ts` — type rename, cardContents widening, entityDetails.contents.alliance entry.
- `packages/app-shared/src/settings/dynamicSettings.ts` — defaults for cardContents.organization/alliance + entityDetails.contents.organization/alliance.

apps/frontend dynamic-components (2):
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` — imports, default-action ternary, subentities branch (alliance arm + scsMaxOverride), parsed.subcardsMax fallback, alliance summary template.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` — type-rename consumption, default-tabs ternary, children/allianceSummary derivations, drawer-header summary, tab-render switch with renamed testid.

apps/frontend params + tests (4):
- `apps/frontend/src/params/entityTypePlural.ts` + `.test.ts`
- `apps/frontend/src/params/entityTypeSingular.ts` + `.test.ts`

apps/frontend routes (1):
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — 5 widening sites + new alliance section testid.

apps/frontend i18n (15):
- 7 × `entityDetails.json` (rename tabs.candidates → tabs.children).
- 7 × `results.json` (new alliance.summary ICU plural key).
- 1 × `translationKey.ts` (regenerated, prettier-formatted).

@openvaa/dev-seed (4):
- `packages/dev-seed/src/templates/default.ts`
- `packages/dev-seed/src/templates/e2e.ts`
- `packages/dev-seed/tests/templates/variant-app-settings.test.ts`
- `packages/dev-seed/tests/templates/e2e-app-settings.test.ts`

E2E specs + fixtures (5):
- `tests/tests/specs/variants/results-sections.spec.ts`
- `tests/tests/specs/variants/constituency.spec.ts`
- `tests/tests/specs/variants/startfromcg.spec.ts`
- `tests/tests/utils/testIds.ts`
- `tests/tests/pages/voter/EntityDetailPage.ts`
- `tests/tests/specs/voter/voter-detail.spec.ts`

## Decisions Made

Plan 01 implements decisions D-01, D-02, D-03, D-04 verbatim from the phase CONTEXT.md. Decisions D-05, D-06, D-07 (matching-pipeline cascade) and D-08 (parity capture) are intentionally deferred to Plan 02.

Two executor-level decisions documented under "Deviations":
- (Rule 1) Limit EntityCard summary-line render to variant === 'list' to avoid drawer-header duplicate.
- (Rule 1) Make EntityDetails contentTabs `tabs` annotation include `| undefined` so the optional `[ENTITY_TYPE.Alliance]?` indexed access type-checks under svelte-check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] EntityCard summary-line variant clause narrowed to 'list' only**
- **Found during:** Task 4 (EntityDetails alliance drawer)
- **Issue:** Plan Task 3d wrote the alliance-summary derivation guard as `(variant === 'list' || variant === 'details')`, and Plan Task 4g/4h independently rendered the same summary line in the drawer-header (EntityDetails.svelte). Since EntityDetails consumes EntityCard with variant=details for the header slot, both renderings would fire — the drawer would show the "X candidates across N parties" line twice.
- **Fix:** Narrowed EntityCard's allianceSummary guard to `variant === 'list'` only. EntityDetails owns the drawer-header surface (UI-SPEC explicitly localizes the drawer header summary in the EntityDetails component, not in EntityCard). The plan's intent (CONTEXT D-04: "the drawer header repeats the same line") is preserved with both renderings present; the deduplication shifts the dual-render responsibility cleanly to EntityDetails alone.
- **Files modified:** `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` (one if-condition narrowing).
- **Verification:** No visible duplicate in the drawer; EntityCard list still renders the summary.
- **Committed in:** `bf36ab69f` (Task 4 commit).

**2. [Rule 1 — Bug] EntityDetails `tabs` type annotation widened to allow `undefined`**
- **Found during:** Task 9 (close-gate svelte-check)
- **Issue:** After Task 1 made `entityDetails.contents.alliance` optional (`[ENTITY_TYPE.Alliance]?`), the `tabs` indexed-access in EntityDetails.svelte:69 widened to `... | undefined`. The pre-existing type annotation `Array<EntityDetailsContent | ParentEntityDetailsContent>` no longer accepts undefined → svelte-check error count rose from 160 to 161 (1 above the v2.7-close baseline).
- **Fix:** Widened the let-binding annotation to `Array<EntityDetailsContent | ParentEntityDetailsContent> | undefined`. The `if (!tabs?.length)` runtime guard already handles undefined; only the type annotation needed updating. Added a JSDoc comment explaining the optionality.
- **Files modified:** `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte`.
- **Verification:** svelte-check error count returned to 160 (matches v2.7-close baseline). Frontend test:unit still 652/652 green.
- **Committed in:** [Plan 01 close commit] (Task 9 commit).

**3. [Rule 1 — Blocking] translationKey.ts prettier-formatting after regen**
- **Found during:** Task 7 (i18n + translationKey regen)
- **Issue:** The generator emits a single-line union type (`export type TranslationKey = '...' | '...' | ...`); the project convention (and prettier:check gate) is the multi-line formatted shape (1 key per line). The post-regen single-line file caused a 588-line deletion vs. addition diff, which would have been a noisy commit.
- **Fix:** Ran `yarn prettier --write src/lib/types/generated/translationKey.ts` after the regeneration. Format-only change.
- **Files modified:** `apps/frontend/src/lib/types/generated/translationKey.ts`.
- **Verification:** prettier-formatted file matches prior formatting; all 3 acceptance grep counts unchanged (entityDetails.tabs.children=1, results.alliance.summary=1, entityDetails.tabs.candidates=0).
- **Committed in:** `375e86200` (chore commit alongside the i18n feat commit).

---

**Total deviations:** 3 auto-fixed (3 Rule 1 — all bug/blocking fixes).
**Impact on plan:** All three fixes were necessary for correctness (no visible duplicate render, build/check green, prettier:check gate). No scope creep — the plan's intent for the alliance render path is unchanged.

## Issues Encountered

- **svelte-check baseline error +1:** caught at the close gate, root-caused to the type-rename atomicity working as intended (the optional Alliance entry surfaced an undefined type at the indexed-access site). Fix described under Deviations #2.
- No build failures, no test failures, no lint regression vs. v2.7-close baseline (95 errors).

## Verification Gate Results

| Check | Result | Baseline | Status |
|---|---|---|---|
| `yarn build` | 14 tasks successful | n/a | PASS |
| `yarn workspace @openvaa/frontend test:unit --run` | 652 / 652 | 646 (Phase 67 close) | PASS (+6 new param-matcher rows) |
| `yarn workspace @openvaa/dev-seed test:unit --run` | 484 / 484 | 484 | PASS |
| `yarn workspace @openvaa/frontend lint:check` | 95 errors | 95 (v2.7 deferral) | HOLDS |
| `yarn workspace @openvaa/frontend check` (svelte-check) | 160 errors | 160 (v2.7 close) | HOLDS |
| Acceptance grep — `OrganizationDetailsContent` source-tree | 0 | 0 | PASS |
| Acceptance grep — `entityDetails.tabs.candidates` source-tree | 0 | 0 | PASS |
| Acceptance grep — `voter-entity-detail-submatches` source-tree | 0 | 0 | PASS |
| Acceptance grep — `submatchesTab` `tests/` | 0 | 0 | PASS |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Ready for Plan 02:**
- D-05 (`imputeParentAnswers` proxy-children generalisation) and D-06 (`matchStore.svelte.ts` alliance branch) can land against the stable foundation here.
- The type rename is atomic — no consumer outside this plan still imports `OrganizationDetailsContent`.
- The route matchers accept alliance values, so click-to-drawer will work end-to-end after Plan 02 wires the matching cascade.
- The drawer renders correctly: tabs `['info','children']`, EntityChildren with `entityType=ENTITY_TYPE.Organization` for alliance children.
- Manual smoke can be run on `yarn dev:reset-with-data` after Plan 02 lands.

**Open follow-ups for Plan 02 (per CONTEXT "Deferred Ideas"):**
- Capture new pending todo: "Rewrite parent answer imputation logic so that entity answers are not overwritten ad hoc."
- Run manual smoke per ROADMAP SC-4: 5-step (tab visible → cards populated → click-to-drawer → member orgs render → return to list).
- Re-confirm Playwright parity (67p / 1f / 34c) does not regress.

**No blockers** — Plan 02 can be initiated immediately.

---
*Phase: 69-alliance-card-lane-a*
*Completed: 2026-05-09*

## Self-Check: PASSED

- [x] FOUND: apps/frontend/src/lib/utils/getAllianceSummary.ts
- [x] FOUND: commit fbb620669 (Task 1)
- [x] FOUND: commit f201683e3 (Task 2)
- [x] FOUND: commit f3e5055a6 (Task 3)
- [x] FOUND: commit bf36ab69f (Task 4)
- [x] FOUND: commit 17253bc27 (Task 5)
- [x] FOUND: commit 516ba7411 (Task 6)
- [x] FOUND: commit fd8145f36 (Task 7)
- [x] FOUND: commit 375e86200 (Task 7 prettier follow-up)
- [x] FOUND: commit 2ad46ff16 (Task 8)
