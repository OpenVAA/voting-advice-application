<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {t} from '$lib/i18n';
  import {candidateFilters} from '$lib/utils/filters';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {candidateRankings, partyRankings, resultsAvailable, settings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {EntityList} from '$lib/components/entityList';
  import {EntityListControls} from '$lib/components/entityListControls';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {Loading} from '$lib/components/loading';
  import {StretchBackground} from '$lib/components/stretchBackground';
  import {Tabs} from '$lib/components/tabs';
  import {BasicPage} from '$lib/templates/basicPage';
  import {activeTab} from './page-stores';

  // Which entity sections to show
  const sections = $settings.results.sections as EntityType[];
  if (!sections?.length) error(500, 'No sections to show');

  let filteredCandidates: MaybeRanked<CandidateProps>[] = [];
  let filteredParties: MaybeRanked<PartyProps>[] = [];
</script>

<BasicPage title={$resultsAvailable ? $t('results.title.results') : $t('results.title.browse')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('results.heroEmoji')} />
  </svelte:fragment>

  <svelte:fragment slot="banner">
    {#if $settings.header.showHelp}
      <Button
        href={$getRoute(Route.Help)}
        variant="icon"
        icon="help"
        text={$t('actionLabels.help')} />
    {/if}
    <Button
      on:click={() => console.info('Show favourites')}
      variant="icon"
      icon="list"
      text={$t('actionLabels.yourList')} />
  </svelte:fragment>

  <p class="text-center">
    {$resultsAvailable ? $t('results.ingress.results') : $t('results.ingress.browse')}
  </p>

  <StretchBackground padding="medium" bgColor="base-300" toBottom class="min-h-[75vh]">
    <!-- We need to add mx-10 below to match the margins to the basic page margins, except for the EntityList components which we want to give more width -->

    {#if sections.length > 1}
      <Tabs
        tabs={sections.map((entityType) => $t(`common.${entityType}.plural`))}
        bind:activeIndex={$activeTab}
        class="mx-10" />
    {/if}

    <!-- Candidates -->
    {#if sections[$activeTab] === 'candidate'}
      {#await Promise.all([$candidateRankings, $candidateFilters])}
        <Loading showLabel class="mt-lg" />
      {:then [allCandidates, candidateFilters]}
        <h2 class="mx-10 mb-md mt-md">
          {$t('results.candidatesShown', {numShown: filteredCandidates.length})}
          {#if filteredCandidates.length !== allCandidates.length}
            <span class="font-normal text-secondary"
              >{$t('results.candidatesTotal', {numTotal: allCandidates.length})}</span>
          {/if}
        </h2>
        {#if candidateFilters}
          <EntityListControls
            contents={allCandidates}
            filterGroup={candidateFilters}
            bind:output={filteredCandidates}
            class="mx-10 mb-md" />
        {/if}
        <EntityList
          contents={filteredCandidates}
          actionCallBack={({id}) => $getRoute({route: Route.ResultCandidate, id})}
          class="mb-lg" />
      {/await}

      <!-- Parties -->
    {:else if sections[$activeTab] === 'party'}
      {#await $partyRankings}
        <Loading showLabel class="mt-lg" />
      {:then allParties}
        <h2 class="mx-10 mb-md mt-md">
          {$t('results.partiesShown', {numShown: filteredParties.length})}
          {#if filteredParties.length !== allParties.length}
            <span class="font-normal text-secondary"
              >{$t('results.partiesTotal', {numTotal: allParties.length})}</span>
          {/if}
        </h2>
        <EntityListControls
          contents={allParties}
          bind:output={filteredParties}
          class="mx-10 mb-md" />
        <EntityList
          contents={filteredParties}
          actionCallBack={({id}) => $getRoute({route: Route.ResultParty, id})}
          class="mb-lg" />
      {/await}
    {/if}
  </StretchBackground>
</BasicPage>
