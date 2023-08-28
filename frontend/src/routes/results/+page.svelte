<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {PageData} from './$types';
  import {allCandidates, allQuestions, candidateRankings} from '$lib/utils/stores';
  import CandidateRankingListing from '$lib/components/CandidateRankingListing.svelte';

  export let data: PageData;

  if (data?.candidates && data?.questions) {
    $allCandidates = data.candidates;
    $allQuestions = data.questions;
  } else {
    throw new Error('Could not load candidate or question data!');
  }
</script>

<h1>{$_('candidates.candidates')}</h1>

{#each $candidateRankings as { match, candidate }}
  <CandidateRankingListing ranking={match} {candidate} />
{/each}
