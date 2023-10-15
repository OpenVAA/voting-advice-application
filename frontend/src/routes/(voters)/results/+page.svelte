<script lang="ts">
  import {_} from 'svelte-i18n';
  import {onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {candidateRankings} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {EntityCard} from '$lib/components/entityCard';
  import {ScoreGauge} from '$lib/components/scoreGauge';
  import {BasicPage} from '$lib/components/basicPage';
  import {HelpIcon, ListIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';
  import {HeroEmoji} from '$lib/components/heroEmoji';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');

  // This has to be done onMount, because goto may otherwise be called on the server
  onMount(() => {
    if ($candidateRankings?.length === 0) {
      logDebugError('No candidate rankings found. Redirecting to questions');
      goto('/questions');
    }
  });
</script>

<BasicPage title={$page.data.appLabels.viewTexts.yourCandidatesTitle}>
  <HeroEmoji slot="hero">🎊</HeroEmoji>

  <svelte:fragment slot="secondaryActions">
    <IconButton href="/list" aria-label={$page.data.appLabels.actionLabels.yourList}>
      <ListIcon />
    </IconButton>
    <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
      <HelpIcon />
    </IconButton>
  </svelte:fragment>

  <p class="text-center">{$page.data.appLabels.viewTexts.yourCandidatesDescription}</p>

  <!-- TODO: Create a utility class to handle these full-width views -->
  <div
    class="-mx-lg -mb-safelgb flex w-screen flex-col items-center bg-base-300 px-md py-lg pb-safelgb">
    <div
      role="feed"
      class="grid w-full max-w-xl grid-cols-1 gap-md"
      aria-label={$page.data.appLabels.viewTexts.yourCandidatesTitle}>
      {#each $candidateRankings as { match, candidate }, i}
        <EntityCard
          on:click={() => goto(`${urlRoot}/${candidate.id}`)}
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
        <p>{$_('candidates.notFound')}</p>
      {/each}
    </div>
  </div>
</BasicPage>
