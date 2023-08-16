<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {isSingleElection, visibleConstituencies, visibleElections} from '$lib/stores/stores';
  import {ucFirst} from '$lib/utils/strings';

  function gotoPersonNomination(id: string) {
    let root = $page.url.pathname.replace(/\/$/, '');
    goto(`${root}/person/${id}`);
  }
</script>

<h1>Results</h1>

{#if $visibleElections}
  {#each $visibleElections.sorted as election}
    {#if !$isSingleElection}
      <h2>Results for {election.name}</h2>
    {/if}
    {#each election.nominations.persons.filter( {constituencyId: $visibleConstituencies.sorted.map((c) => c.id)} ) as { nominationId, name, shortName, initials, electionSymbol, isIndependent, memberOfNominatingOrganization, organization, organizationNominations }}
      <div class="my-4">
        <h2>{name} (a.k.a. {shortName} or {initials})</h2>
        {#if electionSymbol != ''}
          <p>Symbol: {electionSymbol}</p>
        {/if}
        {#if organizationNominations.length}
          <p>
            Listed by:
            {organizationNominations
              .map((n) => n.shortName + (n.type ? ` (${ucFirst(n.type)})` : ''))
              .join(', ')}
          </p>
          {#if isIndependent}
            <em>Independent candidate</em>
          {:else if memberOfNominatingOrganization}
            <em
              >Member of the same {organizationNominations[0].type
                ? organizationNominations[0].type
                : 'party'}</em>
          {:else}
            <em>But member of {organization?.shortName} ({organization?.name})</em>
          {/if}
        {:else}
          <p>Not listed by an organization, huh?</p>
        {/if}
        <div>
          <button class="btn" on:click={() => gotoPersonNomination(nominationId)}
            >View details</button>
        </div>
      </div>
    {:else}
      <p>No persons found! Maybe the Constituency is empty?</p>
    {/each}
  {/each}
{:else}
  <!-- TO DO: <Loading /> -->
  <h1>Loading...</h1>
{/if}
