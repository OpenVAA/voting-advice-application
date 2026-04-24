<!--@component

# Results layout

Renders the matching results list and, when on an entity detail child route, shows that entity's details in a `Drawer` modal overlay. The layout persists across child route navigation, keeping the results list mounted underneath.

Entity cards are `<a>` links — right-click opens in new tab, normal click triggers SvelteKit client-side navigation which the layout detects and renders in a Drawer.

## Architecture (Phase 62 Plan 62-03 refactor)

- URL is the single source of truth (D-09, D-13). Tabs, drawer visibility, and
  active entity type are pure `$derived` over `page.params.entityTypePlural` /
  `entityTypeSingular` / `id` and the `electionId` persistent search param.
  No local `$state` twins for URL-derivable state; no `$effect`-based sync.
- `<EntityListWithControls>` replaces the legacy `<EntityList>` call —
  filters are re-enabled end-to-end through the shared `filterContext`
  (D-05), which auto-scopes per (electionId, entityTypePlural) per D-14.
- Drawer-first paint (D-10): the `{#if drawerVisible} <EntityDetailsDrawer/>`
  block is rendered BEFORE the list container in DOM source order; the list
  container carries `content-visibility: auto` so the browser defers its
  layout/paint until it scrolls into view.

Sibling tracking concerns (Pitfall 6) preserved verbatim:
- `startFeedbackPopupCountdown` via `$appSettings.results.showFeedbackPopup`
- `startSurveyPopupCountdown` via `$appSettings.survey.showIn`
- `onMount` `results_ranked`/`results_browse` page-entry event
- `$effect` drawer-viewed tracking event
-->

<script lang="ts">
  import { isMatch } from '@openvaa/matching';
  import { onMount } from 'svelte';
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
  import { EntityListWithControls } from '$lib/dynamic-components/entityList';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { logDebugError } from '$lib/utils/logger';
  import { parseParams } from '$lib/utils/route';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import { DELAY } from '$lib/utils/timing';
  import MainContent from '../../../MainContent.svelte';
  import type { Snippet } from 'svelte';
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
  // URL-derived state (D-09, D-13)
  ////////////////////////////////////////////////////////////////////
  //
  // electionId lives in the persistent search param (PERSISTENT_SEARCH_PARAMS
  // in `$lib/utils/route/params.ts`), not in the route path. `parseParams`
  // merges route + search params transparently, matching the paramStore +
  // filterContext analogs.
  //
  // entityTypePlural + entityTypeSingular + id are route params introduced
  // by Plan 62-02 via matcher-gated optional segments.
  //
  // Single-election fallback: when there is exactly one election available,
  // auto-select it — preserves the legacy layout behaviour (line 101 of the
  // pre-refactor file) without mutating the URL (buildRoute / $getRoute
  // handlers continue to append electionId to the search params on the
  // first explicit navigation).

  const ENTITY_PLURALS = ['candidates', 'organizations'] as const;
  type EntityPlural = (typeof ENTITY_PLURALS)[number];

  const _parsedParams = $derived(parseParams(page));
  const _urlElectionIdRaw = $derived(_parsedParams.electionId);
  const _urlElectionId = $derived(
    Array.isArray(_urlElectionIdRaw) ? _urlElectionIdRaw[0] : _urlElectionIdRaw
  );

  const activeElectionId = $derived<string | undefined>(
    _urlElectionId ?? (elections.length === 1 ? elections[0].id : undefined)
  );

  const activeElection = $derived<Election | undefined>(
    activeElectionId ? elections.find((e) => e.id === activeElectionId) : undefined
  );

  const _urlPluralRaw = $derived(page.params.entityTypePlural);
  const _urlPlural = $derived<EntityPlural | undefined>(
    _urlPluralRaw === 'candidates' || _urlPluralRaw === 'organizations' ? _urlPluralRaw : undefined
  );

  // The map of plurals available for the active election (possibly just candidates,
  // possibly just organizations, possibly both). Computed from matches so we always
  // render consistent tab labels without going through a separate $state twin.
  type EntityTab = { type: EntityType; label: string };
  const entityTabs = $derived<Array<EntityTab>>(
    activeElectionId && matches[activeElectionId]
      ? (Object.keys(matches[activeElectionId]) as Array<EntityType>).map((type) => ({
          type,
          label: ucFirst(t(`common.${type}.plural`))
        }))
      : []
  );

  // Plural → singular mapping uses American spelling (RESEARCH Open Question 1
  // RESOLVED). When the URL omits entityTypePlural we fall back to the first
  // available tab for the active election.
  const activeEntityType = $derived.by<EntityType | undefined>(() => {
    if (_urlPlural === 'candidates') return 'candidate';
    if (_urlPlural === 'organizations') return 'organization';
    return entityTabs[0]?.type;
  });

  const activeMatches = $derived<Array<MaybeWrappedEntityVariant> | undefined>(
    activeElectionId && activeEntityType ? matches[activeElectionId]?.[activeEntityType] : undefined
  );

  // Tabs.activeIndex — non-bound, passed as a $derived value (Pitfall 3).
  const activeTabIndex = $derived.by(() => {
    if (!activeEntityType) return 0;
    const i = entityTabs.findIndex((tab) => tab.type === activeEntityType);
    return i === -1 ? 0 : i;
  });

  ////////////////////////////////////////////////////////////////////
  // Drawer visibility (D-09) — drawer renders iff both singular+id present
  ////////////////////////////////////////////////////////////////////

  const drawerVisible = $derived<boolean>(
    !!(page.params.entityTypeSingular && page.params.id)
  );

  const drawerEntity = $derived.by<MaybeWrappedEntityVariant | undefined>(() => {
    if (!drawerVisible) return undefined;
    const entityType = page.params.entityTypeSingular as EntityType;
    const entityId = page.params.id!;
    const nominationId = page.url.searchParams.get('nominationId') ?? undefined;
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
      // Silent degradation — UI-SPEC Empty State Inventory "Deeplink to entity not found"
      logDebugError(
        `Could not get entity details for ${entityType} ${entityId}. Error: ${e instanceof Error ? e.message : '-'}`
      );
      return undefined;
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Start countdowns and track events (Pitfall 6 — PRESERVE VERBATIM)
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

  // Drawer-view tracking — fires on drawer open transitions (covers both
  // matched and unmatched entity pools per the legacy `results_ranked_*` /
  // `results_browse_*` event pair).
  $effect(() => {
    if (!drawerVisible || !drawerEntity) return;
    const entityType = page.params.entityTypeSingular as EntityType;
    const entityId = page.params.id!;
    if (isMatch(drawerEntity)) {
      startEvent(`results_ranked_${entityType}`, { id: entityId, score: drawerEntity.score });
    } else {
      startEvent(`results_browse_${entityType}`, { id: entityId });
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Handlers (D-09: all selector changes push to URL)
  ////////////////////////////////////////////////////////////////////

  /**
   * Build a path-only /results URL from a plural and append electionId as a search param.
   * electionId is a PERSISTENT_SEARCH_PARAMS member in `$lib/utils/route/params.ts`;
   * writing it as a route segment would contradict that contract and break the
   * existing `$getRoute('Results', ...)` consumers across the app.
   */
  function buildListRoute(plural: EntityPlural | undefined, electionId: string | undefined): string {
    const base = plural ? `/results/${plural}` : '/results';
    const search = new URLSearchParams(page.url.searchParams);
    if (electionId) search.set('electionId', electionId);
    const qs = search.toString();
    return qs ? `${base}?${qs}` : base;
  }

  function handleElectionChange(details: { option: unknown }): void {
    const { id } = details.option as Election;
    const plural = _urlPlural ?? _pluralForActiveType();
    goto(buildListRoute(plural, id));
    startEvent('results_changeElection', { election: id });
  }

  function handleEntityTabChange({ index, tab }: { index?: number; tab?: Tab }): void {
    const typed = tab as EntityTab | undefined;
    if (typed?.type === 'candidate' || index === 0) {
      goto(buildListRoute('candidates', activeElectionId));
      startEvent('results_changeTab', { section: 'candidate' });
      return;
    }
    if (typed?.type === 'organization' || index === 1) {
      goto(buildListRoute('organizations', activeElectionId));
      startEvent('results_changeTab', { section: 'organization' });
      return;
    }
  }

  function handleDrawerClose(): void {
    goto(buildListRoute(_urlPlural ?? _pluralForActiveType(), activeElectionId));
  }

  function _pluralForActiveType(): EntityPlural | undefined {
    if (activeEntityType === 'candidate') return 'candidates';
    if (activeEntityType === 'organization') return 'organizations';
    return undefined;
  }

  function getName(e: unknown): string {
    return (e as Election).name;
  }
</script>

{#if Object.values(nominationsAvailable).some(Boolean)}
  <!--
    DRAWER-FIRST SOURCE ORDER (D-10, Open Question 4 RESOLVED — cheapest-first).
    Rendered before MainContent so that on a cold deeplink the drawer paints
    before the list container below it (the list carries
    `content-visibility: auto` so the browser defers its layout/paint until
    in view).
  -->
  {#if drawerVisible && drawerEntity}
    <EntityDetailsDrawer
      entity={drawerEntity}
      onClose={handleDrawerClose}
      data-testid="voter-results-drawer" />
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
      <!--
        LIST CONTAINER — `content-visibility: auto` defers layout/paint until
        scrolled into view (D-10, Open Question 4 RESOLVED). Renders AFTER the
        drawer block above in source order so the drawer wins the paint race
        on cold deeplinks.
      -->
      <div
        class="bg-base-300 flex min-h-[120vh] flex-col items-center [content-visibility:auto]"
        style="content-visibility: auto;"
        data-testid="voter-results-list-container">
        {#if activeElectionId}
          <div class="pb-safelgb pl-safemdl pr-safemdr match-w-xl:px-0 w-full max-w-xl">
            {#if entityTabs.length > 1}
              <Tabs
                tabs={entityTabs}
                activeIndex={activeTabIndex}
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
                  {#key `${activeElectionId}:${activeEntityType}`}
                    <h3 class="my-lg mx-10 text-xl">
                      {t(`results.${activeEntityType}.numShown`, { numShown: activeMatches.length })}
                      {#if constituenciesSelectable}
                        <span class="font-normal">
                          {t('results.inConstituency')}
                          {activeElection?.getApplicableConstituency(constituencies)?.name || '—'}
                        </span>
                      {/if}
                    </h3>
                    <EntityListWithControls
                      entities={activeMatches}
                      class="mb-lg mx-10"
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
