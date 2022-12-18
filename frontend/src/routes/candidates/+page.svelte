<script>
    import { _ } from 'svelte-i18n'
	import CandidateListing from '../../components/CandidateListing.svelte';
	export let data;
    // TODO: Define proper candidate data structure
    let candidates = data ? Object.values(data) : null;
</script>

<h1 class="text-3xl font-medium ml-2.5 mt-14 leading-6 text-gray-500">{$_('candidates.candidates')}</h1>

{#each candidates as candidate}
    <CandidateListing id={candidate.id} candidate={candidate.attributes} />
{:else}
    <p>{$_('candidates.notFound')}</p>
{/each}