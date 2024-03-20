<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {candidateRankings, settings} from '$lib/utils/stores';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityList} from '$lib/components/entityList';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {StretchBackground} from '$lib/components/stretchBackground';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Tabs} from '$lib/components/tabs';

  let activeIndex = 0;
  let itemsShown = 0;

  // Which entity sections to show
  const sections = $settings.results.sections as EntityType[];
  if (!sections?.length) error(500, 'No sections to show');

  // TODO: Enable party rankings
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
    {#if sections.length > 1}
      <Tabs
        tabs={sections.map((entityType) => $t(`common.${entityType}.plural`))}
        bind:activeIndex />
    {/if}

    {#if sections[activeIndex] === 'candidate'}
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
    {:else if sections[activeIndex] === 'party'}
      <h2 class="mb-lg mt-xl">
        {$t('results.partiesShown', {numShown: itemsShown})}
        <span class="font-normal text-secondary"
          >{$t('results.partiesTotal', {numTotal: $page.data.parties.length})}</span>
      </h2>
      <EntityList
        bind:itemsShown
        entities={$page.data.parties}
        actionCallBack={({id}) => $getRoute({route: Route.ResultParty, id})}
        class="mb-lg" />
    {/if}
  </StretchBackground>
</BasicPage>
