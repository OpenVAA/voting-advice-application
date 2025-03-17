<!--@component

# The details for a single entity or nomination

Used to show an entity's details using the `EntityDetails` component.

## Params

- `entityType`: The type of the entity to show.
- `entityId`: The id of the entity to show.
- `nominationId`: Optional. The id of the nomination for the entity to show. If not defined, the naked entity is shown.

## Settings

- `entityDetails.contents`: The tabs in `EntityDetails` to show for each entity type.
- See also the other properties under `entityDetails`, which affect the `EntityDetails` component.

## Tracking events

- `results_ranked_${$entityType}`: { id, score }
- `results_browse_${$entityType}`: { id }
-->

<script lang="ts">
  import { Match } from '@openvaa/matching';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDetails } from '$lib/dynamic-components/entityDetails';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { logDebugError } from '$lib/utils/logger';
  import SingleCardContent from '../../../../../SingleCardContent.svelte';
  import type { EntityType } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, getRoute, matches, startEvent, t } = getVoterContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // MainContent
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    actions: {
      help: 'hide',
      feedback: 'hide',
      return: 'show',
      returnButtonLabel: $t('common.back'),
      returnButtonCallback: () => goto($getRoute('Results'))
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Get the current match or nomination
  ////////////////////////////////////////////////////////////////////

  let entity: MaybeWrappedEntityVariant | undefined;
  let title = '';
  $: {
    const entityType = $page.params.entityType as EntityType;
    const entityId = $page.params.entityId;
    const nominationId = $page.url.searchParams.get('nominationId') ?? undefined;
    try {
      ({ entity, title } = getEntityAndTitle({
        dataRoot: $dataRoot,
        matches: $matches,
        entityType,
        entityId,
        nominationId
      }));
      doTrack();
    } catch (e) {
      handleError(
        e instanceof Error
          ? e.message
          : `Entity of type ${entityType} with id ${entityId} and nomination ${nominationId} not found.`
      );
    }
  }

  /**
   * Log error and return to resuls.
   */
  function handleError(message: string): void {
    logDebugError(message);
    goto($getRoute('Results'));
  }

  ////////////////////////////////////////////////////////////////////
  // Event tracking
  ////////////////////////////////////////////////////////////////////

  function doTrack(): void {
    if (entity instanceof Match) {
      startEvent(`results_ranked_${$page.params.entityType as EntityType}`, {
        id: $page.params.entityId,
        score: entity.score
      });
    } else {
      startEvent(`results_browse_${$page.params.entityType as EntityType}`, { id: $page.params.entityId });
    }
  }
</script>

<SingleCardContent {title}>
  <!-- The card -->
  {#if entity}
    {#key entity}
      <EntityDetails {entity} />
    {/key}
  {:else}
    <Loading showLabel />
  {/if}
</SingleCardContent>
