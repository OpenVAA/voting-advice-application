<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidateRankings} from '$lib/utils/stores';
  import {CandidateDetailsCard} from '$lib/components/candidates';

  let candidate: CandidateProps | undefined;
  let ranking: RankingProps | undefined;

  // This block is reactive, although currently it's not necesary.
  // If, however, we add a way to navigate between candidates, then
  // this page will not update if the route param is changed unless
  // we check for it in a reactive way
  $: {
    const id = '' + $page.params.candidateId;
    // First, check if we have a ranking for the candidate,
    // which contains the Candidate object
    // TODO: We could disallow access to this page if there are no
    // $candidateRankings by moving the redirect check currently in
    // ../+page.svelte to ../+layout.svelte
    if ($candidateRankings.length > 0) {
      const result = $candidateRankings.find((r) => '' + r.candidate.id === id);
      if (result) {
        candidate = result.candidate;
        ranking = result.match;
      }
    }
    // If not, try to find the candidate
    if (!candidate) {
      candidate = $page.data.candidates.find((c) => '' + c.id === id);
    }
  }
</script>

{#if candidate}
  <div class="flex w-full flex-grow flex-col items-center bg-base-300 lg:p-md lg:pb-0">
    <div class="w-full max-w-xl flex-grow rounded-t-lg bg-base-100 pb-[3.5rem] lg:shadow-xl">
      <CandidateDetailsCard {candidate} {ranking} />
    </div>
  </div>
{:else}
  {$_('candidates.notFound')}
{/if}
