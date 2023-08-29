<script lang="ts">
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import type {CompatibilityScore} from '$lib/types/compatibilityScore.type';
  import Tabs from '$lib/shared/Tabs.svelte';
  import CandidateBasicInfo from './CandidateBasicInfo.svelte';
  import CandidateOpinions from './CandidateOpinions.svelte';
  import {ScoreGauge} from '$lib/components/scoreGauge/index';
  import type {CandidateProps} from './CandidateProps.type';

  export let candidate: CandidateProps;
  export let compatibilityScore: CompatibilityScore;

  // Tabs
  let tabs = [$_('candidate.tabs.basicInfo'), $_('candidate.tabs.opinions')];
  let activeItem = tabs[0];
  const handleChangeTab = (e: CustomEvent) => {
    activeItem = e.detail;
  };
</script>

<section class="mt-4">
  <!-- TODO: replace the following div tag with the EntityCard component -->
  <div class="mb-4 ml-4">
    <h1 class="text-h1">{GetFullNameInOrder(candidate.firstName, candidate.lastName)}</h1>
    <p>
      <span class="badge-lg bg-default-party p-1 text-white">{candidate.party.shortName}</span>
    </p>
  </div>
  <!-- {#} -->
  {#if compatibilityScore?.policyTopics}
    <div
      class="mx-4 mb-6 grid grid-flow-row grid-cols-2 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {#each compatibilityScore.policyTopics as policyTopic}
        <!-- TODO: replace the progressBarColor color with the color of the party -->
        <ScoreGauge score={policyTopic.score} shape="radial" label={policyTopic.name} />
      {/each}
    </div>
  {/if}
  <Tabs on:changeTab={handleChangeTab} {tabs} {activeItem} />
  {#if tabs[0] === activeItem}
    <CandidateBasicInfo {candidate} />
  {:else if tabs[1] === activeItem}
    <CandidateOpinions {candidate} />
  {/if}
</section>
