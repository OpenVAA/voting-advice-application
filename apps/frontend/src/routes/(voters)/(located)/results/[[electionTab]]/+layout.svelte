<!--@component

# Results election-tab layout

The outermost of the three results route levels (phase 165, D-07 / D-08). It owns the page chrome — the hero, the ingress and the whole-page empty state — plus the election picker, the page-entry analytics event and both popup countdowns. The entity-tab layout below it owns the type tabs; the innermost page below that owns the list and the drawer opener.

## Architecture

- URL is the single source of truth. The active election is `$derived` over `page.params.electionTab` (name-disjoint from the search-side `?electionId=…` AVAILABLE-array surface, which keeps its `voterContext.selectedElections` semantics — that array drives nomination + question filtering and is set by the voter at `/elections`). No local `$state` twins for URL-derivable state; no `$effect`-based sync.
- This level is the one that SURVIVES every in-results navigation: a tab switch, a drawer open and a drawer close all change params below it, so the page-entry event and the popup countdowns belong here and nowhere lower. Only an election change or a fresh entry re-runs them.
- `{@render children()}` is rendered INSIDE the `fullWidth` snippet, where the tabs-and-list markup used to sit, so the descendant-owned list stays inside `MainContent`'s full-width region. Rendering it outside that snippet would take the list out of its container.
- D-08's "picker instead of children": when no election can be implied, this layout renders the select-an-election prompt INSTEAD of its children. The entity-tab layout below applies the same rule to its own param.

Sibling tracking concerns:
- `startFeedbackPopupCountdown` via `appSettings.results.showFeedbackPopup`
- `startSurveyPopupCountdown` via `appSettings.survey.showIn`
- `onMount` `results_ranked`/`results_browse` page-entry event
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { MainContent } from '$layouts/main';
  import AccordionSelect from '$lib/components/accordionSelect/AccordionSelect.svelte';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { DELAY } from '$lib/utils/timing';
  import { buildListRoute, narrowEntityPlural, pluralForEntityType } from './resultsRoutes';
  import type { Election } from '@openvaa/data';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // The reactive context getters (currentResultsEntityType, matches, nominationsAvailable, resultsAvailable, selectedElections) are read via voterCtx.X.
  // Genuinely stable members (getRoute, t, answers, startEvent, *Countdown) remain destructured.
  //
  // appSettings and dataRoot are NOT in that set. Both are bare reactive accessors, so per CLAUDE.md's Context Destructuring Rule neither may be destructured: appSettings is value-replacing, so a destructured local stops updating, and dataRoot is identity-stable behind a #version bridge, so the destructure takes the version dependency once at init and never again.
  const voterCtx = getVoterContext();
  const { answers, getRoute, startEvent, startFeedbackPopupCountdown, startSurveyPopupCountdown, t } = voterCtx;
  // appSettings is value-replacing: a $derived read alias is safe and correct.
  const appSettings = $derived(voterCtx.appSettings);
  // dataRoot is identity-stable: read `voterCtx.dataRoot.<prop>` directly inside the consuming tracking scope, never through an intermediate $derived alias (referential equality would suppress downstream notification and the cold/direct-URL snapshot would stay empty). See CLAUDE.md "Context Destructuring Rule" and its stable-reference carve-out.
  // Local aliases for template readability:
  const elections = $derived(voterCtx.selectedElections);

  ////////////////////////////////////////////////////////////////////
  // URL-derived state
  ////////////////////////////////////////////////////////////////////
  //
  // Two name-disjoint election surfaces coexist on the URL:
  //   - ROUTE side: `page.params.electionTab` (singular) — the *selected* election whose results-page is being rendered. New.
  //   - SEARCH side: `?electionId=…` / `electionId[N]=…` (zero-or-more) — the AVAILABLE elections (voter scope set at `/elections`), surfaced via `voterContext.selectedElections`.
  // The two share NO key name (electionTab vs electionId) — different identifiers throughout the codebase. The server-side guard at `[[electionTab]]/+layout.ts` validates that `params.electionTab` is a member of the AVAILABLE array.
  //
  // entityTab + entity + id are route params, gated by the etPl / etSg short-name matchers. They are read at the levels that own them (the entity-tab layout and the innermost page), not here.
  //
  // Single-election fallback: when the route segment is absent AND there's exactly one available election, auto-select it. The server guard in `[[electionTab]]/+layout.ts` is expected to redirect-and-canonicalize this case, so this fallback is the client-side safety net.

  const _urlElectionTab = $derived(page.params.electionTab);

  const activeElectionId = $derived<string | undefined>(
    _urlElectionTab ?? (elections.length === 1 ? elections[0].id : undefined)
  );

  const activeElection = $derived<Election | undefined>(
    activeElectionId ? elections.find((e) => e.id === activeElectionId) : undefined
  );

  const _urlPlural = $derived(narrowEntityPlural(page.params.entityTab));

  // Plural → singular mapping uses American spelling. The implied entity type lives on voterContext via `currentResultsEntityType`: URL-first with default-pick fallback to the first available tab for the active election. Reading through `voterCtx.X` per the CLAUDE.md Context Destructuring Rule preserves reactivity (must not destructure).
  const activeEntityType = $derived(voterCtx.currentResultsEntityType);

  ////////////////////////////////////////////////////////////////////
  // Start countdowns and track events
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    startEvent(voterCtx.resultsAvailable ? 'results_ranked' : 'results_browse', {
      election: activeElectionId,
      entityType: activeEntityType,
      numAnswers: Object.keys(answers.answers).length
    });
  });

  // Use $effect for popup countdowns so they react to app settings updates.
  // The settings store may update after the component mounts (async data load), and the countdown functions handle repeated calls by clearing prior timeouts.
  $effect(() => {
    if (appSettings.results.showFeedbackPopup != null)
      startFeedbackPopupCountdown(appSettings.results.showFeedbackPopup);
  });

  $effect(() => {
    if (appSettings.survey?.showIn && appSettings.survey.showIn.includes('resultsPopup'))
      startSurveyPopupCountdown(appSettings.results.showSurveyPopup);
  });

  ////////////////////////////////////////////////////////////////////
  // Handlers (all selector changes push to URL)
  ////////////////////////////////////////////////////////////////////

  // The absence of `noScroll` here is DELIBERATE, not an oversight beside its `handleEntityTabChange` sibling one level down: switching election replaces the whole list with different content, so the default scroll-to-top is the correct landing. Entity-tab switches keep scroll; election switches do not.
  function handleElectionChange(details: { option: unknown }): void {
    const { id } = details.option as Election;
    const plural = _urlPlural ?? pluralForEntityType(activeEntityType);
    goto(buildListRoute(id, plural));
    startEvent('results_changeElection', { election: id });
  }

  function getName(e: unknown): string {
    return (e as Election).name;
  }
</script>

{#if Object.values(voterCtx.nominationsAvailable).some(Boolean)}
  <MainContent title={voterCtx.resultsAvailable ? t('results.title.results') : t('results.title.browse')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.results.heroEmoji')} />
      </figure>
    {/snippet}

    <div class="mb-xl text-center" data-testid="voter-results-ingress">
      {#if voterCtx.resultsAvailable}
        <p>{t('dynamic.results.ingress.results')}</p>
      {:else}
        <p>
          {@html sanitizeHtml(
            t('dynamic.results.ingress.browse', {
              questionsLink: `<a href="${getRoute.current('Questions')}">${t('results.ingress.questionsLinkText', {
                numQuestions: appSettings.matching.minimumAnswers
              })}</a>`
            })
          )}
        </p>
      {/if}
      {#if elections.length > 1}
        <p>{t('dynamic.results.multipleElections')}</p>
      {/if}
    </div>

    {#if voterCtx.dataRoot.elections.length > 1}
      {@const activeIndex = elections.findIndex((e) => e.id === activeElectionId)}
      <AccordionSelect
        options={elections}
        {activeIndex}
        labelGetter={getName}
        onChange={handleElectionChange}
        class="-mt-md mb-lg"
        style="view-transition-name: results-election-select"
        data-testid="voter-results-election-select" />

      {#if activeElection?.info}
        <p transition:slide={{ duration: DELAY.sm }} class="text-secondary text-center text-sm">
          {activeElection.info}
        </p>
      {/if}
    {/if}

    {#snippet fullWidth()}
      <!--
        LIST CONTAINER — `content-visibility: auto` defers layout/paint until scrolled into view (Open Question 4 RESOLVED). The former "renders after the drawer block so the drawer wins the cold-deeplink paint race" clause is gone with the per-route drawer: the drawer is now a top-layer dialog in the root layout, so nothing in this file's source order can lose that race.
      -->
      <div
        class="bg-base-300 flex min-h-[120vh] flex-col items-center [content-visibility:auto]"
        style="content-visibility: auto;"
        data-testid="voter-results-list-container">
        {#if activeElectionId}
          {@render children()}
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
      <Button href={getRoute.current('Questions')} text={t('questions.title')} variant="main" icon="next" />
      <Button href={getRoute.current('Home')} text={t('common.returnHome')} />
    {/snippet}
  </MainContent>
{/if}
