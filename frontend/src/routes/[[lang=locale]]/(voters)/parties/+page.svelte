<script lang="ts">
  import {t} from '$lib/i18n';
  import {goto} from '$app/navigation';
  import {EntityCard} from '$lib/components/entityCard';
  import {getRoute, Route} from '$lib/utils/navigation';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<div class="flex w-full flex-grow flex-col items-center justify-start bg-base-300 p-lg pb-[3.5rem]">
  <div class="w-full max-w-xl">
    <h1 class="my-lg">{$t('parties.parties')}</h1>
    <div role="feed" class="-mx-md grid grid-cols-1 gap-md" aria-label={$t('parties.parties')}>
      {#each data.parties as { id, name, shortName }, i}
        <EntityCard
          on:click={() => goto(getRoute({route: Route.Party, id}))}
          ariaPosinset={i + 1}
          ariaSetsize={data.parties.length}
          title={name}
          {id}
          listText={shortName} />
      {:else}
        <p>{$t('parties.notFound')}</p>
      {/each}
    </div>
  </div>
</div>
