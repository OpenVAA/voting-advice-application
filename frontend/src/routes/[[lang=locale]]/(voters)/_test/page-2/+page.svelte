<script lang="ts">
  import {getGlobalContext} from '$lib/_contexts/global';
  import {Loading} from '$lib/components/loading';
  const {vaaData} = getGlobalContext();
</script>

<a href="/_test/">Page 1</a>

{#if !$vaaData.candidates.length}
  <Loading />
{:else}
  <h1>Candidates, page 2</h1>
  <ol>
    {#each $vaaData.candidates as candidate}
      <li>{candidate.name}</li>
    {/each}
  </ol>
{/if}
