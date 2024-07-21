<script lang="ts">
  import {getVoterContext} from '$lib/_contexts/voter';
  import {Loading} from '$lib/components/loading';
  import {BasicPage} from '$lib/templates/basicPage';

  const {election, electionId, locale} = getVoterContext();
</script>

<BasicPage title="Test">
  {#if $election && $election.constituencies}
    <h1>Election: {$election.name}</h1>
    <h2>Constituencies</h2>
    <ol>
      {#each $election.constituencies as { id, name }}
        <li><a href="/{$locale}/_test/{$electionId}/{id}">{name}</a></li>
      {/each}
    </ol>
  {:else}
    <Loading />
  {/if}
</BasicPage>
