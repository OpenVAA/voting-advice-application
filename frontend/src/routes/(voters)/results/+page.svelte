<script lang="ts">
  import {_} from 'svelte-i18n';
  import {onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {candidates, candidateRankings} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {EntityCard} from '$lib/components/entityCard';
  import {ScoreGauge} from '$lib/components/scoreGauge';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');

  onMount(() => {
    if ($candidateRankings?.length === 0) {
      logDebugError('No candidate rankings found. Redirecting to questions');
      goto('/questions');
    }
  });
</script>

<div class="flex h-full flex-col items-center justify-center bg-primary">
  <div class="max-w-xl">
    <h1>{$_('candidates.candidates')}</h1>
    <div role="feed" class="grid grid-cols-1 gap-4" aria-label={$_('candidates.candidates')}>
      {#each $candidateRankings as { match, candidate }, i}
        <EntityCard
          on:click={() => goto(`${urlRoot}/${candidate.id}`)}
          ariaPosinset={i + 1}
          ariaSetsize={$candidates.length}
          title={GetFullNameInOrder(candidate.firstName, candidate.lastName)}
          imgSrc="/images/candidate-photo.png"
          id={candidate.id}
          listText={candidate.party?.shortName ?? ''}
          electionSymbol={candidate.electionSymbol}>
          <div slot="card-footer">
            {#if match.subMatches && match.subMatches.length > 0}
              <div
                class="mx-4 mb-6 grid grid-flow-row grid-cols-2 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {#each match.subMatches as subMatch}
                  <!-- TODO: replace the progressBarColor color with the color of the category -->
                  <ScoreGauge
                    score={subMatch.score}
                    label={subMatch.questionGroup.label ?? ''}
                    shape="linear" />
                {/each}
              </div>
            {/if}
          </div>
        </EntityCard>
      {:else}
        <p>{$_('candidates.notFound')}</p>
      {/each}
    </div>
  </div>
</div>
