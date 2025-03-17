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
  import { Election, ENTITY_TYPE, type EntityType } from '@openvaa/data';
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { beforeNavigate, pushState } from '$app/navigation';
  import { page } from '$app/stores';
  import AccordionSelect from '$lib/components/accordionSelect/AccordionSelect.svelte';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { type Tab, Tabs } from '$lib/components/tabs';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDetailsDrawer, type EntityDetailsDrawerProps } from '$lib/dynamic-components/entityDetails';
  import { EntityList, EntityListControls } from '$lib/dynamic-components/entityList';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { parseParams, ROUTE } from '$lib/utils/route';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import { DELAY } from '$lib/utils/timing';
  import resultsVideo from './resultsVideo.json';
  import MainContent from '../../../MainContent.svelte';
  import type { CustomVideoProps } from '@openvaa/app-shared';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answers,
    appSettings,
    constituenciesSelectable,
    dataRoot,
    entityFilters,
    getRoute,
    locale,
    matches,
    resultsAvailable,
    selectedConstituencies: constituencies,
    selectedElections: elections,
    startEvent,
    startFeedbackPopupCountdown,
    startSurveyPopupCountdown,
    t
  } = getVoterContext();
  const { video } = getLayoutContext(onDestroy);

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
    }))
      // TEMP: Fixed override
      .sort((a) => a.type === ENTITY_TYPE.Organization ? -1 : 0);
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
    pushState(to.url, {
      resultsShowEntity: {
        entityType: entityType as EntityType,
        entityId,
        nominationId
      }
    });
    cancel();
  });

  function getDrawerProps(opts: { entityType: EntityType; entityId: Id; nominationId?: Id }): EntityDetailsDrawerProps {
    return {
      entity: getEntityAndTitle({
        dataRoot: $dataRoot,
        matches: $matches,
        ...opts
      }).entity
    };
  }

  ////////////////////////////////////////////////////////////////////
  // Filters
  ////////////////////////////////////////////////////////////////////

  // This will hold the filtered entities returned by EntityListControls
  // TODO: Combine EntityListControls and List components into one
  let filteredEntities = new Array<MaybeWrappedEntityVariant>();

  ////////////////////////////////////////////////////////////////////
  // Video
  ////////////////////////////////////////////////////////////////////

  const videoProps = resultsVideo[$locale as keyof LocalizedIntroVideoProps];
  if (videoProps) video.load(videoProps);

  interface LocalizedIntroVideoProps {
    fi: IntroVideoProps;
    sv: IntroVideoProps;
    en: IntroVideoProps;
  }
  interface IntroVideoProps {
    video: CustomVideoProps;
  }


  // TEMP
  const questionId: Record<string, string> = {
    // Counties
    vzrmfatxpudypabsvacxu7ho: 'hjpwslzkxz864tli4i3uqtdl',
    // Municipalities
    fgvyvd6vm2s8762oh0ztsvd7: 'ktypq7ldxwfigqq7o2te99a4',
  }
</script>

{#if $page.state.resultsShowEntity}
  {#key $page.state.resultsShowEntity}
    <EntityDetailsDrawer {...getDrawerProps($page.state.resultsShowEntity)} />
  {/key}
{/if}

<MainContent title={$resultsAvailable ? $t('results.title.results') : $t('results.title.browse')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.results.heroEmoji')} />
  </figure>

  <div class="mt-md mb-xl text-center">
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
              <h3 class="mx-10 my-lg text-xl">
                {$t(`results.${activeEntityType}.numShown`, { numShown: activeMatches.length })}
                {#if $constituenciesSelectable}
                  <span class="font-normal">
                    {$t('results.inConstituency')}
                    {activeElection.getApplicableConstituency($constituencies)?.name || '—'}
                  </span>
                {/if}
              </h3>
              <EntityListControls
                entities={activeMatches}
                onUpdate={(results) => (filteredEntities = results)}
                filterGroup={$entityFilters[activeElectionId][activeEntityType]}
                class="mx-10 mb-md" />
              <EntityList 
                cards={filteredEntities.map((e) => ({ entity: e }))} 
                class="mb-lg" 
                questionId={questionId[activeElectionId]} 
                />
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
