<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidates} from '$lib/utils/stores';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {EntityCard} from '$lib/components/entityCard';
  import {goto} from '$app/navigation';

  const urlRoot = $page.url.pathname.replace(/\/$/, '');
</script>

<div class="flex h-full flex-col items-center justify-center bg-primary">
  <div class="max-w-xl">
    <div class="p-5">
      <h1 class="ml-2.5 mt-14 text-center text-3xl font-medium leading-6 text-gray-500">
        {$_('candidates.candidates')}
      </h1>
    </div>
    <div role="feed" class="grid grid-cols-1 gap-4" aria-label={$_('candidates.candidates')}>
      {#each $candidates as { id, firstName, lastName, party, electionSymbol }, i}
        <EntityCard
          on:click={() => goto(`${urlRoot}/${id}`)}
          ariaPosinset={i + 1}
          ariaSetsize={$candidates.length}
          title={GetFullNameInOrder(firstName, lastName)}
          imgSrc="/images/candidate-photo.png"
          {id}
          listText={party?.name ?? ''}
          {electionSymbol} />
      {:else}
        <p>{$_('candidates.notFound')}</p>
      {/each}
    </div>
  </div>
</div>