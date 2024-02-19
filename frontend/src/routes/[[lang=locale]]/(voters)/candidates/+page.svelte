<script lang="ts">
  import {t} from '$lib/i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {EntityCard} from '$lib/components/entityCard';
  import {goto} from '$app/navigation';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<div class="flex w-full flex-grow flex-col items-center justify-start bg-base-300 p-lg pb-[3.5rem]">
  <div class="w-full max-w-xl">
    <h1 class="my-lg">{$t('candidates.candidates')}</h1>
    <!-- The -mx-md below is there to extend the cards a bit over the normal padding,
         match-w-xl:mx-0 cancels this on screens where the max-width comes into effect. -->
    <div
      role="feed"
      class="-mx-md grid grid-cols-1 gap-md match-w-xl:mx-0"
      aria-label={$t('candidates.candidates')}>
      {#each data.candidates as { id, firstName, lastName, party, electionSymbol }, i}
        <EntityCard
          on:click={() => goto(getRoute({route: Route.Candidate, id}))}
          ariaPosinset={i + 1}
          ariaSetsize={data.candidates.length}
          title={GetFullNameInOrder(firstName, lastName)}
          {id}
          listText={party?.name ?? ''}
          {electionSymbol} />
      {:else}
        <p>{$t('candidates.notFound')}</p>
      {/each}
    </div>
  </div>
</div>
