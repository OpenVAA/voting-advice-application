<script lang="ts">
  import {t} from '$lib/i18n';
  import {candidateRankings} from '$lib/utils/stores';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityList} from '$lib/components/entityList';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {StretchBackground} from '$lib/components/stretchBackground';
  import {BasicPage} from '$lib/templates/basicPage';

  let itemsShown = 0;
</script>

<BasicPage title={$t('viewTexts.yourCandidatesTitle')}>
  <!-- <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('viewTexts.questionsTip')}
  </svelte:fragment> -->

  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('results.heroEmoji')} />
  </svelte:fragment>

  <svelte:fragment slot="banner">
    <Button
      href={$getRoute(Route.Help)}
      variant="icon"
      icon="help"
      text={$t('actionLabels.help')} />
    <Button
      on:click={() => console.info('Show favourites')}
      variant="icon"
      icon="list"
      text={$t('actionLabels.yourList')} />
  </svelte:fragment>

  <p class="text-center">
    {$t('viewTexts.yourCandidatesDescription', {
      numCandidates: $candidateRankings?.length,
      filters: 'filters'
    })}
  </p>

  <StretchBackground padding="medium" bgColor="base-300" toBottom>
    <h2 class="mb-lg mt-xl">
      {$t('results.candidatesShown', {numShown: itemsShown})}
      <span class="font-normal text-secondary"
        >{$t('results.candidatesTotal', {numTotal: $candidateRankings.length})}</span>
    </h2>
    <EntityList
      bind:itemsShown
      rankings={$candidateRankings}
      actionCallBack={({id}) => $getRoute({route: Route.ResultCandidate, id})}
      class="mb-lg" />
  </StretchBackground>
</BasicPage>
