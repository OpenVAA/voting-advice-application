<script>
    import { _ } from 'svelte-i18n'
	export let data;
    let parties = data ? Object.values(data) : null;
</script>

<h1 class="text-3xl font-medium ml-2.5 mt-14 leading-6 text-gray-500">{$_('parties.parties')}</h1>

{#each parties as party}
    <section class="card w-256 bg-base-100 shadow-xl m-8">
        <a href={`/parties/${party.id}`}>
            <h1>{party.attributes.party}</h1>
        </a>
    </section>
{:else}
    <p>{$_('parties.notFound')}</p>
{/each}