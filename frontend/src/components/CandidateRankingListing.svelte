<script>
    import CandidateListing from "./CandidateListing.svelte";
    export let ranking;
    export let candidate;
</script>

<section class="card w-256 bg-base-100 shadow-xl m-8">
    <p>{ranking.id}.</p>
    <p>Compatibility: {ranking.score}</p>
    <CandidateListing candidate={candidate} />
</section>