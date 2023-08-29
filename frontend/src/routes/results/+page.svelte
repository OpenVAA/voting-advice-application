<script lang="ts">
  import {_} from 'svelte-i18n';
  import {candidateRankings} from '$lib/utils/stores';
  import CandidateRankingListing from '$lib/components/CandidateRankingListing.svelte';
</script>

<h1>{$_('candidates.candidates')}</h1>

{#each $candidateRankings as { match, candidate }}
  <CandidateRankingListing ranking={match} {candidate} />
{/each}
