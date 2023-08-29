<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidateRankings} from '$lib/utils/stores';
  import {
    CandidateDetailsCard,
    type CandidateProps,
    type RankingProps
  } from '$lib/components/candidates';

  let ranking: {candidate: CandidateProps; match: RankingProps} | undefined;

  $: if ($page.params.candidateId) {
    const id = '' + $page.params.candidateId;
    ranking = $candidateRankings.find((r) => '' + r.candidate.id === id);
  }
</script>

{#if ranking}
  <CandidateDetailsCard candidate={ranking.candidate} ranking={ranking.match} />
{:else}
  {$_('candidates.notFound')}
{/if}
