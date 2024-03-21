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
  let candidates: CandidateProps[];
  $: candidates = data.candidates;
</script>

<BasicPage title={$t('candidates.candidates')}>
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

  <StretchBackground padding="medium" bgColor="base-300" toBottom>
    <h2 class="mb-lg mt-xl">
      {$t('candidates.candidatesShown', {numShown: itemsShown})}
      <span class="font-normal text-secondary"
        >{$t('candidates.candidatesTotal', {numTotal: candidates.length})}</span>
    </h2>
    <EntityList
      bind:itemsShown
      entities={candidates}
      actionCallBack={({id}) => $getRoute({route: Route.Candidate, id})}
      class="mb-lg" />
  </StretchBackground>
</BasicPage>
