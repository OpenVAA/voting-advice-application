<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {allCandidates} from '$lib/utils/stores';
  import {CandidateListing} from '$lib/components/candidates';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<div class="bg-primary">
  <div class="p-5">
    <h1 class="ml-2.5 mt-14 text-center text-3xl font-medium leading-6 text-gray-500">
      {$_('candidates.candidates')}
    </h1>
    {#each $allCandidates as candidate}
      <CandidateListing {candidate} href={`${urlRoot}/${candidate.id}`} />
    {:else}
      <p>{$_('candidates.notFound')}</p>
    {/each}
  </div>
</div>
