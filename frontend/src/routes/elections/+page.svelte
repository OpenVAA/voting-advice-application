<script lang="ts">
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import {gotoRoute, PageType} from '$lib/navigation';
  import {appLabels, availableElections, effectiveSettings} from '$lib/stores/stores';

  let selectedElectionId: string | string[];
  let allowMultiple: boolean | undefined;
  $: allowMultiple = $effectiveSettings?.electionsAllowSelectMultiple ?? false;

  function gotoConstituencies() {
    if (selectedElectionId == null || selectedElectionId.length == 0) {
      return;
    }
    gotoRoute({
      page: PageType.SelectConstituencies,
      electionIds: selectedElectionId
    });
  }
</script>

<h1>Select Elections</h1>

{#if $availableElections?.length && $effectiveSettings}
  {#each $availableElections.sorted as election, index}
    <label class="block">
      {#if allowMultiple}
        <input
          type="checkbox"
          class="checkbox"
          name="electionId"
          value={election.id}
          bind:group={selectedElectionId} />
      {:else}
        <input
          type="radio"
          class="radio"
          name="electionId"
          value={election.id}
          bind:group={selectedElectionId} />
      {/if}
      {index + 1}. {election.name} ({election.date.toLocaleDateString()})
    </label>
  {:else}
    <p>No elections found. This should not happen!</p>
  {/each}
  <button
    on:click={gotoConstituencies}
    class="btn"
    disabled={selectedElectionId == null || selectedElectionId.length === 0}
    >Continue to Selected Election</button>
{:else}
  <LoadingIndicator />
{/if}
