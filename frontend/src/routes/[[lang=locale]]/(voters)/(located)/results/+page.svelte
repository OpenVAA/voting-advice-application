<!--@component

# Matching results or browse nominations page

Display the matching results or, if these are unavailable, all nominations for each election and entity type enabled in settings. Entities are opened in a `Drawer` modal unless they're opened in new tabs.

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
  import { type EntityType } from '@openvaa/data';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { beforeNavigate, pushState } from '$app/navigation';
  import { page } from '$app/stores';
  import AccordionSelect from '$lib/components/accordionSelect/AccordionSelect.svelte';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { type Tab, Tabs } from '$lib/components/tabs';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDetailsDrawer, type EntityDetailsDrawerProps } from '$lib/dynamic-components/entityDetails';
  import { EntityList, EntityListControls } from '$lib/dynamic-components/entityList';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { logDebugError } from '$lib/utils/logger';
  import { parseParams, ROUTE } from '$lib/utils/route';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import { DELAY } from '$lib/utils/timing';
  import MainContent from '../../../MainContent.svelte';
  import type { Id } from '@openvaa/core';
  import type { Election } from '@openvaa/data';
  import { Input } from '$lib/components/input';
  import { assertTranslationKey } from '$lib/i18n/utils';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answers,
    dataRoot,
    entityFilters,
    matches,
    resultsAvailable,
    selectedElections: elections,
    startEvent,
    shouldShowFinished,
    startFinishedCountdown,
    track,
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
    // if ($appSettings.results.showFeedbackPopup != null)
    //   startFeedbackPopupCountdown($appSettings.results.showFeedbackPopup);
    // if ($appSettings.survey?.showIn && $appSettings.survey.showIn.includes('resultsPopup'))
    //   startSurveyPopupCountdown($appSettings.results.showSurveyPopup);
    startFinishedCountdown();
  });

  ////////////////////////////////////////////////////////////////////
  // Sections
  ////////////////////////////////////////////////////////////////////

  /** For use with the `Tabs` component */
  type EntityTab = { type: EntityType; label: string };

  /** The id of the currently active election */
  let activeElectionId: Id | undefined;
  /** A utility for easier access to the election object */
  let activeElection: Election;
  /** The currently active EntityType */
  let activeEntityType: EntityType | undefined;
  /** The results currently shown */
  let activeMatches: Array<MaybeWrappedEntityVariant> | undefined;
  /** The tabs for entity selection that are available for the active election */
  let entityTabs: Array<EntityTab>;
  /** The initially selected tab, updated when the election is changed and when the snapshot is restored */
  let initialEntityTabIndex = 0;

  // Pre-select election if there’s only one
  if ($elections.length === 1) activeElectionId = $elections[0].id;

  // React to changes in activeElectionId to updadate entityTabs
  $: if (activeElectionId) {
    entityTabs = Object.keys($matches[activeElectionId]).map((type) => ({
      type: type as EntityType,
      label: ucFirst($t(`common.${type as EntityType}.plural`))
    }));
    // Preserve current activeEntityType if it exists in the new tabs, otherwise use the first one available
    if (!activeEntityType || !(activeEntityType in $matches[activeElectionId])) activeEntityType = entityTabs[0]?.type;
    activeElection = $elections.find((e) => e.id === activeElectionId)!;
  }

  // Update the activeMatches when either the active election or entity type changes. If activeEntityType is undefined, this is due to an error
  $: if (activeElectionId) {
    activeMatches = activeEntityType ? $matches[activeElectionId][activeEntityType] : undefined;
    setInitialEntityTab();
  }

  /** Set initial tab based on activeEntityType */
  function setInitialEntityTab(): void {
    const index = entityTabs.findIndex((tab) => tab.type === activeEntityType);
    initialEntityTabIndex = index === -1 ? 0 : index;
  }

  function getName(e: unknown): string {
    return (e as Election).name;
  }

  ////////////////////////////////////////////////////////////////////
  // Handle selections
  ////////////////////////////////////////////////////////////////////

  function handleElectionChange(details: { option: unknown }): void {
    const { id } = details.option as Election;
    activeElectionId = id;
    startEvent('results_changeElection', { election: id });
  }

  function handleEntityTabChange({ tab }: { tab: Tab }): void {
    activeEntityType = (tab as EntityTab).type;
    startEvent('results_changeTab', { section: activeEntityType });
  }

  ////////////////////////////////////////////////////////////////////
  // Open entity details in a Drawer
  ////////////////////////////////////////////////////////////////////

  beforeNavigate(({ cancel, to }) => {
    if (to?.route.id !== ROUTE.ResultEntity) return;
    const { entityType, entityId, nominationId } = parseParams(to);
    if (!entityType || !entityId || !nominationId || Array.isArray(nominationId)) return;
    setTimeout(() => {
      $shouldShowFinished = true;
    }, 1000);
    pushState(to.url, {
      resultsShowEntity: {
        entityType: entityType as EntityType,
        entityId,
        nominationId
      }
    });
    cancel();
  });

  function getDrawerProps(opts: {
    entityType: EntityType;
    entityId: Id;
    nominationId?: Id;
  }): EntityDetailsDrawerProps | undefined {
    try {
      return {
        entity: getEntityAndTitle({
          dataRoot: $dataRoot,
          matches: $matches,
          ...opts
        }).entity
      };
    } catch (e) {
      // TODO: Show a notification to the user
      logDebugError(
        `Could not get entity details for ${opts.entityType} ${opts.entityId} with nomination ${opts.nominationId ?? '-'}. Error: ${e instanceof Error ? e.message : '-'}`
      );
      return undefined;
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Filters
  ////////////////////////////////////////////////////////////////////

  // This will hold the filtered entities returned by EntityListControls
  // TODO: Combine EntityListControls and List components into one
  let filteredEntities = new Array<MaybeWrappedEntityVariant>();

  let answer2: string | undefined;
  let answerSaved = false;

  function saveAnswer() {
    track('results_finished_answer', { questionIndex: 2, answer: answer2 });
    answerSaved = true;
  }
</script>

{#if $page.state.resultsShowEntity}
  {@const props = getDrawerProps($page.state.resultsShowEntity)}
  {#key props}
    {#if props}
      <EntityDetailsDrawer {...props} />
    {/if}
  {/key}
{/if}

<MainContent title={$resultsAvailable ? $t('results.title.results') : $t('results.title.browse')}>
  <!-- <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.results.heroEmoji')} />
  </figure> -->

  <div class="mb-xl text-center">
    {#if $shouldShowFinished}
      <div class="text-lg" transition:slide={{ duration: DELAY.sm }}>
        <p class="text-success">{$t('results.finished.intro')}</p>
        <!-- <p>{$t('results.finished.question1')}</p>
        <div class="my-md gap-md flex justify-center">
          {#each ['yes', 'no'] as option}
            <label class="label gap-sm text-md flex-col">
              <input
                type="radio"
                class="radio-primary radio"
                name="finished-question-1"
                value={option}
                on:click={() => saveAnswer(1)}
                bind:group={answer1} />
              {$t(assertTranslationKey(`results.finished.${option}`))}
            </label>
          {/each}
        </div> -->
        <p>{$t('results.finished.question2')}</p>
        {#if !answerSaved}
          <div class="my-md flex justify-center gap-md">
            {#each Array.from({ length: 5 }, (_, i) => i + 1) as option}
              <label class="label flex-col gap-sm text-md">
                <input
                  type="radio"
                  class="radio-primary radio"
                  name="finished-question-2"
                  value={option}
                  bind:group={answer2} />
                {option}
              </label>
            {/each}
          </div>
          <button class="btn btn-primary" on:click={saveAnswer} disabled={!answer2}>
            {$t('results.finished.submit')}
          </button>
        {:else}
          <p class="text-primary">{$t('results.finished.outro')}</p>
        {/if}
      </div>
    {:else}
      <p>{$t('dynamic.results.ingress.results')}</p>
    {/if}
    <!-- {#if $resultsAvailable}
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
    {/if} -->
  </div>

  <!-- Multi election selector -->
  {#if $dataRoot.elections.length > 1}
    {@const activeIndex = $elections.findIndex((e) => e.id === activeElectionId)}
    <AccordionSelect
      options={$elections}
      {activeIndex}
      labelGetter={getName}
      onChange={handleElectionChange}
      class="-mt-md mb-lg" />

    {#if activeElection?.info}
      <p transition:slide={{ duration: DELAY.sm }} class="text-center text-sm text-secondary">
        {activeElection.info}
      </p>
    {/if}
  {/if}

  <!-- Set min-h-[120vh] to prevent scrolling changes when filters yield no results 
    TODO: When we get nice transitions for the list items, check whether this is still necessary -->
  <div slot="fullWidth" class="flex min-h-[120vh] flex-col items-center bg-base-300">
    {#if activeElectionId}
      <div class="w-full max-w-xl pb-safelgb pl-safemdl pr-safemdr match-w-xl:px-0">
        <!-- EntityType selector if there are multiple -->
        {#if Object.keys($matches[activeElectionId]).length > 1}
          <Tabs tabs={entityTabs} activeIndex={initialEntityTabIndex} onChange={handleEntityTabChange} />
        {/if}

        <!-- We need to add mx-10 below to match the margins to the basic page margins, except for the EntityList components which we want to give more width -->

        {#if activeEntityType}
          {#if activeMatches}
            {#key activeMatches}
              <!-- <h3 class="my-lg mx-10 text-xl">
                {$t(`results.${activeEntityType}.numShown`, { numShown: activeMatches.length })}
                {#if $constituenciesSelectable}
                  <span class="font-normal">
                    {$t('results.inConstituency')}
                    {activeElection.getApplicableConstituency($constituencies)?.name || '—'}
                  </span>
                {/if}
              </h3> -->
              <EntityListControls
                entities={activeMatches}
                onUpdate={(results) => (filteredEntities = results)}
                filterGroup={$entityFilters[activeElectionId][activeEntityType]}
                searchProperty=""
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
      </div>
    {:else}
      <p class="mt-[2rem] text-center text-sm text-secondary" transition:slide>{$t('results.selectElectionFirst')}</p>
    {/if}
  </div>
</MainContent>
