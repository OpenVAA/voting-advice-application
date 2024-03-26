<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {candidateRankings, settings} from '$lib/utils/stores';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {
    candidateFilters,
    filteredCandidateRankings,
    initCandidateFilters,
    resetCandidateFilters
  } from '$lib/utils/filters';
  import {Button} from '$lib/components/button';
  import {EntityList} from '$lib/components/entityList';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {StretchBackground} from '$lib/components/stretchBackground';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Modal} from '$lib/components/modal';
  import {Tabs} from '$lib/components/tabs';
  import {EntityFilters} from '$lib/components/entityFilters';
  import type {PageData} from '../$types';
  import {Icon} from '$lib/components/icon';

  export let data: PageData;

  // Items on the list
  let activeIndex = 0;

  // Which entity sections to show
  const sections = $settings.results.sections as EntityType[];
  if (!sections?.length) error(500, 'No sections to show');

  // Exports from Modal
  let openFiltersModal: () => void;
  let closeFiltersModal: () => void;

  // Open filters dialog and init filters
  function openFilters() {
    if (!$candidateFilters) initCandidateFilters(data.parties, [...data.infoQuestions]);
    openFiltersModal();
  }

  // Reset and close the filters dialog
  function resetFilters() {
    resetCandidateFilters();
    closeFiltersModal();
  }

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

  <StretchBackground padding="medium" bgColor="base-300" toBottom class="min-h-[75vh]">
    <!-- We need to add mx-10 below to match the margins to the basic page margins, except for the EntityList components which we want to give more width -->

    {#if sections.length > 1}
      <Tabs
        tabs={sections.map((entityType) => $t(`common.${entityType}.plural`))}
        bind:activeIndex
        class="mx-10" />
    {/if}

    {#if sections[activeIndex] === 'candidate'}
      <div class="mx-10 mt-md">
        <h2 class="mb-md">
          {$t('results.candidatesShown', {numShown: $filteredCandidateRankings.length})}
          {#if $filteredCandidateRankings.length !== $candidateRankings.length}
            <span class="font-normal text-secondary"
              >{$t('results.candidatesTotal', {numTotal: $candidateRankings.length})}</span>
          {/if}
        </h2>

        <div class="mb-md flex flex-row">
          <Button
            on:click={openFilters}
            color={$candidateFilters?.group.active ? 'warning' : undefined}
            icon="filter"
            iconPos="left"
            class="!w-auto"
            text={$candidateFilters?.group.active
              ? $t('components.entityFilters.filtersActive', {
                  numActiveFilters:
                    $candidateFilters.group.filters.filter((f) => f.active).length ?? 0
                })
              : $t('components.entityFilters.filterButtonLabel')} />
          <!-- 
            <Button 
              on:click={() => console.warn('Not implemented yet')}
              icon="sort"
              iconPos="left"
              class="!w-auto grow"
              text="Sort results"/>
            <Button 
              on:click={() => console.warn('Not implemented yet')}
              variant="icon"
              icon="search"
              text="Search results"/>
          -->
        </div>
      </div>

      {#if $filteredCandidateRankings.length === 0 && $candidateRankings.length > 0}
        <button
          class="my-lg flex flex-col items-center text-center text-secondary"
          on:click={openFilters}>
          <Icon name="info" />
          {$t('components.entityFilters.noResults')}
        </button>
      {/if}

      <EntityList
        rankings={$filteredCandidateRankings}
        actionCallBack={({id}) => $getRoute({route: Route.ResultCandidate, id})}
        class="mb-lg" />
    {:else if sections[activeIndex] === 'party'}
      <div class="mx-10">
        <h2 class="mb-lg mt-xl">
          {$t('results.partiesShown', {numShown: $page.data.parties.length})}
        </h2>
      </div>

      <EntityList
        entities={$page.data.parties}
        actionCallBack={({id}) => $getRoute({route: Route.ResultParty, id})}
        class="mb-lg" />
    {/if}
  </StretchBackground>
</BasicPage>

<!-- We need to keep the filter components outside the tabs so that the state of the filterGroup retained between tab switching -->

{#if sections.includes('candidate')}
  <Modal
    title="Filters"
    boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
    bind:openModal={openFiltersModal}
    bind:closeModal={closeFiltersModal}>
    {#if $candidateFilters}
      <EntityFilters filters={$candidateFilters.filters} targets={$candidateRankings} />
    {/if}
    <div class="flex w-full flex-col items-center" slot="actions">
      <Button
        on:click={closeFiltersModal}
        text={$t('components.entityFilters.applyAndClose')}
        variant="main" />
      <Button
        on:click={resetFilters}
        color="warning"
        disabled={!$candidateFilters?.group.active}
        text={$t('components.entityFilters.reset')} />
    </div>
  </Modal>
{/if}
