<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidateRankings} from '$lib/utils/stores';
  import {CandidateRankingListing} from '$lib/components/candidates';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<h1>{$_('candidates.candidates')}</h1>

{#each $candidateRankings as { match, candidate }}
  <CandidateRankingListing ranking={match} {candidate} href={`${urlRoot}/${candidate.id}`} />
{:else}
  {$_('candidates.notFound')}
{/each}
