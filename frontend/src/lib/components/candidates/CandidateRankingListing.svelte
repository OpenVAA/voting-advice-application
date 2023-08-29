<script lang="ts">
  import CandidateListing from './CandidateListing.svelte';
  import type {CandidateProps} from './CandidateProps.type';
  import type {RankingProps} from './CandidateRanking.type';
  export let ranking: RankingProps;
  export let candidate: CandidateProps;
  export let href: string;
</script>

<section class="w-256 card m-8 bg-base-100 shadow-xl">
  <p>Compatibility: {ranking.score}</p>
  <CandidateListing {candidate} {href} />
</section>
