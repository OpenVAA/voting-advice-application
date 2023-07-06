<script>
  import {_} from 'svelte-i18n';
  export let data;
  let parties = data.parties ? Object.values(data.parties) : null;
</script>

<h1 class="ml-2.5 mt-14 text-3xl font-medium leading-6 text-gray-500">{$_('parties.parties')}</h1>

{#if parties}
  {#each parties as party}
    <section class="w-256 card m-8 bg-base-100 shadow-xl">
      <a href={`/parties/${party.id}`}>
        <h1>{party.attributes.name}</h1>
      </a>
    </section>
  {/each}
{:else}
  <p>{$_('parties.notFound')}</p>
{/if}
