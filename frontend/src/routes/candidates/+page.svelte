<script>
	import {getData} from '../../api/getData';
	import CandidateListing from '../../components/CandidateListing.svelte';

	const fetchDataFromBackend = (async () => {
		// TODO: Quick test 
		let data = await getData('api/candidates?populate=*');
		return data.data;
	})();
</script>

{#await fetchDataFromBackend}
	<p>...waiting</p>
{:then data}
	{#each data as candidate}
		<CandidateListing candidate={candidate.attributes} />
	{:else}
		<p>No candidates found</p>
	{/each}
{:catch error}
	<p>An error occurred!</p>
{/await}
