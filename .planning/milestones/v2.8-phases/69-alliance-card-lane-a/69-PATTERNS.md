# Phase 69: Alliance Card Lane A - Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 28 (~16 source + 5 i18n + 4 test fixtures + 3 E2E pin sites)
**Analogs found:** 28 / 28 (every modified file has a closely matching in-tree analog — Phase 69 is "uniform extension of an existing pattern")

## File Classification

### Plan A — Type surface + render path + route widening (Plan 01 candidate)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | type-config | (none) | `cardContents.organization` literal-union pattern (lines 204-217) within the same file | exact (rename + symmetric add) |
| `packages/app-shared/src/settings/dynamicSettings.ts` | config-default | (none) | `cardContents.organization: ['candidates']` default at line 62 | exact (rename + symmetric add) |
| `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` | component (dynamic) | request-response (renders props) | The existing `OrganizationNomination → CandidateNomination` subentities branch at lines 131-142 within the same file | exact (mirror branch + maxSubcards override) |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | component (dynamic) | request-response | The existing `'candidates'` tab branch + children derivation at lines 75-81, 124-127 | exact (parallel branch for AllianceNomination) |
| `apps/frontend/src/lib/utils/matches.ts` | utility (NEW helper) | transform | `findCandidateNominations` at lines 53-81 of the same file | exact (one level up the hierarchy) |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte` | component (dynamic) | request-response | (no edit — REUSED as-is; receives `entityType={ENTITY_TYPE.Organization}` instead of `Candidate`) | already-generic |
| `apps/frontend/src/params/entityTypePlural.ts` | route-matcher | request-response | (current allowlist within same file) | exact (1-line OR addition) |
| `apps/frontend/src/params/entityTypeSingular.ts` | route-matcher | request-response | (current allowlist within same file) | exact (1-line OR addition) |
| `apps/frontend/src/params/entityTypePlural.test.ts` | test | (none) | Existing `it.each` rows at lines 14-23 | exact (one positive-case row addition) |
| `apps/frontend/src/params/entityTypeSingular.test.ts` | test | (none) | Existing `it.each` rows at lines 14-21 | exact (one positive-case row addition) |
| `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` | route (SvelteKit layout) | request-response (URL→state→component) | Existing `_urlPlural`, `activeEntityType`, `_pluralForActiveType`, `handleEntityTabChange` ternaries within same file (5 sites: lines 99, 117-119, 139-144, 252-264, 274-278, 366-371) | exact (mechanical widening) |
| `apps/frontend/src/lib/utils/route/route.ts` | route-config | (none) | `DEFAULT_PARAMS.ResultEntity` (existing) | optional — only if planner adds explicit `ResultAlliance` route id |

### Plan B — Matching pipeline (Plan 02 candidate)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` | utility (matching) | transform | The function itself: existing org/faction child-lookup branch at lines 42-48 + answer-read at line 56 | exact (additive widening + optional param) |
| `apps/frontend/src/lib/utils/matching/imputeParentAnswers.type.ts` | utility (type) | (none) | `MatchingProxy<TNomination = AnyNominationVariant>` already accepts any nomination — no change required | already-generic |
| `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` | store (Svelte 5 reactive) | event-driven (answer-store change → derived match tree) | The existing `parentMethod === 'impute'` org/faction branch at lines 65-79 within same file | role-match (mirror branch + .map → for...of refactor) |
| `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` | test (NEW, OPTIONAL/RECOMMENDED) | (none) | No existing test — new file. Sibling: `apps/frontend/src/lib/utils/matching/median.test.ts`-style structure (verify exists). | greenfield — pattern derived from co-located vitest convention |

### Cross-cutting (both plans)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/templates/default.ts` | seed-config | (none) | `results.cardContents.organization: ['candidates']` at line 248 + `cardContents.alliance: []` at line 249 | exact (in-place rename + alliance content fill) |
| `packages/dev-seed/src/templates/e2e.ts` | seed-config | (none) | `cardContents.organization: ['candidates']` at line 97 | exact (rename only — NO alliance addition per Phase 67 D-04) |
| `packages/dev-seed/tests/templates/variant-app-settings.test.ts` | test (fixture pin) | (none) | Lines 117-120 fixture-pin assertion | exact (literal pin update) |
| `packages/dev-seed/tests/templates/e2e-app-settings.test.ts` | test (fixture pin) | (none) | Lines 104-110 fixture-pin assertion | exact (literal pin update) |
| `tests/tests/specs/variants/results-sections.spec.ts` | test (E2E pin) | (none) | Existing `cardContents` pin literals at lines 66, 146 | exact (literal pin update) |
| `tests/tests/specs/variants/constituency.spec.ts` | test (E2E pin) | (none) | Existing pin at line 58 | exact (literal pin update) |
| `tests/tests/specs/variants/startfromcg.spec.ts` | test (E2E pin) | (none) | Existing pins at lines 71, 100 | exact (literal pin update) |
| `apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/entityDetails.json` | i18n | (none) | Existing `tabs.candidates` key at line 5 | exact (rename + 7-locale fan-out) |
| `apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/results.json` | i18n | (none) | Existing ICU plural pattern at line 6 (`results.candidate.numShown`) — nested-plural can be modeled on this single-plural | role-match (single → nested ICU plural) |
| `apps/frontend/src/lib/types/generated/translationKey.ts` | generated-type | (none) | Generated artifact — regenerated via `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` | mechanical regeneration |
| `apps/frontend/src/lib/utils/getAllianceSummary.ts` (OPTIONAL helper) | utility | transform | `apps/frontend/src/lib/utils/entityCards.ts:getCardQuestions` (2-line tiny utility shape) | role-match (single-purpose pure derivation) |

---

## Pattern Assignments

### `EntityCard.svelte` — Alliance subentities branch (controller, request-response)

**Analog:** `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` (same file, lines 131-142 — the existing Organization branch)

**Imports pattern** (lines 42-61, copy verbatim — already imports the right symbols; only need to add `findOrganizationNominations` from `$lib/utils/matches`):
```typescript
import { ENTITY_TYPE, isObjectType, OBJECT_TYPE } from '@openvaa/data';
import { Avatar } from '$lib/components/avatar';
import { Button } from '$lib/components/button';
import { ElectionSymbol } from '$lib/components/electionSymbol';
import { EntityTag } from '$lib/components/entityTag';
import { InfoAnswer } from '$lib/components/infoAnswer';
import { MatchScore } from '$lib/components/matchScore';
import { SubMatches } from '$lib/components/subMatches';
import { getAppContext } from '$lib/contexts/app';
import { getVoterContext } from '$lib/contexts/voter';
import { concatClass, getUUID } from '$lib/utils/components';
import { unwrapEntity } from '$lib/utils/entities';
import { getCardQuestions } from '$lib/utils/entityCards';
import { findCandidateNominations } from '$lib/utils/matches'; // ← extend: also import findOrganizationNominations
```

**Context-read pattern** (lines 77-78 — Svelte 5 ctx-getter conventions per CLAUDE.md):
```typescript
const { appSettings, appType, dataRoot, getRoute, startEvent, t } = getAppContext();
const voterContext = $appType === 'voter' ? getVoterContext() : undefined;
```

**Default-action ternary** (lines 106-114 — must be widened for alliance plural per Risk #4 in RESEARCH):
```typescript
const effectiveAction =
  action ??
  $getRoute({
    route: 'ResultEntity',
    entityTypePlural: type === 'candidate' ? 'candidates' : 'organizations', // ← extend: + 'alliance' → 'alliances'
    entityTypeSingular: type,
    id,
    nominationId: unwrapped.nomination?.id
  });
```

**Core subentities branch (the analog to copy)** (lines 131-142):
```typescript
let scs: Array<EntityCardProps> | undefined;
if (
  variant === 'list' &&
  unwrapped.nomination &&
  isObjectType(unwrapped.nomination, OBJECT_TYPE.OrganizationNomination) &&
  $appSettings.results?.cardContents?.organization?.includes('candidates') // ← rename literal to 'children'
) {
  scs = findCandidateNominations({ matches: voterContext?.matches, nomination: unwrapped.nomination }).map((e) => ({
    entity: e
  }));
}
```

**Subcards rendering + truncation** (lines 285-303 — Phase 69 sets `maxSubcards = Infinity` for alliance branch via the `parsed.subcardsMax` or local override pattern; truncation logic short-circuits cleanly):
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

**Recursion guard** (line 134 — REQUIRES `variant === 'list'`; ensures alliance card renders org-nom subcards but those subcards do NOT recurse into their own candidate-nom sub-subcards). VERIFIED: this is the safety mechanism preventing recursion explosion (Risk #3).

---

### `EntityDetails.svelte` — Alliance drawer tab handling (controller, request-response)

**Analog:** Same file, lines 30-128 (the existing organization-children-tab branch)

**Imports pattern** (lines 30-46 — extend: rename `OrganizationDetailsContent` → `ParentEntityDetailsContent`; rename literal `'candidates'` → `'children'`):
```typescript
import { ENTITY_TYPE, isObjectType, OBJECT_TYPE } from '@openvaa/data';
import { Tabs } from '$lib/components/tabs';
import { getAppContext } from '$lib/contexts/app';
import { getVoterContext } from '$lib/contexts/voter';
import { EntityCard } from '$lib/dynamic-components/entityCard';
import { concatClass } from '$lib/utils/components';
import { unwrapEntity } from '$lib/utils/entities';
import { findCandidateNominations } from '$lib/utils/matches';
import { sortQuestions } from '$lib/utils/sorting';
import { EntityChildren, EntityInfo, EntityOpinions } from './';
import type { CustomData, EntityDetailsContent, OrganizationDetailsContent } from '@openvaa/app-shared';
//                                                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                                                  ↑ rename to ParentEntityDetailsContent
```

**Context-read pattern** (lines 50-60 — keep as-is; `voterContext` is captured in a `let` so accessor-reads remain reactive):
```typescript
const { appSettings, appType, startEvent, t } = getAppContext();
let voterContext: VoterContext | undefined;
let answers: AnswerStore | undefined = $state(undefined);
if ($appType === 'voter') {
  voterContext = getVoterContext();
  answers = voterContext.answers;
}
```

**ContentTab type (analog to widen)** (line 62):
```typescript
type ContentTab = { content: EntityDetailsContent | OrganizationDetailsContent; label: string };
//                                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                                  ↑ rename to ParentEntityDetailsContent
```

**Default-tabs derivation (analog to widen)** (lines 66-73):
```typescript
let contentTabs: Array<ContentTab> = $derived.by(() => {
  const { entity: nakedEntity } = unwrapEntity(entity);
  let tabs: Array<EntityDetailsContent | OrganizationDetailsContent> =
    $appSettings.entityDetails.contents[nakedEntity.type as keyof AppSettings['entityDetails']['contents']];
  if (!tabs?.length)
    tabs = nakedEntity.type === 'organization' ? ['info', 'opinions', 'candidates'] : ['info', 'opinions'];
  // ← Phase 69 extends: nakedEntity.type === 'alliance' ? ['info', 'children'] : ...
  //   + rename 'candidates' literal to 'children'
  return tabs.map((tab) => ({ content: tab, label: t(`entityDetails.tabs.${tab}`) }));
});
```

**Children-derivation (analog to widen — copy structure for AllianceNomination)** (lines 75-81):
```typescript
let children: Array<MaybeWrappedEntityVariant> = $derived.by(() => {
  const { nomination } = unwrapEntity(entity);
  const tabs = contentTabs.map((ct) => ct.content);
  if (tabs.includes('candidates') && isObjectType(nomination, OBJECT_TYPE.OrganizationNomination))
    return findCandidateNominations({ matches: voterContext?.matches, nomination });
  // ← Phase 69 extends: rename 'candidates' → 'children'; add isObjectType(nomination, OBJECT_TYPE.AllianceNomination)
  //   branch returning findOrganizationNominations({ matches, nomination })
  return [];
});
```

**Tab-switch render (analog to widen)** (lines 118-127):
```svelte
{#if contentTabs[activeIndex]?.content === 'info'}
  <div data-testid="voter-entity-detail-info"><EntityInfo {entity} questions={infoQuestions} /></div>
{:else if contentTabs[activeIndex]?.content === 'opinions'}
  <div data-testid="voter-entity-detail-opinions">
    <EntityOpinions {entity} questions={opinionQuestions} {answers} />
  </div>
{:else if contentTabs[activeIndex]?.content === 'candidates'}
  <div data-testid="voter-entity-detail-submatches">
    <EntityChildren entities={children} entityType={ENTITY_TYPE.Candidate} />
  </div>
{/if}
```
**Phase 69 widening:**
- Rename `'candidates'` → `'children'` at the switch cell.
- Update `data-testid` to `voter-entity-detail-children` (rename per UI-SPEC; the spec also calls out this as the recommended rename for symmetry).
- Pass `entityType` derivation: `entityType={isObjectType(nomination, OBJECT_TYPE.AllianceNomination) ? ENTITY_TYPE.Organization : ENTITY_TYPE.Candidate}`.

---

### `imputeParentAnswers.ts` — Generalize for AllianceNomination (utility, transform)

**Analog:** Same file, full body (~109 lines). Phase 69 widens the generic constraint, adds an optional `childProxies` param, and extends two switch sites (child-lookup + answer-read).

**Function signature pattern (analog to widen)** (lines 22-28):
```typescript
export function imputeParentAnswers<TNomination extends OrganizationNomination | FactionNomination>({
  nominations,
  questions
}: {
  nominations: Array<TNomination>;
  questions: Array<AnyQuestionVariant>;
}): Array<MatchingProxy<TNomination>> {
```

**Phase 69 widening:**
```typescript
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
   * of entity.getAnswer() — enables cascading parent-pass imputation
   * (orgs Pass 1 → alliances Pass 2 without entity writes).
   */
  childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>>;
}): Array<MatchingProxy<TNomination>> {
```

**Proxy-build prelude pattern** (lines 30-37 — keep as-is):
```typescript
// The base for proxy answers
const proxyAnswers: Array<AnswerDict> = nominations.map((n) => structuredClone(n.answers ?? {}));

// Build the output
function buildProxies(): Array<MatchingProxy<TNomination>> {
  const proxies: Array<MatchingProxy<TNomination>> = [];
  for (let i = 0; i < nominations.length; i++) proxies.push(new MatchingProxy(nominations[i], proxyAnswers[i]));
  return proxies;
}
```

**Child-lookup branch (analog to widen)** (lines 42-48):
```typescript
for (let i = 0; i < nominations.length; i++) {
  const parent = nominations[i];
  const children =
    isObjectType(parent, OBJECT_TYPE.OrganizationNomination) && parent.hasFactions
      ? parent.factionNominations
      : parent.candidateNominations;
  if (children.length === 0) continue;
```

**Phase 69 widening (3-arm conditional — alliance first, then org-with-factions, then default):**
```typescript
let children: ReadonlyArray<AnyNominationVariant>;
if (isObjectType(parent, OBJECT_TYPE.AllianceNomination)) {
  children = parent.organizationNominations;
} else if (isObjectType(parent, OBJECT_TYPE.OrganizationNomination) && parent.hasFactions) {
  children = parent.factionNominations;
} else {
  children = (parent as OrganizationNomination | FactionNomination).candidateNominations;
}
if (children.length === 0) continue;
```

**Answer-read pattern (analog to widen)** (line 56):
```typescript
const answers = children.map((c) => c.entity.getAnswer(question)?.value).filter((v) => v != null);
```

**Phase 69 widening (read from proxy if available):**
```typescript
const answers = children
  .map((c) => {
    const proxy = childProxies?.get(c.id);
    if (proxy) return proxy.answers[question.id]?.value;
    return c.entity.getAnswer(question)?.value;
  })
  .filter((v) => v != null);
```

**Imputation per question type (keep verbatim — no changes)** (lines 59-93):
```typescript
let value: Id | number | undefined;
try {
  if (isObjectType(question, OBJECT_TYPE.SingleChoiceOrdinalQuestion)) {
    const choiceIds = question.choices.map((c) => c.id);
    const indexAnswers = answers.map((a) => choiceIds.indexOf(a as Id)).filter((i) => i >= 0);
    const imputedIndex =
      indexAnswers.length > 0 ? median(indexAnswers, { returnFirstWhenTied: true }) : undefined;
    if (imputedIndex != null) value = question.choices[imputedIndex].id;
  } else if (isObjectType(question, OBJECT_TYPE.SingleChoiceCategoricalQuestion)) {
    value = mode(answers as Array<Id>);
  } else if (isObjectType(question, OBJECT_TYPE.NumberQuestion)) {
    value = median(answers.filter((v) => typeof v === 'number'));
  }
} catch (e) {
  logDebugError(`Matching.imputeParentAnswers: Error imputing answer for question ${question.id}:`, e);
  continue;
}

if (value != null) {
  proxyAnswers[i][question.id] = {
    value: value
  } as Answer<typeof value>;
}
```

**Backward-compat invariant:** when `childProxies` is `undefined`, the new branch falls back to entity reads → output MUST be byte-identical to current code (Risk #7). This is the "additive change with optional param" pattern — covered by an OPTIONAL regression unit test.

---

### `matchStore.svelte.ts` — Alliance branch with cross-iteration cache (store, event-driven)

**Analog:** Same file, lines 38-100 (the existing `$derived.by` match-tree builder)

**Existing branch shape (analog to mirror)** (lines 64-79):
```typescript
let proxies: Array<MatchingProxy<AnyNominationVariant>> | undefined;
if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
  switch (parentMethod) {
    case 'impute':
      proxies = imputeParentAnswers({
        nominations: nominations as Array<OrganizationNomination | FactionNomination>,
        questions
      });
      break;
    case 'answersOnly':
    case 'none':
      break;
    default:
      throw new Error(`Unsupported parent matching method: ${parentMethod}`);
  }
}
```

**Phase 69 alliance branch (mirrored after the Org branch, with `childProxies` arg):**
```typescript
} else if (entityType === ENTITY_TYPE.Alliance) {
  switch (parentMethod) {
    case 'impute':
      proxies = imputeParentAnswers({
        nominations: nominations as Array<AllianceNomination>,
        questions,
        childProxies: orgProxiesById
      });
      break;
    case 'answersOnly':
    case 'none':
      break;
    default:
      throw new Error(`Unsupported parent matching method: ${parentMethod}`);
  }
}
```

**Cross-iteration cache (NEW — built from Pass 1 org proxies):**

The current `Object.fromEntries(Object.entries(electionContent).map(...))` pattern (line 49-97) builds entityType match results in isolation — no shared state across iterations. Phase 69 needs to accumulate org proxies in Pass 1 and read them in Pass 2.

**Recommended refactor (Pattern 3 in RESEARCH §"Sequential matchStore Loop"):** convert the inner `.map()` to a sequential `for...of` accumulator:

```typescript
for (const [electionId, electionContent] of Object.entries(nq)) {
  const electionMatches: Record<EntityType, Array<MaybeWrappedEntityVariant>> = {} as never;
  // Phase 69 cross-iteration cache — populated by the Org branch, consumed by the Alliance branch
  const orgProxiesById = new Map<Id, MatchingProxy<AnyNominationVariant>>();

  for (const [entityType, { nominations, opinionQuestions: questions }] of Object.entries(electionContent)) {
    const numAnswers = countAnswers({ questions, answers: currentAnswers });
    if (numAnswers < minAns) {
      electionMatches[entityType as EntityType] = nominations;
      continue;
    }
    if (!nominations.length) {
      electionMatches[entityType as EntityType] = [];
      continue;
    }

    const questionGroups = submatches.includes(entityType as EntityType)
      ? removeDuplicates(questions.map((q) => q.category))
      : undefined;

    let proxies: Array<MatchingProxy<AnyNominationVariant>> | undefined;
    if (entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Faction) {
      // existing branch — unchanged behaviour
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
      // NEW alliance branch — reads from org cache
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
    electionMatches[entityType as EntityType] = proxies
      ? matches.map((m) => unwrapProxiedMatch(m as Match<MatchingProxy<AnyNominationVariant>>))
      : matches;
  }
  tree[electionId] = electionMatches;
}
```

**Sequencing invariant (LOAD-BEARING):** the default seed orders `appSettings.results.sections = ['candidate', 'organization', 'alliance']` — `Object.entries()` follows insertion order, so org pass runs before alliance pass. A customer override that listed alliance first would silently skip the cascade (`orgProxiesById` would be empty when alliance pass runs, falling through to entity reads → no impute). The `for...of` refactor makes this invariant local and reviewable; the planner SHOULD add a JSDoc comment above the alliance branch documenting the org-first dependency.

---

### `findOrganizationNominations` — New helper (utility, transform)

**Analog:** `findCandidateNominations` at `apps/frontend/src/lib/utils/matches.ts` lines 53-81 (same file)

**Imports pattern (copy from existing top of file)** (lines 1-7):
```typescript
import { ENTITY_TYPE } from '@openvaa/data';
import { unwrapEntity } from './entities';
import { compareMaybeWrappedEntities } from './sorting';
import type { Id } from '@openvaa/core';
import type { CandidateNomination, EntityType, OrganizationNomination, QuestionCategory } from '@openvaa/data';
import type { Match } from '@openvaa/matching';
import type { MatchTree } from '$lib/contexts/voter/matchStore.svelte';
```

**Phase 69 imports extension:** add `AllianceNomination` to the `@openvaa/data` import.

**Existing helper (the analog to copy structure)** (lines 53-81):
```typescript
/**
 * A utility function to find the `CandidateNomination` for an `OrganizationNomination` in the match tree.
 * @param matches - The possible `MatchTree`.
 * @param nomination - The `OrganizationNomination` whose children to find.
 * @returns An array of `CandidateNomination` matches or the non-matched `CandidateNomination`s if matches are not found for all of the candidates.
 */
export function findCandidateNominations({
  matches,
  nomination: { candidateNominations }
}: {
  matches?: MatchTree;
  nomination: OrganizationNomination;
}): Array<CandidateNomination | Match<CandidateNomination, QuestionCategory>> {
  if (!matches) return candidateNominations.sort(compareMaybeWrappedEntities);

  const candidateMatches = candidateNominations
    .map(
      ({ id }) =>
        findNomination({
          matches,
          entityType: ENTITY_TYPE.Candidate,
          nominationId: id
        })?.match
    )
    .filter((n) => n != null)
    .sort(compareMaybeWrappedEntities);

  return candidateMatches as Array<Match<CandidateNomination, QuestionCategory>>;
}
```

**Phase 69 new helper (one level up the parent hierarchy):**
```typescript
/**
 * A utility function to find the `OrganizationNomination` for an `AllianceNomination` in the match tree.
 * @param matches - The possible `MatchTree`.
 * @param nomination - The `AllianceNomination` whose children to find.
 * @returns An array of `OrganizationNomination` matches or the non-matched `OrganizationNomination`s if matches are not found for all of the orgs.
 */
export function findOrganizationNominations({
  matches,
  nomination: { organizationNominations }
}: {
  matches?: MatchTree;
  nomination: AllianceNomination;
}): Array<OrganizationNomination | Match<OrganizationNomination, QuestionCategory>> {
  if (!matches) return organizationNominations.sort(compareMaybeWrappedEntities);

  const orgMatches = organizationNominations
    .map(
      ({ id }) =>
        findNomination({
          matches,
          entityType: ENTITY_TYPE.Organization,
          nominationId: id
        })?.match
    )
    .filter((n) => n != null)
    .sort(compareMaybeWrappedEntities);

  return orgMatches as Array<Match<OrganizationNomination, QuestionCategory>>;
}
```

---

### Route matchers — Widen plural + singular matchers (route-config, request-response)

**Analog (plural):** `apps/frontend/src/params/entityTypePlural.ts` lines 16-18:
```typescript
export function match(param: string): param is 'candidates' | 'organizations' {
  return param === 'candidates' || param === 'organizations';
}
```

**Phase 69 widening:**
```typescript
export function match(param: string): param is 'candidates' | 'organizations' | 'alliances' {
  return param === 'candidates' || param === 'organizations' || param === 'alliances';
}
```

**Analog (singular):** `apps/frontend/src/params/entityTypeSingular.ts` lines 20-22:
```typescript
export function match(param: string): param is 'candidate' | 'organization' {
  return param === 'candidate' || param === 'organization';
}
```

**Phase 69 widening:**
```typescript
export function match(param: string): param is 'candidate' | 'organization' | 'alliance' {
  return param === 'candidate' || param === 'organization' || param === 'alliance';
}
```

**Test pattern (positive-case row addition)** — `entityTypePlural.test.ts` lines 14-23:
```typescript
it.each([
  ['candidates', true],
  ['organizations', true],
  ['candidate', false],
  ['organization', false],
  ['organisations', false],
  ['party', false],
  ['parties', false],
  ['', false],
  ['CANDIDATES', false]
])('match(%p) === %p', (input, expected) => {
  expect(match(input)).toBe(expected);
});
```

**Phase 69 additions to it.each:** `['alliances', true]`, `['alliance', false]` (singular spelling rejected by plural matcher), `['ALLIANCES', false]`.

**Same shape for `entityTypeSingular.test.ts`** — add `['alliance', true]`, `['alliances', false]`, `['ALLIANCE', false]`.

---

### `+layout.svelte` — Voter results layout extension (5 widening sites)

**Analog:** `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (same file). Five sites need widening — every site already has `candidate`/`organization` ternaries that need a third arm:

**Site 1: ENTITY_PLURALS const (line 99):**
```typescript
const ENTITY_PLURALS = ['candidates', 'organizations'] as const;
type EntityPlural = (typeof ENTITY_PLURALS)[number];
```
Phase 69: append `'alliances'`.

**Site 2: `_urlPlural` derivation (lines 116-119):**
```typescript
const _urlPluralRaw = $derived(page.params.entityTypePlural);
const _urlPlural = $derived<EntityPlural | undefined>(
  _urlPluralRaw === 'candidates' || _urlPluralRaw === 'organizations' ? _urlPluralRaw : undefined
);
```
Phase 69: extend OR chain to also accept `'alliances'`.

**Site 3: `activeEntityType` ternary (lines 139-144):**
```typescript
const activeEntityType = $derived.by<EntityType | undefined>(() => {
  const fromUrl: EntityType | undefined =
    _urlPlural === 'candidates' ? 'candidate' : _urlPlural === 'organizations' ? 'organization' : undefined;
  if (fromUrl && entityTabs.some((t) => t.type === fromUrl)) return fromUrl;
  return entityTabs[0]?.type;
});
```
Phase 69: extend ternary chain with `_urlPlural === 'alliances' ? 'alliance' : ...`.

**Site 4: `handleEntityTabChange` (lines 252-264):**
```typescript
function handleEntityTabChange({ index, tab }: { index?: number; tab?: Tab }): void {
  const typed = tab as EntityTab | undefined;
  if (typed?.type === 'candidate' || index === 0) {
    goto(buildListRoute('candidates', activeElectionId));
    startEvent('results_changeTab', { section: 'candidate' });
    return;
  }
  if (typed?.type === 'organization' || index === 1) {
    goto(buildListRoute('organizations', activeElectionId));
    startEvent('results_changeTab', { section: 'organization' });
    return;
  }
}
```
Phase 69: append a third clause for `typed?.type === 'alliance' || index === 2` → `goto(buildListRoute('alliances', activeElectionId))` + `startEvent('results_changeTab', { section: 'alliance' })`.

**Site 5: `_pluralForActiveType` (lines 274-278):**
```typescript
function _pluralForActiveType(): EntityPlural | undefined {
  if (activeEntityType === 'candidate') return 'candidates';
  if (activeEntityType === 'organization') return 'organizations';
  return undefined;
}
```
Phase 69: insert `if (activeEntityType === 'alliance') return 'alliances';`.

**Site 6 (data-testid switch — UI-SPEC contract):** lines 366-371:
```svelte
<div
  data-testid={activeEntityType === 'candidate'
    ? 'voter-results-candidate-section'
    : activeEntityType === 'organization'
      ? 'voter-results-party-section'
      : undefined}>
```
Phase 69: extend ternary with `: activeEntityType === 'alliance' ? 'voter-results-alliance-section'` (matches UI-SPEC §"WCAG-relevant data-testid contract" Assumption A1).

---

### `dynamicSettings.type.ts` — Type renames + alliance additions (type-config)

**Analog:** Same file, the existing `cardContents.organization` literal-union shape and the `OrganizationDetailsContent` type at lines 369-376.

**cardContents shape (analog to mirror)** (lines 204-217):
```typescript
[ENTITY_TYPE.Organization]: Array<
  | 'submatches'
  | 'candidates'  // ← Phase 69: rename to 'children'
  | QuestionInCardContent
>;
```

**alliance entry — current shape (lines 218-230):**
```typescript
[ENTITY_TYPE.Alliance]?: Array<
  | 'submatches'
  | QuestionInCardContent
>;
```

**Phase 69 alliance entry widening:** add `| 'children'` (mirror the org shape; per CONTEXT D-01 default `cardContents.alliance: ['children']`).

**Existing `OrganizationDetailsContent` type (analog to rename)** (lines 369-376):
```typescript
/**
 * The possible content tabs to show for `Organization`s.
 */
export type OrganizationDetailsContent =
  /**
   * The party's candidates.
   */
  'candidates';
```

**Phase 69 rename:**
```typescript
/**
 * The possible content tabs to show for parent entities (Organization, Alliance).
 * The "children" of an Organization are its CandidateNominations; the "children"
 * of an Alliance are its OrganizationNominations.
 */
export type ParentEntityDetailsContent = 'children';
```

**Existing `entityDetails.contents` shape (analog to widen)** (lines 25-47):
```typescript
contents: {
  [ENTITY_TYPE.Candidate]: Array<EntityDetailsContent>;
  [ENTITY_TYPE.Organization]: Array<EntityDetailsContent | OrganizationDetailsContent>;
  // ← Phase 69: rename type ref + add Alliance entry
};
```

**Phase 69 widening:**
```typescript
contents: {
  [ENTITY_TYPE.Candidate]: Array<EntityDetailsContent>;
  [ENTITY_TYPE.Organization]: Array<EntityDetailsContent | ParentEntityDetailsContent>;
  [ENTITY_TYPE.Alliance]?: Array<EntityDetailsContent | ParentEntityDetailsContent>;
  // ← per D-02 planner discretion: narrower `Array<'info' | ParentEntityDetailsContent>` is also acceptable
};
```

---

### `dynamicSettings.ts` — Default updates (config-default)

**Analog:** Same file, lines 4-8 (entityDetails.contents) + lines 59-67 (results.cardContents).

**Existing defaults (analog to mirror):**
```typescript
entityDetails: {
  contents: {
    candidate: ['info', 'opinions'],
    organization: ['info', 'candidates', 'opinions']  // ← rename 'candidates' → 'children'
    // ← Phase 69: add alliance: ['info', 'children']
  },
  // ...
},
results: {
  cardContents: {
    candidate: ['submatches'],
    organization: ['candidates'],  // ← rename to ['children']
    alliance: []                   // ← change to ['children']
  },
  showFeedbackPopup: 180,
  showSurveyPopup: 500,
  sections: ['candidate', 'organization']
  // ← (default sections unchanged here; the dev-seed default.ts adds 'alliance')
}
```

---

### dev-seed templates — Mirror the rename (seed-config)

**Analog 1:** `packages/dev-seed/src/templates/default.ts` lines 245-254:
```typescript
results: {
  cardContents: {
    candidate: ['submatches'],
    organization: ['candidates'],  // ← rename to ['children']
    alliance: []                   // ← change to ['children']
  },
  showFeedbackPopup: 180,
  showSurveyPopup: 500,
  sections: ['candidate', 'organization', 'alliance']  // ← unchanged
}
```

The verbatim "FULL `results` block must be present" pattern (Phase 67 cross-cutting fix #2) is preserved — the shallow-merge contract still requires every key currently shipped.

**Analog 2 (E2E template):** `packages/dev-seed/src/templates/e2e.ts` lines 94-100:
```typescript
results: {
  cardContents: {
    candidate: ['submatches'],
    organization: ['candidates']  // ← rename to ['children']
  },
  sections: ['candidate', 'organization']
}
```
**Critical (Assumption A2 / Phase 67 D-04):** do NOT add `alliance` section/cardContents to E2E template; the E2E suite intentionally excludes alliance.

**Fixture-pin sites in dev-seed unit tests:**

`packages/dev-seed/tests/templates/variant-app-settings.test.ts` lines 117-120:
```typescript
expect(results?.cardContents).toEqual({
  candidate: ['submatches'],
  organization: ['candidates']  // ← rename to ['children']
});
```

`packages/dev-seed/tests/templates/e2e-app-settings.test.ts` lines 104-110:
```typescript
expect(E2E_BASE_APP_SETTINGS.results).toEqual({
  cardContents: {
    candidate: ['submatches'],
    organization: ['candidates']  // ← rename to ['children']
  },
  sections: ['candidate', 'organization']
});
```

---

### E2E variant pin sites — Same rename (test, none)

**Analog:** the existing pinned-literal `'candidates'` strings in the E2E variants. Three files, five sites:

`tests/tests/specs/variants/results-sections.spec.ts:66`:
```typescript
cardContents: { candidate: ['submatches'], organization: ['candidates'] },  // ← rename to ['children']
```

`tests/tests/specs/variants/results-sections.spec.ts:146`: same shape.

`tests/tests/specs/variants/constituency.spec.ts:58`: same shape.

`tests/tests/specs/variants/startfromcg.spec.ts:71`: same shape.

`tests/tests/specs/variants/startfromcg.spec.ts:100`: same shape.

All five sites: replace `['candidates']` → `['children']` literally. Single commit (Risk #11 — type rename atomicity).

---

### i18n — `entityDetails.tabs` rename + new alliance summary key

**Analog 1 (entityDetails.json — current shape, English):**
```json
{
  "links": "Links",
  "memberOfOrganization": "member of {organization}",
  "tabs": {
    "candidates": "candidates",  // ← rename key to "children"
    "info": "Basic Info",
    "opinions": "Opinions"
  }
}
```

**Phase 69 rename — apply to all 7 locales (`da, en, et, fi, fr, lb, sv`):** rename key `tabs.candidates` → `tabs.children`. English label recommendation per UI-SPEC: `"Members"` (semantic-uniform across alliance/org parents).

**Analog 2 (results.json — ICU plural pattern, English):**
```json
{
  "alliance": {
    "numShown": "{numShown, plural, =0 {No alliances} =1 {1 alliance} other {# alliances}}"
  },
  "candidate": {
    "numShown": "{numShown, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}}"
  },
  // ...
  "organization": {
    "numShown": "{numShown, plural, =0 {No parties} =1 {1 party} other {# parties}}"
  }
}
```

**Phase 69 addition — apply to all 7 locales:** add nested-plural key `alliance.summary`:
```json
"alliance": {
  "numShown": "...",
  "summary": "{numCandidates, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}} across {numParties, plural, =0 {no parties} =1 {1 party} other {# parties}}"
}
```

**Generated type regen:** after JSON edits, regenerate `apps/frontend/src/lib/types/generated/translationKey.ts` via `tsx apps/frontend/tools/translationKey/generateTranslationKeyType.ts` from `apps/frontend/`. This is a mechanical step but MUST run before `yarn build` to avoid stale-key errors.

---

### Optional helper — `getAllianceSummary` (utility, transform)

**Analog:** `apps/frontend/src/lib/utils/entityCards.ts:getCardQuestions` (~38 lines, single-purpose pure derivation). Phase 69's `getAllianceSummary` follows the same shape (small, pure, locally-derived from data accessors) and avoids drift between the EntityCard list-variant summary and the EntityDetails drawer-header summary.

**Recommended location:** `apps/frontend/src/lib/utils/getAllianceSummary.ts` (new file), exported from the relevant barrel.

**Sketch:**
```typescript
import type { AllianceNomination } from '@openvaa/data';

export function getAllianceSummary(allianceNom: AllianceNomination): {
  numCandidates: number;
  numParties: number;
} {
  const orgNoms = allianceNom.organizationNominations;
  return {
    numParties: orgNoms.length,
    numCandidates: orgNoms.reduce((sum, org) => sum + org.candidateNominations.length, 0)
  };
}
```

---

## Shared Patterns

### Svelte 5 Context Destructuring Rule (CLAUDE.md)

**Source:** `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" + `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:106-123`

**Apply to:** `EntityCard.svelte`, `EntityDetails.svelte`, any new branch/derive that consumes voter-context reactive accessors

**Pattern (already applied correctly in EntityCard.svelte:78, EntityDetails.svelte:55-60):**

```typescript
// Stable references — destructure ok:
const { appSettings, appType, dataRoot, getRoute, startEvent, t } = getAppContext();

// Reactive accessors — read via ctx.X (or capture and read in $derived):
const voterContext = $appType === 'voter' ? getVoterContext() : undefined;
// ...inside $derived.by:
//   voterContext?.matches  // ← reactive read; do NOT destructure { matches } from voterContext
```

Phase 69's new branches in `EntityCard.svelte` and `EntityDetails.svelte` MUST follow the same access pattern: read `voterContext?.matches` (not destructured), so the cascading-impute-driven match tree updates flow through to render correctly.

### Cardcontents Opt-In Gate

**Source:** `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:131-142`

**Apply to:** all new alliance render branches gated by `cardContents` settings

**Pattern:**
```typescript
if (
  variant === 'list' &&
  unwrapped.nomination &&
  isObjectType(unwrapped.nomination, OBJECT_TYPE.AllianceNomination) &&
  $appSettings.results?.cardContents?.alliance?.includes('children')
) {
  // alliance-specific render branch
}
```

### Cascading Proxy Imputation (NEW for Phase 69)

**Source:** Phase 69 — established by this phase

**Apply to:** Pass 1 produces `MatchingProxy<OrganizationNomination>` from candidate-nom answers; Pass 2 reads from Pass 1 proxies via `childProxies` map.

**Invariants:**
- No entity is mutated (proxies are scoped to matching only).
- When `childProxies` is `undefined`, behaviour is byte-identical to current code (Risk #7 backward-compat).
- Org pass MUST run before alliance pass within the same election iteration (Risk #1 — sequencing).

### MatchingProxy answer-read shape

**Source:** `apps/frontend/src/lib/utils/matching/imputeParentAnswers.type.ts:7-12`

**Apply to:** the new `childProxies?.get(c.id)?.answers[question.id]?.value` read in `imputeParentAnswers.ts`

```typescript
export class MatchingProxy<TNomination extends AnyNominationVariant = AnyNominationVariant> implements HasAnswers {
  constructor(
    public target: TNomination,
    public answers: AnswerDict
  ) {}
}
```

`MatchingProxy.answers` is `AnswerDict` keyed by `questionId` with `Answer<typeof value>` values — matches `parent.entity.getAnswer(question)` shape, so the new read path produces type-compatible values.

### Settings shallow-merge defense (Phase 67 cross-cutting fix #2)

**Source:** `packages/dev-seed/src/templates/default.ts:228-258` JSDoc + the literal-mirror shape

**Apply to:** every dev-seed template's `results` block when adding/renaming a key

**Pattern:** the seed override MUST mirror the FULL `results` block from `dynamicSettings.ts:59-67` (cardContents for every entity type listed in `sections`, plus `showFeedbackPopup` / `showSurveyPopup` / `sections`). Adding alliance support means EVERY listed entity type's cardContents must be present in the seed too — Phase 67 already did this work; Phase 69 only diffs the renamed value + alliance content.

### ICU Nested Plural

**Source:** `apps/frontend/src/lib/i18n/translations/en/results.json:6,28` — single-plural pattern (`"numShown": "..."`)

**Apply to:** new `results.alliance.summary` key per UI-SPEC

**Pattern (nested plural):**
```json
"summary": "{numCandidates, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}} across {numParties, plural, =0 {no parties} =1 {1 party} other {# parties}}"
```

7 locales must have this key; English is required, others can ship with English fallback (existing locale-ratchet pattern).

---

## No Analog Found

Files with NO close match in the codebase (planner should reach for RESEARCH.md / UI-SPEC.md instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | Every Phase 69 file has a close in-tree analog. The phase is "uniform extension of an existing pattern, not new feature engineering" (RESEARCH §"Don't Hand-Roll" key insight). |

The only optional NEW file without a per-line analog is `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` (regression guard). Its shape is derived from existing co-located vitest test files (e.g. `apps/frontend/src/params/entityTypePlural.test.ts`) — vitest `describe` + `it.each` + synthetic input.

---

## Cross-Phase Continuity

| Phase 69 Surface | Continuity With |
|------------------|-----------------|
| `cardContents.alliance: ['children']` default | Phase 67 D-04 (seed ships `cardContents.alliance: []` placeholder) — Phase 69 fills the placeholder |
| Cascading proxy in matchStore | v2.6 P64 reverse-fill of `organizationNominationIds` on Alliance parents (data-path prerequisite) |
| Route matchers accept `'alliances'` / `'alliance'` | Phase 62 introduced the matchers as strict allowlists; Phase 69 widens the OR chain |
| Manual smoke as validation surface | Phase 67 D-03 (alliance work uses manual UI smoke + parity gate, no new unit tests in `@openvaa/matching` / `@openvaa/filters`) |
| Parity gate baseline `67p / 1f / 34c` | v2.6 P64 baseline; held through v2.7 (Phase 65, 66, 67); Phase 69 must continue to pass |
| `'candidates'` → `'children'` rename surface | Establishes the "semantic-uniform parent-children naming" precedent for any future parent-entity types (factions-as-parent if introduced post-v2.8) |

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/dynamic-components/entityCard/`
- `apps/frontend/src/lib/dynamic-components/entityDetails/`
- `apps/frontend/src/lib/utils/matching/`
- `apps/frontend/src/lib/utils/matches.ts`
- `apps/frontend/src/lib/contexts/voter/`
- `apps/frontend/src/params/`
- `apps/frontend/src/routes/(voters)/(located)/results/`
- `apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/`
- `packages/app-shared/src/settings/`
- `packages/dev-seed/src/templates/`
- `packages/dev-seed/tests/templates/`
- `tests/tests/specs/variants/`

**Files scanned:** ~28 source files + 14 i18n JSON files + 4 fixture-pin tests + 3 E2E pin specs

**Pattern extraction date:** 2026-05-09

**Confidence:** HIGH — every Phase 69 surface has a verified in-tree analog; the cascading-impute pattern (the only genuinely new construct) is mechanically derivable from the existing `imputeParentAnswers` + `matchStore` shapes plus a small additive widening (optional `childProxies` param, additional generic constraint arm, and a `for...of` refactor for cross-iteration state).
