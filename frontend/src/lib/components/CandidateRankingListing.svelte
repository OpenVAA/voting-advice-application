<script lang="ts">
  import CandidateListing from '$lib/components/CandidateListing.svelte';
  import type {CandidateProps} from './CandidateDetailsCard.type';
  import type {RankingProps} from './CandidateRanking.type';
  export let ranking: RankingProps;
  export let candidate: CandidateProps;
</script>

<section class="w-256 card m-8 bg-base-100 shadow-xl">
  <p>Compatibility: {ranking.score}</p>
  <CandidateListing {candidate} />
</section>
