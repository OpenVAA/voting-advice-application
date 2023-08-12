<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {CompatibilityScore} from '$lib/types/compatibilityScore.type';
  import Tabs from '$lib/shared/Tabs.svelte';
  import CandidateBasicInfo from '$lib/components/CandidateBasicInfo.svelte';
  import CandidateOpinions from '$lib/components/CandidateOpinions.svelte';
  import {ScoreGauge} from '$lib/components/scoreGauge/index';
  export let candidate;
  export let compatibilityScore: CompatibilityScore = {};

  let tabs = ['Basic info', 'Opinions'];
  let activeItem = tabs[0];
  const handleChangeTab = (e) => {
    activeItem = e.detail;
  };
  let current = 'basic-info';
</script>

<section class="mt-4">
  <!-- TODO: replace the following div tag with the EntityCard component -->
  <div class="mb-4 ml-4">
    <h1 class="text-h1">{candidate.name}</h1>
    <p>
      <span class="badge-lg bg-default-party p-1 text-white">{candidate.partyShortName}</span>
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
    <CandidateOpinions />
  {/if}
</section>
