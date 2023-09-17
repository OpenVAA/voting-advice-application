<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {EntityCard} from '$lib/components/entityCard';
  import type {PageServerData} from './$types';

  export let data: PageServerData;

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<div class="bg-primary">
  <div class="p-5 pb-12">
    <h1 class="ml-2.5 mt-14 text-center text-3xl font-medium leading-6 text-gray-500">
      {$_('parties.parties')}
    </h1>
    <div role="feed" class="grid grid-cols-1 gap-4" aria-label={$_('parties.parties')}>
      {#each data.parties as { id, name, shortName }, i}
        <EntityCard
          on:click={() => goto(`${urlRoot}/${id}`)}
          ariaPosinset={i + 1}
          ariaSetsize={data.parties.length}
          title={name}
          {id}
          listText={shortName} />
      {:else}
        <p>{$_('parties.notFound')}</p>
      {/each}
    </div>
  </div>
</div>
