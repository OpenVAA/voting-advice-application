<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidates, candidateRankings} from '$lib/utils/stores';
  import {CandidateDetailsCard} from '$lib/components/candidates';

  let candidate: CandidateProps | undefined;
  let ranking: RankingProps | undefined;

  $: if ($page.params.candidateId) {
    const id = '' + $page.params.candidateId;
    // First, check if we have a ranking for the candidate,
    // which contains the Candidate object
    if ($candidateRankings.length > 0) {
      const result = $candidateRankings.find((r) => '' + r.candidate.id === id);
      if (result) {
        candidate = result.candidate;
        ranking = result.match;
      }
    }
    // If not, try to find the candidate
    if (!candidate) {
      candidate = $candidates.find((c) => '' + c.id === id);
    }
  }
</script>

{#if candidate}
  <CandidateDetailsCard {candidate} {ranking} />
{:else}
  {$_('candidates.notFound')}
{/if}
