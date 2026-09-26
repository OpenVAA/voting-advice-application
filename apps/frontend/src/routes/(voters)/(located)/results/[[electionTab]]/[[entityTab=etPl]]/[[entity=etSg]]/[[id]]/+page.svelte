<!--@component

# Results — list / detail page (the single innermost page node)

Owns the matching results list and mounts the entity drawer's opener. The election-tab layout two levels up owns the page chrome and the election picker; the entity-tab layout one level up owns the type tabs and the implied-type gate.

## Why this file matches every URL shape, and why that is the point

All four route params are optional (phase 165, D-08), so this ONE page node serves every shape `/results` emits:

  1. `/results?electionId=X`                                            — picker; the election-tab layout renders the prompt instead of these children
  2. `/results/[electionTab]?electionId=X`                              — list, active tab IMPLIED from the voter context
  3. `/results/[electionTab]/[entityTab]?electionId=X`                  — list, explicit plural tab
  4. `/results/[electionTab]/[entityTab]/[entity]/[id]?electionId=X`    — list + drawer (matching types)

Because every one of those resolves to the same page node, SvelteKit reuses the SAME component instance across them, and a navigation between two shapes updates this component rather than remounting it. That single-instance guarantee is the whole mechanism: **a second page node anywhere above this file would break it**, which is why the entity-tab layout deliberately has no `+page.svelte` beside it. Spike 033 measured exactly that failure on a tree with a page file at each level — the first switch away from the implied tab remounted the list, because the implied shape and the explicit shape were served by different component instances in different route files.

The cross-type shape `/results/[electionTab]/organizations/candidate/[id]` stays ROUTABLE — the params are optional and D-09 forbids canonicalisation and redirects — but no current emitter produces it, so it is not in the tested set. See `165-NEGATIVE-CONTROL.md` § 6 for the derivation.

Route params:
- `electionTab`   (optional, freeform)              — SELECTED election id for the active results tab
- `entityTab`     (optional, matcher-gated by etPl) — `candidates` | `organizations` | `alliances`
- `entity`        (optional, matcher-gated by etSg) — `candidate` | `organization` | `alliance`
- `id`            (optional)                        — entity id for the drawer

Name-disjoint dissociation: `electionTab` (route key, SELECTED singular) and `electionId` (search key, AVAILABLE array; PERSISTENT_SEARCH_PARAMS member at `$lib/routes/params.ts`) are literally different identifiers throughout the codebase. `constituencyId` continues to travel as a persistent search param.

The sibling `+page.ts` guards the two impossible shapes: a matcher fallthrough (404) and `entity`-without-`id` / `id`-without-`entity` (307 back to the list). Both are pinned by `page.guards.test.ts`.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { isMatch } from '@openvaa/matching';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Loading } from '$lib/components/loading';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDrawerOpener } from '$lib/dynamic-components/entityDetails';
  import { EntityListWithControls } from '$lib/dynamic-components/entityList';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { compareMaybeWrappedEntities } from '$lib/utils/sorting';
  import { buildListRoute, narrowEntityPlural, pluralForEntityType } from '../../../resultsRoutes';
  import type { Election, EntityType } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // The reactive context getters (constituenciesSelectable, currentResultsEntityType, matches, selectedConstituencies, selectedElections) are read via voterCtx.X.
  // Genuinely stable members (startEvent, t) remain destructured.
  //
  // dataRoot is NOT in that set. It is a bare reactive accessor that is identity-stable behind a #version bridge, so per CLAUDE.md's Context Destructuring Rule it may be neither destructured nor bound to an intermediate $derived read alias: referential equality would suppress downstream notification and the cold/direct-URL snapshot would stay empty. Read `voterCtx.dataRoot.<prop>` directly inside the consuming tracking scope — the drawer derivation below does exactly that, and must keep doing it. See CLAUDE.md "Context Destructuring Rule" and its stable-reference carve-out.
  const voterCtx = getVoterContext();
  const { startEvent, t } = voterCtx;
  // Local aliases for template readability. Both are value-replacing, so a $derived read alias is safe and correct.
  const elections = $derived(voterCtx.selectedElections);
  const constituencies = $derived(voterCtx.selectedConstituencies);

  ////////////////////////////////////////////////////////////////////
  // URL-derived state
  ////////////////////////////////////////////////////////////////////
  //
  // Re-derived from the route params here rather than prop-drilled down from the two layouts above, for the reason given in the entity-tab layout: each level reading the URL directly is what keeps "the URL is the single source of truth" true across three files instead of one.

  const _urlElectionTab = $derived(page.params.electionTab);

  const activeElectionId = $derived<string | undefined>(
    _urlElectionTab ?? (elections.length === 1 ? elections[0].id : undefined)
  );

  const activeElection = $derived<Election | undefined>(
    activeElectionId ? elections.find((e) => e.id === activeElectionId) : undefined
  );

  const _urlPlural = $derived(narrowEntityPlural(page.params.entityTab));

  // Plural → singular mapping uses American spelling. The implied entity type lives on voterContext via `currentResultsEntityType`: URL-first with default-pick fallback to the first available tab for the active election. Reading through `voterCtx.X` per the CLAUDE.md Context Destructuring Rule preserves reactivity (must not destructure).
  const activeEntityType = $derived(voterCtx.currentResultsEntityType);

  // `compareMaybeWrappedEntities` re-sorts what the matcher already ordered, and the primary key is the same one: it compares match score DESC, which is exactly `MatchingAlgorithm`'s ascending distance. What it adds is a TIE-BREAK — election symbol asc, then name asc — for entities the matcher scores identically.
  //
  // Why this is needed (debug session `tied-match-order-churn`): `matchingAlgorithm.ts:122` sorts on distance alone, and `Array.prototype.sort` is stable, so distance-tied entities keep their ARRIVAL order. That order is the `get_nominations` row order, which falls back to the `gen_random_uuid()` primary key for any nomination lacking `sort_order` — so tied candidates permuted between page loads. The seed-side half is fixed in `dev-seed`'s pipeline, but an imported dataset without `sort_order` would still churn; this makes `/results` stable regardless of what the data layer hands us.
  //
  // `toSorted`, NOT `sort`: `voterCtx.matches[...]` is reactive context state and must not be mutated in place.
  const activeMatches = $derived<Array<MaybeWrappedEntityVariant> | undefined>(
    activeElectionId && activeEntityType
      ? voterCtx.matches[activeElectionId]?.[activeEntityType]?.toSorted(compareMaybeWrappedEntities)
      : undefined
  );

  ////////////////////////////////////////////////////////////////////
  // Drawer visibility — drawer renders iff both singular+id present
  ////////////////////////////////////////////////////////////////////

  const drawerVisible = $derived<boolean>(!!(page.params.entity && page.params.id));

  const drawerEntity = $derived.by<MaybeWrappedEntityVariant | undefined>(() => {
    if (!drawerVisible) return undefined;
    const entityType = page.params.entity as EntityType;
    const entityId = page.params.id!;
    const nominationId = page.url.searchParams.get('nominationId') ?? undefined;
    try {
      const { entity } = getEntityAndTitle({
        dataRoot: voterCtx.dataRoot,
        matches: voterCtx.matches,
        entityType,
        entityId,
        nominationId
      });
      return entity;
    } catch (e) {
      // Silent degradation — UI-SPEC Empty State Inventory "Deeplink to entity not found"
      log.error(
        `Could not get entity details for ${entityType} ${entityId}. Error: ${e instanceof Error ? e.message : '-'}`
      );
      return undefined;
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Track events
  ////////////////////////////////////////////////////////////////////

  // Drawer-view tracking — fires on drawer open transitions (covers both matched and unmatched entity pools per the legacy `results_ranked_*` / `results_browse_*` event pair).
  $effect(() => {
    if (!drawerVisible || !drawerEntity) return;
    const entityType = page.params.entity as EntityType;
    const entityId = page.params.id!;
    if (isMatch(drawerEntity)) {
      startEvent(`results_ranked_${entityType}`, { id: entityId, score: drawerEntity.score });
    } else {
      startEvent(`results_browse_${entityType}`, { id: entityId });
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Handlers
  ////////////////////////////////////////////////////////////////////

  function handleDrawerClose(): void {
    // `noScroll: true` mirrors the entity-card open path (EntityCard's `cardAction` snippet sets `data-sveltekit-noscroll` on its anchor branch). Without it, SvelteKit's default scroll-on-navigation snaps the list back to the top, which reads as "the page scrolls when the drawer closes".
    goto(buildListRoute(activeElectionId, _urlPlural ?? pluralForEntityType(activeEntityType)), { noScroll: true });
  }
</script>

<!--
  The opener renders NOTHING in place: the dialog itself is `DrawerHost`, mounted once in the voter app's root layout, and a modally-opened dialog sits in the top layer regardless of source order. `voter-results-drawer` rides on the host payload's `testId` rather than on a component in this file.
-->
{#if drawerVisible && drawerEntity}
  <EntityDrawerOpener entity={drawerEntity} onClose={handleDrawerClose} />
{/if}

<!--
  This `{#if}` is a TYPE NARROWING, not a second gate: its else-branch — the no-nominations warning — belongs to the entity-tab layout above, which never renders these children when the active type is unresolved. It is kept here so `activeEntityType` narrows for the section testid and the heading key below.
-->
{#if activeEntityType}
  {#if activeMatches}
    <div
      data-testid={activeEntityType === 'candidate'
        ? 'voter-results-candidate-section'
        : activeEntityType === 'organization'
          ? 'voter-results-party-section'
          : activeEntityType === 'alliance'
            ? 'voter-results-alliance-section'
            : undefined}>
      <!-- {#key}: keep — a scope-tuple change discards per-scope filter UI state; without remount, EntityListWithControls would carry filter selections from one election:entityType context into the next. -->
      {#key `${activeElectionId}:${activeEntityType}`}
        <h3 class="my-lg mx-10 text-xl">
          {t(`results.${activeEntityType}.numShown`, { numShown: activeMatches.length })}
          {#if voterCtx.constituenciesSelectable}
            <span class="font-normal">
              {t('results.inConstituency')}
              {activeElection?.getApplicableConstituency(constituencies)?.name || '—'}
            </span>
          {/if}
        </h3>
        <EntityListWithControls entities={activeMatches} class="mb-lg mx-10" data-testid="voter-results-list" />
      {/key}
    </div>
  {:else}
    <Loading />
  {/if}
{/if}
