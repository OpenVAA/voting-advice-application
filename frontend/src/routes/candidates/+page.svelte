<script>
	import CandidateListing from '../../components/CandidateListing.svelte';
	export let data;
    let candidates = data ? Object.values(data) : null;
</script>

<h1>Candidates</h1>

{#each candidates as candidate}
    <CandidateListing candidate={candidate} />
{:else}
    <p>No candidates found</p>
{/each}