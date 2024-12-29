<!--@component

# Matching results or browse nominations page

Display the matching results or, if these are unavailable, all nominations for each election and entity type enabled in settings.

## Params

The nominations applicable to these elections and constituencies are shown. These are optional if they can be implied in `/(located)/+layout.ts`.
- `electionId`: One or more `Id`s.
- `constituencyId`: One or more `Id`s.

## Settings

- `results.showFeedbackPopup`: Whether to start the countdown for showing the feedback popup on this page.
- `results.cardContents`: The contents of the entity cards.
- `survey.showIn`: If the values include `resultsPopup`, start the countdown for showing the survey popup on this page.

## Tracking events

- `results_browse`
- `results_changeElection`
- `results_changeTab`
- `results_ranked`
-->

<script lang="ts">
  import { Election, type EntityType } from '@openvaa/data';
  import { type Snapshot } from '@sveltejs/kit';
  import { onMount } from 'svelte';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { StretchBackground } from '$lib/components/stretchBackground';
  import { type Tab, Tabs } from '$lib/components/tabs';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityList, EntityListControls } from '$lib/dynamic-components/entityList';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import Layout from '../../../../Layout.svelte';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answers,
    appSettings,
    entityFilters,
    getRoute,
    matches,
    resultsAvailable,
    selectedElections: elections,
    startEvent,
    startFeedbackPopupCountdown,
    startSurveyPopupCountdown,
    t
  } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Start countdowns and track events, set initial tab
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    startEvent($resultsAvailable ? 'results_ranked' : 'results_browse', {
      election: activeElectionId,
      entityType: activeEntityType,
      numAnswers: Object.keys($answers).length
    });
    if ($appSettings.results.showFeedbackPopup != null)
      startFeedbackPopupCountdown($appSettings.results.showFeedbackPopup);
    if ($appSettings.survey?.showIn && $appSettings.survey.showIn.includes('resultsPopup'))
      startSurveyPopupCountdown($appSettings.results.showSurveyPopup);
  });

  ////////////////////////////////////////////////////////////////////
  // Sections
  ////////////////////////////////////////////////////////////////////

  /** For use with the `Tabs` component */
  type EntityTab = { type: EntityType; label: string };

  /** The id of the currently active election, defaulting to the first or only election.  */
  let activeElectionId = $elections[0].id;
  /** A utility for easier access to the election object */
  let activeElection: Election;
  /** The currently active EntityType */
  let activeEntityType: EntityType | undefined;
  /** The results currently shown */
  let activeMatches: Array<MaybeWrappedEntityVariant> | undefined;
  /** The tabs for entity selection that are available for the active election */
  let entityTabs: Array<EntityTab>;

  // React to changes in activeElectionId to updadate entityTabs
  $: {
    entityTabs = Object.keys($matches[activeElectionId]).map((type) => ({
      type: type as EntityType,
      label: ucFirst($t(`common.${type as EntityType}.plural`))
    }));
    // Preserve current activeEntityType if it exists in the new tabs, otherwise use the first one available
    if (!activeEntityType || !(activeEntityType in $matches[activeElectionId])) activeEntityType = entityTabs[0]?.type;
    activeElection = $elections.find((e) => e.id === activeElectionId)!;
  }

  // Update the activeMatches when either the active election or entity type changes. If activeEntityType is undefined, this is due to an error
  $: {
    activeMatches = activeEntityType ? $matches[activeElectionId][activeEntityType] : undefined;
    setInitialEntityTab();
  }

  function handleElectionChange({ id }: Election): void {
    activeElectionId = id;
    startEvent('results_changeElection', { election: id });
  }

  function handleEntityTabChange({ tab }: { tab: Tab }): void {
    activeEntityType = (tab as EntityTab).type;
    startEvent('results_changeTab', { section: activeEntityType });
  }

  /** The initially selected tab, updated when the election is changed and when the snapshot is restored */
  let initialEntityTabIndex = 0;

  /** Set initial tab based on activeEntityType */
  function setInitialEntityTab(): void {
    const index = entityTabs.findIndex((tab) => tab.type === activeEntityType);
    initialEntityTabIndex = index === -1 ? 0 : index;
  }

  // Restore the currently open section when returning
  export const snapshot: Snapshot<{ activeElectionId: Id; activeEntityType?: EntityType }> = {
    capture: () => ({ activeElectionId, activeEntityType }),
    restore: (values) => {
      ({ activeElectionId, activeEntityType } = values);
    }
  };

  ////////////////////////////////////////////////////////////////////
  // Filters
  ////////////////////////////////////////////////////////////////////

  // This will hold the filtered entities returned by EntityListControls
  // TODO: Combine EntityListControls and List components into one
  let filteredEntities = new Array<MaybeWrappedEntityVariant>();
</script>

<Layout title={$resultsAvailable ? $t('results.title.results') : $t('results.title.browse')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.results.heroEmoji')} />
  </figure>

  <div class="mb-xl text-center">
    {#if $resultsAvailable}
      <p>{$t('dynamic.results.ingress.results')}</p>
    {:else}
      <p>
        {@html sanitizeHtml(
          $t('dynamic.results.ingress.browse', {
            questionsLink: `<a href="${$getRoute('Questions')}">${$t('results.ingress.questionsLinkText', {
              numQuestions: $appSettings.matching.minimumAnswers
            })}</a>`
          })
        )}
      </p>
    {/if}
    {#if $elections.length > 1}
      <p>{$t('dynamic.results.multipleElections')}</p>
    {/if}
  </div>

  <!-- Multi election selector
    TODO: Redesign layout -->
  {#if $elections.length > 1}
    <div class="-mt-md mb-lg grid gap-md">
      {#each $elections as election}
        <button
          class="btn px-lg"
          class:bg-base-300={activeElectionId === election.id}
          class:font-bold={activeElectionId === election.id}
          on:click={() => handleElectionChange(election)}>
          {election.shortName}
        </button>
      {/each}
    </div>

    {#if activeElection.info}
      <p class="text-center text-secondary">
        <Icon name="info" />
        {activeElection.info}
      </p>
    {/if}
  {/if}

  <StretchBackground padding="medium" bgColor="base-300" toBottom class="min-h-[75vh]">
    <!-- EntityType selector if there are multiple -->
    {#if Object.keys($matches[activeElectionId]).length > 1}
      <Tabs tabs={entityTabs} activeIndex={initialEntityTabIndex} onChange={handleEntityTabChange} />
    {/if}

    <!-- We need to add mx-10 below to match the margins to the basic page margins, except for the EntityList components which we want to give more width -->

    {#if activeEntityType}
      {#if activeMatches}
        {#key activeMatches}
          <h2 class="mx-10 mb-md mt-md">
            {$t(`results.${activeEntityType}.numShown`, { numShown: filteredEntities?.length })}
            {#if filteredEntities?.length !== activeMatches.length}
              <span class="font-normal text-secondary"
                >{$t('results.numTotal', { numTotal: activeMatches.length })}</span>
            {/if}
          </h2>
          <EntityListControls
            entities={activeMatches}
            onUpdate={(results) => (filteredEntities = results)}
            filterGroup={$entityFilters[activeElectionId][activeEntityType]}
            class="mx-10 mb-md" />
          <EntityList cards={filteredEntities.map((e) => ({ entity: e }))} class="mb-lg" />
        {/key}
      {:else}
        <Loading />
      {/if}
    {:else}
      <div class="py-lg text-center text-lg text-error">
        {$t('error.noNominations')}
      </div>
    {/if}
  </StretchBackground>
</Layout>
