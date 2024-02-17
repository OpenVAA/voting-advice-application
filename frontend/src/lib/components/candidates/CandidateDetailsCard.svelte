<script lang="ts">
  import {t} from '$lib/i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import Tabs from '$lib/components/shared/Tabs.svelte';
  import {ScoreGauge} from '$lib/components/scoreGauge/index';
  import CandidateBasicInfo from './CandidateBasicInfo.svelte';
  import CandidateOpinions from './CandidateOpinions.svelte';

  export let candidate: CandidateProps;
  export let ranking: RankingProps | undefined = undefined;

  // Tabs
  let tabs = [$t('candidate.tabs.basicInfo'), $t('candidate.tabs.opinions')];
  let activeItem = tabs[0];
  const handleChangeTab = (e: CustomEvent) => {
    activeItem = e.detail;
  };
</script>

<article>
  <!-- TODO: replace the following div tag with the EntityCard component -->
  <header class="p-lg">
    <h1>
      {GetFullNameInOrder(candidate.firstName, candidate.lastName)}
    </h1>
    <p class="text-center">
      <span class="p-1 badge-md rounded-sm bg-secondary text-white"
        >{candidate.party.shortName}</span>
      {#if ranking}<span class="px-3 text-lg">{ranking}</span>{/if}
    </p>
    {#if ranking?.subMatches && ranking.subMatches.length > 0}
      <div class="mt-md grid grid-flow-row grid-cols-3 gap-x-lg gap-y-14 py-sm lg:grid-cols-4">
        {#each ranking.subMatches as subMatch}
          <!-- TODO: replace the progressBarColor color with the color of the party -->
          <ScoreGauge
            score={subMatch.score}
            label={subMatch.questionGroup.label ?? ''}
            shape="linear" />
        {/each}
      </div>
    {/if}
  </header>
  <!-- {#} -->
  <Tabs on:changeTab={handleChangeTab} {tabs} {activeItem} />
  {#if tabs[0] === activeItem}
    <CandidateBasicInfo {candidate} />
  {:else if tabs[1] === activeItem}
    <CandidateOpinions {candidate} />
  {/if}
</article>
