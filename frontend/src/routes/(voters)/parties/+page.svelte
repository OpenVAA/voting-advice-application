<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {EntityCard} from '$lib/components/entityCard';
  import type {PageServerData} from './$types';

  export let data: PageServerData;

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<div class="flex w-full flex-grow flex-col items-center justify-start bg-base-300 p-lg pb-[3.5rem]">
  <div class="w-full max-w-xl">
    <h1 class="my-lg">{$_('parties.parties')}</h1>
    <div role="feed" class="-mx-md grid grid-cols-1 gap-md" aria-label={$_('parties.parties')}>
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
