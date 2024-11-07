<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { onDestroy } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { EntityDetails } from '$lib/components/entityDetails';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { locale, t } from '$lib/i18n';
  import { candidateRankings, infoQuestions, opinionQuestions, partyRankings, settings } from '$lib/stores/index.js';
  import { startEvent } from '$lib/utils/analytics/track';
  import { getRoute, ROUTE } from '$lib/utils/navigation';
  import type { Readable } from 'svelte/store';

  export let data;

  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    actions: {
      help: 'hide',
      feedback: 'hide',
      return: 'show',
      returnButtonLabel: $t('common.back'),
      returnButtonCallback: () => (useBack ? history.back() : goto($getRoute(ROUTE.Results)))
    }
  });

  let entityType: Exclude<EntityType, 'all'>;
  let id: string;
  /** A party's candidates for displaying on a separate tab in EntityDetails or undefined if not applicable */
  let candidatesOrUndef: Promise<Array<WrappedEntity> | Array<RankingProps> | undefined>;
  let entity: Promise<WrappedEntity | RankingProps | undefined>;
  let title = '';
  let entities: Readable<Promise<Array<WrappedEntity> | Array<RankingProps>>>;

  // We need to set these reactively to get the most recent param data. We should, however, check that data has actually changed before reloading anything.
  $: {
    const current = { id, entityType };
    id = data.entityId;
    entityType = data.entityType as Exclude<EntityType, 'all'>;

    // Only update if the data has actually changed.
    if (current.id !== id || current.entityType !== entityType) {
      switch (entityType) {
        case 'candidate':
          entities = candidateRankings;
          break;
        case 'party':
          entities = partyRankings;
          break;
        default:
          error(404, `Unknown entity type ${data.entityType}`);
      }
      entity = $entities.then((d) => {
        const res = d.find((r) => r.entity.id == id);
        if (res) title = res.entity.name;
        return res;
      });
      if ($settings.entityDetails.contents[entityType].includes('candidates')) {
        if (entityType !== 'party') error(500, `Entity type ${entityType} can not have 'candidates' in EntityDetails`);
        candidatesOrUndef = $candidateRankings.then((d) => {
          const res = d.filter((c) => c.entity.party?.id == id);
          return res.length ? res : undefined;
        });
      } else {
        candidatesOrUndef = Promise.resolve(undefined);
      }
      // Tracking
      entity.then((e) => {
        if (!e) return;
        if ('score' in e) {
          // Find out the rank of this entity
          $entities.then((all) => {
            const rank = all.findIndex((a) => a.entity.id == e.entity.id);
            startEvent(`results_ranked_${entityType}`, { id, score: e.score, rank });
          });
        } else {
          startEvent(`results_browse_${entityType}`, { id });
        }
      });
    }
  }

  /**
   * We determine if we arrived via an external link or from within the app, so we can use `history.back()`. However, if we changed the locale, we shouldn't use back() either.
   */
  let useBack = false;
  let initialLocale = $locale;
  afterNavigate((n) => (useBack = n.from?.route != null && initialLocale === $locale));
</script>

<!-- Page title -->
<svelte:head>
  <title>{title} – {$t('dynamic.appName')}</title>
</svelte:head>

<!-- The card -->
<div
  class="-mx-lg -mb-safelgb -mt-lg flex w-screen max-w-xl flex-grow self-center rounded-t-lg bg-base-100 pb-[3.5rem] match-w-xl:shadow-xl">
  {#await Promise.all([entity, candidatesOrUndef, $opinionQuestions, $infoQuestions])}
    <Loading showLabel />
  {:then [content, subentities, opinionQuestionsSync, infoQuestionsSync]}
    {#if content}
      <EntityDetails
        {content}
        {subentities}
        opinionQuestions={opinionQuestionsSync}
        infoQuestions={infoQuestionsSync} />
    {:else}
      {error(404, `Entity ${entityType}:${id} not found`)}
    {/if}
  {/await}
</div>
