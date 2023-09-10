<script>
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {EntityCard} from '$lib/components/entityCard';
  import {_} from 'svelte-i18n';
  export let data;
  let parties = data.parties ? Object.values(data.parties) : [];
</script>

<div class="bg-primary">
  <div class="p-5">
    <h1 class="ml-2.5 mt-14 text-center text-3xl font-medium leading-6 text-gray-500">
      {$_('parties.parties')}
    </h1>
    <div role="feed" class="grid grid-cols-1 gap-4" aria-label={$_('candidates.candidates')}>
      {#each parties as party, i}
        <EntityCard
          on:click={() => goto(`${$page.url.pathname}/${party.id}`)}
          ariaPosinset={i + 1}
          ariaSetsize={parties.length}
          title={party.attributes.name}
          id={party.id}
          listText={party.attributes.shortName} />
      {:else}
        <p>{$_('parties.notFound')}</p>
      {/each}
    </div>
  </div>
</div>
