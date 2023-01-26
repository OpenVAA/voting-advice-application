<script>
  import {_} from 'svelte-i18n';
  export let data;
  let parties = data ? Object.values(data) : null;
</script>

<h1 class="ml-2.5 mt-14 text-3xl font-medium leading-6 text-gray-500">{$_('parties.parties')}</h1>

{#each parties as party}
  <section class="w-256 card m-8 bg-base-100 shadow-xl">
    <a href={`/parties/${party.id}`}>
      <h1>{party.attributes.party}</h1>
    </a>
  </section>
{:else}
  <p>{$_('parties.notFound')}</p>
{/each}
