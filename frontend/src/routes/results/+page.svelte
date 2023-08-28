<script lang="ts">
  import {_} from 'svelte-i18n';
  import {onMount} from 'svelte';
  import {derived, type Readable} from 'svelte/store';
  import type {PageData} from './$types';
  import {
    answeredQuestions,
    allCandidates,
    allQuestions,
    candidateMatches
  } from '$lib/utils/stores';
  import {matchCandidates} from '$lib/utils/matching';
  import CandidateRankingListing from '$lib/components/CandidateRankingListing.svelte';
  import type {Match} from '$lib/vaa-matching';
  import type {CandidateProps} from '$lib/components/CandidateDetailsCard.type';
  import type {RankingProps} from '$lib/components/CandidateRanking.type';

  export let data: PageData;

  if (data?.candidates && data?.questions) {
    $allCandidates = data.candidates;
    $allQuestions = data.questions;
  } else {
    throw new Error('Could not load candidate or question data!');
  }

  // We need to call these only onMount because the localStorage-based stores will
  // not be updated earlier (they need browser to work)
  onMount(() => {
    $candidateMatches = matchCandidates($allQuestions, $answeredQuestions, $allCandidates);
  });

  // Currently, it's quite silly that we need to separate these two, but when the
  // vaa-data model integration is complete, the proper Candidate object will be
  // contained in the Match objects themselves.
  const rankings: Readable<{match: RankingProps; candidate: CandidateProps}[]> = derived(
    [candidateMatches, allCandidates],
    ([matches, candidates]) => {
      const out = [];
      for (const match of $candidateMatches) {
        const candidate = $allCandidates.find(
          (c) => 'id' in match.entity && c.id === match.entity.id
        );
        if (candidate) {
          out.push({match: match as RankingProps, candidate});
        }
      }
      return out;
    }
  );
</script>

<h1>{$_('candidates.candidates')}</h1>

{#each $rankings as { match, candidate }}
  <CandidateRankingListing ranking={match} {candidate} />
{/each}
