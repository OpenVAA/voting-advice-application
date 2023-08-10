<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {appLabels, availableElections, effectiveSettings} from '$lib/stores/stores';
  let selectedElectionId: string | string[];

  function gotoConstituencies() {
    let root = $page.url.pathname.replace(/\/$/, '');
    const electionIds = Array.isArray(selectedElectionId)
      ? selectedElectionId.join(',')
      : selectedElectionId;
    goto(`${root}/${electionIds}/constituencies`);
  }

  let allowMultiple: boolean | undefined;
  $: allowMultiple = $effectiveSettings?.electionsAllowSelectMultiple ?? false;
</script>

<h1>
  {$appLabels?.electionsTitle ?? 'Title Not Found'}
</h1>

{#if $availableElections?.length && $effectiveSettings}
  {#each $availableElections as election, index}
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
  <!-- TO DO: <Loading /> -->
  <h1>Loading...</h1>
{/if}
