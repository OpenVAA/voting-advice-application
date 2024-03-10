<script lang="ts">
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityCard} from '$lib/components/entityCard';
  import {BasicPage} from '$lib/templates/basicPage';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<BasicPage title={$t('parties.parties')} mainClass="bg-base-300">
  <!-- <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('viewTexts.questionsTip')}
  </svelte:fragment> -->

  <svelte:fragment slot="banner">
    <Button href="/help" variant="icon" icon="help" text={$t('actionLabels.help')} />
  </svelte:fragment>

  <p class="text-center">
    {$t('parties.ingress')}
  </p>

  <!-- The -mx-md and w-[calc(100%+20rem/16)] below are there to extend the cards a bit over 
       the normal padding, match-w-xl: classes cancel this on screens where the max-width 
       comes into effect. TODO: Define the calculated width as a predefined utility class 
       that uses the same md definition. -->
  <div
    role="feed"
    class="-mx-md grid w-[calc(100%+20rem/16)] grid-cols-1 gap-md match-w-xl:mx-0 match-w-xl:w-full"
    aria-label={$t('parties.parties')}>
    {#each data.parties as { id, name, shortName }, i}
      <EntityCard
        on:click={() => goto($getRoute({route: Route.Party, id}))}
        ariaPosinset={i + 1}
        ariaSetsize={data.parties.length}
        title={name}
        {id}
        listText={shortName} />
    {:else}
      <p>{$t('parties.notFound')}</p>
    {/each}
  </div>
</BasicPage>
