<script>
	import {getData} from '../../api/getData';

	const fetchDataFromBackend = (async () => {
		// TODO: Quick test 
		let data = await getData('api/candidates');
		return data.data;
	})();
</script>

{#await fetchDataFromBackend}
	<p>...waiting</p>
{:then data}
	{#each data as candidate}
		<p>Candidate: {candidate.attributes.firstName} {candidate.attributes.lastName}</p>
	{:else}
		<p>No candidates found</p>
	{/each}
{:catch error}
	<p>An error occurred!</p>
{/await}
