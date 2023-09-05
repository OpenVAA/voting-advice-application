<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {allCandidates} from '$lib/utils/stores';
  import {CandidateListing} from '$lib/components/candidates';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<h1>{$_('candidates.candidates')}</h1>

{#each $allCandidates as candidate}
  <CandidateListing {candidate} href={`${urlRoot}/${candidate.id}`} />
{/each}
