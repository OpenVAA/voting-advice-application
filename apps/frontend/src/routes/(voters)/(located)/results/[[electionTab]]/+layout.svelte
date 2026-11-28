<!--@component

# Results election-tab layout

The outermost of the three results route levels. It owns the page chrome — the hero, the ingress and the whole-page empty state — plus the election picker, the page-entry analytics event and both popup countdowns. The entity-tab layout below it owns the type tabs; the innermost page below that owns the list and the drawer opener.

## Architecture

- URL is the single source of truth. The active election is `voterCtx.currentResultsElection`, derived from `page.params.electionTab` (name-disjoint from the search-side `?electionId=…` AVAILABLE-array surface, which keeps its `voterContext.selectedElections` semantics — that array drives nomination + question filtering and is set by the voter at `/elections`). No local `$state` twins for URL-derivable state; no `$effect`-based sync.
- This level SURVIVES every in-results navigation, an election switch included: a tab switch, a drawer open and a drawer close change params below it, and an election switch changes only this level's own param, so SvelteKit reuses the component. The page-entry event therefore fires once per visit to the results page, on mount; an election switch is recorded by `results_changeElection` and does not re-fire it. The popup countdowns are likewise started once per visit; their effects re-run only when the app settings change, not on an election switch.
- `{@render children()}` is rendered INSIDE the `fullWidth` snippet, so the descendant-owned list stays inside `MainContent`'s full-width region. Rendering it outside that snippet would take the list out of its container.
- Chooser instead of children: when no election can be implied, this layout renders the select-an-election prompt INSTEAD of its children, unless the URL opens an entity drawer. The entity-tab layout below applies the same rule, with the same drawer carve-out, to its own param.

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
  import { buildListRoute, hasEntityDrawer, narrowEntityPlural, pluralForEntityType } from '$lib/routes';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { DELAY } from '$lib/utils/timing';
  import type { Election } from '@openvaa/data';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Reactive accessors are read as voterCtx.X or through a $derived alias, never destructured; dataRoot is never aliased (CLAUDE.md § Context Destructuring Rule).
  const voterCtx = getVoterContext();
  const { answers, getRoute, track, startFeedbackPopupCountdown, startSurveyPopupCountdown, t } = voterCtx;
  const appSettings = $derived(voterCtx.appSettings);
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
  // entityTab + entity + id are route params, gated by the entityTypePlural / entityTypeSingular matchers. They are read at the levels that own them (the entity-tab layout and the innermost page), not here, except for the drawer carve-out below.
  //
  // The active election is `voterCtx.currentResultsElection`: the route segment, or the only available election when the segment is absent and exactly one is available. The server guard in `[[electionTab]]/+layout.ts` redirects that case to the canonical URL first, so the fallback is the client-side safety net.

  const _urlPlural = $derived(narrowEntityPlural(page.params.entityTab));

  const activeEntityType = $derived(voterCtx.currentResultsEntityType);

  // The drawer is an overlay keyed on `entity` + `id`, so children render for an entity URL even when no election resolves, as the entity-tab layout does for an unresolved type. A bare `/results` card link carries no election segment, so SvelteKit slots its plural into the freeform `[[electionTab]]` and no election matches it.
  const drawerVisible = $derived(hasEntityDrawer(page.params));

  ////////////////////////////////////////////////////////////////////
  // Start countdowns and track events
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    track(voterCtx.resultsAvailable ? 'results_ranked' : 'results_browse', {
      electionId: voterCtx.currentResultsElection?.id,
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
    goto(buildListRoute(id, plural, page));
    track('results_changeElection', { electionId: id });
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
      {@const activeIndex = elections.findIndex((e) => e.id === voterCtx.currentResultsElection?.id)}
      <AccordionSelect
        options={elections}
        {activeIndex}
        labelGetter={getName}
        onChange={handleElectionChange}
        class="-mt-md mb-lg"
        style="view-transition-name: results-election-select"
        data-testid="voter-results-election-select" />

      {#if voterCtx.currentResultsElection?.info}
        <p transition:slide={{ duration: DELAY.sm }} class="text-secondary text-center text-sm">
          {voterCtx.currentResultsElection.info}
        </p>
      {/if}
    {/if}

    {#snippet fullWidth()}
      <!--
        LIST CONTAINER — `content-visibility: auto` defers layout/paint until scrolled into view. The drawer is a top-layer dialog in the root layout, so nothing in this file's source order decides whether the drawer or the list paints first on a cold deeplink.
      -->
      <div
        class="bg-base-300 flex min-h-[120vh] flex-col items-center [content-visibility:auto]"
        style="content-visibility: auto;"
        data-testid="voter-results-list-container">
        {#if voterCtx.currentResultsElection || drawerVisible}
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
