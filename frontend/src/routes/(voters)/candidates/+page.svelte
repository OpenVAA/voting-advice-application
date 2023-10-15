<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {PageServerData} from './$types';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {EntityCard} from '$lib/components/entityCard';
  import {BasicPage} from '$lib/components/basicPage';
  import {HelpIcon, ListIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';

  export let data: PageServerData;

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<BasicPage title={$_('candidates.candidates')}>
  <svelte:fragment slot="secondaryActions">
    <IconButton href="/list" aria-label={$page.data.appLabels.actionLabels.yourList}>
      <ListIcon />
    </IconButton>
    <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
      <HelpIcon />
    </IconButton>
  </svelte:fragment>

  <p class="text-center">{$_('candidates.allCandidatesDescription')}</p>

  <!-- TODO: Create a utility class to handle these full-width views -->
  <div
    class="-mx-lg -mb-safelgb flex w-screen flex-col items-center bg-base-300 px-md py-lg pb-safelgb">
    <div
      role="feed"
      class="grid w-full max-w-xl grid-cols-1 gap-md"
      aria-label={$_('candidates.candidates')}>
      {#each data.candidates as { id, firstName, lastName, party, electionSymbol }, i}
        <EntityCard
          on:click={() => goto(`${urlRoot}/${id}`)}
          ariaPosinset={i + 1}
          ariaSetsize={data.candidates.length}
          title={GetFullNameInOrder(firstName, lastName)}
          {id}
          listText={party?.name ?? ''}
          {electionSymbol} />
      {:else}
        <p>{$_('candidates.notFound')}</p>
      {/each}
    </div>
  </div>
</BasicPage>
