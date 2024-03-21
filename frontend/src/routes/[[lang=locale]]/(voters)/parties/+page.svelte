<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityList} from '$lib/components/entityList';
  import {StretchBackground} from '$lib/components/stretchBackground';
  import {BasicPage} from '$lib/templates/basicPage';
  import type {PageServerData} from './$types';

  export let data: PageServerData;

  let itemsShown = 0;
  let parties: PartyProps[];
  $: parties = data.parties;
</script>

<BasicPage title={$t('parties.parties')}>
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

  <StretchBackground padding="medium" bgColor="base-300" toBottom>
    <h2 class="mb-lg mt-xl">
      {$t('parties.partiesShown', {numShown: itemsShown})}
      <span class="font-normal text-secondary"
        >{$t('parties.partiesTotal', {numTotal: parties.length})}</span>
    </h2>
    <EntityList
      bind:itemsShown
      entities={parties}
      actionCallBack={({id}) => $getRoute({route: Route.Party, id})}
      class="mb-lg" />
  </StretchBackground>
</BasicPage>
