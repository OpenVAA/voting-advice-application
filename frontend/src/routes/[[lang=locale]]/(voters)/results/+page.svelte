<script lang="ts">
  import {onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {candidateRankings} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {EntityCard} from '$lib/components/entityCard';
  import {ScoreGauge} from '$lib/components/scoreGauge';
  import {BasicPage} from '$lib/templates/basicPage';

  // This has to be done onMount, because goto may otherwise be called on the server
  onMount(() => {
    if ($candidateRankings?.length === 0) {
      logDebugError('No candidate rankings found. Redirecting to questions');
      goto(getRoute(Route.Questions));
    }
  });
</script>

<BasicPage title={$t('viewTexts.yourCandidatesTitle')} mainClass="bg-base-300">
  <!-- <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('viewTexts.questionsTip')}
  </svelte:fragment> -->

  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('results.heroEmoji')} />
  </svelte:fragment>

  <svelte:fragment slot="banner">
    <Button href={getRoute(Route.Help)} variant="icon" icon="help" text={$t('actionLabels.help')} />
    <Button
      on:click={() => console.info('Show favourites')}
      variant="icon"
      icon="list"
      text={$t('actionLabels.yourList')} />
  </svelte:fragment>

  <p class="text-center">
    {$t('viewTexts.yourCandidatesDescription', {
      numCandidates: $candidateRankings?.length,
      filters: 'filters'
    })}
  </p>

  <!-- The -mx-md and w-[calc(100%+20rem/16)] below are there to extend the cards a bit over 
       the normal padding, match-w-xl: classes cancel this on screens where the max-width 
       comes into effect. TODO: Define the calculated width as a predefined utility class 
       that uses the same md definition. -->
  <div
    role="feed"
    class="-mx-md grid w-[calc(100%+20rem/16)] grid-cols-1 gap-md match-w-xl:mx-0 match-w-xl:w-full"
    aria-label={$t('candidates.candidates')}>
    {#each $candidateRankings as { match, candidate }, i}
      <EntityCard
        on:click={() => goto(getRoute({route: Route.Result, id: candidate.id}))}
        ariaPosinset={i + 1}
        ariaSetsize={$candidateRankings.length}
        tabindex={0}
        title={GetFullNameInOrder(candidate.firstName, candidate.lastName)}
        imgSrc="/images/candidate-photo.png"
        imgAlt={$t('candidate.portraitAlt')}
        id={candidate.id}
        listText={candidate.party?.shortName ?? ''}
        electionSymbol={candidate.electionSymbol}
        summaryMatch={match.toString()}>
        <div slot="card-footer">
          {#if match.subMatches && match.subMatches.length > 0}
            <div
              class="mt-md grid grid-flow-row grid-cols-3 gap-x-lg gap-y-14 py-sm lg:grid-cols-4">
              {#each match.subMatches as subMatch}
                <!-- TODO: replace the progressBarColor color with the color of the category -->
                <ScoreGauge
                  showUnit={true}
                  score={subMatch.score}
                  label={subMatch.questionGroup.label ?? ''}
                  shape="linear" />
              {/each}
            </div>
          {/if}
        </div>
      </EntityCard>
    {:else}
      <p>{$t('candidates.notFound')}</p>
    {/each}
  </div>
</BasicPage>
