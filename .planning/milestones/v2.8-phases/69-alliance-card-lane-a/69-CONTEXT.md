# Phase 69: Alliance Card Lane A - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Milestone:** v2.8 Alliance Card + Frontend Hygiene Sweep (Phase 1 of 4)

<domain>
## Phase Boundary

Make the voter results page's "Alliances" tab render a working entity card per alliance. This closes the v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS deferral (alliances surface visible but cards are empty / "tab does nothing").

Concretely, three layers must change:

1. **Settings type surface (`packages/app-shared`)** — semantic-uniform "children" naming for sub-entity card content and detail tabs:
   - `cardContents.organization`: rename `'candidates'` → `'children'`.
   - `cardContents.alliance`: add `'children'` (mirror of the renamed Organization entry).
   - Detail-tab type rename: `OrganizationDetailsContent` → `ParentEntityDetailsContent`; its sole value renames from `'candidates'` to `'children'`.
   - `entityDetails.contents.alliance`: new entry — typed to allow `'info' | 'children'` (Alliance has no own answers, so `'opinions'` is excluded). Planner picks the exact union shape (narrower vs reuse `EntityDetailsContent | ParentEntityDetailsContent`).

2. **Render path (`apps/frontend/src/lib/dynamic-components`)** — `EntityCard.svelte` subentities branch (currently hard-coded to `OrganizationNomination → CandidateNomination`) is extended so:
   - `AllianceNomination → OrganizationNomination` rendering works.
   - `OrganizationNomination → CandidateNomination` continues to work under the renamed `'children'` opt-in.
   - `EntityDetails.svelte` (drawer) handles the Alliance entry with `'info' + 'children'` tabs by mirroring the Organization drawer minus the opinions tab.
   - When listing alliance members in card subcards, **all** member organizations are rendered (override `maxSubcards` for the alliance branch), not just the first 3. Organization cards retain the existing top-3-then-expand behaviour.

3. **Matching score (`apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` + `matchStore.svelte.ts`)** — Alliances currently get no imputed match score because `imputeParentAnswers` is generic on `OrganizationNomination | FactionNomination` and `matchStore` only branches for those entity types. The chain is extended to:
   - **Pass 1 (existing):** candidate-noms → organization-noms (writes into `MatchingProxy<OrganizationNomination>`).
   - **Pass 2 (new):** organization-noms → alliance-noms, **reading from the Pass-1 proxies** — i.e. `imputeParentAnswers` is generalised to accept proxy-children so the alliance pass uses already-imputed org answers without overwriting any entity. (See D-01 for the chosen helper-extension approach over the alternative entity-write quick fix.)

**In scope:**
- Type renames + alliance additions in `packages/app-shared/src/settings/dynamicSettings.type.ts` (cardContents + entityDetails contents + DetailsContent rename).
- Default-settings updates in `packages/app-shared/src/settings/defaultSettings.ts` (or wherever defaults live) so `cardContents.alliance = ['children']` and `entityDetails.contents.alliance = ['info', 'children']` ship by default.
- `EntityCard.svelte` subentities branch extension for `AllianceNomination → OrganizationNomination`, plus the `'candidates' → 'children'` rename at the cardContents check site (line 137).
- `EntityCard.svelte` `maxSubcards` override for the Alliance subcards branch — render all member organizations, not just top-3.
- `EntityDetails.svelte` Alliance type-tab handling (info + children tabs), reusing existing org-nomination rendering surface for the children tab.
- Alliance "X candidates across N parties" summary computed from the v2.6 P64 reverse-filled `organizationNominationIds` + each org-nom's `candidateNominations.length`. Rendered on **both** the card (below name, above member-orgs sub-list) and in the drawer header.
- Generalise `imputeParentAnswers` to accept proxy-children (so the alliance pass reads from already-imputed org proxies). No entity-answer writes.
- `matchStore.svelte.ts` extension: add the Alliance branch — run org pass first, then alliance pass with the org proxies as children.
- Update / verify `packages/dev-seed/src/templates/default.ts` settings carry the renames + alliance additions through (it consumes `app_settings.results.cardContents` + `entityDetails.contents`).
- Manual smoke per ROADMAP SC-4: 5-step manual smoke (tab visible → cards populated → click-to-drawer → member orgs render → return to list) on a clean `yarn dev:reset-with-data` start. v2.7-close Playwright parity continues to pass.

**Out of scope:**
- Lane B (drop alliance from sections) and Lane C (conditional render guard) — explicitly rejected per REQUIREMENTS Out-of-Scope.
- Refactoring the imputation paradigm beyond the proxy-children extension. The deferred todo "Rewrite parent answer imputation logic so that entity answers are not overwritten ad hoc" captures the broader refactor; Phase 69 only does the targeted extension needed for the alliance cascade.
- Schema migrations (no Supabase migration files touched; v2.8 milestone constraint).
- New unit tests in `@openvaa/matching` / `@openvaa/filters` for Alliance — manual UI smoke + existing parity gate are the validation surface.
- Renaming any other `'candidates'`-keyed type that isn't part of the cardContents / details-content surface (e.g. `findCandidateNominations` utility name unchanged).

</domain>

<decisions>
## Implementation Decisions

### Type Surface — `'children'` Rename + Alliance Additions

- **D-01: Semantic-uniform "children" naming.** Rename `cardContents.organization`'s `'candidates'` value → `'children'`. Add `'children'` to `cardContents.alliance`. Rename `OrganizationDetailsContent` type → `ParentEntityDetailsContent` with value `'children'` (was `'candidates'`). Reasoning: an entity's "children" are its sub-noms regardless of type — orgs have candidate-noms as children, alliances have org-noms as children. Single shared opt-in keeps the type surface symmetric and avoids a parallel `cardContents.alliance: 'organizations'` enum that would diverge as more parent entity types are added.
- **D-02: Alliance entityDetails.contents tabs.** `entityDetails.contents.alliance` ships with `['info', 'children']` by default. Drawer mirrors the Organization drawer minus the opinions tab (alliance has no own answers). Planner picks the exact type union — narrower `Array<'info' | ParentEntityDetailsContent>` vs reuse `Array<EntityDetailsContent | ParentEntityDetailsContent>` — based on whether allowing `'opinions'` for alliance (and runtime-skipping it) is more useful than enforcing the narrower type.

### Card Render Behaviour

- **D-03: Alliance card subcards show all members, not top-3.** When the Alliance branch in `EntityCard.svelte` renders subcards (`AllianceNomination → OrganizationNomination`), `maxSubcards` is overridden to render every member org. Organization-card subcards retain the existing default of 3. Reasoning: alliances have at most a handful of member orgs (default seed: 3 per alliance), so the "top-3 + expand" UX adds clutter without value. **Note for the planner:** this override is alliance-specific — do NOT change the `maxSubcards` default for organization cards.
- **D-04: "X candidates across N parties" summary on card and in drawer header.** Computed at render time from the v2.6 P64 reverse-filled `organizationNominationIds` (count = N) and `sum(orgNom.candidateNominations.length)` across the alliance's org-noms (count = X). Card line lives below the alliance name, above the member-orgs subcard list. Drawer header repeats the same line for context-continuity (the user may have clicked through from a different list view).

### Matching Score — Cascading Imputation

- **D-05: Generalise `imputeParentAnswers` to accept proxy-children; no entity-answer writes.** The function's child-lookup (currently `parent.factionNominations || parent.candidateNominations` for org-parents) is widened to also handle Alliance parents (`parent.organizationNominations` as children) AND to optionally read child answers from a pre-built proxy map (so Pass 2 sees Pass 1's imputed values without writing them back to org entities). Concretely: add an optional `childProxies?: Map<NominationId, MatchingProxy<*>>` param; when present and a child has a matching proxy, read from `proxy.proxyAnswers[questionId]` instead of `child.entity.getAnswer(question)`.
- **D-06: `matchStore.svelte.ts` runs orgs first, then alliances.** The matching pipeline gains an Alliance branch that runs **after** the existing Organization branch in the `for (const [electionId, electionContent])` loop, passing the Pass-1 org proxies as the `childProxies` arg to the new alliance call. `parentMatchingMethod` semantics extend to alliances unchanged — `'impute' | 'answersOnly' | 'none'` apply identically.
- **D-07: Default `parentMatchingMethod` for alliances is `'impute'`.** Same default as orgs. If the user wants `'answersOnly'` or `'none'` for alliances specifically, that's a future enum-split; today they share one knob.

### Plan Split

- **D-08: Planner discretion on plan count.** Reasonable shapes: (a) one combined plan covering type renames + render path + matching pipeline + manual smoke; (b) two plans split as "type + render" / "matching + smoke"; (c) three plans (type / render / matching). Planner picks based on diff cohesion and reviewability. The matching change (D-05/D-06) and the render change (D-03/D-04) are independent enough to live in separate plans if size warrants.

### Claude's Discretion

- Exact wording / format of the "X candidates across N parties" summary (i18n key naming, plural rules per locale, fallback when X = 0 or N = 1).
- Exact Alliance drawer tab label text and ordering — planner picks consistent with existing organization-drawer conventions.
- Whether to extend `EntityDetails.svelte`'s tab-array typing inline or factor a helper — planner picks.
- Exact name of the new optional `imputeParentAnswers` param (`childProxies` vs `childProxyMap` vs `proxyChildren`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v2.8 Milestone Anchors
- `.planning/ROADMAP.md` §"Phase 69: Alliance Card Lane A" — phase goal, dependencies, SC-1 through SC-4, UI hint flag.
- `.planning/REQUIREMENTS.md` §ALLIANCE-01 — single-requirement scope statement; out-of-scope list.

### Source Todo + 3-Lane Analysis
- `.planning/todos/pending/2026-04-30-alliance-tab-rendering-and-sections-config.md` — the 3-lane analysis (A/B/C) that produced this phase. Lane A selected; Lanes B/C explicitly rejected.

### Upstream Phase Context (v2.7)
- `.planning/milestones/v2.7-phases/67-default-seed-alliances/67-CONTEXT.md` — Phase 67 alliance seeding decisions (D-01 through D-05; D-58-01 "no real party names" rule). Default seed ships 2 alliances (`Alliance L = SDU+RF+GW`, `Alliance R = BC+VC+RA`) + 10 alliance_noms + 30/10 org-nom parent split.
- `.planning/milestones/v2.7-phases/67-default-seed-alliances/` SUMMARY / VERIFICATION — Phase 67 SC-2 PASS-WITH-CONCERNS rationale (the empty-tab UX that this phase reconciles).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/` — v2.6 P64 reverse-fill of `organizationNominationIds` on Alliance parents (the data path Phase 67 verified non-empty).

### Type Surface
- `packages/app-shared/src/settings/dynamicSettings.type.ts:187-231` — current `cardContents` shape (Candidate / Organization / Alliance variants).
- `packages/app-shared/src/settings/dynamicSettings.type.ts:25-47` — current `entityDetails.contents` shape.
- `packages/app-shared/src/settings/dynamicSettings.type.ts:359-376` — current `EntityDetailsContent` + `OrganizationDetailsContent` types (the rename target).

### Render Path
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:131-142` — current subentities branch (org → candidates only). Line 137 has the `'candidates'` cardContents check that gets renamed.
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:21` — current `maxSubcards = 3` default.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte:41,62,68` — `EntityDetailsContent | OrganizationDetailsContent` consumption sites; rename target.

### Matching Pipeline
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` — the function to generalise. Lines 22 (generic constraint), 44-47 (children-lookup branch), 52-93 (per-question imputation; reads from `c.entity.getAnswer(question)`).
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.type.ts` — `MatchingProxy` class definition.
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts:48-96` — the per-electionType match loop where the Alliance branch is added.

### Data Model
- `packages/data/src/objects/nominations/variants/allianceNomination.ts` — `AllianceNomination` definition; `organizationNominations` accessor.

### CLAUDE.md Anchors
- `CLAUDE.md` §"Frontend Data Flow" — adapter pattern.
- `CLAUDE.md` §"Matching Algorithm Paradigm (`@openvaa/matching`)" — distance + subdimensions; relevant when reasoning about whether Alliance imputation distorts the matching space.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`MatchingProxy`** (`apps/frontend/src/lib/utils/matching/imputeParentAnswers.type.ts`) — already provides per-nomination imputed-answer override without writing to entities. Generalising the helper is additive; existing org+faction calls keep working.
- **`EntityCard.svelte`** subcards mechanism — already handles "list more than maxSubcards → expand button" (`maxSubcards = 3` default). The Alliance branch can lean on the same machinery with `maxSubcards: Infinity` (or `members.length`) override.
- **`findCandidateNominations`** (`apps/frontend/src/lib/utils/matches/findCandidateNominations.ts`) — current org → candidate-noms helper. Likely needs an `findOrganizationNominations` sibling for the alliance branch.
- **Existing organization-nomination card rendering** — the children tab in the alliance drawer reuses this surface (per ROADMAP SC-3: "no new bespoke components for the drawer body").
- **v2.7 Phase 67 default seed** — provides 2 alliances × 5 constituencies = 10 alliance-noms + 30 org-noms parent-linked. Manual smoke runs on `yarn dev:reset-with-data` without further seed work.

### Established Patterns
- **Cardcontents opt-in pattern** — `cardContents[entityType].includes('foo')` gates rendering. The rename keeps the existing pattern; adding `'children'` to the alliance variant is mechanically the same as the existing `'candidates'` opt-in for orgs.
- **Detail tab content union** — `EntityDetailsContent | OrganizationDetailsContent` already models "shared tabs + parent-entity-specific tabs". Renaming to `ParentEntityDetailsContent` keeps the same composition.
- **Cascading proxy pattern (new)** — Pass 1 builds proxies for orgs reading from candidate entities; Pass 2 builds proxies for alliances reading from Pass-1 org proxies. No entity is mutated.
- **Manual smoke as validation** — Phase 67 D-03 established this for alliance-related work; no new unit tests in `@openvaa/matching` or `@openvaa/filters` (would couple package tests to seed shape).

### Integration Points
- **Type renames cascade through** `apps/frontend/src/lib/` cardContents-aware code, dev-seed default templates (`packages/dev-seed/src/templates/default.ts` references `cardContents.organization.includes('candidates')` if any), and any `@openvaa/app-shared` consumer that reads `cardContents` shape.
- **`matchStore` Alliance branch** integrates at the same level as the Organization branch in the `[electionId, electionContent]` loop. Care needed: alliance pass must run **after** org pass in the same loop iteration so the org proxies are available.
- **`EntityCard` recursive rendering** — alliance subcards render `OrganizationNomination` children via the same `<EntityCard>` recursion that today renders org → candidate subcards. Verify no infinite-loop or context-stacking issues when the renamed `'children'` opt-in fires twice in the same render tree.

</code_context>

<specifics>
## Specific Ideas

- User explicitly requested the `'candidates' → 'children'` rename — applies to BOTH the Organization cardContents value and the renamed `ParentEntityDetailsContent` type. Semantic-uniform across entity-type levels.
- User explicitly requested `imputeParentAnswers` extension over the entity-write quick-fix (chose the cleaner refactor inline rather than deferring it).
- User explicitly requested the "show all alliance members, not just top-3" behaviour for the card subcards branch.
- Alliance drawer mirrors Organization drawer **minus opinions tab** — alliances have no own answers, so an opinions tab would be empty.

</specifics>

<deferred>
## Deferred Ideas

### New Todo to Capture (Post-Phase 69)
- **"Rewrite parent answer imputation logic so that entity answers are not overwritten ad hoc"** — broader refactor of the imputation paradigm. Phase 69's proxy-children extension (D-05) partially does this work, but the deeper refactor (per-entity-type matching method, separation of imputation strategy from the matching loop, etc.) is out of scope. Capture as a new todo at phase verification time so it lands in the v2.9+ backlog.

### Already Deferred (out of v2.8 scope)
- Lane B / Lane C — explicitly rejected per REQUIREMENTS Out-of-Scope. Quick rollback (B) and conditional render guard (C) are not pursued; Lane A is the proper fix.
- New unit tests in `@openvaa/matching` / `@openvaa/filters` for Alliance — Phase 67 D-03 + ROADMAP SC-4 use manual UI smoke + parity gate as the validation surface.
- DB-01 nominations table cleanup — deferred 2026-04-29; user opted to keep the table as is.

</deferred>

---

*Phase: 69-alliance-card-lane-a*
*Context gathered: 2026-05-09*
