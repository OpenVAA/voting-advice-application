<!--@component

# Results — list / detail page (Phase 62 D-08, D-11, D-12)

Single page file serving the four URL shapes of `/results`:

  1. `/results/[electionId]`                                     — list only, default plural tab
  2. `/results/[electionId]/[plural]`                            — list only, explicit plural tab
  3. `/results/[electionId]/[plural]/[singular]/[id]`            — list + drawer (matching types)
  4. `/results/[electionId]/organizations/candidate/[id]`        — list + drawer (cross-type edge)

List rendering is owned by the parent `+layout.svelte`, which persists across
child-route navigation. When both `entityTypeSingular` and `id` are present in
the URL the page renders a single-card entity-detail view. Plan 62-03 refactors
the layout to wire drawer-over-list rendering; until then, navigating to a
detail URL renders the detail here (legacy behaviour preserved — baseline E2E
still passes).

Route params:
- `entityTypePlural`  (optional, matcher-gated)  — `candidates` | `organizations`
- `entityTypeSingular` (optional, matcher-gated) — `candidate` | `organization`
- `id` (optional)                                — entity id for the drawer

Search params:
- `nominationId` (optional) — show the entity as a specific nomination variant

Deeplink to a missing entity degrades silently (UI-SPEC Empty State Inventory
"Deeplink to entity not found") — the error is `logDebugError`'d and the page
falls through to `<Loading />`.

Tracking events (preserved from legacy `[entityType]/[entityId]/+page.svelte`):
- `results_ranked_${entityTypeSingular}`  when drawer entity carries a match score
- `results_browse_${entityTypeSingular}`  otherwise
-->

<script lang="ts">
  import { isMatch } from '@openvaa/matching';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDetails } from '$lib/dynamic-components/entityDetails';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { logDebugError } from '$lib/utils/logger';
  import SingleCardContent from '../../../../../../SingleCardContent.svelte';
  import type { EntityType } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, matches, startEvent, t } = getVoterContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Drawer-entity resolution (D-11 coupling already enforced by +page.ts)
  ////////////////////////////////////////////////////////////////////

  const entityType = $derived(page.params.entityTypeSingular as EntityType | undefined);
  const entityId = $derived(page.params.id);

  let entity = $state<MaybeWrappedEntityVariant | undefined>();
  let title = $state('');

  $effect(() => {
    // Short-circuit when the URL carries no drawer state — the layout renders
    // the list view unchanged in that case and this page is effectively empty.
    if (!entityType || !entityId) {
      entity = undefined;
      title = '';
      return;
    }
    const nominationId = page.url.searchParams.get('nominationId') ?? undefined;
    try {
      ({ entity, title } = getEntityAndTitle({
        dataRoot: $dataRoot,
        matches,
        entityType,
        entityId,
        nominationId
      }));
      doTrack();
    } catch (e) {
      // Silent degradation — UI-SPEC Empty State Inventory "Deeplink to entity not found"
      logDebugError(
        `Could not get entity details for ${entityType} ${entityId}. Error: ${e instanceof Error ? e.message : '-'}`
      );
      handleError();
    }
  });

  /**
   * Navigate back to the parent list view (D-09 drawer-close semantics).
   * Strips only `entityTypeSingular` + `id` — preserves the plural-tab context.
   */
  function handleError(): void {
    const { electionId, entityTypePlural } = page.params;
    const listSuffix = entityTypePlural ? `/${entityTypePlural}` : '';
    goto(`/results/${electionId}${listSuffix}`);
  }

  ////////////////////////////////////////////////////////////////////
  // Top-bar + page-style overrides (only when detail view is active)
  ////////////////////////////////////////////////////////////////////

  $effect(() => {
    if (!entityType || !entityId) return;
    pageStyles.push({ drawer: { background: 'bg-base-300' } });
    topBarSettings.push({
      actions: {
        help: 'hide',
        feedback: 'hide',
        return: 'show',
        returnButtonLabel: t('common.back'),
        returnButtonCallback: () => {
          const { electionId, entityTypePlural } = page.params;
          const listSuffix = entityTypePlural ? `/${entityTypePlural}` : '';
          goto(`/results/${electionId}${listSuffix}`);
        }
      }
    });
  });

  ////////////////////////////////////////////////////////////////////
  // Event tracking
  ////////////////////////////////////////////////////////////////////

  function doTrack(): void {
    if (!entityType || !entityId) return;
    if (isMatch(entity)) {
      startEvent(`results_ranked_${entityType}`, {
        id: entityId,
        score: entity.score
      });
    } else {
      startEvent(`results_browse_${entityType}`, { id: entityId });
    }
  }
</script>

{#if entityType && entityId}
  <SingleCardContent {title}>
    {#if entity}
      {#key entity}
        <EntityDetails {entity} data-testid="voter-entity-detail" />
      {/key}
    {:else}
      <Loading showLabel />
    {/if}
  </SingleCardContent>
{/if}
