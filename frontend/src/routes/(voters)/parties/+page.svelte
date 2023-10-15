<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import type {PageServerData} from './$types';
  import {EntityCard} from '$lib/components/entityCard';
  import {BasicPage} from '$lib/components/basicPage';
  import {HelpIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';

  export let data: PageServerData;

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<BasicPage title={$_('parties.parties')}>
  <svelte:fragment slot="secondaryActions">
    <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
      <HelpIcon />
    </IconButton>
  </svelte:fragment>

  <p class="text-center">{$_('parties.allPartiesDescription')}</p>

  <!-- TODO: Create a utility class to handle these full-width views -->
  <div
    class="-mx-lg -mb-safelgb flex w-screen flex-col items-center bg-base-300 px-md py-lg pb-safelgb">
    <div
      role="feed"
      class="grid w-full max-w-xl grid-cols-1 gap-md"
      aria-label={$_('parties.parties')}>
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
</BasicPage>
