<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {EntityCard} from '$lib/components/entityCard';
  import {goto} from '$app/navigation';

  export let data;
  let candidates: any[any] | [];

  if (data?.candidates) {
    candidates = data.candidates ? Object.values(data.candidates) : null;
  }
</script>

<div class="bg-primary">
  <div class="p-5">
    <h1 class="ml-2.5 mt-14 text-center text-3xl font-medium leading-6 text-gray-500">
      {$_('candidates.candidates')}
    </h1>
    <p>These are the candidates in your constituency. The best matches are first on the list.</p>
  </div>
  <div role="feed" class="grid grid-cols-1 gap-4" aria-label={$_('candidates.candidates')}>
    {#each candidates as candidate, i}
      <EntityCard
        on:click={() => goto(`${$page.url.pathname}/${candidate.id}`)}
        ariaPosinset={i + 1}
        ariaSetsize={candidates.length}
        title={GetFullNameInOrder(candidate.attributes.firstName, candidate.attributes.lastName)}
        photoSrc="/images/candidate-photo.png"
        id={candidate.id}
        listText={candidate?.attributes?.party?.data?.attributes.shortName}
        electionSymbol={Math.floor(Math.random() * 1000).toString()} />
    {:else}
      <p>{$_('candidates.notFound')}</p>
    {/each}
  </div>
</div>
