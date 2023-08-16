<script lang="ts">
  import CandidateListing from '$lib/components/CandidateListing.svelte';
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {gotoRoute, PageType} from '$lib/navigation';
  import {isSingleElection, visibleConstituencies, visibleElections} from '$lib/stores/stores';

  function gotoPersonNomination(id: string) {
    gotoRoute({
      page: PageType.ShowPerson,
      personNominationId: id,
      currentUrl: $page.url.pathname
    });
  }
</script>

<h1 class="ml-2.5 mt-14 text-3xl font-medium leading-6 text-gray-500">
  {$_('candidates.candidates')}
</h1>

{#if $visibleElections}
  {#each $visibleElections.sorted as election}
    {#if !$isSingleElection}
      <h2>Results for {election.name}</h2>
    {/if}
    {#each election.nominations.persons.filter( {constituencyId: $visibleConstituencies.sorted.map((c) => c.id)} ) as candidate}
      <CandidateListing
        {candidate}
        on:select={() => gotoPersonNomination(candidate.nominationId)} />
    {:else}
      <p>{$_('candidates.notFound')}</p>
    {/each}
  {/each}
{:else}
  <LoadingIndicator />
{/if}
