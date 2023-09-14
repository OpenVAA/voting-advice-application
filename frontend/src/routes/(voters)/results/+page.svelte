<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidates, candidateRankings} from '$lib/utils/stores';
  import {CandidateListing, CandidateRankingListing} from '$lib/components/candidates';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');

  // TODO: Check onMount if $candidateRankings.length > 0 and if not redirect to
  // frontpage or /questions
</script>

<div class="flex h-full flex-col items-center justify-center">
  <div class="max-w-xl">
    <h1>{$_('candidates.candidates')}</h1>
    {#if $candidateRankings.length > 0}
      {#each $candidateRankings as { match, candidate }}
        <CandidateRankingListing ranking={match} {candidate} href={`${urlRoot}/${candidate.id}`} />
      {/each}
    {:else}
      {#each $candidates as candidate}
        <CandidateListing {candidate} href={`${urlRoot}/${candidate.id}`} />
      {/each}
    {/if}
  </div>
</div>
