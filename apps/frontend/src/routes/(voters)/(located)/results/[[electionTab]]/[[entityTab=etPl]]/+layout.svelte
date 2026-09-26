<!--@component

# Results entity-tab layout

The middle of the three results route levels (phase 165, D-07 / D-08). It owns the entity-type tab strip, the resolution of the ACTIVE entity type, and the tab-change handler. The election-tab layout above it owns the page chrome and the election picker; the innermost page below it owns the list and the drawer opener.

## Why the param is optional, and why there is no `+page.svelte` beside this file

`entityTab` is optional and matcher-gated (`etPl`), like the three params around it. Keeping it optional is what lets a bare `/results/{election}` URL — with no plural segment at all — render this layout and everything below it, with the active tab IMPLIED from the voter context rather than forced into the URL. Forcing it into the URL is the force-fill the Post-88-02 loop fix removed, and `buildListRoute` still refuses to do it.

There is deliberately NO `+page.svelte` at this level. The list lives on the single innermost page node, so every URL shape resolves to the SAME page component instance and a tab switch updates it rather than remounting it. Spike 033 measured the alternative directly: a layered tree with a page file at each level remounted the list on the first switch away from the implied tab, because the implied shape and the explicit shape were served by different component instances in different route files. Adding a page file here would reintroduce exactly that.

## D-08's "cannot be implied, so show the chooser" at this level

When the active entity type cannot be resolved — no nominations for the active election — this layout renders the no-nominations warning INSTEAD of `{@render children()}`, which is the same shape the election-tab layout uses when no election can be implied.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Tabs } from '$lib/components/tabs';
  import { getVoterContext } from '$lib/contexts/voter';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import { buildListRoute } from '../resultsRoutes';
  import type { EntityType } from '@openvaa/data';
  import type { Snippet } from 'svelte';
  import type { Tab } from '$lib/components/tabs';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // The reactive context getters (currentResultsEntityType, matches, selectedElections) are read via voterCtx.X. Genuinely stable members (startEvent, t) remain destructured.
  //
  // dataRoot is NOT in that set, and neither is appSettings. Both are bare reactive accessors, so per CLAUDE.md's Context Destructuring Rule neither may be destructured: appSettings is value-replacing, so a destructured local stops updating, and dataRoot is identity-stable behind a #version bridge, so the destructure takes the version dependency once at init and never again. dataRoot must be read as `voterCtx.dataRoot.<prop>` directly inside the consuming tracking scope, never through an intermediate $derived alias — referential equality would suppress downstream notification and the cold/direct-URL snapshot would stay empty. This level reads neither, but the rule is restated here because the rule travels with the file, not with the one file that happens to break it. See CLAUDE.md "Context Destructuring Rule" and its stable-reference carve-out.
  const voterCtx = getVoterContext();
  const { startEvent, t } = voterCtx;
  // Local alias for template readability. `selectedElections` is value-replacing, so a $derived read alias is safe and correct.
  const elections = $derived(voterCtx.selectedElections);

  ////////////////////////////////////////////////////////////////////
  // URL-derived state
  ////////////////////////////////////////////////////////////////////
  //
  // Each level RE-DERIVES what it needs from the route params and the context rather than receiving it as a prop from the level above. That is what keeps "the URL is the single source of truth" true across three files instead of one: a prop-drilled `activeElectionId` would make this layout's correctness depend on its parent's derivation staying in step with the URL, which is the coupling the split exists to remove.

  const _urlElectionTab = $derived(page.params.electionTab);

  // Single-election fallback: when the route segment is absent AND there's exactly one available election, auto-select it. The server guard in `[[electionTab]]/+layout.ts` is expected to redirect-and-canonicalize this case, so this fallback is the client-side safety net.
  const activeElectionId = $derived<string | undefined>(
    _urlElectionTab ?? (elections.length === 1 ? elections[0].id : undefined)
  );

  // The map of plurals available for the active election (possibly just candidates, possibly just organizations, possibly both). Computed from matches so we always render consistent tab labels without going through a separate $state twin.
  type EntityTab = { type: EntityType; label: string };
  const entityTabs = $derived<Array<EntityTab>>(
    activeElectionId && voterCtx.matches[activeElectionId]
      ? (Object.keys(voterCtx.matches[activeElectionId]) as Array<EntityType>).map((type) => ({
          type,
          label: ucFirst(t(`common.${type}.plural`))
        }))
      : []
  );

  // Plural → singular mapping uses American spelling. The implied entity type lives on voterContext via `currentResultsEntityType`: URL-first with default-pick fallback to the first available tab for the active election. Reading through `voterCtx.X` per the CLAUDE.md Context Destructuring Rule preserves reactivity (must not destructure).
  const activeEntityType = $derived(voterCtx.currentResultsEntityType);

  // An open drawer is an OVERLAY keyed on `entity` + `id`, not a part of the list hierarchy, and it must mount even when the active entity type cannot be resolved. Before the phase-165 split the drawer was rendered ABOVE this gate, so an entity URL whose type could not be resolved still opened the drawer over an empty list; nesting the opener under the gate without this carve-out silently turned a working deeplink into a blank page. The reachable case is a bare `/results` whose card links carry no election segment: SvelteKit then slots the PLURAL into the freeform `[[electionTab]]`, no election resolves, and the type goes undefined — measured against `perm-localisation-positive`, which is red without this and green with it.
  const drawerVisible = $derived<boolean>(!!(page.params.entity && page.params.id));

  // Tabs.activeIndex — non-bound, passed as a $derived value.
  const activeTabIndex = $derived.by(() => {
    if (!activeEntityType) return 0;
    const i = entityTabs.findIndex((tab) => tab.type === activeEntityType);
    return i === -1 ? 0 : i;
  });

  ////////////////////////////////////////////////////////////////////
  // Handlers (all selector changes push to URL)
  ////////////////////////////////////////////////////////////////////

  // `noScroll: true` on all three branches: the entity-type tabs sit in the lower half of the page, so SvelteKit's default scroll-to-top would throw a voter who has scrolled down to reach them back up to the intro on every switch. The tab strip would leave the viewport under the user's own finger.
  function handleEntityTabChange({ index, tab }: { index?: number; tab?: Tab }): void {
    const typed = tab as EntityTab | undefined;
    if (typed?.type === 'candidate' || index === 0) {
      goto(buildListRoute(activeElectionId, 'candidates'), { noScroll: true });
      startEvent('results_changeTab', { section: 'candidate' });
      return;
    }
    if (typed?.type === 'organization' || index === 1) {
      goto(buildListRoute(activeElectionId, 'organizations'), { noScroll: true });
      startEvent('results_changeTab', { section: 'organization' });
      return;
    }
    if (typed?.type === 'alliance' || index === 2) {
      goto(buildListRoute(activeElectionId, 'alliances'), { noScroll: true });
      startEvent('results_changeTab', { section: 'alliance' });
      return;
    }
  }
</script>

<div class="pb-safelgb pl-safemdl pr-safemdr match-w-xl:px-0 w-full max-w-xl">
  {#if entityTabs.length > 1}
    <Tabs
      tabs={entityTabs}
      activeIndex={activeTabIndex}
      onChange={handleEntityTabChange}
      style="view-transition-name: results-entity-tabs"
      data-testid="voter-results-entity-tabs" />
  {/if}

  <!--
    D-08's "cannot be implied, so show the chooser" at this level, with the overlay carve-out the `drawerVisible` derivation above explains: children render when there is something for them to render — a resolvable list, OR a drawer. The innermost page carries its own narrowing gate on the same value, so in the drawer-only case it mounts the opener and no list.
  -->
  {#if activeEntityType || drawerVisible}
    {@render children()}
  {:else}
    <div class="py-lg text-error text-center text-lg" data-testid="voter-results-no-nominations-warning">
      {t('error.noNominations')}
    </div>
  {/if}
</div>
