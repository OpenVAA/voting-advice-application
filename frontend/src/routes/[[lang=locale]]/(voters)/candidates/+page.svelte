<script lang="ts">
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityCard} from '$lib/components/entityCard';
  import {BasicPage} from '$lib/templates/basicPage';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<BasicPage title={$t('candidates.candidates')} mainClass="bg-base-300">
  <!-- <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('viewTexts.questionsTip')}
  </svelte:fragment> -->

  <svelte:fragment slot="banner">
    <Button href="/help" variant="icon" icon="help" text={$t('actionLabels.help')} />
    <Button
      on:click={() => console.info('Show favourites')}
      variant="icon"
      icon="list"
      text={$t('actionLabels.yourList')} />
  </svelte:fragment>

  <p class="text-center">
    {$t('candidates.ingress')}
  </p>

  <!-- The -mx-md and w-[calc(100%+20rem/16)] below are there to extend the cards a bit over 
       the normal padding, match-w-xl: classes cancel this on screens where the max-width 
       comes into effect. TODO: Define the calculated width as a predefined utility class 
       that uses the same md definition. -->
  <div
    role="feed"
    class="-mx-md grid w-[calc(100%+20rem/16)] grid-cols-1 gap-md match-w-xl:mx-0 match-w-xl:w-full"
    aria-label={$t('candidates.candidates')}>
    {#each data.candidates as { id, firstName, lastName, party, electionSymbol }, i}
      <EntityCard
        on:click={() => goto($getRoute({route: Route.Candidate, id}))}
        ariaPosinset={i + 1}
        ariaSetsize={data.candidates.length}
        title={GetFullNameInOrder(firstName, lastName)}
        imgAlt={$t('candidate.portraitAlt')}
        {id}
        listText={party?.name ?? ''}
        {electionSymbol} />
    {:else}
      <p>{$t('candidates.notFound')}</p>
    {/each}
  </div>
</BasicPage>
