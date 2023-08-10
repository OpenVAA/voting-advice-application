<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {appLabels, availableConstituencyCategories} from '$lib/stores/stores';

  const selectedConstituencyIds: string[] = [];

  function gotoQuestionCategories() {
    // TO DO: Make sure ids never contain commas, slashes or question marks
    // TO DO: Make path parts consts or define a global function for goto that takes
    // electionIds etc. as arguments
    let root = $page.url.pathname.replace(/\/$/, '');
    const constituencyIds = Object.values(selectedConstituencyIds).join(',');
    goto(`${root}/${constituencyIds}/questions`);
  }

  let singleElection: boolean;
  $: singleElection = Object.keys($availableConstituencyCategories.byElection).length === 1;

  // In order to continue, we need one value for each election
  let submittable = false;
  $: submittable =
    selectedConstituencyIds.length > 0 &&
    selectedConstituencyIds.filter((id) => id == null || id == '').length === 0;

  // TO DO:
  // * Disallow selecting a constituency from multiple categories for the same election:
  //   make an expander or a radio selection?
  //   Now, we just pick the last changed one but that should not be so
  // * We should take into accont the nested structure of constituencies and only display
  //   the leaf nodes (and use a searchable select)
  // * Handle overlapping constituency categories: both identical categories and those
  //   that are subsets of others
</script>

<h1>
  {$appLabels?.constituenciesTitle ?? 'Title Not Found'}
</h1>

{#if $availableConstituencyCategories?.nonEmpty}
  {#each $availableConstituencyCategories?.byElection as [election, categories], elIndex}
    {#if !singleElection}
      <h2>
        {election.name}
      </h2>
    {/if}
    {#if categories.length > 1}
      <p>Select a constituency from one of the categories below for this election.</p>
    {/if}
    {#each categories as category, catIndex}
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
