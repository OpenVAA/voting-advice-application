<!--@component

# Results layout

Renders the matching results list and, when on an entity detail child route, shows that entity's details in a `Drawer` modal overlay. The layout persists across child route navigation, keeping the results list mounted underneath.

Entity cards are `<a>` links — right-click opens in new tab, normal click triggers SvelteKit client-side navigation which the layout detects and renders in a Drawer.

## TODO

- Restore EntityListControls (search + filters) — currently disabled due to infinite $effect loop when used in layout context
-->

<script lang="ts">
  import { isMatch } from '@openvaa/matching';
  import { onMount, untrack } from 'svelte';
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import AccordionSelect from '$lib/components/accordionSelect/AccordionSelect.svelte';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { Tabs } from '$lib/components/tabs';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDetailsDrawer } from '$lib/dynamic-components/entityDetails';
  import { EntityList } from '$lib/dynamic-components/entityList';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { logDebugError } from '$lib/utils/logger';
  import { ROUTE } from '$lib/utils/route';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import { DELAY } from '$lib/utils/timing';
  import MainContent from '../../../MainContent.svelte';
  import type { Snippet } from 'svelte';
  import type { Id } from '@openvaa/core';
  import type { Election, EntityType } from '@openvaa/data';
  import type { Tab } from '$lib/components/tabs';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answers,
    appSettings,
    constituenciesSelectable,
    dataRoot,
    getRoute,
    matches,
    nominationsAvailable,
    resultsAvailable,
    selectedConstituencies: constituencies,
    selectedElections: elections,
    startEvent,
    startFeedbackPopupCountdown,
    startSurveyPopupCountdown,
    t
  } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Start countdowns and track events
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    startEvent(resultsAvailable ? 'results_ranked' : 'results_browse', {
      election: activeElectionId,
      entityType: activeEntityType,
      numAnswers: Object.keys(answers.answers).length
    });
  });

  // Use $effect for popup countdowns so they react to app settings updates.
  // The settings store may update after the component mounts (async data load),
  // and the countdown functions handle repeated calls by clearing prior timeouts.
  $effect(() => {
    if ($appSettings.results.showFeedbackPopup != null)
      startFeedbackPopupCountdown($appSettings.results.showFeedbackPopup);
  });

  $effect(() => {
    if ($appSettings.survey?.showIn && $appSettings.survey.showIn.includes('resultsPopup'))
      startSurveyPopupCountdown($appSettings.results.showSurveyPopup);
  });

  ////////////////////////////////////////////////////////////////////
  // Sections
  ////////////////////////////////////////////////////////////////////

  type EntityTab = { type: EntityType; label: string };

  let activeElectionId = $state<Id | undefined>(undefined);
  let activeElection = $state<Election>();
  let activeEntityType = $state<EntityType | undefined>(undefined);
  let activeMatches = $state<Array<MaybeWrappedEntityVariant> | undefined>(undefined);
  let entityTabs = $state<Array<EntityTab>>([]);
  let initialEntityTabIndex = $state(0);

  if (elections.length === 1) activeElectionId = elections[0].id;

  $effect(() => {
    if (activeElectionId) {
      entityTabs = Object.keys(matches[activeElectionId]).map((type) => ({
        type: type as EntityType,
        label: ucFirst(t(`common.${type as EntityType}.plural`))
      }));
      const currentType = untrack(() => activeEntityType);
      if (!currentType || !(currentType in matches[activeElectionId])) activeEntityType = entityTabs[0]?.type;
      activeElection = elections.find((e) => e.id === activeElectionId)!;
    }
  });

  $effect(() => {
    if (activeElectionId) {
      activeMatches = activeEntityType ? matches[activeElectionId][activeEntityType] : undefined;
      setInitialEntityTab();
    }
  });

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
  // Entity detail drawer (declarative, route-based)
  ////////////////////////////////////////////////////////////////////

  let isEntityDetail = $derived(page.route?.id?.endsWith(ROUTE.ResultEntity) ?? false);

  let drawerEntity = $derived.by<MaybeWrappedEntityVariant | undefined>(() => {
    if (!isEntityDetail) return undefined;
    const entityType = page.params.entityType as EntityType;
    const entityId = page.params.entityId;
    const nominationId = page.url.searchParams.get('nominationId') ?? undefined;
    if (!entityType || !entityId) return undefined;
    try {
      const { entity } = getEntityAndTitle({
        dataRoot: $dataRoot,
        matches,
        entityType,
        entityId,
        nominationId
      });
      return entity;
    } catch (e) {
      logDebugError(
        `Could not get entity details for ${entityType} ${entityId}. Error: ${e instanceof Error ? e.message : '-'}`
      );
      return undefined;
    }
  });

  $effect(() => {
    if (!isEntityDetail || !drawerEntity) return;
    const entityType = page.params.entityType as EntityType;
    const entityId = page.params.entityId;
    if (isMatch(drawerEntity)) {
      startEvent(`results_ranked_${entityType}`, { id: entityId, score: drawerEntity.score });
    } else {
      startEvent(`results_browse_${entityType}`, { id: entityId });
    }
  });

  function handleDrawerClose(): void {
    goto($getRoute('Results'));
  }
</script>

{#if Object.values(nominationsAvailable).some(Boolean)}
  {#if isEntityDetail && drawerEntity}
    <EntityDetailsDrawer entity={drawerEntity} onClose={handleDrawerClose} />
  {/if}

  <MainContent title={resultsAvailable ? t('results.title.results') : t('results.title.browse')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.results.heroEmoji')} />
      </figure>
    {/snippet}

    <div class="mb-xl text-center" data-testid="voter-results-ingress">
      {#if resultsAvailable}
        <p>{t('dynamic.results.ingress.results')}</p>
      {:else}
        <p>
          {@html sanitizeHtml(
            t('dynamic.results.ingress.browse', {
              questionsLink: `<a href="${$getRoute('Questions')}">${t('results.ingress.questionsLinkText', {
                numQuestions: $appSettings.matching.minimumAnswers
              })}</a>`
            })
          )}
        </p>
      {/if}
      {#if elections.length > 1}
        <p>{t('dynamic.results.multipleElections')}</p>
      {/if}
    </div>

    {#if $dataRoot.elections.length > 1}
      {@const activeIndex = elections.findIndex((e) => e.id === activeElectionId)}
      <AccordionSelect
        options={elections}
        {activeIndex}
        labelGetter={getName}
        onChange={handleElectionChange}
        class="-mt-md mb-lg"
        data-testid="voter-results-election-select" />

      {#if activeElection?.info}
        <p transition:slide={{ duration: DELAY.sm }} class="text-secondary text-center text-sm">
          {activeElection.info}
        </p>
      {/if}
    {/if}

    {#snippet fullWidth()}
      <div class="bg-base-300 flex min-h-[120vh] flex-col items-center" data-testid="voter-results-container">
        {#if activeElectionId}
          <div class="pb-safelgb pl-safemdl pr-safemdr match-w-xl:px-0 w-full max-w-xl">
            {#if Object.keys(matches[activeElectionId]).length > 1}
              <Tabs
                tabs={entityTabs}
                activeIndex={initialEntityTabIndex}
                onChange={handleEntityTabChange}
                data-testid="voter-results-entity-tabs" />
            {/if}

            {#if activeEntityType}
              {#if activeMatches}
                <div
                  data-testid={activeEntityType === 'candidate'
                    ? 'voter-results-candidate-section'
                    : activeEntityType === 'organization'
                      ? 'voter-results-party-section'
                      : undefined}>
                  {#key activeMatches}
                    <h3 class="my-lg mx-10 text-xl">
                      {t(`results.${activeEntityType}.numShown`, { numShown: activeMatches.length })}
                      {#if constituenciesSelectable}
                        <span class="font-normal">
                          {t('results.inConstituency')}
                          {activeElection?.getApplicableConstituency(constituencies)?.name || '—'}
                        </span>
                      {/if}
                    </h3>
                    <!-- TODO: Restore EntityListControls (search + filters) — disabled due to infinite $effect loop in layout context -->
                    <EntityList
                      cards={activeMatches.map((e) => ({ entity: e }))}
                      class="mb-lg"
                      data-testid="voter-results-list" />
                  {/key}
                </div>
              {:else}
                <Loading />
              {/if}
            {:else}
              <div class="py-lg text-error text-center text-lg">
                {t('error.noNominations')}
              </div>
            {/if}
          </div>
        {:else}
          <p class="text-secondary mt-[2rem] text-center text-sm" transition:slide>
            {t('results.selectElectionFirst')}
          </p>
        {/if}
      </div>
    {/snippet}
  </MainContent>
{:else}
  <MainContent title={t('error.noNominations')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.error.heroEmoji')} />
      </figure>
    {/snippet}

    {#snippet primaryActions()}
      <Button href={$getRoute('Questions')} text={t('questions.title')} variant="main" icon="next" />
      <Button href={$getRoute('Home')} text={t('common.returnHome')} />
    {/snippet}
  </MainContent>
{/if}
