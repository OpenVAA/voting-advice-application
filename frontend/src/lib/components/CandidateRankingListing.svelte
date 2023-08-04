<script>
  import CandidateListing from '$lib/components/CandidateListing.svelte';
  export let ranking;
  export let candidate;
</script>

<section class="w-256 card m-8 bg-base-100 shadow-xl">
  <p>{ranking.id}.</p>
  <p>Compatibility: {ranking.score}</p>
  <CandidateListing id={candidate?.id} candidate={candidate?.attributes} />
</section>
