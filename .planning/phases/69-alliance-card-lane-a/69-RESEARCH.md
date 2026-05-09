# Phase 69: Alliance Card Lane A — Research

**Researched:** 2026-05-09
**Domain:** Frontend rendering (Svelte 5 / SvelteKit) + cascading match-imputation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Semantic-uniform "children" naming.** Rename `cardContents.organization`'s `'candidates'` value → `'children'`. Add `'children'` to `cardContents.alliance`. Rename `OrganizationDetailsContent` type → `ParentEntityDetailsContent` with value `'children'` (was `'candidates'`). Reasoning: an entity's "children" are its sub-noms regardless of type — orgs have candidate-noms as children, alliances have org-noms as children. Single shared opt-in keeps the type surface symmetric and avoids a parallel `cardContents.alliance: 'organizations'` enum that would diverge as more parent entity types are added.
- **D-02: Alliance entityDetails.contents tabs.** `entityDetails.contents.alliance` ships with `['info', 'children']` by default. Drawer mirrors the Organization drawer minus the opinions tab (alliance has no own answers). Planner picks the exact type union — narrower `Array<'info' | ParentEntityDetailsContent>` vs reuse `Array<EntityDetailsContent | ParentEntityDetailsContent>`.
- **D-03: Alliance card subcards show all members, not top-3.** When the Alliance branch in `EntityCard.svelte` renders subcards (`AllianceNomination → OrganizationNomination`), `maxSubcards` is overridden to render every member org. Organization-card subcards retain the existing default of 3.
- **D-04: "X candidates across N parties" summary on card and in drawer header.** Computed from `organizationNominationIds` (count = N) and `sum(orgNom.candidateNominations.length)` (count = X). Card line lives below the alliance name, above the member-orgs subcard list. Drawer header repeats the same line.
- **D-05: Generalise `imputeParentAnswers` to accept proxy-children; no entity-answer writes.** Add an optional `childProxies?: Map<NominationId, MatchingProxy<*>>` param; when present and a child has a matching proxy, read from `proxy.proxyAnswers[questionId]` instead of `child.entity.getAnswer(question)`.
- **D-06: `matchStore.svelte.ts` runs orgs first, then alliances.** Add an Alliance branch that runs **after** the existing Organization branch in the `for (const [electionId, electionContent])` loop, passing the Pass-1 org proxies as the `childProxies` arg.
- **D-07: Default `parentMatchingMethod` for alliances is `'impute'`.** Same default as orgs; one knob today.
- **D-08: Planner discretion on plan count.** Reasonable shapes: 1, 2, or 3 plans. Matching change (D-05/D-06) and render change (D-03/D-04) are independent enough to live in separate plans.

### Claude's Discretion

- Exact wording / format of the "X candidates across N parties" summary (i18n key naming, plural rules per locale, fallback when X = 0 or N = 1).
- Exact Alliance drawer tab label text and ordering.
- Whether to extend `EntityDetails.svelte`'s tab-array typing inline or factor a helper.
- Exact name of the new optional `imputeParentAnswers` param (`childProxies` vs `childProxyMap` vs `proxyChildren`).

### Deferred Ideas (OUT OF SCOPE)

- Lane B (drop alliance from sections) and Lane C (conditional render guard) — explicitly rejected.
- Refactoring the imputation paradigm beyond the proxy-children extension.
- Schema migrations (no Supabase migration files touched).
- New unit tests in `@openvaa/matching` / `@openvaa/filters` for Alliance.
- Renaming any other `'candidates'`-keyed type that isn't part of cardContents / details-content surface (e.g. `findCandidateNominations` utility name unchanged).

### New Todo to Capture (Post-Phase 69)
- "Rewrite parent answer imputation logic so that entity answers are not overwritten ad hoc" — broader refactor; Phase 69's proxy-children extension partially does this work.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ALLIANCE-01 | The voter results "Alliances" tab renders a working entity card per alliance entity (Lane A): name, member organizations sub-list, "X candidates across N parties" summary; EntityCard's `subentities` branch handles `OBJECT_TYPE.AllianceNomination → OrganizationNomination`; `cardContents.alliance` shape decisions captured; click-to-drawer works; member orgs render in the drawer; manual smoke + parity gate pass. | Findings #1-#11 below — all locked decisions are mechanically resolvable from existing infrastructure (no new architecture); blast radius mapped; cascading-impute pattern verified safe. Critical: Risk #4 (route matchers) surfaced — clicking an alliance card today produces a 404 because `[entityTypePlural=entityTypePlural]` rejects `'alliances'`. |
</phase_requirements>

## Summary

Phase 69 closes the v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS deferral: alliance cards currently render empty because (a) `cardContents.alliance: []` was the only shape Phase 67 could ship without committing to UX, and (b) `EntityCard.svelte`'s subentities branch is hard-coded to `OrganizationNomination → CandidateNomination`. The data path is fully wired (v2.6 P64 `organizationNominationIds` reverse-fill + v2.7 P67 default seed = 2 alliances × 5 constituencies × 3 member orgs each), so this phase is purely a frontend render-path + cascading-imputation extension. No schema changes, no upstream package work.

**Critical finding (Risk #4):** the SvelteKit route param-matchers `entityTypePlural` and `entityTypeSingular` reject `'alliances'` and `'alliance'` respectively (filenames `apps/frontend/src/params/entityTypePlural.ts` + `entityTypeSingular.ts`), and `EntityCard.svelte:110-111`'s default-action ternary falls back to `'organizations'` for the alliance branch. **Without widening these matchers + the ternary, clicking an alliance card today produces a 404 (built-in `match()` returns false → SvelteKit serves 404 per Phase 62 threat T-62-04).** This is in addition to the 8 locked decisions in CONTEXT.md and MUST be addressed for SC-3 ("clicking an alliance card opens the entity detail drawer").

**Primary recommendation:** 2-plan split. Plan 01 = type renames + render path (`dynamicSettings.type.ts` + `dynamicSettings.ts` defaults + `EntityCard.svelte` + `EntityDetails.svelte` + route-matcher widening + dev-seed default refresh + i18n); Plan 02 = matching extension (`imputeParentAnswers.ts` generalisation + `matchStore.svelte.ts` Alliance branch) + manual smoke + parity gate. This split isolates the matching-logic change (highest behavioural risk) from the render diff (highest line count) so reviewers can audit each pass independently. Single-plan or 3-plan splits are also defensible; planner's discretion per D-08.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Settings type surface (`cardContents`, `entityDetails.contents`) | `@openvaa/app-shared` (package) | `@openvaa/dev-seed` defaults consumer | The renamed type union is the contract every UI/seed/test surface depends on; `app-shared` owns it. |
| Alliance card render branch | Frontend (`apps/frontend`) — dynamic component layer | `@openvaa/data` (read-only) | `EntityCard.svelte` reads `OBJECT_TYPE.AllianceNomination` and traverses `organizationNominations` getter. No data-layer change required. |
| Alliance drawer tabs | Frontend (`apps/frontend`) — dynamic component layer | `@openvaa/app-shared` (consumes type) | `EntityDetails.svelte` consumes the renamed type union; reuses `EntityChildren.svelte` for the children tab body (no new components). |
| Cascading impute (orgs → alliances) | Frontend (`apps/frontend`) — utils + voter-context store | `@openvaa/matching` (consumed via algorithm.match) | `imputeParentAnswers.ts` and `matchStore.svelte.ts` are app-layer; no change to `@openvaa/matching` itself (per D-03 "no new unit tests in matching/filters" — package is treated as a stable dependency). |
| "X candidates across N parties" summary | Frontend (`apps/frontend`) — render surface | `@openvaa/data` (provides counts via `organizationNominations[*].candidateNominations.length`) | Pure render-time derivation from existing data accessors. |
| Click-to-drawer route surface | Frontend (`apps/frontend`) — SvelteKit param-matchers + route table | — | `entityTypePlural` / `entityTypeSingular` matchers must be widened (Risk #4); also `DEFAULT_PARAMS` table in `route.ts`. |

## Standard Stack

This phase introduces **no new packages**. All work uses the existing in-tree libraries.

### Core (in use)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@openvaa/app-shared` | workspace:^ | Owns `DynamicSettings`, `cardContents`, `entityDetails.contents`, `EntityDetailsContent`, `OrganizationDetailsContent` types | Single source of truth for app-config types — both frontend and Edge Functions consume it [VERIFIED: packages/app-shared/src/index.ts barrel, dual ESM+CJS build] |
| `@openvaa/data` | workspace:^ | Provides `OBJECT_TYPE`, `ENTITY_TYPE`, `AllianceNomination`, `OrganizationNomination`, `isObjectType` type-guard | Universal data model; alliance-nom data path is fully validated by v2.7 P67 [VERIFIED: packages/data/src/objects/nominations/variants/allianceNomination.ts:80-90] |
| `@openvaa/matching` | workspace:^ | `Match`, `MatchingAlgorithm` (consumed unchanged) | Unit-test free zone for alliance per D-03; treat as stable dependency [VERIFIED: 67-VERIFICATION.md SC-4] |
| Svelte 5 runes (`$derived`, `$state`, `$effect`) | bundled in SvelteKit 2 | EntityCard.svelte / EntityDetails.svelte reactivity | CLAUDE.md context-destructuring rule applies — read reactive-getter properties via `ctx.X`, not destructure [VERIFIED: CLAUDE.md "Context Destructuring Rule (Svelte 5)"] |
| `sveltekit-i18n` | bundled | `t()` translation function for "X candidates across N parties" plural rules | Existing pattern — see `entityCard.showAllCandidates: "Show all {numCandidates} candidates"` and `results.candidate.numShown` plural format [VERIFIED: apps/frontend/src/lib/i18n/translations/en/entityCard.json + results.json] |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Generalise `imputeParentAnswers` (D-05) | Write imputed answers directly into Alliance entity via `entity.setAnswer()` | Explicitly rejected by user: "no entity-answer writes." The proxy pattern preserves the entity as the source of truth and keeps imputation reversible. |
| `cardContents.alliance: 'organizations'` (parallel enum value) | The semantic-uniform `'children'` value | Explicitly rejected by D-01: would diverge as more parent entity types are added. |
| Add new `findOrganizationNominations` helper next to `findCandidateNominations` | Inline the `nomination.organizationNominations` traversal in EntityCard's alliance branch | Both are defensible; the helper-function form is more consistent with the existing `findCandidateNominations` pattern (which sorts by `compareMaybeWrappedEntities` and falls back gracefully when matches are absent). Recommended: factor the helper for symmetry. The CONTEXT line "(likely a new) findOrganizationNominations helper" already implies this. |
| `maxSubcards: Infinity` for alliance branch | `maxSubcards: members.length` | `Infinity` is cleaner; the truncation logic is `parsed.subcards.slice(0, showAllSubcards ? undefined : maxSubcards)` (EntityCard.svelte:287) and `parsed.subcards.length > maxSubcards` (line 290). With `Infinity`, both expressions short-circuit correctly: `slice(0, Infinity)` returns all; `length > Infinity` is always false → expand-button suppressed. |
| Route widening: add `'alliances'` plural to existing matchers | Add a new `entityTypePluralAlliance` matcher per-route | Existing matchers are a single-file boolean; widening is a 1-line OR addition (`return param === 'candidates' || param === 'organizations' || param === 'alliances'`). Per-route matchers would multiply the route surface. |

**No new npm packages installed.** Version verification not applicable (no new dependencies). [VERIFIED: phase scope is in-tree changes only]

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────┐                                 ┌─────────────────────┐
│ yarn dev:reset   │                                 │ Voter clicks        │
│ -with-data       │                                 │ "Alliances" tab     │
│ (Phase 67 seed)  │                                 │                     │
└──────┬───────────┘                                 └─────────┬───────────┘
       │ writes default                                        │ activeEntityType
       │ template + 2                                          │ = 'alliance'
       │ alliances + 10                                        │
       │ alliance-noms                                         ▼
       ▼                                              ┌─────────────────────┐
┌──────────────────┐                                  │ /results/+layout    │
│ Supabase DB      │                                  │ entityTabs derived  │
│ alliance rows +  │                                  │ from voterCtx       │
│ nominations rows │                                  │ .matches keys       │
│ with parent_     │                                  └─────────┬───────────┘
│ nomination wired │                                            │ activeMatches
└──────┬───────────┘                                            │ = matches[el]
       │ supabase adapter reads,                                │ ['alliance']
       │ reverse-fills                                          │
       │ organizationNominationIds                              ▼
       │ on Alliance parents (v2.6 P64)                ┌──────────────────┐
       ▼                                                │ EntityList       │
┌──────────────────┐    matchStore       ┌────────┐    │ <EntityCard      │
│ DataRoot         │◄────────────────────│ voter  │    │   entity={alli   │
│ getAlliance      │  Pass 1: orgs+      │ Context│───►│   nce-match}/>   │
│ Nomination(id)   │  factions →         │ matches│    └──────┬───────────┘
│ → returns        │  proxies            │ tree   │           │
│ AllianceNom with │  Pass 2: alliances  │        │           │ ALLIANCE BRANCH (NEW)
│ organization     │  ← orgs proxies     │        │           │ checks isObjectType
│ Nominations[]    │  via childProxies   │        │           │ AllianceNomination
└──────┬───────────┘  (Phase 69 D-05)   └────────┘           │ + cardContents
       │                                                      │ alliance.includes
       │ EntityCard reads                                     │ ('children')
       │ unwrapped.nomination                                 ▼
       │ → AllianceNomination                       ┌─────────────────────┐
       │                                            │ findOrganization-   │
       │                                            │ Nominations(allianc │
       │                                            │ e, matches)         │
       │                                            │ → Array<Match<      │
       │                                            │   OrganizationNom>> │
       │                                            └─────────┬───────────┘
       │                                                      │ subcards
       │                                                      │ maxSubcards=Inf
       │                                                      ▼
       │                                            ┌─────────────────────┐
       │                                            │ <EntityCard         │
       │                                            │   variant="subcard" │
       │                                            │   entity={orgMatch} │
       │                                            │ /> (recursive)      │
       │                                            └─────────────────────┘
       │
       │ Click on card → goto /results/alliances/alliance/[id]?nominationId=
       ▼
┌──────────────────┐    EntityDetailsDrawer   ┌──────────────────────────┐
│ Param-matcher    │   ┌──────────────────┐   │ EntityDetails.svelte     │
│ entityTypePlural │   │ getEntityAndTitle│   │ contentTabs from         │
│ now accepts      │──►│ → AllianceNom    │──►│ entityDetails.contents   │
│ 'alliances'      │   │ via dataRoot     │   │ .alliance =              │
│ (NEW)            │   │ .getAlliance     │   │ ['info', 'children']     │
│                  │   │ Nomination       │   │ Children tab body =      │
│ entityTypeSingu  │   └──────────────────┘   │ <EntityChildren          │
│ lar accepts      │                          │   entities={             │
│ 'alliance'       │                          │     organizationNoms     │
│ (NEW)            │                          │   } entityType=          │
└──────────────────┘                          │   ENTITY_TYPE.Organiz... │
                                              │ /> (REUSED)              │
                                              └──────────────────────────┘
```

### Recommended Touch Points (no new directories)

```
packages/app-shared/src/settings/
├── dynamicSettings.type.ts    # Type renames: candidates→children; OrganizationDetailsContent→ParentEntityDetailsContent; add cardContents.alliance children entry; add entityDetails.contents.alliance
└── dynamicSettings.ts         # Default updates: cardContents.alliance=['children']; entityDetails.contents organization='children' (was 'candidates'); add alliance=['info','children']

packages/dev-seed/src/templates/
├── default.ts:248             # 'candidates' → 'children' on cardContents.organization; cardContents.alliance: ['children']
└── e2e.ts:97                  # 'candidates' → 'children' on cardContents.organization

packages/dev-seed/tests/templates/
├── variant-app-settings.test.ts:117-120   # Update fixture to expect 'children' (literal pin)
└── e2e-app-settings.test.ts:104-110       # Update fixture to expect 'children' (literal pin)

apps/frontend/src/params/
├── entityTypePlural.ts        # Add 'alliances'
└── entityTypeSingular.ts      # Add 'alliance'

apps/frontend/src/lib/utils/route/
└── route.ts                    # Optional: add ResultAlliance entry to DEFAULT_PARAMS for completeness

apps/frontend/src/lib/utils/
└── matches.ts                  # Add findOrganizationNominations sibling next to findCandidateNominations

apps/frontend/src/lib/utils/matching/
└── imputeParentAnswers.ts     # Generalise generic constraint: + AllianceNomination; add optional childProxies param; add Alliance child-lookup branch (parent.organizationNominations)

apps/frontend/src/lib/dynamic-components/entityCard/
└── EntityCard.svelte          # Line 110-111 ternary: branch alliance plural; lines 131-142 alliance subentities branch + maxSubcards override; add "X candidates across N parties" summary line below name

apps/frontend/src/lib/dynamic-components/entityDetails/
└── EntityDetails.svelte       # Line 41 import rename; line 62 type rename; line 68 type rename; line 71 default rename + add alliance default; line 78 'candidates' → 'children'; line 124 'candidates' → 'children'; lines 75-81 children derivation extension for AllianceNomination → organizationNominations; pass-through entityType to EntityChildren

apps/frontend/src/lib/contexts/voter/
└── matchStore.svelte.ts       # REFACTOR loop from .map() to sequential for...of so org proxies persist across alliance iteration; add Alliance branch with childProxies arg

apps/frontend/src/lib/i18n/translations/en/
├── entityCard.json            # Optional: rename keys (showAllCandidates → showAllChildren) OR add a parallel summary key
├── entityDetails.json         # Rename `tabs.candidates` → `tabs.children` (English label can stay "Candidates" for orgs OR generalise to "Members" — consider entity-type-specific labels in t() callers)
└── results.json (no change needed; existing alliance.numShown already covers tab plural)
# Same updates required in: da, et, fi, fr, lb, sv (6 other locales)

apps/frontend/src/lib/types/generated/
└── translationKey.ts          # Auto-regenerated by yarn workspace @openvaa/frontend tools/translationKey/generateTranslationKeyType.ts → run after i18n edits
```

### Pattern 1: cardContents Opt-In Gate (existing pattern, EXTENDED for alliance)

**What:** Each entity-type's card content is gated by an `Array<...>` opt-in: a feature renders only when its key is present in the array.
**When to use:** All entity-card features that should be configurable per VAA instance.
**Example (current code path being renamed):**
```ts
// Source: apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:131-142
if (
  variant === 'list' &&
  unwrapped.nomination &&
  isObjectType(unwrapped.nomination, OBJECT_TYPE.OrganizationNomination) &&
  $appSettings.results?.cardContents?.organization?.includes('candidates')   // ← rename to 'children'
) {
  scs = findCandidateNominations({ matches: voterContext?.matches, nomination: unwrapped.nomination }).map((e) => ({
    entity: e
  }));
}
```

### Pattern 2: Cascading Proxy Imputation (NEW for Phase 69)

**What:** Pass 1 builds `MatchingProxy<OrganizationNomination>` reading from candidate-nom entity answers. Pass 2 builds `MatchingProxy<AllianceNomination>` reading from Pass-1 org proxies (NOT from org entities, which still have `null` for unanswered questions).
**When to use:** Multi-level parent imputation where intermediate-level entities don't own answers.
**Sketch (research-only — exact diff is for the plan):**
```ts
// Source: apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts
// (1) Widen generic constraint
export function imputeParentAnswers<
  TNomination extends OrganizationNomination | FactionNomination | AllianceNomination
>({
  nominations,
  questions,
  childProxies   // NEW optional
}: {
  nominations: Array<TNomination>;
  questions: Array<AnyQuestionVariant>;
  childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>>;
}): Array<MatchingProxy<TNomination>> {
  // ... existing proxy-building unchanged ...

  for (let i = 0; i < nominations.length; i++) {
    const parent = nominations[i];

    // (2) Extend child-lookup to handle Alliance parents
    let children: Array<AnyNominationVariant>;
    if (isObjectType(parent, OBJECT_TYPE.AllianceNomination)) {
      children = parent.organizationNominations;
    } else if (isObjectType(parent, OBJECT_TYPE.OrganizationNomination) && parent.hasFactions) {
      children = parent.factionNominations;
    } else {
      children = (parent as OrganizationNomination | FactionNomination).candidateNominations;
    }
    if (children.length === 0) continue;

    // ... existing unanswered-questions filter ...

    for (const question of unansweredQuestions) {
      // (3) Read child answers from proxy if available, else from entity
      const answers = children
        .map((c) => {
          const proxy = childProxies?.get(c.id);
          if (proxy) return proxy.answers[question.id]?.value;
          return c.entity.getAnswer(question)?.value;
        })
        .filter((v) => v != null);
      // ... existing imputation logic unchanged (median / mode / median for ordinal/categorical/number) ...
    }
  }

  return buildProxies();
}
```

### Pattern 3: Sequential matchStore Loop (REFACTOR)

**What:** The current `Object.fromEntries(Object.entries(electionContent).map(...))` builds match results per-entityType in isolation. To pass org-pass proxies into the alliance call, refactor to a sequential `for...of` accumulator.
**When to use:** When one entity-type's match-pipeline output feeds another entity-type's input within the same election iteration.
**Sketch (research-only):**
```ts
// Source: apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts:48-98
for (const [electionId, electionContent] of Object.entries(nq)) {
  const electionMatches: Record<EntityType, Array<MaybeWrappedEntityVariant>> = {} as never;
  // Pass 1 cache for the alliance branch
  const orgProxiesById = new Map<Id, MatchingProxy<AnyNominationVariant>>();

  for (const [entityType, { nominations, opinionQuestions: questions }] of Object.entries(electionContent)) {
    const numAnswers = countAnswers({ questions, answers: currentAnswers });
    if (numAnswers < minAns) { electionMatches[entityType] = nominations; continue; }
    if (!nominations.length) { electionMatches[entityType] = []; continue; }

    const questionGroups = submatches.includes(entityType as EntityType)
      ? removeDuplicates(questions.map((q) => q.category))
      : undefined;

    let proxies: Array<MatchingProxy<AnyNominationVariant>> | undefined;
    if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
      // existing branch
      if (parentMethod === 'impute') {
        proxies = imputeParentAnswers({
          nominations: nominations as Array<OrganizationNomination | FactionNomination>,
          questions
        });
        // Cache org proxies for the alliance branch
        if (entityType === ENTITY_TYPE.Organization) {
          for (const p of proxies) orgProxiesById.set(p.target.id, p);
        }
      }
    } else if (entityType === ENTITY_TYPE.Alliance) {
      // NEW alliance branch
      if (parentMethod === 'impute') {
        proxies = imputeParentAnswers({
          nominations: nominations as Array<AllianceNomination>,
          questions,
          childProxies: orgProxiesById
        });
      }
    }

    const matches = algorithm.match<AnyNominationVariant | MatchingProxy<AnyNominationVariant>>({
      questions, reference: voter, targets: proxies ?? nominations, options: { questionGroups }
    });
    electionMatches[entityType] = proxies
      ? matches.map((m) => unwrapProxiedMatch(m as Match<MatchingProxy<AnyNominationVariant>>))
      : matches;
  }
  tree[electionId] = electionMatches;
}
```

### Anti-Patterns to Avoid

- **Destructuring reactive context properties.** Per CLAUDE.md "Context Destructuring Rule (Svelte 5)": `voterCtx.matches` is a reactive accessor — already correctly read via `voterContext?.matches` in EntityCard.svelte:139 and EntityDetails.svelte:79 (which uses the local `voterContext` capture). Phase 69's new branch in EntityCard MUST follow the same pattern: read `voterContext?.matches` inside the `$derived.by()` block, not destructure.
- **Writing imputed answers back to the entity.** Explicitly forbidden by D-05. The `MatchingProxy` pattern is reversible; entity writes are not.
- **Inserting alliance branch BEFORE org branch in matchStore.** The cascade depends on Pass 1 (orgs) running before Pass 2 (alliances). The current loop is `.map()` over `Object.entries(electionContent)` — JS object iteration order is insertion-order-stable, and `entityTypes` from voterContext is `appSettings.results?.sections` which the seed orders as `['candidate', 'organization', 'alliance']`. **However:** an authored override that listed alliance first would silently break the cascade. Recommend an explicit invariant: build an `orgProxiesById` map from the org branch and pass it to alliance only if non-empty; if empty, alliance pass falls back to reading entity answers (which are null for alliances → no impute → matches unchanged). The refactor to sequential `for...of` makes this invariant local and reviewable.
- **Hard-coding the Alliance subcard count.** `maxSubcards = members.length` works today (3 per alliance in seed) but couples the override to seed shape. Use `Infinity` instead (Pattern 1 above).
- **Adding new bespoke components for the alliance drawer body.** Per ROADMAP SC-3: "no new bespoke components for the drawer body." Reuse `EntityChildren.svelte` with `entityType={ENTITY_TYPE.Organization}` for the alliance children tab.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sort + match-merge for alliance member orgs | Custom traversal logic | `findCandidateNominations`-style helper (`findOrganizationNominations`) reusing `findNomination` + `compareMaybeWrappedEntities` | Phase 69's helper is a near-clone — `(alliance, matches) → Array<Match<OrgNom>>`. Identical sort/match-merge contract; copy-paste-adapt is the right call. |
| Plural-rule formatting for "X candidates across N parties" | Custom string-build loop | `sveltekit-i18n` `t('results.alliance.summary', { numCandidates, numParties })` with ICU-style plural rules in the locale JSON | Existing pattern at `entityCard.showAllCandidates` (numCandidates) and `results.candidate.numShown` (plural form) — reuse the ICU `{numShown, plural, =0 {...} =1 {...} other {# ...}}` format. |
| Truncation logic for "show all" alliance subcards | Custom `slice` + button | EntityCard.svelte's existing `slice(0, showAllSubcards ? undefined : maxSubcards)` + the conditional `{#if parsed.subcards.length > maxSubcards}` button (lines 287-303) | Already battle-tested for org → candidate cards; with `maxSubcards = Infinity` the same code suppresses the button correctly. |
| Click-to-drawer route synthesis for alliance | Custom URL builder | `$getRoute({ route: 'ResultEntity', entityTypePlural: 'alliances', entityTypeSingular: 'alliance', id, nominationId })` after widening matchers | Identical surface to organization/candidate; only the matcher `match()` predicate changes. |

**Key insight:** the alliance card render is mechanically near-identical to the org card. Phase 69 is mostly **uniform extension of an existing pattern, not new feature engineering.** The only genuinely new work is the cascading proxy in `imputeParentAnswers` + the matchStore loop refactor.

## Per-Research-Focus-Item Findings

### Finding 1 — Type-rename blast radius (mechanical) [HIGH]

The rename has **two distinct surfaces**:

**A. `cardContents.organization` value `'candidates'` → `'children'`**

Total sites with the literal string `'candidates'` in cardContents context (excluding adjacent `'candidates'` strings that mean URL-plural / table-name / i18n-key — those stay):

| File | Line | Context | Action |
|------|------|---------|--------|
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | 212 | `cardContents.organization` union member | Rename literal `'candidates'` → `'children'`; add JSDoc note |
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | 219-230 | `cardContents.alliance` union | Add `'children'` literal next to `'submatches'` and `QuestionInCardContent` |
| `packages/app-shared/src/settings/dynamicSettings.ts` | 62 | `cardContents.organization: ['candidates']` default | `'candidates'` → `'children'` |
| `packages/app-shared/src/settings/dynamicSettings.ts` | 63 | `cardContents.alliance: []` | Change to `cardContents.alliance: ['children']` |
| `packages/dev-seed/src/templates/default.ts` | 248 | seed override `organization: ['candidates']` | `'candidates'` → `'children'` |
| `packages/dev-seed/src/templates/default.ts` | 249 | seed override `alliance: []` | Change to `alliance: ['children']` |
| `packages/dev-seed/src/templates/e2e.ts` | 97 | E2E template `organization: ['candidates']` | `'candidates'` → `'children'` |
| `packages/dev-seed/tests/templates/variant-app-settings.test.ts` | 119 | unit-test fixture pin `organization: ['candidates']` | `'candidates'` → `'children'` |
| `packages/dev-seed/tests/templates/e2e-app-settings.test.ts` | 107 | unit-test fixture pin `organization: ['candidates']` | `'candidates'` → `'children'` |
| `tests/tests/specs/variants/results-sections.spec.ts` | 66, 146 | E2E variant pin `organization: ['candidates']` | `'candidates'` → `'children'` |
| `tests/tests/specs/variants/constituency.spec.ts` | 58 | E2E variant pin | `'candidates'` → `'children'` |
| `tests/tests/specs/variants/startfromcg.spec.ts` | 71, 100 | E2E variant pin | `'candidates'` → `'children'` |
| `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` | 137 | `cardContents?.organization?.includes('candidates')` | `'candidates'` → `'children'` |

**Total cardContents-rename sites: 13** [VERIFIED: grep `'candidates'` against `apps/frontend/src/lib/**`, `packages/app-shared/**`, `packages/dev-seed/**`, `tests/**` 2026-05-09]

**Confirmed-NOT-renamed `'candidates'` strings** (these are URL-plural / table-name / type-tag, NOT cardContents semantics):
- `apps/frontend/src/params/entityTypePlural.{ts,test.ts}` — URL plural matcher
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:99,118,141,255,275` — URL plural string
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:424,426` — Supabase table name
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — Supabase table name
- `apps/frontend/src/lib/components/entityTag/EntityTag.svelte:38` — `faction: 'candidates'` icon-name string
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte:75` — URL plural for parent-route synth
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:110` — URL plural for default-action route (BUT see Risk #4 — needs widening for alliance)
- `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` — generated-file references
- `packages/dev-seed/src/...` (NominationsGenerator, CandidatesGenerator, supabaseAdminClient, emitters, generators, etc.) — DB table-name / refs.candidates ref-name strings; NOT cardContents semantics

**B. `OrganizationDetailsContent` type rename → `ParentEntityDetailsContent`**

This type rename has a **tiny blast radius**:

| File | Line | Context | Action |
|------|------|---------|--------|
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | 372-376 | `export type OrganizationDetailsContent = 'candidates'` | Rename to `export type ParentEntityDetailsContent = 'children'` (and rename the JSDoc) |
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | 37 | `Array<EntityDetailsContent | OrganizationDetailsContent>` for organization tabs | `OrganizationDetailsContent` → `ParentEntityDetailsContent` |
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | (NEW) | `entityDetails.contents.alliance` type entry | New entry: `Array<EntityDetailsContent | ParentEntityDetailsContent>` (or narrower per planner discretion — D-02) |
| `packages/app-shared/src/settings/dynamicSettings.ts` | 7 | `organization: ['info', 'candidates', 'opinions']` default | `'candidates'` → `'children'` |
| `packages/app-shared/src/settings/dynamicSettings.ts` | (NEW) | `entityDetails.contents.alliance` default | Add: `alliance: ['info', 'children']` |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | 41 | `import type { ..., OrganizationDetailsContent } from '@openvaa/app-shared'` | Rename to `ParentEntityDetailsContent` |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | 62 | `type ContentTab = { content: EntityDetailsContent | OrganizationDetailsContent; ... }` | Rename type ref |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | 68 | `let tabs: Array<EntityDetailsContent | OrganizationDetailsContent>` | Rename type ref |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | 71 | `tabs = ... ['info', 'opinions', 'candidates'] : ['info', 'opinions']` | `'candidates'` → `'children'`; add alliance fallback `nakedEntity.type === 'alliance' ? ['info', 'children'] : ...` (or restructure) |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | 78 | `if (tabs.includes('candidates') && isObjectType(nomination, OBJECT_TYPE.OrganizationNomination))` | `'candidates'` → `'children'`; widen branch to also handle `OBJECT_TYPE.AllianceNomination → organizationNominations` |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | 124 | `{:else if contentTabs[activeIndex]?.content === 'candidates'}` | `'candidates'` → `'children'` |

**Total type-rename sites: 11** [VERIFIED: grep `OrganizationDetailsContent\|EntityDetailsContent` 2026-05-09 — only 1 consumer file outside the type definition itself]

**Out-of-scope grep matches** (NOT renamed): `findCandidateNominations` utility name (per CONTEXT explicit out-of-scope); the i18n key `entityDetails.tabs.candidates` (see Finding 6 — separate decision).

### Finding 2 — EntityCard subentities branch — Alliance handling [HIGH]

**Current state (apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:131-142):**
```ts
if (
  variant === 'list' &&
  unwrapped.nomination &&
  isObjectType(unwrapped.nomination, OBJECT_TYPE.OrganizationNomination) &&
  $appSettings.results?.cardContents?.organization?.includes('candidates')
) {
  scs = findCandidateNominations({ matches: voterContext?.matches, nomination: unwrapped.nomination }).map((e) => ({
    entity: e
  }));
}
```

**Phase 69 extension (sketch — not the plan):**
```ts
let scsMaxOverride: number | undefined;  // NEW — drives card-level maxSubcards override

if (
  variant === 'list' &&
  unwrapped.nomination &&
  isObjectType(unwrapped.nomination, OBJECT_TYPE.OrganizationNomination) &&
  $appSettings.results?.cardContents?.organization?.includes('children')
) {
  scs = findCandidateNominations({ matches: voterContext?.matches, nomination: unwrapped.nomination }).map((e) => ({
    entity: e
  }));
} else if (
  variant === 'list' &&
  unwrapped.nomination &&
  isObjectType(unwrapped.nomination, OBJECT_TYPE.AllianceNomination) &&
  $appSettings.results?.cardContents?.alliance?.includes('children')
) {
  scs = findOrganizationNominations({ matches: voterContext?.matches, nomination: unwrapped.nomination }).map((e) => ({
    entity: e
  }));
  scsMaxOverride = Infinity;  // D-03: render all members, not just top-3
}
```

**Recursion safety (CRITICAL):** Card recursion is `<EntityCard variant="subcard" {...ecProps}>`. The opt-in pattern self-terminates: when `variant === 'subcard'`, the subentities `if` (line 134) requires `variant === 'list'` so subcards do NOT spawn their own subcards. **Verified:** an alliance-card in `'list'` variant renders org-nom subcards in `'subcard'` variant; those org-nom subcards do NOT render candidate-nom sub-subcards (the `variant === 'list'` check in line 134 short-circuits). So we get exactly 2 levels: alliance card → org-nom subcards. [VERIFIED: EntityCard.svelte:134 + recursion at line 288 with `variant="subcard"`]

**`maxSubcards` override propagation:** `maxSubcards` is currently a top-level prop (default 3, line 67). Two implementation choices:
1. **Local override:** add `let scsMaxOverride: number | undefined` to the `parsed` block; replace `maxSubcards` reads in the template (lines 287, 290, 297-301) with `scsMaxOverride ?? maxSubcards`. (RECOMMENDED — keeps `maxSubcards` prop semantics intact.)
2. **Re-parameterise the prop:** add `maxAllianceSubcards` separately. (NOT RECOMMENDED — adds a prop just for one branch.)

**Confidence:** HIGH — pattern verified end-to-end against current code.

### Finding 3 — EntityDetails (drawer) Alliance handling [HIGH]

**Current state (apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte:62-81):**
```ts
type ContentTab = { content: EntityDetailsContent | OrganizationDetailsContent; label: string };

let contentTabs: Array<ContentTab> = $derived.by(() => {
  const { entity: nakedEntity } = unwrapEntity(entity);
  let tabs: Array<EntityDetailsContent | OrganizationDetailsContent> =
    $appSettings.entityDetails.contents[nakedEntity.type as keyof AppSettings['entityDetails']['contents']];
  if (!tabs?.length)
    tabs = nakedEntity.type === 'organization' ? ['info', 'opinions', 'candidates'] : ['info', 'opinions'];
  return tabs.map((tab) => ({ content: tab, label: t(`entityDetails.tabs.${tab}`) }));
});

let children: Array<MaybeWrappedEntityVariant> = $derived.by(() => {
  const { nomination } = unwrapEntity(entity);
  const tabs = contentTabs.map((ct) => ct.content);
  if (tabs.includes('candidates') && isObjectType(nomination, OBJECT_TYPE.OrganizationNomination))
    return findCandidateNominations({ matches: voterContext?.matches, nomination });
  return [];
});
```

**Phase 69 extensions:**
1. Type rename: `OrganizationDetailsContent` → `ParentEntityDetailsContent` everywhere (3 sites: lines 41, 62, 68).
2. Default-tabs ternary widening: `nakedEntity.type === 'alliance' ? ['info', 'children'] : nakedEntity.type === 'organization' ? ['info', 'opinions', 'children'] : ['info', 'opinions']`.
3. `children` derivation: extend the `if (tabs.includes('children'))` branch to also handle `OBJECT_TYPE.AllianceNomination`:
   ```ts
   if (tabs.includes('children')) {
     if (isObjectType(nomination, OBJECT_TYPE.OrganizationNomination))
       return findCandidateNominations({ matches: voterContext?.matches, nomination });
     if (isObjectType(nomination, OBJECT_TYPE.AllianceNomination))
       return findOrganizationNominations({ matches: voterContext?.matches, nomination });
   }
   return [];
   ```
4. `entityType` to pass to `<EntityChildren>` (line 126): currently hard-coded `entityType={ENTITY_TYPE.Candidate}`. Extend to: derive from the nomination's children type. Concretely: `entityType={isObjectType(nomination, OBJECT_TYPE.AllianceNomination) ? ENTITY_TYPE.Organization : ENTITY_TYPE.Candidate}` — this drives the i18n key `results.${entityType}.numShown` (existing keys exist for both: `results.candidate.numShown` AND `results.organization.numShown`).
5. The `voterContext` capture at lines 56-59 already handles the voter-vs-candidate appType branch — no change needed.

**`AppSettings['entityDetails']['contents']` access (line 69):** the keyof index access currently uses `nakedEntity.type` which for alliance entities returns `'alliance'`; the type-system surface needs `entityDetails.contents.alliance` to exist for this to typecheck. Phase 69 D-02 ensures it does. [VERIFIED: dynamicSettings.type.ts:25-47]

**Confidence:** HIGH — every site verified against current code.

### Finding 4 — `imputeParentAnswers` generalisation [HIGH]

**Current signature (apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts:22-28):**
```ts
export function imputeParentAnswers<TNomination extends OrganizationNomination | FactionNomination>({
  nominations,
  questions
}: {
  nominations: Array<TNomination>;
  questions: Array<AnyQuestionVariant>;
}): Array<MatchingProxy<TNomination>>
```

**Current child-lookup branch (lines 42-48):**
```ts
const parent = nominations[i];
const children =
  isObjectType(parent, OBJECT_TYPE.OrganizationNomination) && parent.hasFactions
    ? parent.factionNominations
    : parent.candidateNominations;  // ← only valid for OrgNom (candidates) and FactionNom (candidateNominations)
```

**Current answer-read (line 56):**
```ts
const answers = children.map((c) => c.entity.getAnswer(question)?.value).filter((v) => v != null);
```

**Phase 69 generalisation (concrete sketch — not plan task):**
```ts
import type { Id } from '@openvaa/core';
import type { AllianceNomination, AnyNominationVariant } from '@openvaa/data';
// ... existing imports ...

export function imputeParentAnswers<
  TNomination extends OrganizationNomination | FactionNomination | AllianceNomination
>({
  nominations,
  questions,
  childProxies
}: {
  nominations: Array<TNomination>;
  questions: Array<AnyQuestionVariant>;
  /**
   * Optional map of pre-imputed proxy answers, keyed by child nomination id.
   * When a child has a proxy in this map, its proxy.answers are read instead
   * of the underlying entity.getAnswer() — enables cascading parent-pass imputation
   * (orgs Pass 1 produces proxies that feed alliance Pass 2 without entity writes).
   */
  childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>>;
}): Array<MatchingProxy<TNomination>> {
  // ... existing proxy-base build (line 30) unchanged ...

  for (let i = 0; i < nominations.length; i++) {
    const parent = nominations[i];

    // Extended child-lookup: alliance → org-noms; org+factions → faction-noms; org+candidates / faction → candidate-noms
    let children: ReadonlyArray<AnyNominationVariant>;
    if (isObjectType(parent, OBJECT_TYPE.AllianceNomination)) {
      children = parent.organizationNominations;
    } else if (isObjectType(parent, OBJECT_TYPE.OrganizationNomination) && parent.hasFactions) {
      children = parent.factionNominations;
    } else {
      children = (parent as OrganizationNomination | FactionNomination).candidateNominations;
    }
    if (children.length === 0) continue;

    const unansweredQuestions = matchableQuestions.filter((q) => parent.entity.getAnswer(q) == null);
    if (unansweredQuestions.length === 0) continue;

    for (const question of unansweredQuestions) {
      // Extended answer-read: prefer childProxy answers if available
      const answers = children
        .map((c) => {
          const proxy = childProxies?.get(c.id);
          if (proxy) return proxy.answers[question.id]?.value;
          return c.entity.getAnswer(question)?.value;
        })
        .filter((v) => v != null);
      if (answers.length === 0) continue;
      // ... existing per-question-type imputation (median / mode / median for ordinal/categorical/number) unchanged ...
    }
  }
  return buildProxies();
}
```

**Inline-comment anchor opportunity (per Focus #9):** add a 5-10 line comment block at the top of the function (above the existing JSDoc) explaining the cascading-proxy pattern and why entity writes are forbidden. Recommended location: just above line 16 (above the existing `@param` JSDoc).

**`MatchingProxy.answers` shape:** verified `class MatchingProxy { constructor(public target, public answers: AnswerDict) {} }` — `answers` is `AnswerDict` keyed by `questionId` with `Answer<typeof value>` values, matching `parent.entity.getAnswer(question)` shape. [VERIFIED: imputeParentAnswers.type.ts:7-12 + imputeParentAnswers.ts:88-92]

**Confidence:** HIGH — function structure and types verified.

### Finding 5 — `matchStore` Alliance branch [HIGH]

**Current branching (apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts:65-79):**
```ts
if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
  switch (parentMethod) {
    case 'impute':
      proxies = imputeParentAnswers({
        nominations: nominations as Array<OrganizationNomination | FactionNomination>,
        questions
      });
      break;
    // ...
  }
}
```

**Phase 69 extension — TWO architectural options:**

**Option A: Single branch with shared cache (RECOMMENDED) — refactor `.map()` to `for...of` for explicit ordering:**
- Refactor `Object.fromEntries(Object.entries(electionContent).map(...))` to a sequential `for...of` accumulator (Pattern 3 sketch above).
- Build `orgProxiesById = new Map<Id, MatchingProxy<AnyNominationVariant>>()` after the org branch produces proxies.
- Add Alliance branch: `imputeParentAnswers({ nominations: ... as Array<AllianceNomination>, questions, childProxies: orgProxiesById })`.
- Pros: explicit cross-iteration state; resilient to override order in `appSettings.results.sections`.
- Cons: refactor changes the existing `.map()` shape (small reviewability cost).

**Option B: Keep `.map()` shape, build org cache via outer pass:**
- Pre-loop: extract org-noms from `electionContent`, build proxies, cache in `orgProxiesById`.
- In the existing `.map()`, branch alliance to read from the cached map.
- Pros: minimal diff vs current code.
- Cons: redundant computation (orgs are imputed twice — once in pre-pass, once in the map branch); fragility.

**Sequencing analysis (which order does iteration take?):**
- `entityTypes` driver: `appSettings.results?.sections` (voterContext.svelte.ts:326) → flows to `nominationAndQuestionStore` `entityTypes` arg (line 336) → drives `types.map(...)` (nominationAndQuestionStore.svelte.ts:69) → builds `electionContent` with insertion order = sections array order.
- Default seed (`packages/dev-seed/src/templates/default.ts:253`): `sections: ['candidate', 'organization', 'alliance']` — Alliance is LAST. ✓ Cascade order satisfied by data-shape default.
- Risk: a customer override that reorders sections (e.g. `['alliance', 'organization', 'candidate']`) would silently break the cascade in Option B. Option A's explicit `for...of` makes this invariant local and reviewable.

**Recommendation:** Option A (refactor to sequential `for...of`). The diff is ~30 lines and clarifies the cross-iteration cache.

**Confidence:** HIGH — architecture verified against the existing match loop and the data-shape iteration order.

### Finding 6 — "X candidates across N parties" summary computation [MEDIUM]

**Source of truth:**
- `N` = `alliance.organizationNominationIds.length` (= `nomination.organizationNominations.length` from the getter at allianceNomination.ts:87-90)
- `X` = `alliance.organizationNominations.reduce((sum, org) => sum + org.candidateNominations.length, 0)`

**Where to compute:** TWO defensible sites:
1. **Inside EntityCard's `parsed` $derived block** — alongside subcards. Pros: locality with the alliance render branch. Cons: re-computed on each render; couples summary to card.
2. **As a method on `AllianceNomination`** (e.g. `get summary(): { numCandidates: number; numParties: number }`). Pros: data-layer-owned; reusable from drawer header. Cons: requires `@openvaa/data` package change (out of scope per CONTEXT — phase is frontend-only).

**RECOMMENDED:** site (1) — inline derivation in `EntityCard.svelte` + a sibling derivation in `EntityDetails.svelte` for the drawer header. Both can share a tiny utility helper (e.g. `getAllianceSummary(allianceNom): { numCandidates: number; numParties: number }`) in `apps/frontend/src/lib/utils/`. The helper avoids drift between the two sites.

**Internationalisation surface:**
- ICU plural-rule pattern in use: see `apps/frontend/src/lib/i18n/translations/en/results.json:6` `"numShown": "{numShown, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}}"`
- For Phase 69 add a key like `results.alliance.summary` with shape: `"{numCandidates, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}} across {numParties, plural, =0 {no parties} =1 {1 party} other {# parties}}"` — note ICU supports nested plurals.
- 7 locale folders to update: `da`, `en`, `et`, `fi`, `fr`, `lb`, `sv`. (English mandatory; others can ship with English fallback if locale-team isn't available — check existing locale ratchet for pattern.)
- After JSON edits, regenerate `apps/frontend/src/lib/types/generated/translationKey.ts` via `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` (read at line 7: outputs to `src/lib/types/generated/translationKey.ts`). Run via `cd apps/frontend && tsx tools/translationKey/generateTranslationKeyType.ts` or whatever existing yarn script exists.

**Edge cases:**
- `X = 0`: ICU `=0 {No candidates}` clause handles.
- `N = 0`: shouldn't occur (constructor enforces non-empty `organizationNominationIds`), but ICU `=0 {no parties}` handles defensively.
- `N = 1`: ICU `=1 {1 party}` clause; the line still renders meaningfully.

**Decision deferred to Claude's discretion (per CONTEXT):** exact wording / format / fallback. Recommend the nested-plural pattern above; planner picks final wording.

**Confidence:** MEDIUM — pattern is verified, but exact i18n key naming and locale-team fan-out is discretionary.

### Finding 7 — `maxSubcards` override semantics [HIGH]

**Current truncation (apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:285-303):**
```svelte
{#if parsed.subcards?.length}
  <div class="mt-md gap-lg grid empty:mt-0">
    {#each parsed.subcards.slice(0, showAllSubcards ? undefined : maxSubcards) as ecProps}
      <EntityCard variant="subcard" {...concatClass(ecProps, 'offset-border')} />
    {/each}
    {#if parsed.subcards.length > maxSubcards}
      <div class="offset-border -my-md relative after:!top-0">
        <Button
          onclick={handleSubcardsToggle}
          variant="secondary"
          color="secondary"
          class="max-w-none"
          text={showAllSubcards
            ? t('entityCard.hideAllCandidates')
            : t('entityCard.showAllCandidates', {
                numCandidates: parsed.subcards.length
              })} />
      </div>
    {/if}
  </div>
{/if}
```

**Truncation happens at line 287** (`slice(0, showAllSubcards ? undefined : maxSubcards)`) — and the expand-button visibility at line 290 (`parsed.subcards.length > maxSubcards`).

**Override behaviour:**
- `maxSubcards = Infinity`: `slice(0, Infinity)` returns full array; `length > Infinity` is `false` → button suppressed → "show all" is implicit, no expand UI.
- `maxSubcards = members.length`: `slice(0, length)` returns full array; `length > length` is `false` → button suppressed. Same end result, but ties to data shape.

**Recommended override site:** within the `parsed` $derived block, alongside `scs`. Add a `subcardsMax` field to the returned object; in the template, replace `maxSubcards` reads at lines 287, 290 with `parsed.subcardsMax ?? maxSubcards` (or similar). Keep the prop default of `3` for the org → candidate path.

**Translation-key consideration:** when `showAllSubcards === false`, the button text uses `entityCard.showAllCandidates` ("Show all {numCandidates} candidates"). For an alliance card with `maxSubcards = Infinity`, the button isn't rendered, so the candidate-named key isn't surfaced for alliances — no rename of that key is required by Phase 69. (If org cards eventually get `'children'` opt-in too with a non-3 maxSubcards override, the key name `entityCard.showAllCandidates` remains semantically tied to the org-children = candidate path; keep as-is.)

**Confidence:** HIGH — verified against current template.

### Finding 8 — Default-settings update path [HIGH]

**Defaults live in TWO places, both must be updated:**

1. **`packages/app-shared/src/settings/dynamicSettings.ts`** (the TS-level defaults consumed by `mergeAppSettings` when the supabase row is empty):
   ```ts
   // Lines 4-8 — entityDetails.contents
   entityDetails: {
     contents: {
       candidate: ['info', 'opinions'],
       organization: ['info', 'candidates', 'opinions']  // ← rename 'candidates' → 'children'
       // ← ADD: alliance: ['info', 'children']
     },
     // ...
   }
   // Lines 59-67 — results.cardContents
   results: {
     cardContents: {
       candidate: ['submatches'],
       organization: ['candidates'],   // ← rename to ['children']
       alliance: []                     // ← change to ['children']
     },
     // ...
   }
   ```

2. **`packages/dev-seed/src/templates/default.ts:246-254`** (the dev-seed override that lands in supabase rows; per Phase 67 cross-cutting fix #2, the FULL `results` block must be present because the client-side merge is shallow):
   ```ts
   results: {
     cardContents: {
       candidate: ['submatches'],
       organization: ['candidates'],   // ← rename to ['children']
       alliance: []                    // ← change to ['children']
     },
     showFeedbackPopup: 180,
     showSurveyPopup: 500,
     sections: ['candidate', 'organization', 'alliance']  // ← UNCHANGED
   }
   ```
   **Note:** the seed template does NOT currently override `entityDetails.contents` — so defaults from `dynamicSettings.ts` flow through unimpeded. Phase 69 may continue this pattern; the new `alliance: ['info', 'children']` lives ONLY in `dynamicSettings.ts`. [VERIFIED: grep `entityDetails` in `packages/dev-seed/src` returns no matches]

3. **`packages/dev-seed/src/templates/e2e.ts:94-100`** (E2E template — no alliance section, but still has cardContents.organization):
   ```ts
   results: {
     cardContents: {
       candidate: ['submatches'],
       organization: ['candidates']    // ← rename to ['children']
     },
     sections: ['candidate', 'organization']
   }
   ```
   The E2E template intentionally OMITS alliance from sections (per Phase 67 D-04: e2e fixture unchanged). Phase 69 needs only the `'candidates'` → `'children'` rename here; do NOT add alliance to E2E sections.

**Confidence:** HIGH — all three default-settings sites verified.

### Finding 9 — Inline justification format for the cascading-impute pattern [LOW priority]

The CONTEXT.md `code_context` section mentions: "Cascading proxy pattern (new)... No entity is mutated."

**Recommended anchor location:** `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts`, in the JSDoc above the `imputeParentAnswers` function (currently at lines 16-21). Extend the existing JSDoc to capture:
1. **Why proxies, not entity writes:** entity writes leak imputed values into other read paths (filters, drawers); proxies are scoped to matching only.
2. **Why optional `childProxies`:** lets callers compose passes (org pass produces proxies; alliance pass consumes them) without coupling the function to a particular cascade depth.
3. **Why orgs first:** alliance entities own no answers; reading from already-imputed org proxies gives alliances meaningful match scores in the same render frame.

**Reference template:** see CLAUDE.md "Context Destructuring Rule (Svelte 5)" — that comment block became the canonical reference. A similar treatment for the cascading-impute pattern would justify Phase 69 D-05 + D-06 in-tree, and set up the broader-refactor todo (deferred per CONTEXT.md "Deferred Ideas" → "New Todo to Capture Post-Phase 69").

**Confidence:** LOW priority — nice-to-have; not blocking.

### Finding 10 — v2.7-close Playwright parity baseline [HIGH]

**Baseline counts:** `67p / 1f / 34c` — set at v2.6 close (Phase 64 post-fix), confirmed at Phase 65, 66, 67 closes; Phase 68 close did NOT re-run E2E (deferred to user manual smoke).

**Baseline JSON file path:** `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` [VERIFIED].

**Most-recent post-fix:** `.planning/milestones/v2.7-phases/67-default-seed-alliances/post-fix/playwright-report.json` [VERIFIED] (also `66-nominations-schema-adapter-type-cleanup/post-fix/playwright-report.json`).

**Diff script:** `.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` [VERIFIED]. Usage:
```bash
node .planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs \
  .planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json \
  <new-post-fix>.json
```
Exit 0 = `PARITY GATE: PASS`.

**Pre-capture protocol (the Phase 64 attempt-4 protocol — must follow exactly to avoid the seed-overlay false-positive):**
```bash
yarn supabase:reset                      # NOT yarn dev:reset-with-data (avoids mixed default+e2e false-positive)
yarn workspace @openvaa/frontend dev &   # dev server on :5173
# wait for /5173 to respond
yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > raw.json
tail -n +2 raw.json > clean.json         # strip dotenv stdout pollution
```

**Documented false-positive trap:** running on top of `yarn dev:reset-with-data` (which seeds the default template) layers BOTH default+e2e templates → 40-question voter flow → 20 voter-app tests time out at question 18/40. Do not use `yarn dev:reset-with-data` before parity capture. [VERIFIED: 67-VERIFICATION.md "Initial false-positive (caught + corrected during Task 3)"]

**Spec-file relevance to alliance:** grep returned ZERO `'alliance'` matches in `tests/tests/specs/voter/*.spec.ts` — confirming there is no E2E coverage for alliance card render. The parity gate is a **regression detector**, not an alliance-feature validator. New alliance behaviour is covered by manual smoke (per Phase 67 D-03 + ROADMAP SC-4). [VERIFIED: grep `alliance\|Alliance` `tests/tests/specs/voter` 2026-05-09]

**Confidence:** HIGH.

### Finding 11 — Validation Architecture (for Nyquist VALIDATION.md downstream) [HIGH]

See dedicated section below.

## File Inventory

**Every file the planner will touch (grep-backed, verified 2026-05-09):**

### Core type surface (Plan 01)
- `packages/app-shared/src/settings/dynamicSettings.type.ts` — type renames (lines 33, 37, 212, 219-230, 359-376) + alliance cardContents/details additions
- `packages/app-shared/src/settings/dynamicSettings.ts` — defaults: line 7 `'candidates'` → `'children'`; add `alliance: ['info', 'children']` to entityDetails.contents; line 62-63 cardContents updates

### Render path (Plan 01)
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` — alliance subentities branch + cardContents `'children'` rename + `maxSubcards` override + summary line + line 110-111 ternary fix for alliance plural
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` — type renames (lines 41, 62, 68) + default-tabs ternary widening (line 71) + children derivation widening (lines 75-81) + tab-render switch (line 124) + EntityChildren entityType derivation (line 126) + drawer-header summary line
- `apps/frontend/src/lib/utils/matches.ts` — add `findOrganizationNominations` sibling next to `findCandidateNominations` (line 53)
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` — generic constraint widening (line 22) + child-lookup branch widening (lines 42-48) + childProxies param (new) + child answer-read with proxy-fallback (line 56) + JSDoc cascading-impute justification (lines 16-21)

### Route-matcher widening (Plan 01 — CRITICAL per Risk #4)
- `apps/frontend/src/params/entityTypePlural.ts` — add `'alliances'` to allowed values
- `apps/frontend/src/params/entityTypeSingular.ts` — add `'alliance'` to allowed values
- `apps/frontend/src/params/entityTypePlural.test.ts` — add positive-case `['alliances', true]` (currently has `['candidates', true]` line 15 + `['organizations', true]`)
- `apps/frontend/src/params/entityTypeSingular.test.ts` — add positive-case `['alliance', true]`
- `apps/frontend/src/lib/utils/route/route.ts` — line 83-84 `DEFAULT_PARAMS`: optionally add `ResultAlliance: { entityTypePlural: 'alliances', entityTypeSingular: 'alliance' }` — only if the planner adds a `ResultAlliance` route id; otherwise `ResultEntity` already covers the path

### Voter results layout extension (Plan 01)
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — line 99 `ENTITY_PLURALS` const update (add `'alliances'`); line 117-119 `_urlPlural` derivation update; line 140-141 `activeEntityType` ternary extension; line 252-264 `handleEntityTabChange` add alliance branch (+ track `results_changeTab` section: 'alliance'); line 273-277 `_pluralForActiveType` add alliance branch; line 366-370 `data-testid` switch add alliance variant (e.g. `voter-results-alliance-section`)

### Matching pipeline (Plan 02)
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` — refactor lines 48-99 to sequential `for...of` accumulator + add Alliance branch at lines 65-79 (after Org branch) with `childProxies` arg

### Dev-seed templates (Plan 01)
- `packages/dev-seed/src/templates/default.ts` — line 248 cardContents.organization rename + line 249 cardContents.alliance content
- `packages/dev-seed/src/templates/e2e.ts` — line 97 cardContents.organization rename
- `packages/dev-seed/tests/templates/variant-app-settings.test.ts` — line 119 fixture pin update
- `packages/dev-seed/tests/templates/e2e-app-settings.test.ts` — line 107 fixture pin update

### E2E test fixture pins (Plan 01)
- `tests/tests/specs/variants/results-sections.spec.ts` — lines 66, 146 cardContents pin update
- `tests/tests/specs/variants/constituency.spec.ts` — line 58 cardContents pin update
- `tests/tests/specs/variants/startfromcg.spec.ts` — lines 71, 100 cardContents pin update

### i18n + generated types (Plan 01)
- `apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/entityDetails.json` — rename `tabs.candidates` → `tabs.children` (or keep both if planner wants progressive removal); update labels per locale
- `apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/results.json` — add `alliance.summary` ICU plural key (existing `alliance.numShown` already covers tab plural)
- `apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/entityCard.json` — OPTIONAL: rename `showAllCandidates` / `hideAllCandidates` keys IF planner decides to. Per Finding 7, the alliance branch suppresses the expand button entirely (`maxSubcards = Infinity`), so these keys remain semantically pinned to org → candidate cards; recommend keeping as-is.
- `apps/frontend/src/lib/types/generated/translationKey.ts` — auto-regenerate via `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` after JSON edits

### Manual smoke + parity (Plan 02)
- (no file edits — runtime exercise of `yarn dev:reset-with-data` followed by 5-step manual smoke + Playwright parity capture per Finding 10)

**Total file count:**
- Required edits: ~16 source files + 7×2 = 14 i18n JSON files + 1 generated file = ~31 files
- E2E test pin edits: 3 spec files (5 line-occurrences)
- Route matcher tests: 2 test files

## Pattern Analogs

**Closest existing code patterns to mirror:**

| Phase 69 Surface | Analog | Why |
|------------------|--------|-----|
| Alliance subentities branch in EntityCard | The existing `OrganizationNomination → CandidateNomination` branch (EntityCard.svelte:131-142) | Mechanically near-identical: type-guard + cardContents-includes + helper-call + `.map(e => ({entity: e}))`. |
| `findOrganizationNominations` helper | `findCandidateNominations` (apps/frontend/src/lib/utils/matches.ts:53-81) | Same input/output shape, just one level up the parent hierarchy: takes alliance-nom, returns Array<Match\<OrganizationNomination\>> sorted by `compareMaybeWrappedEntities`. |
| Alliance drawer children tab | The existing `'candidates'` tab in EntityDetails.svelte:124-127 | Reuses `<EntityChildren>` with `entityType={ENTITY_TYPE.Organization}` instead of `Candidate`. |
| Cascading proxy in matchStore | The existing `parentMethod === 'impute'` org/faction branch (matchStore.svelte.ts:65-79) | Same `imputeParentAnswers` call, just with the `childProxies` arg added and `nominations` cast to `Array<AllianceNomination>`. |
| matchStore loop refactor | The Phase 64 `voterContext.svelte.ts` `$effect`-with-state-mirror pattern (lines 78-132 — "QUESTION-04 follow-up") | Cross-iteration state in a derive is a known Svelte 5 hazard; explicit `for...of` + accumulator is the documented escape. |
| Route-matcher widening | Phase 62 added the matchers as boolean-OR allowlists | One-line addition to the OR chain. |
| "X candidates across N parties" plural rule | `entityCard.showAllCandidates` (numCandidates plural) + `results.{type}.numShown` (ICU plural with =0/=1/other) | ICU nested-plural pattern used elsewhere in the i18n surface. |
| Default-settings cascade in dev-seed (`results` block must be FULL because client-side merge is shallow) | Phase 67 cross-cutting fix #2 (default.ts:238-254 verbatim mirror of dynamicSettings.ts:59-67 + 'alliance' diff) | Proven pattern; phase 69 only diffs the `'candidates'` → `'children'` rename + `cardContents.alliance` content within the same shape. |

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Cascading impute correctness:** alliance proxies read stale org proxies if `matchStore` loop ordering drifts (e.g. customer reorders `appSettings.results.sections`) | LOW (default seed is correct order; customer override unlikely in v2.8) | HIGH (alliance match scores would silently degrade to "no impute") | Refactor matchStore to sequential `for...of` (Pattern 3); guard the alliance branch with an explicit "if `orgProxiesById` is empty, skip the cascade and rely on entity-answer read" fallback. Document the org-first invariant in a JSDoc comment above the alliance branch. |
| 2 | **Type-rename blast radius miss:** missed a `'candidates'` cardContents-string consumer surface area; rename is non-atomic; build breaks midway through landing | MEDIUM | MEDIUM (build break is loud and immediate; not a silent regression) | Plan single commit for the rename across all 13 sites; run `yarn build` + `yarn test:unit` + `yarn lint:check` after each commit boundary. The grep audit in Finding #1 enumerates every site. |
| 3 | **EntityCard recursion explosion:** alliance card → org subcard → org tries to render its own children subcards → infinite loop or unwanted depth | LOW (verified: subcard variant short-circuits the children branch via `variant === 'list'` check at line 134) | MEDIUM | Verify in manual smoke — alliance card renders exactly 2 levels (alliance → org-noms); org-nom subcards do NOT show their own candidate-nom subcards. Phase 69 plan should explicitly assert this in the manual smoke checklist. |
| 4 | **Route-matcher regression:** `entityTypePlural` / `entityTypeSingular` matchers reject `'alliances'` / `'alliance'` → clicking alliance card serves SvelteKit's built-in 404 | HIGH (active bug today; will surface immediately on first click) | HIGH (SC-3 fails; manual smoke step 3 — "click-to-drawer" — fails immediately) | Widen the two `match()` predicates AND `EntityCard.svelte:110-111` ternary (currently falls back to `'organizations'` for non-candidate types) to handle alliance plural. Add positive-case unit tests at `entityTypePlural.test.ts` + `entityTypeSingular.test.ts`. **This is in addition to D-01..D-08; surface it explicitly to the planner.** |
| 5 | **`results/+layout.svelte` tab-handling drift:** `ENTITY_PLURALS = ['candidates', 'organizations']` const + `handleEntityTabChange` only handles candidate/organization branches — alliance tab visible (line 125-132 entityTabs derivation pulls from `voterCtx.matches` keys) but click goes nowhere | HIGH (will block tab switch UX) | HIGH (alliance tab visible but can't be activated via tab click) | Widen `ENTITY_PLURALS`; widen the `_urlPlural` ternary; widen `handleEntityTabChange`; widen `_pluralForActiveType`. All ~5 sites in `+layout.svelte` (lines 99-141, 252-277). |
| 6 | **i18n key churn:** renaming `entityDetails.tabs.candidates` → `entityDetails.tabs.children` cascades through `translationKey.ts` regen; missed locale = build error | LOW (regen is mechanical) | LOW | Run `tools/translationKey/generateTranslationKeyType.ts` after JSON edits; check `yarn workspace @openvaa/frontend check` (svelte-check) for stale references. ALTERNATIVELY: keep `tabs.candidates` AND add `tabs.children` and `tabs.organizations` (graceful migration); pick one based on diff cohesion. |
| 7 | **Imputation regression for orgs (Pass 1):** generalising `imputeParentAnswers` accidentally changes Pass 1's org/faction behaviour | LOW (additive change — generic widening + optional param) | HIGH (would break voter-app match scores for parties — major regression) | When `childProxies` is undefined, the new branch falls back to entity reads — must produce identical output to current code. Cover this with a unit test in `imputeParentAnswers` (or rely on existing Playwright parity gate to catch). Recommended: add a unit test in `apps/frontend/src/lib/utils/matching/` that asserts org-pass output unchanged when `childProxies` is omitted. |
| 8 | **Drawer-header summary recomputation jank:** if "X candidates across N parties" is computed inside a `$derived` that re-runs on every match update, the drawer header may flicker | LOW (derivation is cheap; no async I/O) | LOW | Compute via a tiny utility (`getAllianceSummary`) used in both card and drawer; let `$derived` cache. Verify in manual smoke step "open drawer for alliance with X candidates" — header should be stable. |
| 9 | **`AppSettings['entityDetails']['contents']` keyof index access fails for alliance type if the type-system surface doesn't include alliance entry:** EntityDetails.svelte:69 reads `[nakedEntity.type as keyof ...]` | MEDIUM (TypeScript will fail to compile if type isn't extended) | MEDIUM (build break; loud) | D-02 ensures the type union covers alliance. Verify `yarn workspace @openvaa/frontend check` after adding the alliance entry to `entityDetails.contents`. |
| 10 | **Phase 69 introduces a new Svelte 5 `state_referenced_locally` hazard** — Phase 70 picks up un-justified warnings | LOW (Phase 70 is the cleanup; any new warnings should be caught there) | LOW | Phase 69's new `$state` declarations (e.g. for the summary cache, if any) should follow the CLAUDE.md context-destructuring rule. Read `voterContext.matches` via `voterContext?.matches` (already done in EntityCard:139); apply the same pattern in any new branch. |
| 11 | **E2E variants tests pin literal `'candidates'` value** — renaming breaks `tests/tests/specs/variants/{results-sections,constituency,startfromcg}.spec.ts` | HIGH (tests will fail with "received: 'children', expected: 'candidates'" on first run) | LOW (loud failure; trivial fix in same commit) | Update all 5 line-occurrences (Finding #1 inventory). Do this in the same commit as the type rename to avoid a flaky CI window. |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Frontend unit tests | Vitest 2.x (per `apps/frontend/package.json` `test:unit`) — 37 frontend test files, 646 tests passing at v2.7-close [VERIFIED: 68-VERIFICATION.md SC-4] |
| Dev-seed unit tests | Vitest 2.x (per `packages/dev-seed/package.json`) — 41 dev-seed test files, 484 tests passing at v2.7-close |
| E2E tests | Playwright (`tests/playwright.config.ts`) — 67p / 1f / 34c parity baseline at v2.6-close, held through v2.7 [VERIFIED: 67-VERIFICATION.md] |
| Quick run command | `yarn test:unit` (runs all unit tests across monorepo via Turborepo) |
| Per-package quick run | `yarn workspace @openvaa/frontend test:unit` |
| E2E full suite | `yarn test:e2e` (requires `yarn dev` running) |
| Parity diff script | `node .planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline.json> <post.json>` |
| Manual smoke | 5-step flow on `yarn dev:reset-with-data` per ROADMAP SC-4 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ALLIANCE-01 / SC-1 | EntityCard's subentities branch handles `OBJECT_TYPE.AllianceNomination → OrganizationNomination`; cardContents.alliance widened | unit (component) | `yarn workspace @openvaa/frontend test:unit -- entityCard` | ❌ Wave 0 — no existing EntityCard component test; OPTIONAL per CONTEXT validation surface |
| ALLIANCE-01 / SC-1 | `'candidates'` → `'children'` rename consistent across type surface + defaults + dev-seed + E2E test fixtures | unit (defaults) + spec-fixture pins | `yarn workspace @openvaa/dev-seed test:unit` (covers `variant-app-settings.test.ts` + `e2e-app-settings.test.ts` updated fixtures) | ✅ existing — `packages/dev-seed/tests/templates/variant-app-settings.test.ts:117-121` + `e2e-app-settings.test.ts:104-110` |
| ALLIANCE-01 / SC-2 | After `yarn dev:reset-with-data`, voter results "Alliances" tab renders populated cards (name + member orgs sub-list + summary) | manual smoke (per Phase 67 D-03) | manual: `yarn dev:reset-with-data && yarn dev` then navigate to `/results` and click the Alliances tab | manual-only — ROADMAP SC-2 |
| ALLIANCE-01 / SC-3 | Click alliance card opens drawer; tabs structure = info + children (no opinions); member orgs render in drawer body | manual smoke + route-matcher unit test | `yarn workspace @openvaa/frontend test:unit -- entityTypePlural.test entityTypeSingular.test` (positive-case for alliance) + manual click-through | ✅ existing test file — `apps/frontend/src/params/entityTypePlural.test.ts` + `entityTypeSingular.test.ts` (need positive-case additions for alliance) |
| ALLIANCE-01 / SC-4 | 5-step manual smoke passes; v2.7-close parity baseline `67p / 1f / 34c` continues to pass | manual smoke + Playwright parity gate | manual: 5-step flow + `yarn test:e2e` + `node diff-parity.mjs <baseline> <post>` | ✅ existing parity script + baseline JSON |
| ALLIANCE-01 / cascading-impute | `imputeParentAnswers` produces unchanged org-pass output when `childProxies` is omitted (regression guard) | unit (library) | `yarn workspace @openvaa/frontend test:unit -- imputeParentAnswers` | ❌ Wave 0 — no existing test for this function; RECOMMENDED add given the org-pass regression risk (Risk #7) |
| ALLIANCE-01 / cascading-impute | Alliance pass produces meaningful match scores when org proxies cascade in | manual UI smoke (no new unit test per D-03 / Phase 67 D-03) | exercise via voter-flow with answers ≥ minimumAnswers; observe alliance card has a match score | manual-only |

### Sampling Rate

- **Per task commit (Plan 01 + Plan 02 individual tasks):**
  - `yarn workspace @openvaa/frontend lint:check` — guard against new lint errors (Phase 71 will resolve the existing 95; Phase 69 must not increase the count)
  - `yarn workspace @openvaa/frontend test:unit` (frontend changes only)
  - `yarn workspace @openvaa/dev-seed test:unit` (dev-seed template fixture changes)
  - `yarn build` (catches type errors fast)
- **Per plan close (Plan 01 → Plan 02 boundary):**
  - `yarn build` (full monorepo) + `yarn test:unit` (full)
  - Frontend `svelte-check` baseline assertion (must not regress beyond 160 err / 12 warn per Phase 71 / TYPING-01 contract)
- **Per phase close (Phase 69 final gate):**
  - Full monorepo `yarn build` + `yarn test:unit` + `yarn lint:check` (with documented Option C exception for the 95 frontend lint errors deferred to Phase 71)
  - 5-step manual UI smoke per ROADMAP SC-4
  - Playwright parity capture (with the `yarn supabase:reset` pre-capture protocol — NOT `yarn dev:reset-with-data`)
  - `node diff-parity.mjs` exits 0 with `PARITY GATE: PASS` and counts `67p / 1f / 34c`

### Wave 0 Gaps

- [ ] OPTIONAL — `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` (regression guard for Risk #7: org-pass output unchanged when `childProxies` omitted). Recommended; not strictly required per CONTEXT D-03 + Phase 67 D-03 ("no new unit tests in @openvaa/matching/@openvaa/filters" — but `imputeParentAnswers` lives in `apps/frontend/src/lib/utils/matching/`, NOT in the `@openvaa/matching` package, so a frontend-side unit test is consistent with the spirit of D-03 while still guarding the cascade).
- [ ] OPTIONAL — Component-level test for `EntityCard.svelte` rendering an alliance card (asserts: name + sub-list + summary line). Uses `@testing-library/svelte` if already in scope; otherwise skip per CONTEXT validation surface ("manual UI smoke + parity baseline").
- [ ] REQUIRED — Update fixture pins in `packages/dev-seed/tests/templates/variant-app-settings.test.ts:119` + `e2e-app-settings.test.ts:107` (literal `'candidates'` → `'children'`). Without this, dev-seed unit tests fail.
- [ ] REQUIRED — Update fixture pins in `tests/tests/specs/variants/{results-sections,constituency,startfromcg}.spec.ts` (5 line-occurrences). Without this, E2E variant tests fail with `'candidates'` mismatch.
- [ ] REQUIRED — Add positive-case `['alliances', true]` to `apps/frontend/src/params/entityTypePlural.test.ts` and `['alliance', true]` to `entityTypeSingular.test.ts`.
- [ ] REQUIRED — Regenerate `apps/frontend/src/lib/types/generated/translationKey.ts` after i18n JSON edits (`tsx apps/frontend/tools/translationKey/generateTranslationKeyType.ts` from `apps/frontend`).

## Project Constraints (from CLAUDE.md)

| Constraint | How Phase 69 satisfies |
|------------|------------------------|
| **Svelte 5 Context Destructuring Rule** | Read `voterContext?.matches` reactively at the call-site (already done in EntityCard.svelte:139, EntityDetails.svelte:79). Phase 69's new branches must follow the same pattern. The new `imputeParentAnswers` `childProxies` Map is built inside `matchStore.svelte`'s `$derived.by` so its reactivity is preserved; downstream consumers read via `voterContext.matches.{electionId}.{entityType}` — already a reactive accessor. |
| **TypeScript strictly — avoid `any`** | All Phase 69 type extensions are concrete: `MatchingProxy<AllianceNomination>`, `Map<Id, MatchingProxy<AnyNominationVariant>>`, `ParentEntityDetailsContent`. No `any` introduced. |
| **Localization — all user-facing strings support multiple locales** | New "X candidates across N parties" key lands in all 7 locale folders (`da`, `en`, `et`, `fi`, `fr`, `lb`, `sv`). Plural rules use ICU. |
| **WCAG 2.1 AA accessibility** | Alliance card reuses existing EntityCard a11y surface (aria-labelledby + aria-describedby + data-testid). New summary line is plain text inside the card, no new interactive elements. Drawer reuses existing EntityDetails a11y surface. No new a11y debt. |
| **Matching algorithms — questions creating subdimensions need special handling** | Phase 69's cascading-impute does NOT touch the matching-algorithm subdimensions logic (`@openvaa/matching` is treated as stable per D-03). The proxy substitution is at the answer-source layer; algorithm.match() consumes proxies identically to nominations. |
| **Missing values — use `MISSING_VALUE` from `@openvaa/core` in matching contexts** | `imputeParentAnswers` already filters `null` answers with `.filter((v) => v != null)` (line 56) — phase 69 keeps this. The cascade only writes proxy answers when at least one child has a non-null answer. |
| **Code review checklist** | Plan close + verify-work agent will run the checklist. Phase 69 ships entirely within the established patterns (cardContents opt-in, $derived render, EntityCard recursion, `$appSettings` reactive store), so checklist coverage is mechanical. |

## State of the Art

| Old Approach | Current Approach (Phase 69) | When Changed | Impact |
|--------------|------------------------------|--------------|--------|
| Cardcontents-organization opt-in `'candidates'` (single-level org→candidate) | Semantic-uniform `'children'` (any parent → any direct sub-noms) | Phase 69 D-01 | Symmetric cardContents surface for alliance/org parents; sets precedent for future parent entity types (factions-as-parent if introduced). |
| `entityDetails.contents.organization` includes `'candidates'` value | `entityDetails.contents.organization` includes `'children'`; `entityDetails.contents.alliance` includes `'children'` | Phase 69 D-01 + D-02 | Drawer surface symmetry: any parent entity's drawer can opt into a children tab. |
| Org-only impute (Pass 1: candidate-noms → org-nom proxies) | Org-then-alliance cascade (Pass 1: candidate-noms → org-nom proxies; Pass 2: org-nom proxies → alliance-nom proxies) | Phase 69 D-05 + D-06 | Alliance entities now produce meaningful match scores in voter results. |
| EntityCard subentities branch hard-coded to `OrganizationNomination` | Branch handles both `OrganizationNomination` and `AllianceNomination` | Phase 69 (in scope) | Generalisation pattern; future `FactionNomination` parent could plug in similarly. |
| `cardContents.alliance: []` (Phase 67 placeholder) | `cardContents.alliance: ['children']` (default) | Phase 67 → Phase 69 | Reconciles v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS. |
| Route param-matchers reject `'alliances'` / `'alliance'` | Matchers accept `'candidates'` / `'organizations'` / `'alliances'` (plural) and `'candidate'` / `'organization'` / `'alliance'` (singular) | Phase 69 (in scope, surfaced as Risk #4) | First-class alliance drawer routing. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `data-testid` for an alliance section in the voter results layout should be `voter-results-alliance-section` (analogous to existing `voter-results-candidate-section` / `voter-results-party-section`) | File Inventory § Voter results layout | LOW — manual smoke / Playwright parity will surface a missing testid; rename trivial. [ASSUMED — pattern matched but no explicit user direction] |
| A2 | E2E template (`packages/dev-seed/src/templates/e2e.ts`) does NOT need alliance added to `sections` (Phase 67 explicitly chose not to) — Phase 69 only touches the cardContents.organization rename here | Finding #8 | LOW — adding alliance to E2E sections would change E2E test behaviour and is out of v2.8 scope (E2E coverage is v2.9 anchor). [VERIFIED via Phase 67 D-04 + 67-VERIFICATION.md "No e2e template change"] |
| A3 | Translation-key rename `entityDetails.tabs.candidates` → `entityDetails.tabs.children` is preferable to keeping `tabs.candidates` and ALSO adding `tabs.children`/`tabs.organizations` (the latter would be graceful migration but adds 7 × 2 stale keys) | File Inventory § i18n | LOW — both approaches work; planner chooses based on diff cohesion. [ASSUMED based on rename-uniformity preference; user may prefer graceful migration] |
| A4 | `MatchingProxy.answers[questionId]` — the answer dictionary keyed by question id — is the correct lookup shape for the new `childProxies` read path | Finding #4 | LOW — verified via `MatchingProxy.constructor(public target, public answers: AnswerDict)` at imputeParentAnswers.type.ts:7-12 + the existing write at imputeParentAnswers.ts:88-92. [VERIFIED] |
| A5 | The `for...of` refactor of `matchStore.svelte.ts:48-99` does not break Svelte 5 reactivity (the outer `$derived.by` body is allowed to use imperative loops) | Finding #5 + Pattern 3 | LOW — `$derived.by(() => { ... })` accepts arbitrary code; reactivity is determined by which $state / accessor reads occur during execution. [VERIFIED via existing `$derived.by` patterns in voterContext.svelte.ts:55, 147, 211, etc.] |
| A6 | Adding `'alliances'` to `entityTypePlural.ts` matcher does not require a parallel matcher for any other route surface (the matcher is shared by all `/results/*` routes) | Finding #1 + Risk #4 | LOW — single matcher file is the contract; SvelteKit picks it via the bracket-name. [VERIFIED via `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/...` directory structure and Phase 62 RESEARCH §Pitfall 7] |
| A7 | Phase 69 does NOT need to add a new `ResultAlliance` entry to `route.ts` ROUTE table or DEFAULT_PARAMS — `ResultEntity` already covers the path with explicit params | File Inventory § Route widening | LOW — simplifies the route surface; planner can add ResultAlliance for symmetry if desired. [ASSUMED based on existing `ResultEntity` route id at route.ts:32] |

## Open Questions

1. **Should the `entityDetails.tabs.{key}` translation key be renamed `candidates` → `children`, or kept as `candidates` plus a new parallel `children`?**
   - What we know: 7 locales currently have `tabs.candidates: "Candidates"`. The renamed type union has the value `'children'` — which means EntityDetails.svelte:72 `t(\`entityDetails.tabs.${tab}\`)` would fall through to `tabs.children` after the rename. Without a corresponding JSON key, the t() call returns the key string `"entityDetails.tabs.children"` literal as fallback (sveltekit-i18n behaviour).
   - What's unclear: whether the user prefers graceful migration (keep both keys + label both "Candidates" or "Members") or hard rename.
   - Recommendation: **rename** `tabs.candidates` → `tabs.children` in all 7 locales; for the **English label**, use entity-context-aware labels at the t() callsite — e.g. for an alliance drawer, the children tab label could be "Member Parties"; for an organization drawer, "Candidates". This means the t() call may need to switch to a context-aware key like `entityDetails.tabs.{entityType}.children` (e.g. `tabs.alliance.children: "Member Parties"`, `tabs.organization.children: "Candidates"`). Alternatively keep the rename simple and label both as `"Members"` / `"Children"` (semantically uniform but less polished UX). Defer to planner.

2. **Should the org-pass `imputeParentAnswers` regression test (Risk #7 mitigation) be added to Phase 69, or deferred to a follow-up todo?**
   - What we know: D-03 says "manual UI smoke is the validation surface"; CONTEXT explicitly defers new unit tests in `@openvaa/matching` / `@openvaa/filters`. The function `imputeParentAnswers` lives in `apps/frontend/src/lib/utils/matching/`, not in the `@openvaa/matching` package.
   - What's unclear: whether the spirit of D-03 ("no coupling unit tests to seed shape") allows a frontend-side unit test of the imputeParentAnswers function directly (no seed coupling — tests just feed in synthetic nominations + answer dicts).
   - Recommendation: ADD a small unit test (5-10 cases) at `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts`. Synthetic input — no seed data — so D-03 spirit is preserved. The cascade is the most behaviourally sensitive part of Phase 69; a unit guard prevents regression without manual rerun.

3. **Should the matchStore loop refactor (Pattern 3) ship as a standalone commit (preserving easy revert) or bundled with the alliance branch addition?**
   - What we know: refactor is ~30 lines net; combined with alliance branch is ~50 lines.
   - What's unclear: reviewer preference.
   - Recommendation: standalone commit FIRST ("refactor: convert matchStore loop to sequential for...of for cross-iteration state cache"), THEN alliance branch ("feat: add alliance cascade impute via childProxies"). Cleaner for `git bisect` if a regression appears.

4. **For the dev seed default template, should the alliance cardContents include `['submatches', 'children']` or just `['children']`?**
   - What we know: D-04 says alliance summary is on card AND drawer; the summary is computed from organizationNominations directly, NOT from match.subMatches. Submatches require submatches-by-question-category from the match; alliances don't have own answers, so submatches via cascading-impute would be available, but the UX value is questionable (submatches are generally more useful for entities the voter directly compares against).
   - What's unclear: whether the user wants alliance cards to show submatches when answered.
   - Recommendation: ship `['children']` only by default. Submatches can be added later via dynamicSettings override.

## Environment Availability

This phase has **no external dependencies**. All work is in-tree code/config edits + manual smoke + Playwright parity gate (existing infrastructure). Step 2.6 marker: **SKIPPED (no external dependencies identified beyond the existing dev stack)**.

For reference, the dev stack already in use (per CLAUDE.md):

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Yarn 4 + Turborepo | Build / test | ✓ | per CLAUDE.md monorepo standard | — |
| Supabase CLI (local) | `yarn dev` / `yarn dev:reset-with-data` | ✓ assumed (used since v2.5) | per CLAUDE.md | — |
| Playwright | E2E parity gate | ✓ | per `tests/playwright.config.ts` | — |
| Vitest | unit tests | ✓ | per package.json `test:unit` | — |

No new tools or services required by Phase 69.

## Security Domain

`security_enforcement` is enabled (absent → enabled per workflow contract).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 69 is voter-app render-only; no auth surface touched. |
| V3 Session Management | no | No session changes. |
| V4 Access Control | no | No new permissions / roles. |
| V5 Input Validation | partial | The two new SvelteKit param-matchers (`entityTypePlural`, `entityTypeSingular`) extend the allowlist for URL segments. Both retain the existing strict-allowlist `match()` shape — invalid values produce SvelteKit 404 (per Phase 62 threat T-62-04). NO new query-param parsing or DB-write paths. |
| V6 Cryptography | no | No crypto operations. |

### Known Threat Patterns for Phase 69 stack (Frontend Svelte 5 / SvelteKit 2 render path)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| URL-segment injection via permissive route matcher | Tampering | `entityTypePlural.ts` / `entityTypeSingular.ts` matchers retain strict allowlist (`return param === 'candidates' || param === 'organizations' || param === 'alliances'`). No regex; no glob; no user-supplied predicate. |
| XSS via uncontrolled rendering of alliance / org names | Information disclosure / Tampering | Svelte's default text interpolation (`{name}`) HTML-escapes by default. The drawer name flows through `Drawer title={nakedEntity.name}` (EntityDetailsDrawer.svelte:29) which is also HTML-escaped. No `{@html}` introduced by Phase 69. The summary line ("X candidates across N parties") is composed via `t(...)` ICU plural with numeric placeholders — no user-content interpolation. |
| Settings-merge corruption from malicious dynamic settings row | Tampering | Phase 67 cross-cutting fix #2 already established the "FULL `results` block in seed" pattern (defense-in-depth against shallow-merge clobber). Phase 69 maintains this — the seed continues to ship `cardContents` for ALL entity types listed in `sections`. |
| Reactive-state poisoning via context destructuring | Tampering / DoS (UI freeze) | CLAUDE.md Context Destructuring Rule applies; Phase 69 extensions read `voterContext?.matches` via accessor, not destructure (Pattern 1 + Anti-Pattern bullet). |

**No new threat surface** is introduced by Phase 69 beyond the existing pattern. The route-matcher widening is additive within the same allowlist contract.

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` (full file read, 318 lines) — render path source of truth
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` (full file read, 137 lines) — drawer source of truth
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` (full file read, 109 lines) — impute function
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.type.ts` (full file read, 12 lines) — MatchingProxy
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` (full file read, 113 lines) — match loop
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (full file read, 476 lines) — context wiring
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts` (full file read, 132 lines) — entity-type iteration order
- `apps/frontend/src/lib/utils/matches.ts` (full file read, 82 lines) — findCandidateNominations analog
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte` (full file read, 58 lines) — children-tab body component (REUSED for alliance)
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.type.ts` (full file read, 19 lines)
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (lines 90-290 read) — tab handling + drawer routing
- `apps/frontend/src/params/entityTypePlural.ts` + `entityTypeSingular.ts` (full file read) — route matcher contracts
- `apps/frontend/src/lib/utils/route/route.ts` (lines 1-90 read) — DEFAULT_PARAMS
- `apps/frontend/src/lib/utils/entityCards.ts` (full file read, 38 lines) — getCardQuestions
- `apps/frontend/src/lib/utils/entityDetails.ts` (full file read, 53 lines) — getEntityAndTitle (alliance-ready)
- `packages/app-shared/src/settings/dynamicSettings.type.ts` (full file read, 399 lines) — type surface
- `packages/app-shared/src/settings/dynamicSettings.ts` (full file read, 91 lines) — defaults
- `packages/app-shared/src/index.ts` (full file read) — barrel
- `packages/data/src/objects/nominations/variants/allianceNomination.ts` (full file read, 91 lines) — Alliance data model
- `packages/data/src/objects/nominations/variants/organizationNomination.ts` (full file read, 109 lines) — Organization analog
- `packages/data/src/objects/entities/base/entityTypes.ts` (full file read, 33 lines) — ENTITY_TYPE constant
- `packages/data/src/utils/typeGuards.ts` (full file read, 100 lines) — isObjectType signature
- `packages/dev-seed/src/templates/default.ts` (lines 230-272 read) — default template alliance overrides
- `packages/dev-seed/src/templates/e2e.ts` (lines 85-107 read) — E2E template (no alliance per D-04)
- `packages/dev-seed/tests/templates/variant-app-settings.test.ts` + `e2e-app-settings.test.ts` (relevant lines read) — fixture pin sites

### v2.7 / v2.6 Phase Anchors
- `.planning/milestones/v2.7-phases/67-default-seed-alliances/67-VERIFICATION.md` (full file read, 209 lines) — SEED-01 SC-2 PASS-WITH-CONCERNS rationale + cross-cutting fixes
- `.planning/todos/pending/2026-04-30-alliance-tab-rendering-and-sections-config.md` (full file read) — 3-lane analysis
- `.planning/REQUIREMENTS.md` (full file read) — ALLIANCE-01 + out-of-scope
- `.planning/ROADMAP.md` (relevant Phase 69 section + parity context)
- `.planning/STATE.md` (full file read) — milestone context
- `.planning/phases/69-alliance-card-lane-a/69-CONTEXT.md` (full file read, 174 lines) — D-01..D-08 + canonical refs
- `CLAUDE.md` (full file read) — Context Destructuring Rule, monorepo conventions

### Secondary (MEDIUM confidence)
- `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` (lines 1-60 read) — i18n generator
- `apps/frontend/src/lib/i18n/translations/en/{entityCard,entityDetails,results,common}.json` — i18n key shape
- `apps/frontend/src/lib/types/generated/translationKey.ts` (relevant lines 478-583 read) — generated type surface
- `tests/tests/specs/variants/{results-sections,constituency,startfromcg}.spec.ts` (relevant lines read) — E2E fixture pin sites

### Tertiary (LOW confidence — no source needed)
- None — every claim is verified against in-tree code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; verified existing in-tree libraries
- Architecture: HIGH — verified against current code paths end-to-end
- Pitfalls: HIGH — Risk #4 / #5 (route-matcher gap) surfaced from line-level grep; Risk #1 (cascade order) surfaced from match-loop iteration analysis
- Type-rename blast radius: HIGH — every `'candidates'` literal grepped + classified
- Cascading-impute pattern: HIGH — function structure + types verified
- i18n surface: MEDIUM — pattern is verified, exact key naming is discretionary

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (30-day estimate; codebase is stable, v2.8 milestone work is in progress only on this phase + adjacent hygiene phases — minimal drift expected during the phase's planning + execution window)

## RESEARCH COMPLETE
