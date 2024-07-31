<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {afterNavigate, goto} from '$app/navigation';
  import {locale, t} from '$lib/i18n';
  import {startEvent} from '$lib/utils/analytics/track';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {
    candidateRankings,
    infoQuestions,
    openFeedbackModal,
    opinionQuestions,
    partyRankings,
    settings
  } from '$lib/stores/index.js';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {Loading} from '$lib/components/loading';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {Readable} from 'svelte/store';

  export let data;

  let entityType: Exclude<EntityType, 'all'>;
  let id: string;
  /** A party's candidates for displaying on a separate tab in EntityDetails or undefined if not applicable */
  let candidatesOrUndef: Promise<WrappedEntity[] | RankingProps[] | undefined>;
  let entity: Promise<WrappedEntity | RankingProps | undefined>;
  let title = '';
  let entities: Readable<Promise<WrappedEntity[] | RankingProps[]>>;

  // We need to set these reactively to get the most recent param data. We should, however, check that data has actually changed before reloading anything.
  $: {
    const current = {id, entityType};
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
        if (entityType !== 'party')
          error(500, `Entity type ${entityType} can not have 'candidates' in EntityDetails`);
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
            startEvent(`results_ranked_${entityType}`, {id, score: e.score, rank});
          });
        } else {
          startEvent(`results_browse_${entityType}`, {id});
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

<SingleCardPage {title}>
  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback && $openFeedbackModal}
      <Button
        on:click={$openFeedbackModal}
        variant="icon"
        icon="feedback"
        text={$t('feedback.send')} />
    {/if}
    <Button
      class="!text-neutral"
      variant="icon"
      icon="close"
      on:click={() => (useBack ? history.back() : goto($getRoute(Route.Results)))}
      text={$t('common.back')} />
  </svelte:fragment>
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
</SingleCardPage>
