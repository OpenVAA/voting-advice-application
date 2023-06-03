<script lang="ts">
  import Tabs from '$lib/shared/Tabs.svelte';
  import CandidateBasicInfo from '$lib/components/CandidateBasicInfo.svelte';
  import CandidateOpinions from '$lib/components/CandidateOpinions.svelte';
  export let candidate;

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
      <span class="badge-lg bg-default-party p-1 text-white">{candidate.electionListShort}</span>
    </p>
  </div>
  <Tabs on:changeTab={handleChangeTab} {tabs} {activeItem} />
  {#if tabs[0] === activeItem}
    <CandidateBasicInfo {candidate} />
  {:else if tabs[1] === activeItem}
    <CandidateOpinions />
  {/if}
</section>
