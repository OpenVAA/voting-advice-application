<script>
  import {_} from 'svelte-i18n';
  import {candidateRankings} from '../../stores';
  import CandidateRankingListing from '../../components/CandidateRankingListing.svelte';
  export let data;
  let candidates = data.results ? Object.values(data.results) : [];

  let candidateRankingsValues;

  candidateRankings.subscribe((value) => {
    candidateRankingsValues = value;
  });
</script>

<h1>{$_('candidates.candidates')}</h1>

{#each candidateRankingsValues as ranking}
  <!--    The idea is that ranking algorithm will return a candidate id with a score-->
  <!--    We should map the candidate id to the actual candidate data from backend here-->
  <CandidateRankingListing
    {ranking}
    candidate={candidates.find((candidate) => candidate.id === ranking.id)} />
{/each}
