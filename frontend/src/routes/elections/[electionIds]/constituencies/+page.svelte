<script lang="ts">
  // TO DO:
  // * Disallow selecting a constituency from multiple categories for the same election:
  //   make an expander or a radio selection?
  //   Now, we just pick the last changed one but that should not be so
  // * We should take into accont the nested structure of constituencies and only display
  //   the leaf nodes (and use a searchable select)
  // * Handle overlapping constituency categories: both identical categories and those
  //   that are subsets of others

  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {appLabels, visibleElections} from '$lib/stores/stores';

  const selectedConstituencyIds: string[] = [];

  function gotoQuestionCategories() {
    let root = $page.url.pathname.replace(/\/$/, '');
    const constituencyIds = Object.values(selectedConstituencyIds).join(',');
    goto(`${root}/${constituencyIds}/questions`);
  }

  let singleElection: boolean;
  $: singleElection = $visibleElections.length === 1;

  // In order to continue, we need one value for each election
  let submittable = false;
  $: submittable =
    selectedConstituencyIds.length > 0 &&
    selectedConstituencyIds.filter((id) => id == null || id == '').length === 0;
</script>

<h1>
  {$appLabels?.constituenciesTitle ?? 'Title Not Found'}
</h1>

{#if $visibleElections.length}
  {#each $visibleElections as election, elIndex}
    {#if !singleElection}
      <h2>
        {election.name}
      </h2>
    {/if}
    {#if election.constituencyCategories.length > 1}
      <p>Select a constituency from one of the categories below for this election.</p>
    {/if}
    {#each election.constituencyCategories as category, catIndex}
      <label class="block">
        <select name={category.id} class="select" bind:value={selectedConstituencyIds[elIndex]}>
          <option disabled selected value="">{category.name}</option>
          {#each category.constituencies as constituency}
            <option value={constituency.id}>{constituency.name}</option>
          {:else}
            <option disabled>No constituencies found in the group! This should not happen</option>
          {/each}
          {catIndex}. {category.name}
        </select>
      </label>
    {:else}
      <p>No constituencyCategories found! This should not happen</p>
    {/each}
  {/each}
  <button on:click={gotoQuestionCategories} class="btn" disabled={!submittable}
    >Continue to Question Categories</button>
{:else}
  <!-- TO DO: <Loading /> -->
  <h1>Loading...</h1>
{/if}
