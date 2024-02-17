<script lang="ts">
  import {t} from '$lib/i18n';
  import {onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {candidateRankings} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {EntityCard} from '$lib/components/entityCard';
  import {ScoreGauge} from '$lib/components/scoreGauge';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');

  // This has to be done onMount, because goto may otherwise be called on the server
  onMount(() => {
    if ($candidateRankings?.length === 0) {
      logDebugError('No candidate rankings found. Redirecting to questions');
      goto(getRoute(Route.Questions));
    }
  });
</script>

<div class="flex w-full flex-grow flex-col items-center justify-start bg-base-300 p-lg pb-[3.5rem]">
  <div class="w-full max-w-xl">
    <h1 class="my-lg">{$t('candidates.candidates')}</h1>
    <!-- The -mx-md below is there to extend the cards a bit over the normal padding,
         match-w-xl:mx-0 cancels this on screens where the max-width comes into effect. -->
    <div
      role="feed"
      class="-mx-md grid grid-cols-1 gap-md match-w-xl:mx-0"
      aria-label={$t('candidates.candidates')}>
      {#each $candidateRankings as { match, candidate }, i}
        <EntityCard
          on:click={() => goto(getRoute({route: Route.Result, id: candidate.id}))}
          ariaPosinset={i + 1}
          ariaSetsize={$page.data.candidates.length}
          title={GetFullNameInOrder(candidate.firstName, candidate.lastName)}
          imgSrc="/images/candidate-photo.png"
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
  </div>
</div>
