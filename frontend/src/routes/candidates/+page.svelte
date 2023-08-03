<script lang="ts">
  import {_} from 'svelte-i18n';
  import CandidateListing from '$lib/components/CandidateListing.svelte';
  export let data;
  // TODO: Define proper candidate data structure
  let candidates;

  if (data?.candidates) {
    candidates = data.candidates ? Object.values(data.candidates) : null;
  }
</script>

<h1 class="ml-2.5 mt-14 text-3xl font-medium leading-6 text-gray-500">
  {$_('candidates.candidates')}
</h1>

{#if candidates}
  {#each candidates as candidate}
    <CandidateListing id={candidate.id} candidate={candidate.attributes} />
  {/each}
{:else}
  <p>{$_('candidates.notFound')}</p>
{/if}
