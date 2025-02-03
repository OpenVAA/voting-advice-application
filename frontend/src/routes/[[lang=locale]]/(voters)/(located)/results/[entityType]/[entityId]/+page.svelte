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
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDetails } from '$lib/dynamic-components/entityDetails';
  import { unwrapEntity } from '$lib/utils/entities';
  import { logDebugError } from '$lib/utils/logger';
  import { findNomination } from '$lib/utils/matches';
  import type { AnyEntityVariant, EntityType } from '@openvaa/data';
  import SingleCardContent from '../../../../../SingleCardContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, getRoute, locale, matches, startEvent, t } = getVoterContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // MainContent
  ////////////////////////////////////////////////////////////////////

  /**
   * We determine if we arrived via an external link or from within the app, so we can use `history.back()`. However, if we changed the locale, we shouldn't use back() either.
   * TODO: Handle this in the topBar component or in the contexts
   */
  let useBack = false;
  let initialLocale = $locale;
  afterNavigate((n) => (useBack = n.from?.route != null && initialLocale === $locale));

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    actions: {
      help: 'hide',
      feedback: 'hide',
      return: 'show',
      returnButtonLabel: $t('common.back'),
      returnButtonCallback: () => (useBack ? history.back() : goto($getRoute('Results')))
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
    const nominationId = $page.url.searchParams.get('nominationId');

    if (nominationId) {
      // Find the nomination in the matches, so we get the score. Note that target may be either a Match or a Nomination
      const target = findNomination({ matches: $matches, entityType, nominationId });
      if (!target) {
        handleError(`Nomination of type ${entityType} with id ${nominationId} not found.`);
      } else {
        // Make sure that the nomination matches the entity we are looking for
        const { entity: nakedEntity } = unwrapEntity<AnyEntityVariant>(target);
        title = nakedEntity.name;
        if (nakedEntity.id !== entityId) {
          handleError(`Nomination with ${nominationId} does not match that of entity ${entityId}.`);
        } else {
          entity = target;
          doTrack();
        }
      }
    } else {
      try {
        entity = $dataRoot.getEntity(entityType, entityId);
        title = entity.name;
        doTrack();
      } catch {
        handleError(`Entity of type ${entityType} with id ${entityId} not found.`);
      }
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